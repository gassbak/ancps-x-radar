"""Identité de l'utilisateur Radar à partir du jeton JWT.

Deux types de jetons existent :
- jetons « Radar » (claims `sub` ou `id`, `statut`), lus par radar_jobs.auth ;
- jetons Djoser/SimpleJWT de Wagan (claim `user_id`), émis par /api/auth/jwt/create/.
Les deux sont acceptés ici sans modifier radar_jobs/auth.py.
"""
from wagan_app.models import CustomUser


def radar_user_id(request):
    """Identifiant du compte, ou None si non connecté."""
    user = request.user
    if not getattr(user, 'is_authenticated', False):
        return None
    uid = getattr(user, 'id', None)
    if uid in (None, ''):
        payload = getattr(user, 'payload', None) or {}
        uid = payload.get('user_id')
    return str(uid) if uid not in (None, '') else None


def is_radar_staff(request):
    """Admin/coach Radar (claim `statut`) ou membre du staff Django (jeton Djoser)."""
    user = request.user
    if not getattr(user, 'is_authenticated', False):
        return False
    if getattr(user, 'is_staff', False):
        return True
    uid = radar_user_id(request)
    if uid and uid.isdigit():
        return CustomUser.objects.filter(pk=int(uid), is_staff=True, is_active=True).exists()
    return False
