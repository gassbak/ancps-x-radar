"""Envoi d'emails via l'API Brevo (https://api.brevo.com/v3/smtp/email).

Sans BREVO_API_KEY configurée : repli console (log) pour ne jamais bloquer
le flux en développement local.
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"


def brevo_configured() -> bool:
    return bool(getattr(settings, "BREVO_API_KEY", ""))


def send_email(to_email: str, subject: str, html: str, text: str = "") -> bool:
    """Envoie un email via Brevo. Retourne True si accepté (ou loggé en fallback)."""
    if not brevo_configured():
        logger.info(f"[Brevo:non configuré] To={to_email} Subject={subject}\n{text[:500]}")
        return False

    payload = {
        "sender": {
            "email": getattr(settings, "BREVO_SENDER_EMAIL", "noreply@bakeli.tech"),
            "name": getattr(settings, "BREVO_SENDER_NAME", "Bakeli Radar"),
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html,
    }
    if text:
        payload["textContent"] = text

    try:
        resp = requests.post(
            BREVO_ENDPOINT,
            headers={"api-key": settings.BREVO_API_KEY, "Content-Type": "application/json"},
            json=payload,
            timeout=20,
        )
        if resp.status_code in (200, 201):
            logger.info(f"Email Brevo envoyé à {to_email} (messageId={resp.json().get('messageId')})")
            return True
        logger.error(f"Brevo erreur {resp.status_code}: {resp.text[:500]}")
        return False
    except requests.RequestException as e:
        logger.error(f"Brevo erreur réseau: {e}")
        return False


def build_alert_email(alert, jobs: list) -> tuple:
    """Construit (sujet, html, texte) pour une alerte et ses offres correspondantes."""
    criteria = alert.keywords or alert.sector or alert.job_type or "vos critères"
    subject = f"🔔 {len(jobs)} nouvelle(s) offre(s) : {criteria}"
    lines_html = "".join(
        f"<li><b>{j.get('title', 'Offre')}</b> — {j.get('company', '')} ({j.get('location', '')})"
        + (f' — <a href="{j.get("offer_url")}">Voir l\'offre</a>' if j.get("offer_url") else "")
        + "</li>"
        for j in jobs[:10]
    )
    frontend = getattr(settings, "FRONTEND_RADAR_URL", "")
    html = (
        f"<p>Bonjour,</p>"
        f"<p>{len(jobs)} nouvelle(s) offre(s) correspondent à votre alerte <b>{criteria}</b> :</p>"
        f"<ul>{lines_html}</ul>"
        + (f'<p><a href="{frontend}">Voir toutes les opportunités sur Bakeli Radar</a></p>' if frontend else "")
        + "<p>— L'équipe Bakeli Radar</p>"
    )
    text = f"{len(jobs)} nouvelle(s) offre(s) pour {criteria} :\n" + "\n".join(
        f"- {j.get('title', 'Offre')} — {j.get('company', '')} ({j.get('location', '')}) {j.get('offer_url', '')}"
        for j in jobs[:10]
    )
    return subject, html, text
