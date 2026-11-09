from .base import *
#import os
#from pathlib import Path

# Définit la racine du projet
#BASE_DIR = Path(__file__).resolve().parent.parent.parent

import dj_database_url

DEBUG = False
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")

# Strict DB for Prod (Postgres)
DATABASES = {
    'default': dj_database_url.parse(os.getenv('DATABASE', 'postgres://user:pass@localhost/db'))
}

# ================================================================
# CORS — Politique d'accès Cross-Origin
# ================================================================
# Les endpoints privés (dashboard, hot-leads, config) sont protégés
# par une liste blanche restreinte.
# Seul l'endpoint public du chatbot (/api/bot/) est ouvert à tous
# les domaines, pour permettre son intégration sur bakeli.tech,
# Rocket.chat, ou tout autre support externe.
CORS_ALLOW_CREDENTIALS = True
cors_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_env:
    CORS_ALLOWED_ORIGINS = cors_env.split(",")
else:
    CORS_ALLOWED_ORIGINS = []

# Ajout global des domaines externes autorisés à faire des requêtes CORS.
# Cette liste autorise le navigateur à passer la requête, MAIS l'API (Dashboard, etc.)
# reste protégée par IsAuthenticated.
# Seule l'API Chatbot (/api/wagan/chat/) a "AllowAny" et laissera passer la requête.
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https?://.*\.bakeli\.tech$',       # Tous les sous-domaines bakeli
    r'^https?://.*\.rocket\.chat$',       # Rocket.chat
    r'^https?://localhost:\d+$',           # D\u00e9veloppement local
    r'^https?://127\.0\.0\.1:\d+$',      # D\u00e9veloppement local
]

# Cookies sécurisés uniquement si le serveur tourne en HTTPS (vrai déploiement).
# En démo Docker locale (HTTP), on désactive pour ne pas bloquer la connexion.
# En prod réelle : ajouter HTTPS_ENABLED=true dans les variables d'env du serveur.
_https_enabled = os.getenv("HTTPS_ENABLED", "false").lower() == "true"
SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = _https_enabled
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = _https_enabled
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
