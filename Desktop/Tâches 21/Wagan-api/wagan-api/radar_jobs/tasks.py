from celery import shared_task
from radar_jobs.services.pipeline import run_pipeline
from radar_jobs.services.email_service import send_scraping_alert, send_scraping_success_report
from django.conf import settings
import logging
import asyncio

logger = logging.getLogger(__name__)


@shared_task
def scrape_jobs_task():
    """
    Tâche Celery pour lancer le scraping automatique (utilisée par Celery Beat).
    """
    logger.info("🚀 Scraping automatique démarré")
    max_pages = settings.SCRAPING_CONFIG.get('MAX_PAGES', 5)
    
    try:
        import time
        start = time.perf_counter()
        result = asyncio.run(run_pipeline(max_pages=max_pages))
        stats = {
            'total_scraped': result.total_scraped,
            'new_jobs': result.new_jobs,
            'by_source': result.by_source,
            'errors': result.errors,
            'durations_s': getattr(result, 'durations', {}),
            'total_duration_s': round(time.perf_counter() - start, 1),
        }
        logger.info(f"✅ Scraping terminé : {stats}")
        
        # Envoyer des alertes en cas d'erreur ou de succès avec nouvelles offres
        if result.errors or result.new_jobs > 0:
            from datetime import datetime
            alert_data = {
                **stats,
                'date': datetime.now().isoformat(),
            }
            send_scraping_alert(alert_data)

        # Alertes candidats "instantanées" : notifier dès la fin du scraping
        if result.new_jobs > 0:
            try:
                send_job_alerts_for_frequencies(['instant'])
            except Exception as e:
                logger.warning(f"Alertes instantanées échouées: {e}")

        return stats
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        # Envoyer une alerte d'erreur
        from datetime import datetime
        send_scraping_alert({
            'errors': [str(e)],
            'total_scraped': 0,
            'new_jobs': 0,
            'by_source': {},
            'date': datetime.now().isoformat(),
        })
        raise


def _alert_matches(alert, row_text: str, row: dict) -> bool:
    """Vrai si l'offre correspond aux critères de l'alerte (mots-clés ET + filtres exacts)."""
    if alert.keywords and alert.keywords.strip():
        words = [w for w in alert.keywords.lower().split() if len(w) > 1]
        if words and not all(w in row_text for w in words):
            return False
    if alert.sector and alert.sector.strip():
        if str(row.get('sector', '')).strip().lower() != alert.sector.strip().lower():
            return False
    if alert.location and alert.location.strip():
        if str(row.get('location', '')).strip().lower() != alert.location.strip().lower():
            return False
    if alert.job_type and alert.job_type.strip():
        if str(row.get('type', '')).strip().lower() != alert.job_type.strip().lower():
            return False
    return True


def send_job_alerts_for_frequencies(frequencies):
    """Envoie les alertes candidats des fréquences données. Retourne le nb d'emails envoyés."""
    from datetime import date, timedelta
    from django.utils import timezone
    from radar_jobs.models import JobAlert
    from radar_jobs.services.jobs_store import load_jobs_df
    from radar_jobs.services.brevo_service import send_email, build_alert_email

    df = load_jobs_df()
    if df is None or df.empty:
        logger.info("Alertes candidats : aucune offre en base.")
        return 0

    today = date.today()
    alerts = JobAlert.objects.filter(is_active=True, frequency__in=frequencies)
    sent = 0
    for alert in alerts:
        # Fenêtre : offres depuis le dernier envoi (ou 2 derniers jours si jamais envoyé)
        if alert.last_sent_at:
            since = alert.last_sent_at.date()
        else:
            since = today - timedelta(days=2)
        window_days = 7 if alert.frequency == 'weekly' else 2
        since = max(since, today - timedelta(days=window_days))

        matches = []
        for _, row in df.iterrows():
            scraped = str(row.get('scraped_date', ''))
            if scraped < since.isoformat():
                continue
            row_text = f"{row.get('title', '')} {row.get('company', '')} {row.get('description', '')} {row.get('sector', '')} {row.get('key_skills', '')}".lower()
            if _alert_matches(alert, row_text, row.to_dict()):
                matches.append(row.to_dict())
                if len(matches) >= 10:
                    break
        if not matches:
            continue
        subject, html, text = build_alert_email(alert, matches)
        if send_email(alert.email, subject, html, text):
            alert.last_sent_at = timezone.now()
            alert.save(update_fields=['last_sent_at', 'updated_at'])
            sent += 1
    logger.info(f"Alertes candidats {frequencies} : {sent} email(s) envoyé(s) pour {alerts.count()} alerte(s).")
    return sent


@shared_task
def send_daily_alerts_task():
    """Beat quotidien : alertes daily + instant."""
    return send_job_alerts_for_frequencies(['daily', 'instant'])


@shared_task
def send_weekly_alerts_task():
    """Beat hebdomadaire : alertes weekly."""
    return send_job_alerts_for_frequencies(['weekly'])
