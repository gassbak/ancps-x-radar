import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from bakeli_learning.serializers.chatbot import ConversationPairsSerializer, SendMessagePairsResponseSerializer
from chatbot.serializers import ChatResponseSerializer
from ..models import ChatSession, Message
from ..serializers import ChatSessionSerializer, MessageSerializer
import requests
from chatbot.constantes.constante import WAGAN_PERSONA,client
from dotenv import load_dotenv

load_dotenv()

class StartChatSession(APIView):
    def post(self, request):
        session = ChatSession.objects.create()
        return Response({"session_id": str(session.session_id)})

class ChatMessage(APIView):
    def post(self, request, session_id):
        try:
            session = ChatSession.objects.get(session_id=session_id)
        except ChatSession.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        user_input = request.data.get("message")
        if not user_input:
            return Response({"error": "Message is required."}, status=400)
        
        #Commande spéciale pour réinitialiser une session
        if user_input.strip().lower() == "/reset":
            session.messages.all().delete()
            return Response({"message": "La session a été réinitialisée."}, status=status.HTTP_200_OK)

        # Enregistrer le message utilisateur
        msg_user = Message.objects.create(session=session, sender="user", content=user_input)

        # Appel à l'API Gemini (ou autre LLM)
        response_text = self.get_bot_response(user_input, session)

        # Enregistrer réponse bot
        msg_bot = Message.objects.create(session=session, sender="bot", content=response_text)

        #return Response({
        #    "user_message": MessageSerializer(msg_user).data,
        #    "bot_message": MessageSerializer(msg_bot).data
        #})
        # 5) renvoyer l’historique groupé par paires
        qs = Message.objects.filter(session=session).order_by("timestamp", "id")
        pairs = []
        current_user = None
        for m in qs:
            if m.sender == "user":
                if current_user is not None:
                    pairs.append({"user": MessageSerializer(current_user).data, "bot": None})
                current_user = m
            elif m.sender == "bot":
                if current_user is None:
                    pairs.append({"user": None, "bot": MessageSerializer(m).data})
                else:
                    pairs.append({
                        "user": MessageSerializer(current_user).data,
                        "bot":  MessageSerializer(m).data
                    })
                    current_user = None

        if current_user is not None:
            pairs.append({"user": MessageSerializer(current_user).data, "bot": None})

        return Response(pairs) 
        #return Response(SendMessagePairsResponseSerializer(payload).data, status=200)
        #return Response({
        #    "user_message": MessageSerializer(msg_user).data,
        #    "bot_message": MessageSerializer(msg_bot).data
        #})

    def get_bot_response(self, prompt: str, session):
        API_KEY = os.getenv("GOOGLE_API_KEY")

        GENERATION_CONFIG = {
            "max_output_tokens": 256,
            "temperature": 0.6,
            "top_p": 0.9,
            "candidate_count": 1,
            "response_mime_type": "text/plain",
        }

        # 1) Connaissances statiques / persona
        static_knowledge = (
            "Bienvenue sur notre site !\n"
            "Nous proposons :\n"
            "- Développement d'applications web\n"
            "- Formations en intelligence artificielle\n"
            "- Formations Analyse de Données\n"
            "- Service client 24h/24\n"
        )

        persona = WAGAN_PERSONA  # garde ta constante

        # 3) Contenus Gemini: system_instruction + historique minimal
        system_instruction = (
            f"{persona}\n\n"
            "Tu réponds en français, de façon claire et concise. Maximum 25 mots\n"
            "Contexte fixe de l'organisation: "
            "Développement d'apps web, formations IA et Data, support 24/7."
        )

        # 2) Contexte dynamique externe (optionnel)
        api_context = ""
        try:
            api_response = requests.get("https://api.exemple.com/infos-actuelles", timeout=5)
            if api_response.status_code == 200:
                data = api_response.json()
                api_context = f"Informations du jour : {data.get('infos', 'non disponible')}"
        except Exception:
            api_context = "Aucune information dynamique disponible pour le moment."

        # 3) Construire l'historique multi-tours (dernier N)
        N = 8  # ajuste selon ta limite de tokens
        past = list(session.messages.order_by("-timestamp")[:N])[::-1]  # oldest→newest

        # 4) Construire les contents au format Gemini (rôles + parts)
        #    On met le "brief" (persona + statique + contexte API) au tout début comme consigne.
        limit_instruction = (
        "Réponds en UNE SEULE phrase, au maximum 20 mots. "
        "N’ajoute pas d’explications, pas de liste, pas d’emoji."
        )
        contents = [
            {
                "role": "user",
                "parts": [
                    {"text": limit_instruction},
                    {
                        "text": (
                            "Contexte et persona (réponds en français, clair et concis) Donne au maximum 20 mots :\n"
                            f"{persona}\n\n"
                            f"{static_knowledge}\n"
                            f"{api_context}\n"
                            )
                    }
                ]
            }
        ]

        # Historique
        for msg in past:
            if msg.sender == "user":
                contents.append({"role": "user",  "parts": [{"text": msg.content}]})
            else:
                contents.append({"role": "model", "parts": [{"text": msg.content}]})

        # Dernier message utilisateur (celui reçu en paramètre)
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        # 5) Appel Gemini avec l'historique
        try:
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
            )
            text = (resp.text or "").strip()
            return text if text else "Désolé, je n'ai pas pu générer de réponse."
        except Exception as e:
            # Ne retourne pas un Response DRF ici — remonte un message simple
            return f"Désolé, erreur lors de l'appel au modèle : {e}"

