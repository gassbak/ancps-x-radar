import asyncio
import logging
from typing import List, Dict
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper, parse_date_french

logger = logging.getLogger(__name__)


class JobSenegalScraper(BaseScraper):
    """
    Scraper pour JobSenegal.com (site de recrutement type blog/news).
    Structure observée : <article class="post-wrap"> avec <h2 class="post-title"><a>.
    """

    def __init__(self):
        super().__init__("https://jobsenegal.com/")
        self.allow_browser = False

    async def scrape(self, max_pages: int = 1) -> List[Dict]:
        logger.info("🔍 Scraping JobSenegal")
        all_jobs = []

        for page in range(1, max_pages + 1):
            if page == 1:
                url = self.base_url
            else:
                url = f"{self.base_url.rstrip('/')}/page/{page}/"

            logger.info(f"📄 Page {page}: {url}")

            soup = await self.get_soup(url, target_selector="post-title")
            if not soup:
                break

            page_jobs = self._parse_jobs(soup)
            if not page_jobs:
                break

            await self.enrich_jobs_with_details(
                page_jobs,
                selectors=['.entry-content', '.post-content', 'article', '.content'],
                max_enrich=20,
                concurrency=5,
            )

            all_jobs.extend(page_jobs)
            await self.sleep(1, 2)

        logger.info(f"✅ JobSenegal: {len(all_jobs)} offres")
        return all_jobs

    def _parse_jobs(self, soup: BeautifulSoup) -> List[Dict]:
        jobs = []
        headers = soup.select('.post-title a, h2.post-title a')

        if not headers:
            return []

        seen = set()
        for link in headers:
            try:
                href = link.get('href')
                if not href or href in seen:
                    continue
                title = link.get_text(strip=True)
                if not title:
                    continue

                seen.add(href)
                article = link.find_parent('article') or link.find_parent('div')

                # Tentative de récupération de date depuis le container
                date_elem = None
                if article:
                    date_elem = article.select_one('time, .post-date, .entry-date, .date')
                raw_text = title.lower()

                job = {
                    'title': title,
                    'company': '',
                    'location': 'Non spécifié',
                    'description': '',
                    'date': parse_date_french(date_elem.get_text(strip=True)) if date_elem else '',
                    'url': href,
                    'contract_type': self._detect_contract(raw_text),
                    'sector': self._detect_sector(raw_text),
                    'source': 'jobsenegal.com',
                    'source_url': self.base_url,
                }

                jobs.append(job)

            except Exception as e:
                logger.debug(f"Erreur parsing JobSenegal: {e}")
                continue

        return jobs

    @staticmethod
    def _detect_contract(text: str) -> str:
        if 'stage' in text or 'stagiaire' in text:
            return 'Stage'
        if 'freelance' in text:
            return 'Freelance'
        if 'cdd' in text:
            return 'CDD'
        return ''

    @staticmethod
    def _detect_sector(text: str) -> str:
        if any(k in text for k in ['developpeur', 'developpeuse', 'informaticien', 'software', 'data', 'cyber']):
            return 'Informatique'
        if any(k in text for k in ['commercial', 'vendeur', 'merchandiser', 'vente']):
            return 'Commerce'
        if 'marketing' in text or 'community' in text:
            return 'Marketing'
        if any(k in text for k in ['comptable', 'finance', 'audit', 'budget']):
            return 'Finance'
        return 'Non spécifié'
