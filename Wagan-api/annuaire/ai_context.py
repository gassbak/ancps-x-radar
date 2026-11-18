"""Contexte « formations ANCPS » pour l'assistant IA de Radar (radar_jobs/views_chat.py).

Principes (cahier des charges, sections 4, 8 et F08/F09) :
- seules les fiches de l'annuaire sont fournies à l'IA ; aucun champ absent n'est inventé ;
- une donnée non vérifiée n'est pas présentée comme une garantie ;
- une panne d'ANCPS ne casse jamais le chat : rien ne lève d'exception ici.
"""
import json
import logging
import re
import unicodedata

from django.conf import settings

from .filters import get_cost_values, get_field_values
from .services import AncpsError, get_certifications

logger = logging.getLogger(__name__)

MAX_RESULTS = 5

INTENT_PATTERN = re.compile(
    r"\b(formations?|certifications?|certificats?|diplomes?|licences?|masters?|bts|bootcamps?|"
    r"cursus|filieres?|se former|me former)\b"
)

STOPWORDS = set("""
a au aux avec ce ces dans de des du elle en et il je j la le les leur lui ma mais me mes moi mon ne nos notre
nous on ou par pas pour qu que quel quelle quelles quels qui sa se ses son sur ta te tes toi ton tu un une vos
votre vous y est sont suis cherche chercher veux voudrais voudrait souhaite besoin trouver trouve propose
proposer propositions existe existent disponible disponibles liste donne donner moi svp merci bonjour salut
quelles quels quelle comment ou pour afin
""".split())
INTENT_WORDS = {"formation", "formations", "certification", "certifications", "certificat", "certificats",
                "diplome", "diplomes", "licence", "licences", "master", "masters", "bts", "bootcamp",
                "bootcamps", "cursus", "filiere", "filieres", "former"}


def _norm(text):
    text = unicodedata.normalize('NFKD', str(text or '')).encode('ascii', 'ignore').decode('ascii')
    return text.lower()


def is_formation_query(text):
    return bool(INTENT_PATTERN.search(_norm(text)))


def _tokens(text):
    words = re.findall(r"[a-z0-9+#]{2,}", _norm(text))
    return [w for w in words if w not in STOPWORDS and w not in INTENT_WORDS]


def _score(item, tokens):
    weighted = [
        (3, get_field_values(item, ['title', 'sigle'])),
        (2, get_field_values(item, ['domaine', 'sousDomaine', 'organisme', 'metiers'])),
        (1, get_field_values(item, ['description', 'objectifs', 'niveauSortie', 'lieu', 'publicCible'])),
    ]
    score = 0
    for weight, values in weighted:
        haystack = _norm(' '.join(values))
        score += weight * sum(1 for t in tokens if t in haystack)
    return score


def _compact(item):
    """Fiche réduite aux champs présents (les champs vides sont omis, jamais remplacés)."""
    def first(fields):
        values = get_field_values(item, fields)
        return values[0] if values else None

    organisme = item.get('organisme') if isinstance(item.get('organisme'), dict) else {}
    site = organisme.get('siteWeb')
    compact = {
        'id': str(item.get('_id') or item.get('id') or ''),
        'titre': first(['title']) or first(['sigle']),
        'sigle': first(['sigle']),
        'organisme': first(['organisme']),
        'domaine': first(['domaine']),
        'niveau': first(['niveauSortie', 'niveauEntree']),
        'duree': first(['duree', 'volumeHoraire']),
        'modalite': first(['modalite']),
        'lieu': first(['lieu']),
        'cout': (get_cost_values(item) or [None])[0],
        'statut_verification': first(['statutVerification']),
        'derniere_verification': first(['sourceLastVerifiedAt']),
        'site_officiel': site if isinstance(site, str) and re.match(r'^https?://', site, re.I) else None,
    }
    if compact['sigle'] == compact['titre']:
        compact['sigle'] = None
    return {k: v for k, v in compact.items() if v}


