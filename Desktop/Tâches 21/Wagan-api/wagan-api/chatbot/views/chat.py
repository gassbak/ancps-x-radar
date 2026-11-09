# coding: utf-8
import os
from django.conf import settings
from rest_framework.response import Response
from django.shortcuts import render
from rest_framework import views, serializers, status

from chatbot.serializers import ChatInputSerializer, ChatResponseSerializer, DocumentUploadSerializer

from ..constantes.constante import WAGAN_PERSONA
from utils.ai_client import ask


class ChatView(views.APIView):
    """
    Vue pour gérer les interactions de chat avec le chatbot Wagan.
    """

    def post(self, request):
        """
        Gère les requêtes POST pour envoyer des messages au chatbot et obtenir des réponses.
        """
        serializer = ChatInputSerializer(data=request.data)

        if serializer.is_valid():
            message = serializer.validated_data["message"]

            # 🧠 Construction des messages (format OpenAI-like)
            messages = [
                {"role": "system", "content": WAGAN_PERSONA},
                {"role": "user", "content": message},
            ]

            try:
                # 🔥 Appel à ton IA (Ollama / Bakeli AI)
                response_text = ask(messages)

                response_serializer = ChatResponseSerializer({
                    "response": response_text
                })

                return Response(response_serializer.data, status=status.HTTP_200_OK)

            except Exception as e:
                return Response(
                    {
                        "error": f"Erreur lors de la communication avec le modèle IA : {str(e)}"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)