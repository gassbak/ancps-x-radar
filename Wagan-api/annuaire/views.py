"""API Radar pour l'annuaire ANCPS (lecture seule, publique, sans nouvelle authentification)."""
import math
import re

from rest_framework.decorators import (
    api_view, authentication_classes, permission_classes, throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .filters import FILTER_FIELDS, apply_filters, build_facets
from .services import AncpsError, get_certification, get_certifications

DEFAULT_PAGE_SIZE = 12
MAX_PAGE_SIZE = 50
MAX_QUERY_LENGTH = 200
ID_PATTERN = re.compile(r'^[A-Za-z0-9_.\-]{1,64}$')
FILTER_KEYS = list(FILTER_FIELDS.keys()) + ['cost']


class AnnuaireThrottle(AnonRateThrottle):
    """Limite les requêtes publiques (exigence de sécurité du cahier des charges)."""
    scope = 'annuaire'
    rate = '120/min'


def _int_param(request, name, default, minimum, maximum):
    raw = request.query_params.get(name)
    if raw in (None, ''):
        return default
    try:
        value = int(raw)
    except ValueError:
        raise ValueError(f"Le paramètre '{name}' doit être un entier.")
    if not minimum <= value <= maximum:
        raise ValueError(f"Le paramètre '{name}' doit être compris entre {minimum} et {maximum}.")
    return value


def _error(exc):
    return Response({'error': str(exc), 'code': 'ancps_unavailable' if exc.status != 404 else 'not_found'},
                    status=exc.status)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AnnuaireThrottle])
def formations_list_view(request):
    """GET /api/annuaire/formations/?q=&page=&page_size=&type=&domain=&level=&region=
    &modality=&duration=&organization=&status=&category=&cost=free|paid|unknown
    (une valeur '__missing__' filtre les fiches où le champ est non renseigné)."""
    try:
        page = _int_param(request, 'page', 1, 1, 1_000_000)
        page_size = _int_param(request, 'page_size', DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)
    except ValueError as exc:
        return Response({'error': str(exc), 'code': 'bad_request'}, status=400)

    try:
        items, stale = get_certifications()
    except AncpsError as exc:
        return _error(exc)

    query = request.query_params.get('q', '')[:MAX_QUERY_LENGTH]
    params = {key: request.query_params.get(key, '').strip() for key in FILTER_KEYS}
    cost = params.get('cost')
    if cost and cost not in ('free', 'paid', 'unknown'):
        return Response({'error': "Le paramètre 'cost' doit valoir free, paid ou unknown.",
                         'code': 'bad_request'}, status=400)

    filtered = apply_filters(items, query, params)
    total = len(filtered)
    start = (page - 1) * page_size
    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'total_pages': math.ceil(total / page_size) if total else 0,
        'results': filtered[start:start + page_size],
        'facets': build_facets(items),
        'stale': stale,
        'source': 'ancps',
    })


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AnnuaireThrottle])
def formation_detail_view(request, cert_id):
    """GET /api/annuaire/formations/<id>/ : fiche telle que fournie par ANCPS."""
    if not ID_PATTERN.match(cert_id):
        return Response({'error': "Identifiant invalide.", 'code': 'bad_request'}, status=400)
    try:
        data, stale = get_certification(cert_id)
    except AncpsError as exc:
        return _error(exc)
    return Response({'data': data, 'stale': stale, 'source': 'ancps'})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([AnnuaireThrottle])
def annuaire_health_view(request):
    """GET /api/annuaire/health/ : l'annuaire ANCPS répond-il ? (n'impacte pas le reste de Radar)."""
    try:
        items, stale = get_certifications()
    except AncpsError as exc:
        return Response({'status': 'down', 'error': str(exc)}, status=exc.status)
    return Response({'status': 'degraded' if stale else 'ok', 'count': len(items), 'stale': stale})