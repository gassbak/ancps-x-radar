import requests
from django.conf import settings

import os

def ask(messages: list, model: str = "openai/gpt-oss-20b") -> str:
    """Envoie une conversation, retourne le texte de réponse avec un fallback automatique vers Groq direct."""
    try:
        # Essai avec l'API Bakeli AI
        resp = requests.post(
            f"{settings.BAKELI_AI_URL}/v1/chat",
            headers={"Authorization": f"Bearer {settings.BAKELI_AI_KEY}"},
            json={"model": model, "messages": messages},
            timeout=15, # Timeout réduit pour basculer rapidement si Bakeli est down
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]
    except Exception as e:
        print(f"⚠️ API Bakeli inaccessible ({e}), basculement vers Groq direct...")
        
        # Fallback de secours direct vers Groq
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return "Désolé, l'API est temporairement indisponible et la clé de secours n'est pas configurée."
            
        # Correspondance des modèles pour Groq
        groq_model = "llama-3.3-70b-versatile"
        
        groq_resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {groq_key}"},
            json={"model": groq_model, "messages": messages},
            timeout=30,
        )
        groq_resp.raise_for_status()
        return groq_resp.json()["choices"][0]["message"]["content"]

def ask_with_file(prompt: str, filepath: str, model: str = "llama3.2") -> str:
    """Envoie un fichier avec un prompt."""
    with open(filepath, "rb") as f:
        resp = requests.post(
            f"{settings.BAKELI_AI_URL}/v1/chat/file",
            headers={"Authorization": f"Bearer {settings.BAKELI_AI_KEY}"},
            data={"prompt": prompt, "model": model},
            files={"file": f},
            timeout=180,
        )
    return resp.json()["message"]["content"]