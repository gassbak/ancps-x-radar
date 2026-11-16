import asyncio
import logging
import os
import re
import time
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from django.db import transaction
from django.utils import timezone

from radar_jobs.models import ANCPSCertification

logger = logging.getLogger(__name__)

DEFAULT_ANCPS_ANNUAIRE_URL = 'https://ancps-senegal.vercel.app/annuaire'
PAGE_LOAD_TIMEOUT = 30

def _text(element):
    if element is None:
        return ''
    return re.sub(r'\s+', ' ', element.get_text(' ', strip=True)).strip()


def _clean_value(value):
    value = re.sub(r'\s+', ' ', str(value or '')).strip()
    if value.lower() in {'non renseigné', 'non renseignée', 'à préciser'}:
        return ''
    return value


def _listing_count(soup):
    for node in soup.select('main p'):
        match = re.search(
            r'(\d+)\s+certifications?\s+trouvées?',
            _text(node),
            re.IGNORECASE,
        )
        if match:
            return int(match.group(1))
    return None


def _listing_is_complete(soup):
    expected_count = _listing_count(soup)
    return expected_count is not None and len(soup.select('a[href^="/certification/"]')) == expected_count


def _parse_listing(html, annuaire_url):
    soup = BeautifulSoup(html, 'html.parser')
    cards = []
    seen_ids = set()

    for card in soup.select('a[href^="/certification/"]'):
        href = card.get('href', '')
        source_id = urlparse(href).path.rstrip('/').split('/')[-1]
        title = _text(card.select_one('h2'))
        if not source_id or not title or source_id in seen_ids:
            continue
        seen_ids.add(source_id)

        badges = [_text(badge) for badge in card.select('div.flex.flex-wrap.gap-2 span')]
        card_type = next(
            (badge for badge in badges if badge.lower() in {'formation / diplôme', 'certification'}),
            '',
        )
        level = next((badge for badge in badges if badge and badge != card_type), '')
        domain_label = next(
            (label for label in card.select('p') if _text(label).lower() == 'domaine'),
            None,
        )
        domain_value = _text(domain_label.find_next_sibling('p')) if domain_label else ''

        cards.append({
            'source_id': source_id,
            'url': urljoin(annuaire_url, href),
            'title': title,
            'type': card_type,
            'level': _clean_value(level),
            'domain': _clean_value(domain_value),
        })

    expected_count = _listing_count(soup)
    if expected_count is None:
        raise ValueError('Le nombre de certifications ANCPS affiché est introuvable.')
    if expected_count != len(cards):
        raise ValueError(
            f'Liste ANCPS incomplète: {len(cards)} fiche(s) extraites sur '
            f'{expected_count} affichée(s).'
        )
    return cards


def _section(soup, title):
    for heading in soup.select('main h2'):
        if _text(heading).casefold() == title.casefold():
            return heading.find_parent('section') or heading.find_parent('aside')
    return None


def _section_text(section, ignore=()):
    if section is None:
        return ''
    paragraphs = [_text(item) for item in section.select('p')]
    ignored = {item.casefold() for item in ignore}
    return '\n'.join(text for text in paragraphs if text and text.casefold() not in ignored)


def _label_values(section):
    values = {}
    if section is None:
        return values

    allowed_labels = {
        'niveau',
        'type',
        'durée',
        'modalité',
        'organisme certificateur',
        'domaine',
        'pays',
        'sigle',
        'métiers associés',
        'établissements',
    }
    for label in section.select('p'):
        key = _text(label).casefold()
        if key not in allowed_labels:
            continue
        parent = label.parent
        paragraphs = parent.find_all('p', recursive=False) if parent else []
        if len(paragraphs) < 2 or paragraphs[0] is not label:
            continue
        value = _clean_value(_text(paragraphs[1]))
        if value:
            values[key] = value
    return values


