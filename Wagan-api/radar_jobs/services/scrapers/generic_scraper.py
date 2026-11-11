import asyncio
import logging
from urllib.parse import urljoin, urlparse
from typing import List, Dict
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper, parse_date_french

logger = logging.getLogger(__name__)


class GenericScraper(BaseScraper):
    """Scraper générique paramétrable."""

    def __init__(self, base_url: str, source_name: str, selectors: Dict[str, str]):
        super().__init__(base_url)
        self.source_name = source_name
        self.selectors = selectors

    @staticmethod
    def _resolve_url(base_url: str, link: str) -> str:
        if not link:
            return ""
        if link.startswith("http"):
            return link
        return urljoin(base_url, link)

    async def scrape(self, max_pages: int = 2) -> List[Dict]:
        logger.info(f"🔍 Scraping {self.source_name}")

        all_jobs = []

        for page in range(1, max_pages + 1):
            if page == 1:
                url = self.base_url
            else:
                if '?' in self.base_url:
                    url = f"{self.base_url}&page={page}"
                else:
                    url = f"{self.base_url}?page={page}"

            logger.info(f"📄 Page {page}: {url}")

            target = self.selectors.get('container', '.job-item')
            soup = await self.get_soup(url, target_selector=target)

            if not soup:
                break

            page_jobs = self._parse_jobs(soup)
            if not page_jobs:
                break

            all_jobs.extend(page_jobs)
            await self.sleep(2, 4)

        logger.info(f"✅ {self.source_name}: {len(all_jobs)} offres")
        return all_jobs

    def _parse_jobs(self, soup: BeautifulSoup) -> List[Dict]:
        jobs = []

        container_sel = self.selectors.get('container', '.job-item')
        cards = soup.select(container_sel)

        if not cards:
            return []

        for card in cards:
            try:
                title_sel = self.selectors.get('title', 'h2 a, h3 a')
                company_sel = self.selectors.get('company', '.company')
                location_sel = self.selectors.get('location', '.location')
                date_sel = self.selectors.get('date', '.date')
                link_sel = self.selectors.get('link', 'a[href]')

                title_elem = card.select_one(title_sel) or card.select_one('a')
                company_elem = card.select_one(company_sel) if company_sel else None
                location_elem = card.select_one(location_sel) if location_sel else None
                date_elem = card.select_one(date_sel) if date_sel else None
                link_elem = card.select_one(link_sel) if link_sel else None

                url = self._resolve_url(self.base_url, link_elem.get('href') if link_elem else '')
                title = title_elem.get_text(strip=True) if title_elem else 'Non spécifié'

                date_val = ''
                if date_elem:
                    if date_elem.get('datetime'):
                        date_val = date_elem.get('datetime')
                    else:
                        date_val = parse_date_french(date_elem.get_text(strip=True))

                job = {
                    'title': title,
                    'company': company_elem.get_text(strip=True) if company_elem else 'Non spécifiée',
                    'location': location_elem.get_text(strip=True) if location_elem else 'Non spécifié',
                    'date': date_val,
                    'url': url,
                    'contract_type': '',
                    'sector': 'Non spécifié',
                    'source': self.source_name,
                    'source_url': self.base_url,
                }

                if title != 'Non spécifié':
                    jobs.append(job)

            except Exception as e:
                logger.debug(f"Erreur parsing générique: {e}")
                continue

        return jobs


def is_internal_site(name: str) -> bool:
    """Indique si un site du fichier de config doit être scrappé par un scraper dédié."""
    from radar_jobs.data.sites_config import DEDICATED_SCRAPERS
    return name.lower() in DEDICATED_SCRAPERS
