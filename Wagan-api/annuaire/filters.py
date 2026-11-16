"""Recherche, filtres et facettes sur les fiches ANCPS.

Les noms de champs et la logique reprennent exactement ceux de
bakeli-radar/src/pages/FormationsPage.jsx pour que le comportement
reste identique quand le filtrage passe côté serveur.
Aucune valeur n'est inventée : un champ absent reste absent.
"""
import re

MISSING = '__missing__'

# clé de filtre (paramètre d'URL) -> champs ANCPS lus
FILTER_FIELDS = {
    'category': ['nature'],
    'type': ['type'],
    'domain': ['domaine'],
    'level': ['niveauSortie', 'niveauEntree'],
    'region': ['lieu'],
    'modality': ['modalite'],
    'duration': ['duree', 'volumeHoraire'],
    'organization': ['organisme'],
    'status': ['statutVerification'],
}

SEARCH_FIELDS = [
    'title', 'sigle', 'description', 'lieu', 'duree', 'volumeHoraire',
    'conditionsAcces', 'objectifs', 'publicCible',
]

COST_FIELDS = ['cout', 'coût', 'prix', 'cost', 'price', 'frais', 'fraisInscription']


def get_label(value):
    """Texte lisible d'une valeur ANCPS (texte, nombre ou objet {nom|name|title})."""
    if isinstance(value, bool):
        return ''
    if isinstance(value, (str, int, float)):
        return str(value).strip()
    if isinstance(value, dict):
        label = value.get('nom') or value.get('name') or value.get('title')
        if isinstance(label, bool):
            return ''
        if isinstance(label, (str, int, float)):
            return str(label).strip()
    return ''


def get_field_values(item, fields):
    values = []
    for field in fields:
        value = item.get(field)
        if isinstance(value, list):
            values.extend(label for label in (get_label(v) for v in value) if label)
        else:
            label = get_label(value)
            if label:
                values.append(label)
    return values


def get_cost_values(item):
    return [label for label in (get_label(item.get(f)) for f in COST_FIELDS) if label]


def get_cost_category(item):
    """'free', 'paid' ou 'unknown' (coût absent = inconnu, jamais déduit)."""
    costs = get_cost_values(item)
    if not costs:
        return 'unknown'
    for cost in costs:
        normalized = cost.casefold()
        numeric_text = re.sub(r'[^\d,.-]', '', normalized).replace(',', '.')
        if re.search(r'\b(gratuit|free)\b', normalized):
            return 'free'
        if numeric_text:
            try:
                if float(numeric_text) == 0:
                    return 'free'
            except ValueError:
                pass
    return 'paid'


def build_facets(items):
    """Options disponibles pour chaque filtre (valeurs réellement présentes)."""
    facets = {}
    for key, fields in FILTER_FIELDS.items():
        seen = set()
        for item in items:
            seen.update(get_field_values(item, fields))
        facets[key] = sorted(seen, key=lambda s: s.casefold())
    return facets


def _matches_search(item, search):
    if not search:
        return True
    haystack = get_field_values(item, SEARCH_FIELDS)
    for fields in FILTER_FIELDS.values():
        haystack.extend(get_field_values(item, fields))
    return any(search in value.casefold() for value in haystack)


def apply_filters(items, query='', params=None):
    """Applique recherche + filtres cumulables. `params` : {clé: valeur}."""
    params = params or {}
    search = (query or '').strip().casefold()
    result = []
    for item in items:
        if not isinstance(item, dict):
            continue
        if not _matches_search(item, search):
            continue
        ok = True
        for key, fields in FILTER_FIELDS.items():
            wanted = params.get(key)
            if not wanted:
                continue
            values = get_field_values(item, fields)
            if wanted == MISSING:
                if values:
                    ok = False
                    break
            elif wanted not in values:
                ok = False
                break
        if not ok:
            continue
        cost = params.get('cost')
        if cost and get_cost_category(item) != cost:
            continue
        result.append(item)
    return result