import time
import re
import random
import asyncio
import sys
import os
import json
import logging
from datetime import date
from typing import Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

FRENCH_MONTHS = {
    "janvier": 1, "fevrier": 2, "février": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "aout": 8, "août": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12, "décembre": 12,
}


def parse_date_french(text):
    """Convertit une date française ('12 mars 2025', '12/03/2025') en date ISO."""
    if not text:
        return ""
    txt = str(text).strip()
    # Format JJ/MM/AAAA ou JJ-MM-AAAA
    m = re.search(r'(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})', txt)
    if m:
        try:
            return date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat()
        except ValueError:
            pass
    # Format FR: "12 mars 2025" ou "12 mars 2025 à 10h"
    m = re.search(r'(\d{1,2})(?:er)?\s+([a-zéèêàâîôûùç\.\']+)\s+(\d{4})', txt, re.IGNORECASE)
    if m:
        month = FRENCH_MONTHS.get(m.group(2).lower().replace(".", ""))
        if month:
            try:
                return date(int(m.group(3)), month, int(m.group(1))).isoformat()
            except ValueError:
                return ""
    return ""


class BaseScraper:
    def __init__(self, base_url: str, max_retries: int = 3):
        self.base_url = base_url
        self.max_retries = max_retries
        self.driver = None  # Pour Selenium
        self.browser = None  # Pour nodriver (fallback)
        self.session = None
        self.cf_cookies = {}
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self._init_session()
        self._load_cf_cookies()
        self.prefer_nodriver = False
        self.allow_browser = True  # Mettre à False pour scraping 100% HTTP sans Selenium

    @property
    def cookies_file(self):
        return os.path.join(os.getcwd(), "chrome_profile", "cf_cookies.json")

    def _load_cf_cookies(self):
        """Charge les cookies Cloudflare (cf_clearance) persistés sur le disque."""
        try:
            if os.path.exists(self.cookies_file):
                with open(self.cookies_file, "r", encoding="utf-8") as f:
                    self.cf_cookies = json.load(f)
                    if self.cf_cookies:
                        logger.info("✅ Cookies Cloudflare chargés depuis le disque")
                        for name, value in self.cf_cookies.items():
                            try:
                                self.session.cookies.set(name, value)
                            except Exception:
                                pass
        except Exception as e:
            logger.warning(f"⚠️ Impossible de charger les cookies Cloudflare: {e}")

    def _save_cf_cookies(self, cookies_dict):
        """Persiste les cookies Cloudflare sur le disque."""
        try:
            profile_dir = os.path.join(os.getcwd(), "chrome_profile")
            os.makedirs(profile_dir, exist_ok=True)
            with open(self.cookies_file, "w", encoding="utf-8") as f:
                json.dump(cookies_dict, f, ensure_ascii=False, indent=2)
            logger.info("💾 Cookies Cloudflare sauvegardés sur le disque")
        except Exception as e:
            logger.warning(f"⚠️ Impossible de sauvegarder les cookies: {e}")

    def _sync_cookies_from_driver(self):
        """Extrait les cookies (cf_clearance) du navigateur pilote vers la session."""
        if not self.driver and not self.browser:
            return
        try:
            extracted = {}
            if self.driver:
                for cookie in self.driver.get_cookies():
                    extracted[cookie["name"]] = cookie["value"]
            elif self.browser:
                cookies = self.browser.cookies.get_all()
                for c in cookies:
                    extracted[c.name] = c.value
            # Ne garder que les cookies Cloudflare pertinents + user_agent
            important = {k: v for k, v in extracted.items()
                         if k in ("cf_clearance", "__cf_bm", "__cflb", "__cfruid")}
            if important:
                self.cf_cookies = important
                self._save_cf_cookies(important)
                for name, value in important.items():
                    try:
                        self.session.cookies.set(name, value)
                    except Exception:
                        pass
                logger.info(f"🔑 {len(important)} cookies Cloudflare synchronisés")
        except Exception as e:
            logger.warning(f"⚠️ Erreur synchro cookies: {e}")

    def _init_session(self):
        try:
            from curl_cffi import requests
            self.session = requests.Session()
        except ImportError:
            import requests
            self.session = requests.Session()

    async def get_soup(self, url: str, target_selector: Optional[str] = None) -> Optional[BeautifulSoup]:
        """
        Récupère le HTML avec retry automatique.
        Utilise Selenium en priorité pour Windows (plus fiable que nodriver).
        """
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

        for attempt in range(self.max_retries):
            try:
                logger.info(f"🔄 Tentative {attempt+1}/{self.max_retries} pour {url}")
                await asyncio.sleep(random.uniform(1, 2))

                # 1. Essai rapide avec curl_cffi
                soup = await self._fetch_with_curl(url, target_selector)
                if soup:
                    return soup

                if not getattr(self, 'allow_browser', True):
                    raise Exception("HTTP seul a échoué (browser désactivé)")

                # 2. nodriver en priorité pour les sites Cloudflare
                if getattr(self, 'prefer_nodriver', False):
                    soup = await self._fetch_with_nodriver(url, target_selector)
                    if soup:
                        return soup
                    soup = await self._fetch_with_selenium(url, target_selector)
                    if soup:
                        return soup
                else:
                    # 2. Essai avec Selenium (plus fiable sous Windows)
                    soup = await self._fetch_with_selenium(url, target_selector)
                    if soup:
                        return soup

                    # 3. Essai avec nodriver (fallback final)
                    soup = await self._fetch_with_nodriver(url, target_selector)
                    if soup:
                        return soup

                raise Exception("Toutes les méthodes ont échoué")

            except Exception as e:
                logger.warning(f"⚠️ Échec tentative {attempt+1}: {e}")
                if attempt < self.max_retries - 1:
                    wait_time = 5 * (attempt + 1)
                    logger.info(f"⏳ Attente de {wait_time}s...")
                    await asyncio.sleep(wait_time)

        logger.error(f"❌ Échec définitif pour {url}")
        return None

    async def _fetch_with_curl(self, url: str, target_selector: Optional[str] = None) -> Optional[BeautifulSoup]:
        try:
            from curl_cffi import requests
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.session.get(url, headers=self.headers, impersonate="chrome124", timeout=30)
            )
            if response.status_code >= 400:
                return None
            if "Just a moment" in response.text or "challenge-form" in response.text:
                return None

            soup = BeautifulSoup(response.content, 'html.parser')
            # Vérifie que le sélecteur existe vraiment (plus fiable que substring)
            if target_selector:
                if not soup.select_one(f".{target_selector}") and not soup.select_one(target_selector) and target_selector not in response.text:
                    return None
            else:
                # Page détail (pas de sélecteur cible) : accepter toute page
                # avec contenu textuel suffisant au lieu d'exiger des
                # sélecteurs de listing (bug précédent => détail toujours None).
                text_len = len(soup.get_text(separator=' ', strip=True))
                if text_len < 500:
                    has_content = (
                        soup.select_one('.card-job') or
                        soup.select_one('.facetapi-facet-im-field-offre-secteur') or
                        soup.select_one('.listing-card') or
                        soup.select_one('.job_listing') or
                        soup.select_one('article.post-wrap') or
                        soup.select_one('.entry-content') or
                        soup.select_one('article')
                    )
                    if not has_content:
                        return None
            return soup
        except Exception:
            return None

    async def _fetch_with_selenium(self, url: str, target_selector: Optional[str] = None) -> Optional[BeautifulSoup]:
        """Scrapping avec Selenium + undetected-chromedriver (stable sous Windows)."""
        try:
            import undetected_chromedriver as uc
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            import time

            if self.driver is None:
                logger.info("🚀 Démarrage du navigateur Selenium...")
                options = uc.ChromeOptions()
                options.add_argument("--disable-blink-features=AutomationControlled")
                options.add_argument("--no-sandbox")
                options.add_argument("--disable-dev-shm-usage")
                options.add_argument("--window-size=1920,1080")
                options.add_argument("--lang=fr-FR")
                self.driver = uc.Chrome(options=options)
                self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            self.driver.get(url)
            time.sleep(3)

            # Attente du sélecteur
            selector = target_selector if target_selector else ".card-job"
            try:
                WebDriverWait(self.driver, 30).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
            except:
                # Scroll si l'élément n'apparaît pas
                for _ in range(3):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)

            # Synchronise les cookies Cloudflare vers la session HTTP
            self._sync_cookies_from_driver()

            content = self.driver.page_source
            soup = BeautifulSoup(content, 'html.parser')

            # Vérification supplémentaire
            if not target_selector and not soup.select_one('.card-job'):
                logger.warning("⚠️ Aucune offre trouvée après Selenium")
                return None

            return soup

        except Exception as e:
            logger.warning(f"⚠️ Erreur Selenium: {e}")
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
                self.driver = None
            return None

    async def _fetch_with_nodriver(self, url: str, target_selector: Optional[str] = None) -> Optional[BeautifulSoup]:
        """Fallback avec nodriver (si Selenium échoue)."""
        try:
            import nodriver as uc
            import time

            is_connected = False
            if self.browser:
                try:
                    if hasattr(self.browser, 'connection') and self.browser.connection and not self.browser.connection.closed:
                        is_connected = True
                except:
                    pass

            if not is_connected:
                logger.info("🚀 Démarrage de nodriver...")
                if self.browser:
                    try:
                        await self.browser.stop()
                    except:
                        pass
                profile_dir = os.path.join(os.getcwd(), "chrome_profile")
                browser_args = [
                    "--window-size=1920,1080",
                    "--lang=fr-FR,fr",
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                ]
                self.browser = await uc.start(sandbox=False, user_data_dir=profile_dir, browser_args=browser_args)

            page = await self.browser.get(url)

            # Attente du contenu ou de la disparition du challenge Cloudflare
            ready = False
            for attempt in range(12):
                content = await page.get_content()
                has_challenge = (
                    "challenges.cloudflare.com" in content or
                    "Just a moment" in content or
                    "cf-challenge" in content
                )
                has_target = (
                    (target_selector and target_selector in content)
                    or (not target_selector and "card-job" in content)
                )
                if has_target or not has_challenge:
                    if not has_challenge:
                        ready = True
                        break
                if has_target:
                    ready = True
                    break
                # Le challenge Cloudflare parfois se résout tout seul après quelques secondes
                if attempt in (4, 7):
                    try:
                        await page.reload()
                    except Exception:
                        pass
                await asyncio.sleep(3)

            content = await page.get_content()
            try:
                await page.close()
            except Exception:
                pass

            # Synchronise les cookies cf_clearance une fois le challenge résolu
            await asyncio.sleep(1)
            self._sync_cookies_from_driver()

            if not ready or "Just a moment" in content:
                logger.warning("⚠️ Challenge Cloudflare non résolu (intervention manuelle nécessaire)")
                return None

            soup = BeautifulSoup(content, 'html.parser')
            return soup

        except Exception as e:
            logger.error(f"Erreur nodriver: {e}")
            if self.browser:
                try:
                    await self.browser.stop()
                except:
                    pass
                self.browser = None
            return None

    async def close(self):
        """Ferme les navigateurs."""
        if self.driver:
            logger.info("🛑 Fermeture de Selenium...")
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None
        if self.browser:
            logger.info("🛑 Fermeture de nodriver...")
            try:
                await self.browser.stop()
            except:
                pass
            self.browser = None

    async def sleep(self, min_sec=1, max_sec=3):
        await asyncio.sleep(random.uniform(min_sec, max_sec))

    @staticmethod
    def extract_detail_description(detail_soup: BeautifulSoup, selectors: list) -> str:
        """Extrait la description d'une page détail (sélecteurs ordonnés + fallback meta/plus long <p>)."""
        if detail_soup is None:
            return ''
        for sel in selectors:
            try:
                block = detail_soup.select_one(sel)
            except Exception:
                block = None
            if block:
                # Retire nav/footer/script/style du bloc pour éviter le bruit
                for tag in block.select('nav, footer, header, script, style, form'):
                    tag.decompose()
                text = block.get_text(separator=' ', strip=True)
                text = re.sub(r'\s+', ' ', text).strip()
                if len(text) > 80:
                    return text[:2000]
        # Fallback : meta description
        try:
            meta = detail_soup.select_one('meta[name="description"]')
            if meta and meta.get('content') and len(meta.get('content').strip()) > 80:
                return re.sub(r'\s+', ' ', meta.get('content').strip())[:2000]
        except Exception:
            pass
        # Fallback : plus long paragraphe
        try:
            best = ''
            for p in detail_soup.select('p'):
                t = re.sub(r'\s+', ' ', p.get_text(separator=' ', strip=True)).strip()
                if len(t) > len(best):
                    best = t
            if len(best) > 80:
                return best[:2000]
        except Exception:
            pass
        return ''

    async def enrich_jobs_with_details(self, jobs: list, selectors: list, max_enrich: int = 20, concurrency: int = 5) -> list:
        """Enrichit jobs['description'] vide via fetch page détail (concurrence bornée)."""
        targets = [j for j in jobs if not (j.get('description') or '').strip() and j.get('url')]
        targets = targets[:max_enrich]
        if not targets:
            return jobs
        sem = asyncio.Semaphore(concurrency)

        async def _one(job):
            async with sem:
                try:
                    detail_soup = await self.get_soup(job['url'])
                    desc = self.extract_detail_description(detail_soup, selectors)
                    if desc:
                        job['description'] = desc
                except Exception as e:
                    logger.debug(f"Erreur détail {job.get('url')}: {e}")
                await asyncio.sleep(0.3)

        await asyncio.gather(*[_one(j) for j in targets])
        enriched = sum(1 for j in targets if (j.get('description') or '').strip())
        logger.info(f"📝 Descriptions enrichies: {enriched}/{len(targets)}")
        return jobs