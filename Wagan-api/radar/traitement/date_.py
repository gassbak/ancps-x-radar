import re
from datetime import date

MONTHS_FR = {
    "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5,
    "juin": 6, "juillet": 7, "août": 8, "aout": 8, "septembre": 9,
    "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
}

def parse_french_date(text: str) -> date:
    # Exemples acceptés :
    # "Publié le 2 octobre 2025", "le 1er janvier 2024", "2 oct. 2025" (si tu ajoutes un mapping abrégé)
    txt = text.lower().strip()
    # capture jour (avec 'er' optionnel), mois en lettres, année
    m = re.search(r'(\d{1,2})(?:er)?\s+([a-zéèêàâîôûùç\.]+)\s+(\d{4})', txt)
    if not m:
        raise ValueError(f"Format de date FR non reconnu: {text}")
    day = int(m.group(1))
    month_txt = m.group(2).replace(".", "")
    year = int(m.group(3))
    month = MONTHS_FR.get(month_txt)
    if not month:
        raise ValueError(f"Mois FR inconnu: {month_txt}")
    return date(year, month, day)

             # "2025-10-02"
