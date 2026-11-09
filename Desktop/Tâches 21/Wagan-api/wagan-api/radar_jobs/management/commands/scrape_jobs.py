import asyncio
import logging
import os
from datetime import datetime
from django.conf import settings
from django.core.management.base import BaseCommand
from radar_jobs.services.pipeline import run_pipeline


class Command(BaseCommand):
    help = 'Lance le processus de scraping multi-sites des offres d\'emploi au Sénégal'

    def add_arguments(self, parser):
        parser.add_argument('--max-pages', type=int, default=None, help='Pages par site (défaut: SCRAPING_CONFIG MAX_PAGES)')

    def handle(self, *args, **options):
        max_pages = options.get('max_pages') or settings.SCRAPING_CONFIG.get('MAX_PAGES', 2)
        self.stdout.write(self.style.SUCCESS(f'Démarrage du pipeline de scraping multi-sites (max_pages={max_pages})...'))

        # Log fichier par run : logs/scrape_YYYYMMDD_HHMMSS.log
        log_path = None
        file_handler = None
        try:
            os.makedirs('logs', exist_ok=True)
            log_path = os.path.join('logs', f"scrape_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
            file_handler = logging.FileHandler(log_path, encoding='utf-8')
            file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s'))
            logging.getLogger().addHandler(file_handler)
            logging.getLogger().setLevel(logging.INFO)
        except Exception:
            pass

        def emit_log(msg):
            self.stdout.write(msg)
            try:
                logging.getLogger('radar_jobs.pipeline').info(msg)
            except Exception:
                pass

        try:
            result = asyncio.run(run_pipeline(max_pages=max_pages, emit_log=emit_log))
            self.stdout.write(self.style.SUCCESS(
                f"\nPipeline terminé.\n"
                f"  Sites exécutés : {', '.join(result.sources_run) if result.sources_run else 'aucun'}\n"
                f"  Total scrapé : {result.total_scraped} offres\n"
                f"  Nouvelles offres ajoutées : {result.new_jobs}"
            ))
            if result.errors:
                self.stdout.write(self.style.WARNING(
                    f"  Erreurs : {'; '.join(result.errors)}"))
            if getattr(result, 'durations', None):
                self.stdout.write(f"  Durées par site (s) : {result.durations}")
            if log_path:
                self.stdout.write(f"  Log fichier : {log_path}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Erreur lors du scraping : {str(e)}'))
        finally:
            try:
                if file_handler:
                    logging.getLogger().removeHandler(file_handler)
                    file_handler.close()
            except Exception:
                pass