def _fallback_text(query, formations):
    lines = [f"🎓 **{len(formations)} formation(s) trouvée(s)** pour « {query} »\n"]
    for f in formations:
        block = ["━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", f"🎓 **{f.get('titre', 'Formation')}**"]
        if f.get('organisme') or f.get('lieu'):
            block.append("🏢 " + " • 📍 ".join(x for x in (f.get('organisme'), f.get('lieu')) if x))
        if f.get('niveau') or f.get('duree'):
            block.append("📊 " + " • ⏱️ ".join(x for x in (f.get('niveau'), f.get('duree')) if x))
        if f.get('cout'):
            block.append(f"💰 {f['cout']}")
        status = f.get('statut_verification')
        block.append(f"✅ {status}" if status and _norm(status).startswith('verifi') else "ℹ️ Information à confirmer")
        if f.get('site_officiel'):
            block.append(f"🔗 {f['site_officiel']}")
        lines.append("\n".join(block))
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                 "ℹ️ La présence dans l'annuaire ne constitue pas une accréditation. "
                 "Retrouvez ces fiches dans « Formations & Certifications » pour les comparer.")
    return "\n".join(lines)


RULES = """
### RÈGLES POUR LES FORMATIONS
- Si l'utilisateur cherche une formation ou une certification, présente UNIQUEMENT les fiches listées ci-dessus, avec ce format (OMETS toute ligne dont le champ est absent du JSON) :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 **Titre**
🏢 Organisme • 📍 Lieu
📊 Niveau • ⏱️ Durée • 🧭 Modalité
💰 Coût
✅ Statut de vérification (dernière vérification : date)
🔗 Site officiel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- INTERDIT d'inventer une formation, un organisme, un prix, une durée, une accréditation ou un lien absent de la liste.
- INTERDIT de dire ou de laisser entendre qu'un organisme est accrédité ou reconnu par l'État : sa présence dans l'annuaire ne l'établit pas. Invite à vérifier auprès de l'organisme.
- INTERDIT de garantir qu'une formation mène à un emploi ou à un salaire.
- Si statut_verification n'est pas « Vérifiée » (ou est absent), précise que l'information est « à confirmer ».
- Pour cette question, ces formations remplacent la section OFFRES DISPONIBLES, sauf si l'utilisateur demande aussi des offres d'emploi.
- Termine en invitant à ouvrir « Formations & Certifications » dans Radar pour comparer et enregistrer les formations.
"""

UNAVAILABLE = """
### FORMATIONS : ANNUAIRE ANCPS INDISPONIBLE
L'annuaire ANCPS est momentanément injoignable. Ne propose AUCUNE formation précise et n'invente aucun organisme. Explique brièvement le problème, puis invite l'utilisateur à réessayer dans quelques minutes ou à consulter « Formations & Certifications » dans Radar.
"""

NO_MATCH = """
### FORMATIONS : AUCUNE CORRESPONDANCE
Aucune fiche de l'annuaire ANCPS ne correspond à cette recherche. N'invente aucune formation. Suggère d'élargir la recherche (autre domaine, autre région) ou de parcourir « Formations & Certifications » dans Radar.
"""


def build_formations_context(user_query):
    """Retourne None si la question ne concerne pas les formations, sinon un dict :
    {'prompt_section': str, 'fallback_text': str|None, 'count': int, 'available': bool}.
    Ne lève jamais d'exception."""
    try:
        if not is_formation_query(user_query):
            return None
        timeout = getattr(settings, 'ANCPS_CHAT_TIMEOUT', 8)
        try:
            items, _stale = get_certifications(timeout=timeout)
        except AncpsError:
            return {'prompt_section': UNAVAILABLE, 'fallback_text': None, 'count': 0, 'available': False}

        tokens = _tokens(user_query)
        records = [i for i in items if isinstance(i, dict)]
        generic = not tokens
        if generic:
            picked = records[:MAX_RESULTS]
        else:
            scored = sorted(((_score(i, tokens), n, i) for n, i in enumerate(records)),
                            key=lambda t: (-t[0], t[1]))
            picked = [i for s, _n, i in scored if s > 0][:MAX_RESULTS]
        if not picked:
            return {'prompt_section': NO_MATCH, 'fallback_text': None, 'count': 0, 'available': True}

        compact = [_compact(i) for i in picked]
        note = ", exemples non filtrés : demande à l'utilisateur de préciser le domaine" if generic else ""
        header = f"### FORMATIONS ET CERTIFICATIONS DISPONIBLES (annuaire national ANCPS, {len(compact)} fiche(s){note})\n"
        section = "\n" + header + json.dumps(compact, ensure_ascii=False) + "\n" + RULES
        return {'prompt_section': section, 'fallback_text': _fallback_text(user_query, compact),
                'count': len(compact), 'available': True}
    except Exception:  # le chat ne doit jamais casser à cause des formations
        logger.exception("Contexte formations ANCPS impossible")
        return None
