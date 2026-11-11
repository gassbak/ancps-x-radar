"""Helpers partagés des vues radar_jobs (synonymes, normalisation DataFrame, modèle IA)."""
import os
import logging

import numpy as np
import pandas as pd
from django.conf import settings

logger = logging.getLogger(__name__)


# Configuration IA - source centrale = settings.GROQ_MODEL (résolu à chaque appel)
def _resolve_ai_model():
    return (
        os.getenv("GROQ_MODEL")
        or getattr(settings, "GROQ_MODEL", None)
        or os.getenv("BAKELI_AI_MODEL")
        or getattr(settings, "BAKELI_AI_MODEL", None)
        or "qwen/qwen3.8-27b"
    )


AI_MODEL = getattr(settings, "GROQ_MODEL", os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b"))  # compat import


SYNONYMS = {
    "dev": "développeur informatique software engineer programmeur",
    "développeur": "software engineer dev programmeur informatique data cloud",
    "developpeur": "software engineer dev programmeur informatique data cloud",
    "développeurs": "software engineer dev programmeur informatique data cloud",
    "developpeurs": "software engineer dev programmeur informatique data cloud",
    "chauffeur": "chauffeurs conducteur transport",
    "chauffeurs": "chauffeur conducteur transport",
    "rh": "ressources humaines human resources",
    "comptable": "comptabilité finance",
    "commercial": "vente business developer",
    "stage": "stagiaire internship",
    "data": "données analyst scientist",
}


def expand_query(query):
    words = query.lower().split()
    expanded = list(words)
    for word in words:
        if word in SYNONYMS:
            expanded.append(SYNONYMS[word])
    return " ".join(expanded)


def ensure_type_column(df):
    if 'type' not in df.columns:
        def infer(row):
            title = str(row.get('title', '')).lower()
            contract = str(row.get('contract_type', '')).lower()
            if 'stage' in title or 'stage' in contract or 'alternance' in title:
                return 'Stage'
            if 'bourse' in title:
                return 'Bourse'
            if 'concours' in title or 'ena' in title or 'recrutement direct' in title:
                return 'Concours'
            if 'formation' in title or 'bootcamp' in title or 'certification' in title:
                return 'Formation'
            if 'freelance' in contract or 'prestation' in title or 'consultant' in title:
                return 'Prestation'
            return 'Emploi'
        df['type'] = df.apply(infer, axis=1)
    return df


def clean_df_for_json(df):
    """Remplace NaN et Inf par None."""
    return df.replace([np.inf, -np.inf, np.nan], [None, None, None])


def is_empty_value(v) -> bool:
    """Vrai si valeur manquante/placeholder (pour omettre les champs vides côté LLM)."""
    if v is None:
        return True
    if isinstance(v, list):
        return not v
    if isinstance(v, str) and v.strip().lower() in ('', 'nan', 'none', 'non spécifié', 'non spécifiée'):
        return True
    try:
        if pd.isna(v):
            return True
    except Exception:
        pass
    return False
