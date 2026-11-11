import requests
from django.conf import settings
import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Modèle Groq — source centrale = Django settings (résolu à chaque appel)
def _resolve_model():
    try:
        return (
            os.getenv("GROQ_MODEL")
            or getattr(settings, "GROQ_MODEL", None)
            or os.getenv("BAKELI_AI_MODEL")
            or getattr(settings, "BAKELI_AI_MODEL", None)
            or "qwen/qwen3.8-27b"
        )
    except Exception:
        return os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")


GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")  # compat import

def _fallback_models(primary: str) -> list:
    try:
        fallbacks = list(getattr(settings, "GROQ_FALLBACK_MODELS", []) or [])
    except Exception:
        fallbacks = []
    return [m for m in [primary, *fallbacks] if m]


def ask(messages: list, model: str = None) -> str:
    """Envoie une conversation, retourne la réponse complète depuis Groq."""
    if model is None:
        model = _resolve_model()

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        return "Désolé, la clé API n'est pas configurée."

    last_error = None
    for attempt_model in _fallback_models(model):
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={"model": attempt_model, "messages": messages},
                timeout=60,
            )
            if resp.status_code == 200:
                if attempt_model != model:
                    logger.warning(f"Groq modèle principal '{model}' indisponible, repli sur '{attempt_model}'")
                return resp.json()["choices"][0]["message"]["content"]
            elif resp.status_code == 429:
                retry_after = resp.headers.get("Retry-After", "20")
                err = Exception(f"RATE_LIMIT:{retry_after}")
                err.status_code = 429
                err.retry_after = retry_after
                raise err
            elif resp.status_code == 404 and "model_not_found" in resp.text:
                logger.warning(f"Groq modèle '{attempt_model}' introuvable, essai du suivant")
                last_error = f"Erreur API (code {resp.status_code})"
                continue
            else:
                return f"Erreur API (code {resp.status_code})"
        except Exception as e:
            if "RATE_LIMIT" in str(e) or getattr(e, "status_code", None) == 429:
                raise
            logger.error(f"Erreur dans ask: {e}")
            return "Désolé, une erreur est survenue."
    return last_error or "Désolé, une erreur est survenue."

def ask_stream(messages: list, model: str = None):
    """
    Stream la réponse depuis Groq directement.
    """
    if model is None:
        model = _resolve_model()

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        msg = "Désolé, la clé API n'est pas configurée."
        yield f"data: {json.dumps(msg)}\n\n"
        return

    try:
        # Appel direct à Groq
        groq_resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
            json={"model": _resolve_model(), "messages": messages, "stream": True},
            timeout=60,
            stream=True
        )
        
        logger.info(f"Groq response status: {groq_resp.status_code}")
        
        if groq_resp.status_code == 429:
            retry_after = groq_resp.headers.get("Retry-After", "20")
            logger.warning(f"Groq rate limit 429, Retry-After: {retry_after}")
            yield f"data: {json.dumps(f'RATE_LIMIT:{retry_after}')}\n\n"
            return
        if groq_resp.status_code == 200:
            for line in groq_resp.iter_lines():
                if line:
                    try:
                        data = line.decode()
                        if data.startswith("data: "):
                            json_str = data[6:]
                            if json_str.strip() == "[DONE]":
                                continue
                            chunk = json.loads(json_str)
                            if chunk.get("choices"):
                                content = chunk["choices"][0].get("delta", {}).get("content", "")
                                if content:
                                    yield f"data: {json.dumps(content)}\n\n"
                    except (json.JSONDecodeError, UnicodeDecodeError) as e:
                        logger.debug(f"Parse error: {e}")
                        continue
        else:
            error_msg = f"Erreur API Groq (code {groq_resp.status_code})"
            logger.error(f"Groq error: {groq_resp.text[:500]}")
            yield f"data: {json.dumps(error_msg)}\n\n"
            
    except Exception as e:
        logger.error(f"Erreur dans ask_stream: {e}")
        yield f"data: {json.dumps('Désolé, une erreur est survenue.')}\n\n"

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
