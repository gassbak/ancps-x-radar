import os,sys
import re
import time
import requests
from datetime import date as _date
from bs4 import BeautifulSoup

# =========================
# [Django setup] si exécuté hors manage.py
# =========================
# 1) pointer vers la racine du projet (là où se trouve manage.py)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)  # pour que 'radar', 'config', etc. soient importables

# 2) indiquer à Django où sont les settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wagan_project.settings")  # <-- remplace 'config' si besoin

# 3) initialiser Django
import django
django.setup()

from django.db import transaction
from radar.models import EmploiRadar, RegionRadar, TypeContratRadar  # <-- adapte si besoin

# =========================
# 1) Utilitaires parsing
# =========================
MONTHS_FR = {
    "janvier": 1, "février": 2, "fevrier": 2, "mars": 3, "avril": 4, "mai": 5,
    "juin": 6, "juillet": 7, "août": 8, "aout": 8, "septembre": 9,
    "octobre": 10, "novembre": 11, "décembre": 12, "decembre": 12,
}

def parse_french_date(text: str) -> _date:
    txt = (text or "").lower().strip()
    m = re.search(r'(\d{1,2})(?:er)?\s+([a-zéèêàâîôûùç\.]+)\s+(\d{4})', txt)
    if not m:
        raise ValueError(f"Format de date FR non reconnu: {text}")
    day = int(m.group(1))
    month_txt = m.group(2).replace(".", "")
    year = int(m.group(3))
    month = MONTHS_FR.get(month_txt)
    if not month:
        raise ValueError(f"Mois FR inconnu: {month_txt}")
    return _date(year, month, day)

def _lower(s):
    return s.strip().lower() if isinstance(s, str) else s

# =========================
# 2) Règles métier (région, contrat, emplacement)
# =========================
REGIONS_CANON = [
    "Dakar","Diourbel","Fatick","Kaffrine","Kaolack","Kédougou","Kolda",
    "Louga","Matam","Saint-Louis","Sédhiou","Tambacounda","Thiès","Ziguinchor"
]
REG_LOWER = {r.lower() for r in REGIONS_CANON}
COUNTRY_LOWER = {"sénégal", "senegal"}

def pick_region_obj(elements):
    """
    Trouve l'objet RegionRadar dont le nom correspond (comparaison insensible à la casse).
    On essaie chaque élément dans l'ordre.
    """
    for e in (elements or []):
        name = _lower(e)
        if not name:
            continue
        obj = RegionRadar.objects.filter(nom__iexact=name).first()
        if obj:
            return obj
    return None

def compute_emplacement(elements, emplacement_txt):
    """
    Règle demandée :
    - choisir le 1er élément qui N'EST PAS 'Sénégal' et N'EST PAS une région connue.
    Fallback :
    - nettoyer le texte d'emplacement (split ','), retirer pays + régions, puis renvoyer
      le 1er token restant non vide.
    """
    for e in (elements or []):
        k = (e or "").strip()
        kl = k.lower()
        if not k: 
            continue
        if kl in COUNTRY_LOWER: 
            continue
        if kl in REG_LOWER: 
            continue
        return k  # premier élément valide

    if emplacement_txt:
        for token in (t.strip() for t in emplacement_txt.split(",")):
            if not token:
                continue
            tl = token.lower()
            if tl in COUNTRY_LOWER:
                continue
            if tl in REG_LOWER:
                continue
            return token 
    return None

def pick_contrat_obj(raw_type):
    """
    Retrouve le TypeContratRadar existant.
    - essai direct iexact
    - mapping simple par mots-clés (minuscule)
    """
    if not raw_type:
        return None
    k = _lower(raw_type)
    # essai direct
    direct = TypeContratRadar.objects.filter(nom__iexact=k).first()
    if direct:
        return direct
    # variantes
    if "cdi" in k:
        return TypeContratRadar.objects.filter(nom__iexact="cdi").first()
    if "cdd" in k:
        return TypeContratRadar.objects.filter(nom__iexact="cdd").first()
    if "stage" in k or "stagiaire" in k:
        return TypeContratRadar.objects.filter(nom__iexact="stage").first()
    if "free" in k or "indépendant" in k or "independant" in k:
        return TypeContratRadar.objects.filter(nom__iexact="freelance").first()
    if "prestation" in k or "service" in k or "consultant" in k:
        return TypeContratRadar.objects.filter(nom__iexact="prestation de services").first()
    return None

def to_date(d):
    if isinstance(d, str):
        try:
            return _date.fromisoformat(d)
        except ValueError:
            return _date.today()
    return d or _date.today()


