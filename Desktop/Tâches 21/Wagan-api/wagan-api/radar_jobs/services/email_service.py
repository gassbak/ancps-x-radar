import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_scraping_alert(scraping_result):
    """
    Envoie une alerte email en cas d'échec ou de problèmes lors du scraping.
    """
    if not getattr(settings, 'SCRAPING_CONFIG', {}).get('ENABLE_EMAIL_ALERTS', False):
        return

    alert_email = settings.SCRAPING_CONFIG.get('ALERT_EMAIL')
    if not alert_email:
        logger.warning("Pas d'email d'alerte configuré pour le scraping")
        return

    errors = scraping_result.get('errors', [])
    total_scraped = scraping_result.get('total_scraped', 0)
    new_jobs = scraping_result.get('new_jobs', 0)
    by_source = scraping_result.get('by_source', {})

    # Déterminer le niveau d'alerte
    if errors:
        subject = f"🚨 Alerte Scraping Bakeli Radar - {len(errors)} erreur(s) détectée(s)"
        level = "ERREUR"
    elif total_scraped == 0:
        subject = "⚠️ Alerte Scraping Bakeli Radar - Aucune offre collectée"
        level = "AVERTISSEMENT"
    else:
        subject = f"✅ Rapport Scraping Bakeli Radar - {new_jobs} nouvelles offres"
        level = "INFO"

    # Construire le corps du message
    message = f"""
Rapport automatique de scraping - Bakeli Radar
{'=' * 50}

Niveau: {level}
Date: {scraping_result.get('date', 'N/A')}
Total collecté: {total_scraped} offres
Nouvelles offres: {new_jobs}

Répartition par source:
"""
    for source, count in by_source.items():
        message += f"  - {source}: {count} offres\n"

    if errors:
        message += f"\nErreurs rencontrées ({len(errors)}):\n"
        for error in errors:
            message += f"  ❌ {error}\n"

    message += f"""
{'=' * 50}
Ce message est envoyé automatiquement par le système de scraping Bakeli Radar.
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[alert_email],
            fail_silently=False,
        )
        logger.info(f"Email d'alerte envoyé à {alert_email}")
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email d'alerte: {e}")


def send_scraping_success_report(scraping_result):
    """
    Envoie un rapport de succès si de nouvelles offres ont été trouvées.
    """
    new_jobs = scraping_result.get('new_jobs', 0)
    if new_jobs > 0:
        send_scraping_alert(scraping_result)
