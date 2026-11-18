"""Scraping des fiches visibles dans l'annuaire public ANCPS."""
import asyncio
import logging
import re
import unicodedata
from urllib.parse import urljoin, urlparse

from asgiref.sync import sync_to_async
from bs4 import BeautifulSoup
from django.db import transaction
from django.utils import timezone

from radar_jobs.models import ANCPSCertification

logger = logging.getLogger(__name__)

ANCPS_CATALOG_URL = "https://ancps-senegal.vercel.app/annuaire"
ANCPS_SITE_URL = "https://ancps-senegal.vercel.app"
DETAIL_PATH = re.compile(r"^/certification/([^/]+)/?$")
DETAIL_FIELDS = {
    "type": "type",
    "nature": "nature",
    "sigle": "sigle",
    "domaine": "domaine",
    "sous domaine": "sousDomaine",
    "niveau d entree": "niveauEntree",
    "niveau de sortie": "niveauSortie",
    "niveau entree": "niveauEntree",
    "niveau sortie": "niveauSortie",
    "niveau": "niveauSortie",
    "organisme": "organisme",
    "organisme certificateur": "organisme",
    "lieu": "lieu",
    "region": "lieu",
    "pays": "lieu",
    "modalite": "modalite",
    "duree": "duree",
    "volume horaire": "volumeHoraire",
    "public cible": "publicCible",
    "conditions d acces": "conditionsAcces",
    "objectifs": "objectifs",
    "competences": "competences",
    "competences visees": "competences",
    "competences libres": "competencesLibres",
    "metiers associes": "metiers",
    "etablissements": "etablissements",
    "statut de verification": "statutVerification",
}


def _normalize_label(value):
    value = value.strip().lower().replace("’", "'")
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = re.sub(r"[^a-z0-9 ]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _clean_text(value):
    return re.sub(r"\s+", " ", value or "").strip()


def extract_certification_links(html):
    """Retourne les URL des fiches liées depuis la page de l'annuaire."""
    soup = BeautifulSoup(html, "html.parser")
    links = {}
    for anchor in soup.select('a[href*="/certification/"]'):
        href = urljoin(ANCPS_SITE_URL, anchor.get("href", ""))
        path = urlparse(href).path
        match = DETAIL_PATH.match(path)
        if match:
            links.setdefault(match.group(1), href)
    return links


def parse_certification_detail(html, source_id, source_url):
    """Extrait les données visibles d'une fiche ANCPS rendue dans le navigateur."""
    soup = BeautifulSoup(html, "html.parser")
    for element in soup.select("script, style, nav, footer, header, noscript"):
        element.decompose()

    title_node = soup.select_one("main h1, article h1, h1")
    if not title_node:
        raise ValueError(f"Titre de certification absent pour {source_id}")
    title = _clean_text(title_node.get_text(" ", strip=True))
    payload = {
        "_id": source_id,
        "id": source_id,
        "title": title,
        "description": "",
        "sourceUrl": source_url,
        "published": True,
    }

    for label in soup.select("main p"):
        field = DETAIL_FIELDS.get(_normalize_label(label.get_text(" ", strip=True)))
        value_node = label.find_next_sibling("p")
        if field and value_node:
            value = _clean_text(value_node.get_text(" ", strip=True))
            if value and _normalize_label(value) not in {"non renseigne", "non renseignee"}:
                payload[field] = value

    for row in soup.select("tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        if len(cells) < 2:
            continue
        field = DETAIL_FIELDS.get(_normalize_label(cells[0].get_text(" ", strip=True)))
        value = _clean_text(cells[1].get_text(" ", strip=True))
        if field and value:
            payload[field] = value

    for heading in soup.select("main h2"):
        heading_label = _normalize_label(heading.get_text(" ", strip=True))
        section = heading.find_parent("section")
        if not section:
            continue
        paragraphs = [
            _clean_text(element.get_text(" ", strip=True))
            for element in section.select("p, li")
        ]
        paragraphs = [
            text for text in paragraphs
            if text and _normalize_label(text) not in {
                "les objectifs de cette certification ne sont pas encore renseignes",
                "competences associees a cette certification",
                "aucun bloc de competences renseigne",
            }
        ]
        if heading_label == "presentation" and paragraphs:
            payload["description"] = paragraphs[0]
        elif heading_label == "objectifs de la formation" and paragraphs:
            payload["objectifs"] = paragraphs
        elif heading_label == "blocs de competences" and paragraphs:
            payload["competences"] = paragraphs

    verification_labels = {
        _normalize_label(text)
        for text in soup.select_one("body").stripped_strings
    }
    if "verifiee" in verification_labels:
        payload["statutVerification"] = "Vérifiée"
    elif "non verifiee" in verification_labels:
        payload["statutVerification"] = "Non vérifiée"

    return payload


async def _get_rendered_html(page, is_listing=False):
    for _ in range(40):
        html = await page.get_content()
        has_content = (
            bool(extract_certification_links(html))
            if is_listing
            else bool(BeautifulSoup(html, "html.parser").select_one("main h1, article h1, h1"))
        )
        if has_content:
            return html
        await asyncio.sleep(0.5)
    raise RuntimeError("Le contenu de l'annuaire ANCPS ne s'est pas chargé.")


def _save_certifications(records, replace_all):
    with transaction.atomic():
        for record in records:
            ANCPSCertification.objects.update_or_create(
                source_id=record["source_id"],
                defaults={
                    "source_url": record["source_url"],
                    "title": record["title"],
                    "payload": record["payload"],
                },
            )
        if replace_all:
            ANCPSCertification.objects.exclude(
                source_id__in=[record["source_id"] for record in records]
            ).delete()


async def scrape_ancps_certifications(limit=None):
    """Scrape le catalogue rendu, enregistre les fiches et conserve les données précédentes en cas d'échec."""
    try:
        import nodriver
    except ImportError as exc:
        raise RuntimeError(
            "nodriver est requis pour scraper l'annuaire ANCPS; installe les dépendances de requirements.txt."
        ) from exc

    browser = await nodriver.start(
        sandbox=False,
        browser_args=["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
    )
    try:
        listing_page = await browser.get(ANCPS_CATALOG_URL)
        listing_html = await _get_rendered_html(listing_page, is_listing=True)
        links = extract_certification_links(listing_html)
        if not links:
            raise RuntimeError("Aucune fiche de certification trouvée dans l'annuaire ANCPS.")

        selected_links = list(links.items())
        if limit is not None:
            selected_links = selected_links[:limit]

        records = []
        for index, (source_id, source_url) in enumerate(selected_links, start=1):
            page = await browser.get(source_url, new_tab=True)
            try:
                html = await _get_rendered_html(page)
                payload = parse_certification_detail(html, source_id, source_url)
                records.append({
                    "source_id": source_id,
                    "source_url": source_url,
                    "title": payload["title"],
                    "payload": payload,
                })
                logger.info("Certification ANCPS scrapée (%s/%s): %s", index, len(selected_links), payload["title"])
            finally:
                await page.close()
            await asyncio.sleep(0.5)

        if len(records) != len(selected_links):
            raise RuntimeError("Le scraping ANCPS est incomplet; les données en base sont conservées.")

        await sync_to_async(_save_certifications, thread_sensitive=True)(
            records, replace_all=limit is None
        )

        return {
            "total_found": len(links),
            "scraped": len(records),
            "updated_at": timezone.now().isoformat(),
        }
    finally:
        browser.stop()