@transaction.atomic
def save_emploi_from_scraped(d: dict) -> EmploiRadar:
    """
    Idempotent par 'lien_candidature' : crée ou met à jour.
    Ne crée pas les régions/contrats : on retrouve ceux qui existent déjà.
    """
    elements = d.get("elements") or []
    region_obj = pick_region_obj(elements)
    emplacement = compute_emplacement(elements, d.get("emplacement"))
    contrat_obj = pick_contrat_obj(d.get("type"))

    defaults = {
        "titre": d.get("titre"),
        "logo": d.get("logo"),
        "mini_description": None,
        "date_publication": to_date(d.get("date_publication")),
        "date_limite": None,
        "nom_entreprise": d.get("nom_entreprise")[:140],
        "provenance": "Emploi Dakar",
        "mail_candidature": None,
        "emplacement": emplacement[:150] if emplacement else None,
    }

    # 1) essaie de déduire le contrat depuis le scraping
    contrat_obj = pick_contrat_obj(d.get("type"))

    # 2) fallback obligatoire: "Autre"
    if contrat_obj is None:
        contrat_obj = TypeContratRadar.objects.filter(nom__iexact="Autre").first()
        if contrat_obj is None:
            # si jamais "Autre" n'existe pas encore, on le crée ici pour éviter l'erreur
            contrat_obj, _ = TypeContratRadar.objects.get_or_create(nom="Autre")


    # nom des FKs selon ton modèle (tu as défini les champs comme 'region' et 'contrat',
    # mais si tu as réellement 'emploi_region'/'emploi_contrat', remplace ci-dessous)
    fk_kwargs = {}
    if hasattr(EmploiRadar, "emploi_region"):
        fk_kwargs["emploi_region"] = region_obj
    else:
        fk_kwargs["region"] = region_obj

    if hasattr(EmploiRadar, "emploi_contrat"):
        fk_kwargs["emploi_contrat"] = contrat_obj
    else:
        fk_kwargs["contrat"] = contrat_obj

    data = {**defaults, **fk_kwargs}
    #print(data)
    job, created = EmploiRadar.objects.get_or_create(
        lien_candidature=d["lien_candidature"],
        defaults={**defaults, **fk_kwargs}
    )
    if not created:
        for k, v in defaults.items():
            setattr(job, k, v)
        for k, v in fk_kwargs.items():
            setattr(job, k, v)
        job.save()
    return job


BASE = "https://www.emploidakar.com/jm-ajax/get_listings/"

# 👉 colle ici le form_data tel que vu dans DevTools (string URL-encodée)
FORM_DATA = "search_keywords=&search_location=&filter_job_type%5B%5D=&orderby=&order=DESC"

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
})

def fetch_page(page: int, per_page: int = 20):
    # payload form-encoded exactement comme DevTools (ne pas mettre json=)
    payload = {
        "page": page,
        "per_page": per_page,
        "form_data": FORM_DATA,   # ← filtres
        "orderby": "date",        # si présent dans DevTools, garde la même valeur
        "order": "DESC",          # idem
        # certains sites ajoutent "search_keywords", "search_location", etc.
    }
    r = session.post(BASE, data=payload, timeout=30)
    r.raise_for_status()
    return r.json()

page = 1
total_saved = 0
while True:
    data = fetch_page(page)
    # 1) parser le HTML renvoyé dans data["html"]
    html = data.get("html", "").strip()
    if not html:
        break
    soup = BeautifulSoup(html, "html.parser")
    #print(soup)

    for card in soup.select(".job_listing"):
        title_el = card.select_one(".position h3")
        company_el = card.select_one(".company, .job_listing-company")
        location_el = card.select_one(".location, .job_listing-location")
        link_el = title_el if title_el and title_el.name == "a" else card.select_one("a")
        date_el = card.select_one(".date time")
        type_emploi = card.select_one(".job-type")
        logo = card.select_one(".company_logo")

        # data brutes
        date_txt = date_el.get_text(strip=True) if date_el else None
        location_txt = location_el.get_text(strip=True) if location_el else None
        locations = [x.strip() for x in (location_txt.split(",") if location_txt else [])]

        # payload standardisé
        data = {
            "logo": logo.get("src") if logo else None,
            "titre": title_el.get_text(strip=True)[:198] if title_el else None,
            "nom_entreprise": company_el.get_text(strip=True) if company_el else None,
            "emplacement": location_txt,
            "lien_candidature": link_el.get("href") if link_el else None,
            "provenance": "Emploi Dakar",
            "date_publication": parse_french_date(date_txt).isoformat() if date_el else None,
            "type": type_emploi.get_text(strip=True) if type_emploi else None,
            "elements": locations,
        }

        # persistence
        job = save_emploi_from_scraped(data)
        total_saved += 1
        print(f"✔️ {job.titre} -> id={job.id}")
        print("********************************************************")
    
    # 2) conditions d'arrêt robustes
    max_pages = data.get("max_num_pages")
    has_more = data.get("found_jobs", True)
    if (max_pages and page >= int(max_pages)) or not has_more:
        print("Max Pages: ",max_pages)
        break

    page += 1
    time.sleep(0.8)
