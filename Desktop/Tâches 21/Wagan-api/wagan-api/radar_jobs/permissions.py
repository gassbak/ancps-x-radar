from rest_framework import permissions

class IsCoachOrAdmin(permissions.BasePermission):
    """
    Allows access only to users with 'coach' or 'admin' status.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'statut') and
            request.user.statut in ['coach', 'admin']
        )
