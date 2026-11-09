from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Configuration CORS pour le développement local
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Définition directe des en-têtes autorisés (Sentry inclus)
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "baggage",
    "sentry-trace",
]

SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = False

SIMPLE_JWT = {
    'SIGNING_KEY': SECRET_KEY,  # Utilise la clé secrète de Django par défaut
    # Tu peux aussi ajouter les autres options si besoin :
    # 'ALGORITHM': 'HS256',
    # 'AUTH_HEADER_TYPES': ('Bearer',),
}