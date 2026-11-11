import asyncio
import logging
from typing import List, Dict
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper, parse_date_french

logger = logging.getLogger(__name__)


class ExpatDakarScraper(BaseScraper):
    """
    Scraper pour Expat-Dakar.com (rubrique emploi).
    Structure observée : <div class="listing-card"> avec lien .listing-card__inner.
    """

    def __init__(self):
        super().__init__("https://www.expat-dakar.com/emploi")
        self.allow_browser = False

    async def scrape(self, max_pages: int = 1) -> List[Dict]:
        logger.info("🔍 Scraping Expat-Dakar")
        all_jobs = []

        for page in range(1, max_pages + 1):
            if page == 1:
                url = self.base_url
            else:
                url = f"{self.base_url}?page={page}"

            logger.info(f"📄 Page {page}: {url}")

            soup = await self.get_soup(url, target_selector="listing-card")
            if not soup:
                break

            page_jobs = self._parse_jobs(soup)
            if not page_jobs:
                break

            # Expat : beaucoup d'annonces expirées (redirect catégorie) => enrichissement borné
            await self.enrich_jobs_with_details(
                page_jobs,
                selectors=['.listing-details__description', '.details-content', '.text-content', 'article', '.content'],
                max_enrich=10,
                concurrency=3,
            )

            all_jobs.extend(page_jobs)
            await self.sleep(1, 2)

        logger.info(f"✅ Expat-Dakar: {len(all_jobs)} offres")
        return all_jobs

    def _parse_jobs(self, soup: BeautifulSoup) -> List[Dict]:
        jobs = []
        cards = soup.select('.listing-card')

        if not cards:
            return []

        for card in cards:
            try:
                link_elem = card.select_one('.listing-card__inner[href]')
                if not link_elem:
                    continue

                title_elem = card.select_one('.listing-card__header__title')
                company_elem = card.select_one('.listing-card__header__tags__item--employer')
                location_elem = card.select_one('.listing-card__header__location')
                date_elem = card.select_one('.listing-card__header__date')

                # Catégorie via attribut data (secteur d'activité)
                category = link_elem.get('data-t-listing_category_title') or ''

                job = {
                    'title': title_elem.get_text(strip=True) if title_elem else 'Non spécifié',
                    'company': company_elem.get_text(strip=True) if company_elem else 'Non spécifiée',
                    'location': location_elem.get_text(strip=True) if location_elem else 'Non spécifié',
                    'description': '',
                    'date': parse_date_french(date_elem.get_text(strip=True)) if date_elem else '',
                    'url': link_elem.get('href'),
                    'contract_type': '',
                    'sector': self._map_sector(category),
                    'source': 'expat-dakar.com',
                    'source_url': self.base_url,
                }

                if job['title'] != 'Non spécifié' and job['url']:
                    jobs.append(job)

            except Exception as e:
                logger.debug(f"Erreur parsing Expat-Dakar: {e}")
                continue

        return jobs

    @staticmethod
    def _map_sector(category: str) -> str:
        cat = (category or '').lower()
        if 'informatiq' in cat or 'technologie' in cat or 'digital' in cat:
            return 'Informatique'
        if 'commercial' in cat or 'vente' in cat:
            return 'Commerce'
        if 'marketing' in cat or 'communication' in cat:
            return 'Marketing'
        if 'service' in cat or 'personne' in cat:
            return 'Services'
        if 'educ' in cat or 'formation' in cat or 'enseign' in cat:
            return 'Éducation'
        return 'Non spécifié'
