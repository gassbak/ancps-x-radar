"""
Configuration des sites d'emploi à scraper.

Liste vérifiée (structure réelle analysée en 2026) des sites accessibles depuis
le scraping. Les sélecteurs correspondent au HTML réel observé.

Sites fonctionnels :
- emploisenegal.com  -> nécessite navigateur Cloudflare (scraper dédié)
- emploidakar.com    -> HTTP simple (scraper dédié)
- expat-dakar.com    -> HTTP simple (scraper dédié)
- jobsenegal.com     -> HTTP simple (scraper dédié)
"""

# Sites traités par un scraper dédié dans radar_jobs/services/scrapers
DEDICATED_SCRAPERS = [
    'emploidakar',
    'expat_dakar',
    'jobsenegal',
    'concoursn',
]

# Liste générique (GenericScraper) basée sur les sélecteurs réels observés.
# Peut être étendue si de nouveaux sites sont validés.
SITES_TO_TEST = [
    {
        'name': 'expat_dakar',
        'url': 'https://www.expat-dakar.com/emploi',
        'scraper': 'expat_dakar',
        'selectors': {
            'container': '.listing-card',
            'title': '.listing-card__header__title',
            'company': '.listing-card__header__tags__item--employer',
            'location': '.listing-card__header__location',
            'date': '.listing-card__header__date',
            'link': 'a.listing-card__inner[href]',
        }
    },
    {
        'name': 'jobsenegal',
        'url': 'https://jobsenegal.com/',
        'scraper': 'jobsenegal',
        'selectors': {
            'container': 'article.post-wrap',
            'title': '.post-title a',
            'link': '.post-title-link[href], a[rel="bookmark"]',
            'date': '.post-date, time, .entry-date',
        }
    },
    {
        'name': 'emploidakar',
        'url': 'https://www.emploidakar.com/offres',
        'scraper': 'emploidakar',
        'selectors': {
            'container': '.job_listing',
            'title': '.position h3',
            'company': '.position .company',
            'location': '.location',
            'date': '.meta .date time',
            'link': 'a[href]',
        }
    },
    {
        'name': 'concoursn',
        'url': 'https://concoursn.com/category/senegal/recrutement-senegal/',
        'scraper': 'concoursn',
        'selectors': {
            'container': 'article.vce-post',
            'title': 'h2.entry-title a',
            'link': 'h2.entry-title a[href]',
            'date': '.meta-item.date .updated',
        }
    },
]
