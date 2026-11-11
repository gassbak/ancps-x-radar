"""Vues système : déclenchement scraping, health-check, monitoring."""
import asyncio
import json
import logging
import os
import threading

import pandas as pd
from django.conf import settings
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from radar_jobs.auth import StatelessJWTAuthentication
from radar_jobs.permissions import IsCoachOrAdmin
from radar_jobs.services.jobs_store import load_jobs_df as load_jobs_df_cached
from radar_jobs.services.pipeline import run_pipeline
from radar_jobs.views_helpers import ensure_type_column

logger = logging.getLogger(__name__)


@api_view(['POST'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([IsCoachOrAdmin])
def trigger_scrape_view(request):
    """Lance le scraping en arrière-plan."""
    max_pages = settings.SCRAPING_CONFIG.get('MAX_PAGES', 5)

    def _run():
        try:
            asyncio.run(run_pipeline(max_pages=max_pages))
        except Exception as e:
            logger.error(f"Erreur pendant le scraping: {e}")
    thread = threading.Thread(target=_run)
    thread.daemon = True
    thread.start()
    return Response({"message": "Le processus de scraping et de nettoyage a été lancé en arrière-plan."})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def health_check_view(request):
    """
    Endpoint de health-check pour monitorer l'état du scraping.
    Renvoie les informations sur le dernier scraping et l'état du système.
    """
    health_status = {
        'status': 'healthy',
        'timestamp': pd.Timestamp.now().isoformat(),
        'scraping': {
            'processed_file_exists': os.path.exists(settings.PROCESSED_FILE),
            'raw_file_exists': os.path.exists(os.path.join(settings.RAW_DATA_DIR, 'jobs_senegal_raw.csv')),
        },
        'config': {
            'max_pages': settings.SCRAPING_CONFIG.get('MAX_PAGES', 5),
            'timeout_per_site': settings.SCRAPING_CONFIG.get('TIMEOUT_PER_SITE', 120),
            'email_alerts_enabled': settings.SCRAPING_CONFIG.get('ENABLE_EMAIL_ALERTS', False),
        }
    }

    # Inclure les métadonnées du dernier run si disponibles
    last_run_path = os.path.join(settings.DATA_DIR, 'last_run.json')
    if os.path.exists(last_run_path):
        try:
            with open(last_run_path, 'r', encoding='utf-8') as f:
                health_status['last_run'] = json.load(f)
        except Exception:
            pass

    # Vérifier l'état du fichier traité
    if health_status['scraping']['processed_file_exists']:
        try:
            stats = os.stat(settings.PROCESSED_FILE)
            df = load_jobs_df_cached()
            if df is None:
                raise ValueError("CSV illisible")
            health_status['scraping'].update({
                'last_update': pd.to_datetime(stats.st_mtime, unit='s').isoformat(),
                'total_offers': len(df),
                'file_size_kb': round(stats.st_size / 1024, 2),
                'sources': df['source'].value_counts().to_dict() if 'source' in df.columns else {},
            })
        except Exception as e:
            health_status['status'] = 'degraded'
            health_status['scraping']['error'] = str(e)

    return Response(health_status)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def scraping_status_view(request):
    """
    Endpoint de monitoring pour afficher l'état détaillé du scraping.
    Utile pour un tableau de bord d'administration.
    """
    status_data = {
        'status': 'success',
        'last_scraping': None,
        'statistics': {
            'total_offers': 0,
            'by_type': {},
            'by_source': {},
            'by_region': {},
        },
        'health': {
            'processed_file': os.path.exists(settings.PROCESSED_FILE),
            'raw_file': os.path.exists(os.path.join(settings.RAW_DATA_DIR, 'jobs_senegal_raw.csv')),
        },
        'config': settings.SCRAPING_CONFIG,
    }

    last_run_path = os.path.join(settings.DATA_DIR, 'last_run.json')
    if os.path.exists(last_run_path):
        try:
            with open(last_run_path, 'r', encoding='utf-8') as f:
                status_data['last_run'] = json.load(f)
        except Exception:
            pass

    if status_data['health']['processed_file']:
        try:
            df = load_jobs_df_cached()
            if df is None:
                raise ValueError("CSV illisible")
            df = ensure_type_column(df)

            status_data['last_scraping'] = {
                'timestamp': pd.to_datetime(os.stat(settings.PROCESSED_FILE).st_mtime, unit='s').isoformat(),
                'total_offers': len(df),
            }

            status_data['statistics'] = {
                'total_offers': len(df),
                'by_type': df['type'].value_counts().to_dict() if 'type' in df.columns else {},
                'by_source': df['source'].value_counts().to_dict() if 'source' in df.columns else {},
                'by_region': df['location'].value_counts().to_dict() if 'location' in df.columns else {},
            }

        except Exception as e:
            status_data['status'] = 'error'
            status_data['error'] = str(e)

    return Response(status_data)
