"""
Vue custom pour le callback Google OAuth2.
Élimine complètement le problème de cookie/session cross-origin :
Google redirige directement vers ce endpoint Django (pas vers le frontend),
Django échange le code, génère les JWT, puis redirige vers le frontend avec les tokens.
"""
import requests
from django.http import HttpResponseRedirect
from django.views import View
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
FRONTEND_URL = "http://localhost:5173"
REDIRECT_URI = "http://localhost:8000/api/auth/google/callback/"


class GoogleCallbackView(View):
    """
    Reçoit le code Google, échange contre un token, crée/récupère l'utilisateur,
    génère des JWT et redirige vers le frontend.
    """
    def get(self, request):
        code = request.GET.get("code")
        error = request.GET.get("error")

        if error or not code:
            return HttpResponseRedirect(f"{FRONTEND_URL}/auth/google?error=access_denied")

        try:
            # 1. Échanger le code contre un access_token Google
            token_response = requests.post(GOOGLE_TOKEN_URL, data={
                "code": code,
                "client_id": settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
                "client_secret": settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET,
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code",
            }, timeout=10)

            if not token_response.ok:
                error_detail = token_response.json().get("error_description", "token_exchange_failed")
                return HttpResponseRedirect(f"{FRONTEND_URL}/auth/google?error={error_detail}")

            google_token = token_response.json().get("access_token")

            # 2. Récupérer le profil Google
            userinfo_response = requests.get(GOOGLE_USERINFO_URL, headers={
                "Authorization": f"Bearer {google_token}"
            }, timeout=10)

            if not userinfo_response.ok:
                return HttpResponseRedirect(f"{FRONTEND_URL}/auth/google?error=userinfo_failed")

            userinfo = userinfo_response.json()
            email = userinfo.get("email")

            if not email:
                return HttpResponseRedirect(f"{FRONTEND_URL}/auth/google?error=no_email")

            # 3. Créer ou récupérer l'utilisateur
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"is_active": True}
            )

            # 4. Générer les JWT Wagan
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # 5. Rediriger vers le frontend avec les tokens dans l'URL
            return HttpResponseRedirect(
                f"{FRONTEND_URL}/auth/google"
                f"?access={access_token}"
                f"&refresh={refresh_token}"
            )

        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur réseau Google OAuth: {e}")
            return HttpResponseRedirect(f"{FRONTEND_URL}/auth/google?error=network_error")
        except Exception as e:
            print(f"❌ Erreur inattendue Google OAuth: {e}")
            return HttpResponseRedirect(f"{FRONTEND_URL}/auth/google?error=server_error")
