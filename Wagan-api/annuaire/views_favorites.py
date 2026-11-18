"""Favoris Radar : « Mes formations enregistrées » (réservé au compte connecté)."""
import re

from rest_framework.decorators import (
    api_view, authentication_classes, permission_classes, throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from radar_jobs.auth import StatelessJWTAuthentication

from .identity import radar_user_id
from .models import Favorite
from .services import AncpsError, get_certifications
from .throttles import AnnuaireIPThrottle

ID_PATTERN = re.compile(r'^[A-Za-z0-9_.\-]{1,64}$')
MAX_FAVORITES = 200


def _unauthorized():
    return Response({'error': "Connectez-vous pour gérer vos formations enregistrées.",
                     'code': 'unauthorized'}, status=401)


@api_view(['GET', 'POST'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([AllowAny])
@throttle_classes([AnnuaireIPThrottle])
def favorites_view(request):
    """GET  /api/annuaire/me/favorites/                 → mes favoris (avec la fiche si disponible)
    POST /api/annuaire/me/favorites/ {formation_id}    → ajouter (sans doublon)"""
    uid = radar_user_id(request)
    if uid is None:
        return _unauthorized()

    if request.method == 'POST':
        data = request.data if isinstance(request.data, dict) else {}
        formation_id = data.get('formation_id')
        if not isinstance(formation_id, str) or not ID_PATTERN.match(formation_id):
            return Response({'error': "Identifiant de formation invalide.", 'code': 'bad_request'}, status=400)
        if (not Favorite.objects.filter(radar_user_id=uid, formation_id=formation_id).exists()
                and Favorite.objects.filter(radar_user_id=uid).count() >= MAX_FAVORITES):
            return Response({'error': f"Limite de {MAX_FAVORITES} formations enregistrées atteinte.",
                             'code': 'limit_reached'}, status=400)
        _, created = Favorite.objects.get_or_create(radar_user_id=uid, formation_id=formation_id)
        return Response({'formation_id': formation_id, 'created': created}, status=201 if created else 200)

    favorites = list(Favorite.objects.filter(radar_user_id=uid))
    by_id = {}
    try:
        items, _stale = get_certifications()
        by_id = {str(item.get('_id') or item.get('id')): item for item in items if isinstance(item, dict)}
    except AncpsError:
        pass  # ANCPS indisponible : on renvoie les identifiants sans la fiche
    return Response({
        'count': len(favorites),
        'favorites': [
            {
                'formation_id': fav.formation_id,
                'created_at': fav.created_at.isoformat(),
                'formation': by_id.get(fav.formation_id),
            }
            for fav in favorites
        ],
    })


@api_view(['DELETE'])
@authentication_classes([StatelessJWTAuthentication])
@permission_classes([AllowAny])
@throttle_classes([AnnuaireIPThrottle])
def favorite_delete_view(request, formation_id):
    """DELETE /api/annuaire/me/favorites/<formation_id>/ — retire un favori (sans erreur s'il n'existe pas)."""
    uid = radar_user_id(request)
    if uid is None:
        return _unauthorized()
    if not ID_PATTERN.match(formation_id):
        return Response({'error': "Identifiant de formation invalide.", 'code': 'bad_request'}, status=400)
    Favorite.objects.filter(radar_user_id=uid, formation_id=formation_id).delete()
    return Response(status=204)
