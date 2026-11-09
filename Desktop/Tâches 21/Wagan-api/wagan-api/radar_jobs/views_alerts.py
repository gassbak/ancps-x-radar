"""API publique des alertes emploi (candidats) + statut du service d'envoi."""
import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import JobAlert
from .serializers_alerts import JobAlertCreateSerializer, JobAlertSerializer
from .services.brevo_service import brevo_configured

logger = logging.getLogger(__name__)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def alert_create_view(request):
    """Crée une alerte emploi (public). Body: email, keywords?, sector?, location?, job_type?, frequency?."""
    serializer = JobAlertCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": "Paramètres invalides", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    data = serializer.validated_data
    # Évite les doublons exacts actifs
    existing = JobAlert.objects.filter(
        email=data['email'], keywords=data.get('keywords', ''), sector=data.get('sector', ''),
        location=data.get('location', ''), job_type=data.get('job_type', ''),
        frequency=data.get('frequency', 'daily'), is_active=True,
    ).first()
    if existing:
        return Response({"message": "Alerte déjà active", "alert": JobAlertSerializer(existing).data}, status=status.HTTP_200_OK)
    alert = JobAlert.objects.create(
        email=data['email'], keywords=data.get('keywords', ''), sector=data.get('sector', ''),
        location=data.get('location', ''), job_type=data.get('job_type', ''),
        frequency=data.get('frequency', 'daily'),
    )
    # Email de confirmation (Brevo) — ne bloque jamais la création en cas d'échec
    email_sent = False
    try:
        from django.conf import settings
        from .services.brevo_service import send_email
        criteria = [v for v in [alert.keywords, alert.sector, alert.location, alert.job_type] if v] or ['toutes les nouvelles offres']
        freq_label = {'instant': 'instantanée', 'daily': 'quotidienne', 'weekly': 'hebdomadaire'}.get(alert.frequency, alert.frequency)
        frontend = getattr(settings, 'FRONTEND_RADAR_URL', '')
        subject = f"✅ Alerte activée : {', '.join(criteria)}"
        html = (
            "<p>Bonjour,</p>"
            f"<p>Votre alerte <b>{', '.join(criteria)}</b> est bien activée "
            f"(fréquence : {freq_label}). Vous recevrez les nouvelles offres correspondantes par email.</p>"
            + (f'<p><a href="{frontend}">Voir les opportunités sur Bakeli Radar</a></p>' if frontend else "")
            + "<p>Pour la désactiver, rouvrez le panneau Alertes avec cet email et supprimez-la.</p>"
            "<p>— L'équipe Bakeli Radar</p>"
        )
        text = (
            f"Votre alerte ({', '.join(criteria)}, fréquence : {freq_label}) est bien activée. "
            "Vous recevrez les nouvelles offres correspondantes par email."
        )
        email_sent = bool(send_email(alert.email, subject, html, text))
    except Exception as e:
        logger.warning(f"Email de confirmation d'alerte échoué pour {alert.email}: {e}")
    return Response(
        {"message": "Alerte créée", "alert": JobAlertSerializer(alert).data, "email_sent": email_sent},
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def alert_list_view(request):
    """Liste les alertes actives d'un email (?email=...)."""
    email = (request.GET.get('email') or '').strip()
    if not email:
        return Response({"error": "Paramètre 'email' requis."}, status=status.HTTP_400_BAD_REQUEST)
    alerts = JobAlert.objects.filter(email=email, is_active=True)
    return Response({"total": alerts.count(), "alerts": JobAlertSerializer(alerts, many=True).data})


@api_view(['DELETE'])
@authentication_classes([])
@permission_classes([AllowAny])
def alert_delete_view(request, alert_id):
    """Désactive une alerte (?email=... doit correspondre au propriétaire)."""
    email = (request.GET.get('email') or '').strip()
    if not email:
        return Response({"error": "Paramètre 'email' requis."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        alert = JobAlert.objects.get(id=alert_id, email=email, is_active=True)
    except JobAlert.DoesNotExist:
        return Response({"error": "Alerte non trouvée."}, status=status.HTTP_404_NOT_FOUND)
    alert.is_active = False
    alert.save(update_fields=['is_active', 'updated_at'])
    return Response({"message": "Alerte désactivée."})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def alert_status_view(request):
    """Statut du service d'envoi (Brevo configuré ?)."""
    return Response({
        "email_service": "brevo" if brevo_configured() else "console (BREVO_API_KEY manquante)",
        "brevo_configured": brevo_configured(),
    })
