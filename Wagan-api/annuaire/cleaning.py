"""Nettoyage des fiches ANCPS avant envoi à Radar.

Certaines descriptions ANCPS contiennent le menu de navigation du site au lieu
d'un vrai texte (ex. « Agriculture, EnvironnementAgroalimentaire… »). Règles
reprises de ancps/scraper.py (_clean_description) : une description détectée
comme polluée devient `None` (donnée indisponible), jamais un texte inventé.
"""

NAVIGATION_MARKERS = [
    "Agriculture, Environnement",
    "Agroalimentaire",
    "Art, Culture, Design",
    "Audit et Gestion",
    "Automobile",
    "Bien-être, Beauté",
    "Hôtellerie, Tourisme",
    "Informatique, Télécom",
    "Transport, Logistique",
]


def is_polluted_description(description, title=None):
    if not isinstance(description, str) or not description.strip():
        return False
    normalized = " ".join(description.split()).casefold()
    matches = sum(marker.casefold() in normalized for marker in NAVIGATION_MARKERS)
    if matches >= 6:
        return True
    if "je m'informe gratuitement" in normalized:
        return True
    if "premium" in normalized and title and str(title).casefold() in normalized:
        return True
    return False


def sanitize_item(item):
    """Retourne une copie de la fiche, description polluée remplacée par None."""
    if not isinstance(item, dict):
        return item
    if is_polluted_description(item.get("description"), item.get("title")):
        item = dict(item)
        item["description"] = None
    return item