"""Accès à l'API ANCPS depuis le backend Wagan.

- ANCPS reste la source de vérité : on ne copie pas les fiches en base.
- Timeout, erreurs maîtrisées, cache (frais + copie « secours » si ANCPS est en panne).
- Aucune clé n'est nécessaire : l'API ANCPS utilisée est publique.
"""
import logging
from urllib.parse import quote

import requests
from django.conf import settings
from django.core.cache import cache

from .cleaning import sanitize_item

logger = logging.getLogger(__name__)

LIST_CACHE_KEY = 'annuaire:certifications:list'
DETAIL_CACHE_KEY = 'annuaire:certification:{id}'


class AncpsError(Exception):
    """Erreur d'accès à ANCPS. `status` = code HTTP renvoyé au frontend."""

    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


class AncpsNotFound(AncpsError):
    def __init__(self, message="Cette fiche est introuvable."):
        super().__init__(message, status=404)


def _request_json(endpoint):
    url = f"{settings.ANCPS_API_URL.rstrip('/')}{endpoint}"
    try:
        resp = requests.get(
            url,
            headers={'Accept': 'application/json'},
            timeout=settings.ANCPS_TIMEOUT,
        )
    except requests.Timeout:
        logger.warning("ANCPS timeout: %s", endpoint)
        raise AncpsError("L'annuaire ANCPS met trop de temps à répondre. Réessayez dans un instant.", 503)
    except requests.RequestException as exc:
        logger.warning("ANCPS injoignable: %s (%s)", endpoint, exc.__class__.__name__)
        raise AncpsError("L'annuaire ANCPS est momentanément indisponible.", 503)

    if resp.status_code == 404:
        raise AncpsNotFound()
    if resp.status_code != 200:
        logger.error("ANCPS HTTP %s sur %s", resp.status_code, endpoint)
        raise AncpsError("L'annuaire ANCPS a renvoyé une erreur. Réessayez plus tard.", 502)
    try:
        return resp.json()
    except ValueError:
        logger.error("ANCPS réponse non JSON sur %s", endpoint)
        raise AncpsError("L'annuaire ANCPS a renvoyé une réponse invalide.", 502)


def _cached_fetch(key, endpoint):
    """Retourne (données, stale). `stale` vrai = copie de secours (ANCPS en panne)."""
    fresh = cache.get(key)
    if fresh is not None:
        return fresh, False
    try:
        data = _request_json(endpoint)
    except AncpsNotFound:
        raise
    except AncpsError:
        stale = cache.get(f"{key}:stale")
        if stale is not None:
            logger.warning("ANCPS indisponible : copie de secours servie pour %s", key)
            return stale, True
        raise
    cache.set(key, data, settings.ANCPS_CACHE_TTL)
    cache.set(f"{key}:stale", data, settings.ANCPS_STALE_TTL)
    return data, False


def get_certifications():
    """Liste des fiches publiées : (liste, stale)."""
    data, stale = _cached_fetch(LIST_CACHE_KEY, '/certifications?published=true')
    items = data if isinstance(data, list) else (data.get('data') if isinstance(data, dict) else None)
    if not isinstance(items, list):
        logger.error("ANCPS: format de liste inattendu")
        raise AncpsError("L'annuaire ANCPS a renvoyé un format inattendu.", 502)
    return [sanitize_item(item) for item in items], stale


def get_certification(cert_id):
    """Une fiche : (dict, stale). `cert_id` doit être validé avant l'appel."""
    key = DETAIL_CACHE_KEY.format(id=cert_id)
    data, stale = _cached_fetch(key, f"/certifications/{quote(str(cert_id), safe='')}")
    if isinstance(data, dict) and isinstance(data.get('data'), dict):
        data = data['data']
    if not isinstance(data, dict):
        raise AncpsError("L'annuaire ANCPS a renvoyé un format inattendu.", 502)
    return sanitize_item(data), stale