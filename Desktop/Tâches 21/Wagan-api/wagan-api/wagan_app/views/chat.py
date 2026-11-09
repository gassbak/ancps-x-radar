import os
import re
import tempfile
import socket
import ipaddress
from urllib.parse import urlparse

import requests
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.permissions import IsAuthenticated, AllowAny

from utils.ai_client import ask, ask_with_file


# ------------------------------------------------------------------ #
#  Modèles disponibles                                                 #
# ------------------------------------------------------------------ #
MODEL_CHAT    = "openai/gpt-oss-20b"   # Usage général via Groq/Bakeli
MODEL_CODE    = "openai/gpt-oss-20b"   # On utilise le même modèle performant pour le code
MODEL_VISION  = "llava"      # Analyse d'images 👀
MODEL_LONG    = "openai/gpt-oss-20b"    # Raisonnement, texte long
MODEL_MULTI   = "openai/gpt-oss-20b"  # Multilingue


wagan_persona = """
Je suis Wagan, un assistant IA créé par Abdoul Khadre DIALLO. Je suis amical, serviable et bien informé sur divers sujets techniques.
Expert en développement web, mobile et marketing digital. J'aide les étudiants de l'école de technologie Bakeli (https://www.bakeli.tech/).
Je maîtrise : React.js, JavaScript, HTML, CSS, Bootstrap, marketing digital, design, Laravel, Python, React Native, Flutter, PHP, et Filament.
Mon objectif est de fournir des informations précises et pertinentes pour soutenir leur apprentissage et leurs projets.
"""

# ⚠️ À remplacer par session ou BDD en production
conversation_history = []


