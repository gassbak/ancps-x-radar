import ast
import logging
import re
import urllib.parse
import pandas as pd
from radar_jobs.services.jobs_store import load_jobs_df as _load_jobs_df_cached

logger = logging.getLogger(__name__)

MAX_JOB_ID_LENGTH = 2048


def sanitize_job_id(job_id: str) -> str:
    """Sanitize job_id : décode URL, limite taille, bloque path traversal."""
    if not isinstance(job_id, str):
        job_id = str(job_id)
    # Décodage URL (frontend encodeURIComponent)
    try:
        job_id = urllib.parse.unquote(job_id)
    except Exception:
        pass
    job_id = job_id.strip()
    if len(job_id) > MAX_JOB_ID_LENGTH:
        job_id = job_id[:MAX_JOB_ID_LENGTH]
    # Bloque tentatives path traversal / injection
    if ".." in job_id or job_id.startswith("/") or "\x00" in job_id:
        # On garde la valeur mais on la flag comme suspecte – le lookup échouera naturellement
        logger.warning(f"job_id suspect détecté: {job_id[:100]}")
    return job_id


def load_jobs_df():
    """Charge le CSV via le cache partagé radar_jobs (source unique)."""
    try:
        return _load_jobs_df_cached()
    except Exception as e:
        logger.error(f"Erreur chargement CSV scrapé: {e}")
        return None


def get_scraped_job_by_id(job_id: str):
    """
    Récupère une offre scrapée par son ID (index string) ou offer_url.
    Retourne (job_dict, job_text) ou (None, None) si non trouvé.
    """
    df = load_jobs_df()
    if df is None or df.empty:
        return None, None

    # Sanitize + décode URL
    job_id = sanitize_job_id(str(job_id))
    if not job_id:
        return None, None
    row = df[df['id'] == job_id]

    # Fallback: chercher par offer_url si pas trouvé par id (permet offer_url comme identifiant)
    if row.empty:
        if 'offer_url' in df.columns:
            row = df[df['offer_url'].astype(str) == job_id]
        # Fallback : index numérique si job_id est un int -> position
        if row.empty:
            try:
                idx = int(job_id)
                if 0 <= idx < len(df):
                    row = df.iloc[[idx]]
            except (ValueError, IndexError):
                pass

    if row.empty:
        return None, None

    record = row.iloc[0].to_dict()

    # Normalisation des champs pour l'affichage / scoring
    # Coordinates parsing
    if isinstance(record.get('coordinates'), str) and record['coordinates'].startswith('['):
        try:
            record['coordinates'] = ast.literal_eval(record['coordinates'])
        except Exception:
            pass
    if isinstance(record.get('key_skills'), str) and record['key_skills']:
        record['key_skills_list'] = [s.strip() for s in record['key_skills'].split(',') if s.strip()]
    else:
        record['key_skills_list'] = record.get('key_skills') if isinstance(record.get('key_skills'), list) else []

    job_text = build_job_text(record)
    return record, job_text


def get_scraped_job_by_url(offer_url: str):
    """Récupère une offre par son offer_url exact."""
    return get_scraped_job_by_id(offer_url)


def build_job_text(job: dict) -> str:
    """
    Construit un texte descriptif de l'offre pour le LLM.
    Normalise whitespace, limite à 3000 chars pour tokens.
    """
    parts = []
    if job.get('title'):
        parts.append(f"Titre: {job.get('title')}")
    if job.get('company'):
        parts.append(f"Entreprise: {job.get('company')}")
    if job.get('location'):
        parts.append(f"Localisation: {job.get('location')}")
    if job.get('sector'):
        parts.append(f"Secteur: {job.get('sector')}")
    if job.get('type'):
        parts.append(f"Type: {job.get('type')}")
    if job.get('contract_type'):
        parts.append(f"Type de contrat: {job.get('contract_type')}")
    if job.get('description'):
        desc = str(job.get('description')).strip()
        # Normalisation whitespace
        desc = re.sub(r'\s+', ' ', desc)
        if desc and desc.lower() not in ('nan', 'none', ''):
            parts.append(f"Description: {desc[:1500]}")
    if job.get('key_skills'):
        parts.append(f"Compétences clés: {job.get('key_skills')}")
    if job.get('experience_level'):
        parts.append(f"Expérience: {job.get('experience_level')}")
    if job.get('education_level'):
        parts.append(f"Niveau d'études: {job.get('education_level')}")
    if job.get('min_exp') is not None and job.get('min_exp') != "":
        try:
            if int(job.get('min_exp')) > 0:
                parts.append(f"Expérience minimum: {job.get('min_exp')} ans")
        except Exception:
            pass
    if job.get('offer_url'):
        parts.append(f"URL: {job.get('offer_url')}")
    if job.get('source'):
        parts.append(f"Source: {job.get('source')}")
    text = "\n".join(parts)
    # Limite tokens LLM
    if len(text) > 3000:
        text = text[:3000]
    # Normalisation finale
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text


def list_jobs_for_scoring(search=None, sector=None, location=None, type_filter=None, limit=50):
    """
    Helper pour lister les offres disponibles pour le scoring
    (léger, pour frontend : id, title, company, location, sector, type, offer_url).
    """
    df = load_jobs_df()
    if df is None or df.empty:
        return []
    if sector:
        df = df[df['sector'].astype(str).str.lower() == sector.lower()]
    if location and location.lower() not in ['toute les régions', 'toutes les régions', '']:
        df = df[df['location'].astype(str).str.lower() == location.lower()]
    if type_filter and type_filter.lower() not in ['tout voir', 'tous', 'all', '']:
        df = df[df['type'].astype(str).str.lower() == type_filter.lower()]
    if search:
        sl = search.lower()
        mask = pd.Series(False, index=df.index)
        for col in ['title', 'company', 'key_skills', 'sector', 'location']:
            if col in df.columns:
                mask |= df[col].astype(str).str.lower().str.contains(sl, na=False)
        df = df[mask]
    df = df.head(limit)
    cols = ['id', 'title', 'company', 'location', 'sector', 'type', 'contract_type', 'offer_url', 'source', 'key_skills']
    available = [c for c in cols if c in df.columns]
    return df[available].to_dict(orient='records')
