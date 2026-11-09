import os
import sys
import json
import time
import asyncio
import logging
from datetime import datetime, date
from typing import List, Dict

import pandas as pd
from django.conf import settings

from radar_jobs.data.sites_config import SITES_TO_TEST, DEDICATED_SCRAPERS
from radar_jobs.processing.cleaner import DataCleaner
from radar_jobs.services.scrapers import (
    GenericScraper,
    EmploiDakarScraper,
    ExpatDakarScraper,
    JobSenegalScraper,
    ConcoursSNScraper,
)

logger = logging.getLogger(__name__)

# Mapping entre le nom du site dans la config et la classe de scraper dédiée
DEDICATED_SCRAPER_MAP = {
    'emploidakar': EmploiDakarScraper,
    'expat_dakar': ExpatDakarScraper,
    'jobsenegal': JobSenegalScraper,
    'concoursn': ConcoursSNScraper,
}


class PipelineResult:
    def __init__(self):
        self.total_scraped = 0
        self.new_jobs = 0
        self.by_source = {}
        self.errors = []
        self.sources_run = []
        self.durations = {}
        self.started_at = None
        self.finished_at = None


def _candidate_base_urls(url):
    """Renvoie la liste des URLs candidates pour un site EmploiSénégal (tous secteurs)."""
    return [url]


