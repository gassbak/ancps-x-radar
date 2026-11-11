"""Point d'entrée historique des vues radar_jobs.

Découpé en modules lisibles :
- views_helpers : synonymes, normalisation DataFrame, modèle IA
- views_chat    : chat_view (RAG + Groq)
- views_jobs    : status, download CSV, liste et détail des offres
- views_system  : trigger scraping, health-check, monitoring

Ce module ré-exporte tout pour compatibilité (urls, imports existants).
"""
from radar_jobs.utils.ai_client import ask  # noqa: F401 (patché par les tests)
from radar_jobs.views_chat import chat_view  # noqa: F401
from radar_jobs.views_helpers import (  # noqa: F401
    AI_MODEL,
    SYNONYMS,
    _resolve_ai_model,
    clean_df_for_json,
    ensure_type_column,
    expand_query,
    is_empty_value,
)
from radar_jobs.views_jobs import (  # noqa: F401
    download_csv_view,
    job_detail_view,
    jobs_list_view,
    status_view,
)
from radar_jobs.views_system import (  # noqa: F401
    health_check_view,
    scraping_status_view,
    trigger_scrape_view,
)

__all__ = [
    'ask',
    'chat_view',
    'status_view',
    'download_csv_view',
    'jobs_list_view',
    'job_detail_view',
    'trigger_scrape_view',
    'health_check_view',
    'scraping_status_view',
    'AI_MODEL',
    'SYNONYMS',
    'expand_query',
    'ensure_type_column',
    'clean_df_for_json',
    'is_empty_value',
]