class ChatAPIView(APIView):
    # Rendu public suite à la demande pour l'intégration Rocket.chat / site web
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["name", "message"],
            properties={
                "name":    openapi.Schema(type=openapi.TYPE_STRING, description="Nom de l'utilisateur"),
                "message": openapi.Schema(type=openapi.TYPE_STRING, description="Message"),
                "github":  openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_URI, description="Lien Github"),
                "images":  openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(type=openapi.TYPE_FILE),
                    description="Captures à analyser",
                ),
            },
        ),
        responses={200: "Success", 400: "Bad Request"},
    )
    def post(self, request, format=None):
        name    = request.data.get("name", "")
        message = request.data.get("message", "")
        github  = request.data.get("github", "")
        images  = request.FILES.getlist("images")

        # 🎯 Identité de Wagan
        if any(kw in message.lower() for kw in ("qui es-tu", "quel est ton nom")):
            return Response({
                "message":  "Data received",
                "user":     name,
                "response": "Je suis Wagan, un assistant IA créé par Abdoul Khadre DIALLO.",
                "model":    None,
            }, status=status.HTTP_200_OK)

        # 📸 Analyse d'images → llava
        if images:
            results = self.handle_images(
                images,
                prompt=message or "Analyse cette image et décris son contenu.",
            )
            return Response({
                "message": "Analyse des images effectuée",
                "user":    name,
                "model":   MODEL_VISION,
                "results": results,
            }, status=status.HTTP_200_OK)

        # 🔗 Traitement du lien externe (GitHub ou autre)
        if github:
            if not self.is_safe_url(github):
                return Response(
                    {"error": "URL non autorisée. Les adresses locales ou privées sont interdites (Protection SSRF)."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                if "github.com" in github:
                    link_content = self.get_github_code(github)
                else:
                    resp = requests.get(github, timeout=10)
                    resp.raise_for_status()
                    try:
                        from bs4 import BeautifulSoup
                        soup = BeautifulSoup(resp.text, 'html.parser')
                        link_content = soup.get_text(separator=' ', strip=True)[:15000]
                    except ImportError:
                        link_content = re.sub(r'<[^>]+>', ' ', resp.text)[:15000]
            except Exception as e:
                link_content = f"Impossible d'accéder au lien ({e})"
            
            message = f"{message}\n\n[Contenu extrait du lien {github}] :\n{link_content}"

        # 💬 Choix du modèle selon le message
        model = self.select_model(message)

        conversation_history.append({"role": "user", "content": message})
        messages = [{"role": "system", "content": wagan_persona}] + conversation_history

        try:
            wagan_response = ask(messages, model=model)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        conversation_history.append({"role": "assistant", "content": wagan_response})

        return Response({
            "message":  "Data received",
            "user":     name,
            "model":    model,
            "response": wagan_response,
        }, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------ #
    #  Sécurité et Utilitaires                                            #
    # ------------------------------------------------------------------ #

    def is_safe_url(self, url: str) -> bool:
        """Vérifie que l'URL est sûre (pas d'IP locale/privée) pour éviter le SSRF."""
        try:
            parsed = urlparse(url)
            if parsed.scheme not in ("http", "https"):
                return False
            hostname = parsed.hostname
            if not hostname:
                return False
            
            # Bloquer explicitement localhost
            if hostname.lower() in ("localhost", "127.0.0.1", "::1"):
                return False
                
            # Résoudre l'IP pour bloquer les réseaux internes
            ip = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                return False
                
            return True
        except Exception:
            return False

    # ------------------------------------------------------------------ #
    #  Sélection automatique du modèle                                    #
    # ------------------------------------------------------------------ #

    def select_model(self, message: str) -> str:
        """Choisit le modèle le plus adapté selon le contenu du message."""
        msg = message.lower()

        # Mots-clés code & logique → phi3
        code_keywords = (
            "code", "bug", "erreur", "fonction", "classe", "algorithme",
            "déboguer", "debug", "script", "programme", "développe",
            "react", "python", "javascript", "php", "flutter", "laravel",
        )
        if any(kw in msg for kw in code_keywords):
            return MODEL_CODE

        # Message long (> 300 chars) → mistral pour le raisonnement
        if len(message) > 300:
            return MODEL_LONG

        # Message en langue non-française détecté (heuristique simple) → gemma3:4b
        french_common = ("je", "tu", "il", "nous", "vous", "comment", "pourquoi", "qu", "est", "une", "les")
        words = msg.split()
        if words and sum(1 for w in words if w in french_common) / len(words) < 0.1:
            return MODEL_MULTI

        # Par défaut → llama3.2
        return MODEL_CHAT

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def handle_images(self, images: list, prompt: str) -> list:
        """Envoie chaque image à llava via ask_with_file."""
        results = []
        for image in images:
            suffix = os.path.splitext(image.name)[-1] or ".jpg"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                for chunk in image.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            try:
                analysis = ask_with_file(prompt=prompt, filepath=tmp_path, model=MODEL_VISION)
                results.append({"file": image.name, "analysis": analysis})
            except Exception as e:
                results.append({"file": image.name, "error": str(e)})
            finally:
                os.remove(tmp_path)

        return results

    def get_github_code(self, github_url: str) -> str:
        """Récupère les fichiers de code source d'un dépôt GitHub."""
        match = re.search(r"github\.com/([^/]+)/([^/]+)", github_url)
        if not match:
            return "URL GitHub invalide."

        username, repo_name = match.group(1), match.group(2)
        api_url = f"https://api.github.com/repos/{username}/{repo_name}/contents"

        try:
            response = requests.get(api_url, timeout=30)
            response.raise_for_status()
            contents = response.json()
        except requests.exceptions.RequestException as e:
            return f"Erreur lors de la récupération du dépôt : {e}"

        extensions = (".py", ".js", ".ts", ".java", ".cpp", ".c", ".html", ".css", ".php")
        code_content = ""

        for item in contents:
            if item["type"] == "file" and item["name"].endswith(extensions):
                raw_url = (
                    f"https://raw.githubusercontent.com"
                    f"/{username}/{repo_name}/master/{item['name']}"
                )
                try:
                    file_resp = requests.get(raw_url, timeout=30)
                    file_resp.raise_for_status()
                    code_content += f"\n\n--- {item['name']} ---\n\n{file_resp.text}"
                except requests.exceptions.RequestException:
                    continue

        return code_content if code_content else "Aucun fichier de code trouvé dans le dépôt."

    def get_code_feedback(self, github_url: str) -> str:
        """Analyse le code GitHub avec phi3 et retourne un feedback."""
        code = self.get_github_code(github_url)
        if not code or code.startswith(("Erreur", "URL", "Aucun")):
            return code

        messages = [
            {
                "role": "system",
                "content": "Tu es un expert en code review. Réponds en français. Sois précis et constructif.",
            },
            {
                "role": "user",
                "content": (
                    f"Analyse ce code et donne un feedback détaillé :\n\n{code}\n\n"
                    "Focus sur :\n"
                    "- Lisibilité\n"
                    "- Bonnes pratiques\n"
                    "- Bugs potentiels\n"
                    "- Optimisation\n"
                    "- Architecture\n"
                ),
            },
        ]

        try:
            return ask(messages, model=MODEL_CODE)
        except Exception as e:
            return f"Erreur IA : {e}"