async def run_pipeline(max_pages: int = 2, emit_log=None) -> PipelineResult:
    """
    Pipeline complet multi-sites :
      - scrape tous les sites (dédiés + génériques)
      - fusion incrémentale avec les données existantes (détection de nouvelles offres)
      - nettoyage et sauvegarde du CSV final

    Retourne un PipelineResult avec statistiques.
    """
    def _log(msg):
        if emit_log:
            emit_log(msg)
        else:
            print(msg)

    os.makedirs(settings.RAW_DATA_DIR, exist_ok=True)
    os.makedirs(settings.DATA_DIR, exist_ok=True)

    result = PipelineResult()
    result.scraped_date = date.today().isoformat()
    result.started_at = datetime.now().isoformat()
    pipeline_start = time.perf_counter()

    all_offers: List[Dict] = []
    scrapers = []

    try:
        # ---------------------------------------------------------------
        # 1. Scraper chaque site de la configuration
        # ---------------------------------------------------------------
        for site in SITES_TO_TEST:
            name = site.get('name')
            url = site.get('url')
            scraper_type = site.get('scraper')

            if not name or not url:
                continue

            _log(f"--- Scraping {name} ({url}) ---")
            scraper_cls = DEDICATED_SCRAPER_MAP.get(scraper_type) if scraper_type else None

            try:
                if scraper_cls:
                    scraper = scraper_cls()
                    scraper.base_url = url
                else:
                    scraper = GenericScraper(url, name, site.get('selectors', {}))

                scrapers.append(scraper)
                default_timeout = settings.SCRAPING_CONFIG.get('TIMEOUT_PER_SITE', 180)
                timeout = site.get('timeout', default_timeout)
                site_start = time.perf_counter()
                try:
                    jobs = await asyncio.wait_for(scraper.scrape(max_pages=max_pages), timeout=timeout)
                except asyncio.TimeoutError:
                    logger.warning(f"Timeout après {timeout}s pour {name} (site bloquant, cf. Cloudflare)")
                    jobs = []
                    result.errors.append(f"{name}: timeout ({timeout}s)")
                except Exception as e:
                    logger.warning(f"Erreur #{name}: {e}")
                    jobs = []
                    result.errors.append(f"{name}: {e}")
                finally:
                    result.durations[name] = round(time.perf_counter() - site_start, 1)

                result.total_scraped += len(jobs)
                result.by_source[name] = len(jobs)
                result.sources_run.append(name)

                if jobs:
                    all_offers.extend(jobs)
                    _log(f"   [OK] {name} : {len(jobs)} offres")
                else:
                    _log(f"   [WARN] {name} : 0 offre (site inaccessible ou structure modifiée)")

            except Exception as e:
                result.errors.append(f"{name}: {e}")
                _log(f"   [ERR] {name} : {e}")

            await asyncio.sleep(1)

        if not all_offers:
            _log("\nAucune offre collectée sur l'ensemble des sites.")
            if os.path.exists(settings.PROCESSED_FILE):
                _log("Le fichier précédent est conservé.")
            result.finished_at = datetime.now().isoformat()
            result.total_duration = round(time.perf_counter() - pipeline_start, 1)
            try:
                with open(os.path.join(settings.DATA_DIR, 'last_run.json'), 'w', encoding='utf-8') as f:
                    json.dump({
                        'started_at': result.started_at,
                        'finished_at': result.finished_at,
                        'total_duration_s': result.total_duration,
                        'total_scraped': 0,
                        'new_jobs': 0,
                        'by_source': result.by_source,
                        'durations_s': result.durations,
                        'errors': result.errors,
                        'sources_run': result.sources_run,
                        'max_pages': max_pages,
                    }, f, ensure_ascii=False, indent=2)
            except Exception as e:
                logger.warning(f"Impossible d'écrire last_run.json: {e}")
            return result

        # ---------------------------------------------------------------
        # 2. Construction du DataFrame RAW
        # ---------------------------------------------------------------
        df_raw = pd.DataFrame(all_offers)
        raw_path = os.path.join(settings.RAW_DATA_DIR, 'jobs_senegal_raw.csv')
        df_raw.to_csv(raw_path, index=False, encoding='utf-8-sig')

        # ---------------------------------------------------------------
        # 3. Nettoyage / normalisation
        # ---------------------------------------------------------------
        cleaner = DataCleaner()
        df_clean = cleaner.clean(df_raw)

        if df_clean is None or df_clean.empty:
            _log("Aucune donnée valide après nettoyage.")
            return result

        # ---------------------------------------------------------------
        # 4. Détection des NOUVELLES offres (fusion incrémentale)
        # ---------------------------------------------------------------
        previous = None
        if os.path.exists(settings.PROCESSED_FILE):
            try:
                prev_df = pd.read_csv(settings.PROCESSED_FILE, encoding='utf-8-sig', dtype=str)
                if not prev_df.empty:
                    prev_df['offer_url'] = prev_df['offer_url'].fillna('')
                    previous = prev_df
            except Exception as e:
                _log(f"[WARN] Impossible de lire l'historique: {e}")

        if previous is not None:
            # Nouvelles = offres dont l'offer_url n'existe pas dans l'historique
            existing_urls = set(previous['offer_url'].astype(str).tolist())
            new_mask = ~df_clean['offer_url'].astype(str).isin(existing_urls)
            result.new_jobs = int(new_mask.sum())

            if result.new_jobs > 0:
                # Combiner : anciennes offres existantes + nouvelles (évite doublons par offer_url)
                df_clean = pd.concat([previous, df_clean[new_mask]], ignore_index=True)
                df_clean = df_clean.drop_duplicates(subset='offer_url', keep='first')
                df_clean = df_clean.reset_index(drop=True)
                _log(f"\n[NEW] {result.new_jobs} NOUVELLES offres détectées -> ajoutées à la base.")
            else:
                _log("\n[OK] Aucune nouvelle offre détectée. Base inchangée (contenu rafraîchi).")
                df_clean = previous  # Garde l'historique complet, n'écrase pas avec le dernier scrape seul
        else:
            result.new_jobs = len(df_clean)
            _log(f"\n[NEW] {result.new_jobs} offres initiales enregistrées (pas d'historique).")

        # ---------------------------------------------------------------
        # 5. Sauvegarde du CSV final
        # ---------------------------------------------------------------
        df_clean.to_csv(settings.PROCESSED_FILE, index=False, encoding='utf-8-sig')
        try:
            from radar_jobs.services.jobs_store import invalidate as invalidate_jobs_cache
            invalidate_jobs_cache()
        except Exception:
            pass
        _log(f"\n[OK] Données sauvegardées: {settings.PROCESSED_FILE}")
        _log(f"   Total dans la base: {len(df_clean)} offres")
        _log(f"   Répartition par source: {df_clean['source'].value_counts().to_dict()}")
        _log(f"   Durées par site (s): {result.durations}")

        result.finished_at = datetime.now().isoformat()
        result.total_duration = round(time.perf_counter() - pipeline_start, 1)
        # Métadonnées du run pour /health/ et /monitoring/
        try:
            last_run = {
                'started_at': result.started_at,
                'finished_at': result.finished_at,
                'total_duration_s': getattr(result, 'total_duration', None),
                'total_scraped': result.total_scraped,
                'new_jobs': result.new_jobs,
                'by_source': result.by_source,
                'durations_s': result.durations,
                'errors': result.errors,
                'sources_run': result.sources_run,
                'max_pages': max_pages,
            }
            with open(os.path.join(settings.DATA_DIR, 'last_run.json'), 'w', encoding='utf-8') as f:
                json.dump(last_run, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"Impossible d'écrire last_run.json: {e}")

        return result

    finally:
        for scraper in scrapers:
            try:
                await scraper.close()
            except Exception:
                pass
        # Réinitialiser le lecteur d'événements Windows si présent
        if sys.platform == 'win32':
            try:
                asyncio.set_event_loop(asyncio.new_event_loop())
            except Exception:
                pass


async def run_pipeline_once(max_pages: int = 2, emit_log=None) -> PipelineResult:
    return await run_pipeline(max_pages=max_pages, emit_log=emit_log)
