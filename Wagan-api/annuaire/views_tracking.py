"""Événements d'usage anonymes (cahier des charges, section 11) et statistiques agrégées."""
import re
from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import (
    api_view, authentication_classes, permission_classes, throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from radar_jobs.auth import StatelessJWTAuthentication

from .identity import is_radar_staff
from .models import EVENT_NAMES, AnnuaireEvent
from .throttles import AnnuaireEventThrottle, AnnuaireIPThrottle

ID_PATTERN = re.compile(r'^[A-Za-z0-9_.\-]{1,64}$')
SESSION_PATTERN = re.compile(r'^[A-Za-z0-9_\-]{8,64}$')


def _bad(message):
    return Response({'error': message, 'code': 'bad_request'}, status=400)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AnnuaireEventThrottle])
def track_event_view(request):
    """POST /api/annuaire/events/ {event, formation_id?, detail?, result_count?, session_id?}"""
    data = request.data if isinstance(request.data, dict) else {}
    event = data.get('event')
    if event not in EVENT_NAMES:
        return _bad("Événement inconnu.")

    formation_id = data.get('formation_id') or ''
    if formation_id and (not isinstance(formation_id, str) or not ID_PATTERN.match(formation_id)):
        return _bad("Identifiant de formation invalide.")

    detail = data.get('detail') or ''
    if not isinstance(detail, str) or len(detail) > 60:
        return _bad("Détail invalide.")

    result_count = data.get('result_count')
    if result_count is not None:
        if isinstance(result_count, bool) or not isinstance(result_count, int) or result_count < 0:
            return _bad("Nombre de résultats invalide.")

    session_id = data.get('session_id') or ''
    if session_id and (not isinstance(session_id, str) or not SESSION_PATTERN.match(session_id)):
        return _bad("Identifiant de session invalide.")

    AnnuaireEvent.objects.create(
        event=event, formation_id=formation_id, detail=detail,
        result_count=result_count, session_id=session_id,
    )
    return Response(status=204)


@api_view(['GET'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([AllowAny])
@throttle_classes([AnnuaireIPThrottle])
def stats_view(request):
    """GET /api/annuaire/stats/?days=30 — réservé aux admins/coachs Radar. Données agrégées."""
    user = request.user
    if not getattr(user, 'is_authenticated', False):
        return Response({'error': "Authentification requise.", 'code': 'unauthorized'}, status=401)
    if not is_radar_staff(request):
        return Response({'error': "Accès réservé.", 'code': 'forbidden'}, status=403)

    try:
        days = int(request.query_params.get('days', 30))
    except ValueError:
        return _bad("Le paramètre 'days' doit être un entier.")
    if not 1 <= days <= 365:
        return _bad("Le paramètre 'days' doit être compris entre 1 et 365.")

    since = timezone.now() - timedelta(days=days)
    events = AnnuaireEvent.objects.filter(created_at__gte=since)
    by_event = {row['event']: row['n'] for row in events.values('event').annotate(n=Count('id'))}
    searches = events.filter(event='formation_search_performed')
    clicks = (events.filter(event='outbound_registration_clicked').exclude(formation_id='')
              .values('formation_id').annotate(clicks=Count('id')).order_by('-clicks')[:20])
    sessions = events.exclude(session_id='').values('session_id').distinct().count()
    return Response({
        'period_days': days,
        'events': {name: by_event.get(name, 0) for name in EVENT_NAMES},
        'unique_sessions': sessions,
        'searches_total': searches.count(),
        'searches_without_results': searches.filter(result_count=0).count(),
        'top_outbound_clicks': list(clicks),
    })
