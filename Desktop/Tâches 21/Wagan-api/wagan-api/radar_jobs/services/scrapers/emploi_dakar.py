import asyncio
import logging
from typing import List, Dict
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper

logger = logging.getLogger(__name__)


class EmploiDakarScraper(BaseScraper):
    """
    Scraper pour EmploiDakar.com (liste d'offres).
    Structure observée : <li class="job_listing"> avec lien direct vers l'offre.
    """

    def __init__(self):
        super().__init__("https://www.emploidakar.com/offres")
        self.sector_hint = "Non spécifié"
        self.allow_browser = False

    async def scrape(self, max_pages: int = 1) -> List[Dict]:
        """Scrape les offres d'emploi sur plusieurs pages + enrichissement rapide."""
        logger.info("🔍 Scraping Emploi Dakar")

        all_jobs = []

        for page in range(1, max_pages + 1):
            if page == 1:
                url = self.base_url
            else:
                url = f"{self.base_url}?page={page}"

            logger.info(f"📄 Page {page}: {url}")

            soup = await self.get_soup(url, target_selector="position")
            if not soup:
                break

            page_jobs = self._parse_jobs(soup)
            if not page_jobs:
                break

            await self.enrich_jobs_with_details(
                page_jobs,
                selectors=['.entry-content', '.job-description', '.post-content', 'article', '.content'],
                max_enrich=20,
                concurrency=5,
            )

            all_jobs.extend(page_jobs)
            await self.sleep(1, 2)

        logger.info(f"✅ Emploi Dakar: {len(all_jobs)} offres")
        return all_jobs

    def _parse_jobs(self, soup: BeautifulSoup) -> List[Dict]:
        """Parse le HTML de Emploi Dakar."""
        jobs = []

        cards = soup.select('.job_listing, article, .card')

        if not cards:
            logger.debug("Aucune carte trouvée sur Emploi Dakar")
            return []

        for card in cards:
            try:
                link_elem = card.select_one('a[href]')
                title_elem = card.select_one('.position h3, h3, h2, .job-title')
                company_elem = card.select_one('.position .company, .company strong, .company, .employer')
                location_elem = card.select_one('.location, .city')
                date_elem = card.select_one('.meta .date time, .date, time')
                contract_elem = card.select_one('.meta .job-type, .contract-type, .badge')
                desc_elem = card.select_one('.description, .job-description, p')
                skills_elem = card.select_one('.skills, .tags')

                date_val = date_elem.get('datetime') if date_elem and date_elem.get('datetime') else (
                    date_elem.get_text(strip=True) if date_elem else ''
                )

                job = {
                    'title': title_elem.get_text(strip=True) if title_elem else 'Non spécifié',
                    'company': company_elem.get_text(strip=True) if company_elem else 'Non spécifiée',
                    'location': location_elem.get_text(strip=True) if location_elem else 'Dakar',
                    'description': desc_elem.get_text(separator=' ', strip=True) if desc_elem else '',
                    'date': date_val,
                    'url': link_elem.get('href') if link_elem else '',
                    'contract_type': contract_elem.get_text(strip=True) if contract_elem else 'CDI',
                    'key_skills': skills_elem.get_text(strip=True) if skills_elem else '',
                    'sector': self.sector_hint,
                    'source': 'emploidakar.com',
                    'source_url': self.base_url,
                }

                if job['title'] != 'Non spécifié':
                    jobs.append(job)

            except Exception as e:
                logger.debug(f"Erreur parsing Emploi Dakar: {e}")
                continue

        return jobs
