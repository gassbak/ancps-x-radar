import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from django.contrib.auth.models import AnonymousUser

class StatelessUser:
    """
    A minimal user-like object that holds information from the JWT payload.
    """
    def __init__(self, payload):
        self.payload = payload
        self.id = payload.get('sub') or payload.get('id')
        self.email = payload.get('email')
        self.statut = payload.get('statut') # Role in Laravel (admin, coach, etc.)
        self.is_active = True
        self.is_authenticated = True

    def __str__(self):
        return f"StatelessUser(email={self.email}, statut={self.statut})"

    @property
    def is_staff(self):
        return self.statut in ['admin', 'coach']

    @property
    def is_superuser(self):
        return self.statut == 'admin'

class StatelessJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        try:
            # Expected format: Bearer <token>
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                return None
        except ValueError:
            return None

        signing_key = getattr(settings, 'SIMPLE_JWT', {}).get('SIGNING_KEY', None)
        if not signing_key:
            signing_key = os.getenv("JWT_SECRET", getattr(settings, 'SECRET_KEY', ''))

        algorithm = getattr(settings, 'SIMPLE_JWT', {}).get('ALGORITHM', 'HS256')

        try:
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=[algorithm]
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')

        user = StatelessUser(payload)
        return (user, None)
