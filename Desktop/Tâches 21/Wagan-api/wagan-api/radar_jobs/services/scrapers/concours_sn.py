import asyncio
import logging
from typing import List, Dict
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper, parse_date_french

logger = logging.getLogger(__name__)


class ConcoursSNScraper(BaseScraper):
    """
    Scraper pour ConcoursN.com — https://concoursn.com
    Listing principal : /category/senegal/recrutement-senegal/ (Sénégal)
    """
    
    def __init__(self):
        super().__init__("https://concoursn.com/category/senegal/recrutement-senegal/")
        self.allow_browser = False
    
    async def scrape(self, max_pages: int = 3) -> List[Dict]:
        """Scrape les offres d'emploi sur plusieurs pages."""
        logger.info("🔍 Scraping ConcoursN")
        
        all_jobs = []
        
        for page in range(1, max_pages + 1):
            if page == 1:
                url = self.base_url
            else:
                url = f"{self.base_url.rstrip('/')}/page/{page}/"
            
            logger.info(f"📄 Page {page}: {url}")
            
            soup = await self.get_soup(url, target_selector="vce-post")
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
            await self.sleep(2, 4)
        
        logger.info(f"✅ ConcoursSN: {len(all_jobs)} offres")
        return all_jobs
    
    def _parse_jobs(self, soup: BeautifulSoup) -> List[Dict]:
        """Parse le HTML de ConcoursN (vce-post)."""
        jobs = []
        
        cards = soup.select('article.vce-post')
        if not cards:
            cards = soup.select('article')
        
        if not cards:
            logger.debug("Aucune carte trouvée sur ConcoursN")
            return []
        
        for card in cards:
            try:
                title_elem = card.select_one('h2.entry-title a, h2 a, h3 a')
                if not title_elem:
                    continue
                
                company_elem = card.select_one('.company, .employeur, .entreprise')
                location_elem = card.select_one('.location, .ville, .lieu')
                date_elem = card.select_one('.meta-item.date .updated, .date, time')
                link_elem = title_elem
                desc_elem = card.select_one('.entry-content p, .excerpt p')
                
                job = {
                    'title': title_elem.get_text(strip=True) if title_elem else 'Non spécifié',
                    'company': company_elem.get_text(strip=True) if company_elem else 'Non spécifiée',
                    'location': location_elem.get_text(strip=True) if location_elem else 'Sénégal',
                    'description': desc_elem.get_text(strip=True) if desc_elem else '',
                    'date': parse_date_french(date_elem.get_text(strip=True)) if date_elem else '',
                    'url': link_elem.get('href') if link_elem else '',
                    'sector': 'Non spécifié',
                    'source': 'concoursn.com',
                    'source_url': self.base_url,
                }
                
                if job['title'] != 'Non spécifié':
                    jobs.append(job)
                    
            except Exception as e:
                logger.debug(f"Erreur parsing ConcoursSN: {e}")
                continue
        
        return jobs