def _detail_data(html, card, source_url):
    soup = BeautifulSoup(html, 'html.parser')
    heading = soup.select_one('h1')
    title = _text(heading)
    if not title:
        raise ValueError(f'La fiche ANCPS {card["source_id"]} ne contient pas de titre.')
    if title != card['title']:
        raise ValueError(
            f"Titre ANCPS incohérent pour {card['source_id']}: "
            f"« {title} » au lieu de « {card['title']} »."
        )

    badge_container = heading.find_previous_sibling('div')
    badges = [_text(badge) for badge in badge_container.select('span')] if badge_container else []
    organization_node = heading.find_next_sibling('p')
    organization = ''
    country = ''
    if organization_node:
        country_node = organization_node.find('span')
        country = _clean_value(_text(country_node))
        organization = _clean_value(''.join(
            str(child) for child in organization_node.children
            if getattr(child, 'name', None) is None
        ))

    key_info = _label_values(_section(soup, 'Informations clés'))
    additional_info = _label_values(_section(soup, 'Informations complémentaires'))
    presentation = _section_text(_section(soup, 'Présentation'))
    objectives = _section_text(
        _section(soup, 'Objectifs de la formation'),
        ignore=('Les objectifs de cette certification ne sont pas encore renseignés.',),
    )
    skills_section = _section(soup, 'Blocs de compétences')
    skills = []
    if skills_section:
        skills = [
            _text(item)
            for item in skills_section.select('li')
            if _text(item)
        ]
        if not skills:
            skills = [
                _text(item)
                for item in skills_section.select('p')
                if _text(item).casefold() not in {
                    'compétences associées à cette certification.',
                    'aucun bloc de compétences renseigné.',
                }
            ]

    certification_type = _clean_value(key_info.get('type') or card['type'])
    domain = _clean_value(key_info.get('domaine') or additional_info.get('domaine') or card['domain'])
    level = _clean_value(key_info.get('niveau') or card['level'])
    duration = _clean_value(key_info.get('durée'))
    modality = _clean_value(key_info.get('modalité'))

    return {
        '_id': card['source_id'],
        'id': card['source_id'],
        'title': title,
        'sigle': _clean_value(additional_info.get('sigle')),
        'type': certification_type,
        'nature': certification_type,
        'domaine': domain,
        'sousDomaine': '',
        'niveauEntree': level,
        'niveauSortie': level,
        'duree': duration,
        'volumeHoraire': '',
        'modalite': modality,
        'lieu': country,
        'cout': '',
        'organisme': organization or _clean_value(key_info.get('organisme certificateur')),
        'description': presentation,
        'objectifs': objectives,
        'conditionsAcces': '',
        'competences': skills,
        'competencesLibres': [],
        'metiers': additional_info.get('métiers associés', ''),
        'etablissements': additional_info.get('établissements', ''),
        'statutVerification': _clean_value(badges[-1]) if len(badges) >= 3 else '',
        'sourceLastVerifiedAt': '',
        'sourceUrl': source_url,
        'published': True,
    }


async def _get_rendered_html(page, url, is_ready, description):
    await page.get(url)
    deadline = time.monotonic() + PAGE_LOAD_TIMEOUT
    while time.monotonic() < deadline:
        html = await page.get_content()
        soup = BeautifulSoup(html, 'html.parser')
        if is_ready(soup):
            return html
        await asyncio.sleep(0.5)
    raise TimeoutError(f'Contenu ANCPS non chargé ({description}): {url}')


async def _scrape_published_certifications(annuaire_url):
    try:
        import nodriver
    except ImportError as exc:
        raise RuntimeError(
            'Le scraping ANCPS nécessite nodriver et un navigateur Chromium disponible.'
        ) from exc

    browser = await nodriver.start(
        headless=True,
        sandbox=False,
        browser_args=[
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--lang=fr-FR',
        ],
    )
    try:
        page = await browser.get(annuaire_url)
        listing_html = await _get_rendered_html(
            page,
            annuaire_url,
            _listing_is_complete,
            'annuaire',
        )
        cards = _parse_listing(listing_html, annuaire_url)
        if not cards:
            return []

        records = []
        for card in cards:
            detail_html = await _get_rendered_html(
                page,
                card['url'],
                lambda soup: _text(soup.select_one('h1')) == card['title']
                and bool(soup.select_one('main h2')),
                f"fiche {card['source_id']}",
            )
            records.append(_detail_data(detail_html, card, card['url']))
        return records
    finally:
        process = browser._process
        await browser.aclose()
        browser.stop()
        if process is not None:
            await process.communicate()


def sync_ancps_certifications(annuaire_url=None):
    """Scrape les fiches publiques du site ANCPS et les stocke dans Radar."""
    annuaire_url = (
        annuaire_url
        or os.getenv('ANCPS_ANNUAIRE_URL')
        or DEFAULT_ANCPS_ANNUAIRE_URL
    ).strip()
    if not annuaire_url.startswith(('http://', 'https://')):
        raise ValueError('ANCPS_ANNUAIRE_URL doit être une URL HTTP(S) valide.')

    records = asyncio.run(_scrape_published_certifications(annuaire_url))
    if not records:
        logger.warning(
            'Le scraping ANCPS ne renvoie aucune fiche; '
            'aucune fiche Radar n’a été désactivée.'
        )
        return {'received': 0, 'created': 0, 'updated': 0, 'deactivated': 0}

    normalized_records = []
    seen_ids = set()
    for record in records:
        source_id = str(record.get('_id') or record.get('id') or '').strip()
        title = str(record.get('title') or '').strip()
        if not source_id or not title:
            raise ValueError('Scraping ANCPS invalide: une fiche ne possède pas d’identifiant ou de titre.')
        if source_id in seen_ids:
            continue
        seen_ids.add(source_id)
        normalized_records.append((source_id, title, record))

    created = 0
    updated = 0
    with transaction.atomic():
        for source_id, title, data in normalized_records:
            _, was_created = ANCPSCertification.objects.update_or_create(
                source_id=source_id,
                defaults={
                    'title': title,
                    'data': data,
                    'is_published': True,
                    'source_updated_at': timezone.now(),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        deactivated = ANCPSCertification.objects.filter(
            is_published=True
        ).exclude(source_id__in=seen_ids).update(is_published=False)

    result = {
        'received': len(normalized_records),
        'created': created,
        'updated': updated,
        'deactivated': deactivated,
    }
    logger.info('Scraping ANCPS terminé: %s', result)
    return result
