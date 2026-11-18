from rest_framework.throttling import SimpleRateThrottle


class AnnuaireIPThrottle(SimpleRateThrottle):
    """Limite par adresse IP, y compris pour les utilisateurs connectés.

    (Les throttles DRF standard utilisent `request.user.pk`, que l'utilisateur sans état
    de Radar n'a pas.)"""
    scope = 'annuaire_ip'
    rate = '120/min'

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}


class AnnuaireEventThrottle(AnnuaireIPThrottle):
    scope = 'annuaire_events'
    rate = '90/min'
