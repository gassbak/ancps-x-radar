import io
import re
import json
import os
import hashlib
import logging
import time
from typing import Optional, Dict, Any

from dotenv import load_dotenv
load_dotenv()

import requests
import PyPDF2
from docx import Document
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class SimpleCache:
    """Cache simple avec TTL (max 128 entrées, TTL 24h)."""
    def __init__(self, maxsize=128, ttl=86400):
        self._cache = {}
        self._maxsize = maxsize
        self._ttl = ttl
    
    def __contains__(self, key):
        if key in self._cache:
            entry = self._cache[key]
            if time.time() - entry['time'] < self._ttl:
                return True
            del self._cache[key]
        return False
    
    def __getitem__(self, key):
        if key in self._cache:
            entry = self._cache[key]
            if time.time() - entry['time'] < self._ttl:
                return entry['value']
            del self._cache[key]
        raise KeyError(key)
    
    def __setitem__(self, key, value):
        if len(self._cache) >= self._maxsize:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k]['time'])
            del self._cache[oldest_key]
        self._cache[key] = {'value': value, 'time': time.time()}
    
    def __len__(self):
        return len(self._cache)


# Cache pour les analyses (128 entrées max, TTL 24h)
analysis_cache = SimpleCache(maxsize=128, ttl=86400)

# Configuration IA - source centrale = Django settings (résolue à chaque appel,
# pas à l'import, pour prendre en compte les changements d'env sans restart).
def _resolve_api_key():
    try:
        from django.conf import settings as dj_settings
        return (
            os.getenv("GROQ_API_KEY")
            or getattr(dj_settings, "GROQ_API_KEY", None)
            or os.getenv("BAKELI_AI_KEY")
            or getattr(dj_settings, "BAKELI_AI_KEY", None)
        )
    except Exception:
        return os.getenv("GROQ_API_KEY") or os.getenv("BAKELI_AI_KEY")


def _resolve_model():
    try:
        from django.conf import settings as dj_settings
        return (
            os.getenv("GROQ_MODEL")
            or getattr(dj_settings, "GROQ_MODEL", None)
            or os.getenv("BAKELI_AI_MODEL")
            or getattr(dj_settings, "BAKELI_AI_MODEL", None)
            or "qwen/qwen3.8-27b"
        )
    except Exception:
        return os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")


def _resolve_endpoint():
    try:
        from django.conf import settings as dj_settings
        return getattr(dj_settings, "GROQ_ENDPOINT", None) or "https://api.groq.com/openai/v1/chat/completions"
    except Exception:
        return "https://api.groq.com/openai/v1/chat/completions"


# Compat ascendante : constantes lues à l'import (peuvent être périmées si env change)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
BAKELI_AI_KEY = os.getenv("BAKELI_AI_KEY")
API_KEY = GROQ_API_KEY or BAKELI_AI_KEY
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")


def normalize_score(value) -> int:
    """Normalise le score LLM en entier 0-100 (garde-fou avant sauvegarde)."""
    try:
        score = int(float(value))
    except (TypeError, ValueError):
        return 0
    return max(0, min(100, score))


def extract_text_from_file(file_bytes: io.BytesIO, filename: str) -> str:
    """
    Extrait le texte d'un fichier (PDF, DOCX, TXT, MD).
    Fonction universelle adaptée du projet cv-scoring-fastapi.
    """
    fname_lower = filename.lower()
    try:
        if fname_lower.endswith('.pdf'):
            reader = PyPDF2.PdfReader(file_bytes)
            return "\n".join([
                page.extract_text() 
                for page in reader.pages 
                if page.extract_text()
            ]).strip()
        elif fname_lower.endswith('.docx'):
            doc = Document(file_bytes)
            return "\n".join([
                paragraph.text 
                for paragraph in doc.paragraphs
            ]).strip()
        elif fname_lower.endswith(('.txt', '.md')):
            return file_bytes.read().decode('utf-8', errors='ignore').strip()
        else:
            raise ValueError(f"Format non supporté : {filename}")
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise ValueError(f"Erreur d'extraction sur '{filename}': {str(e)}")


def extract_json_from_text(text: str) -> Dict[str, Any]:
    """
    Extrait et parse un JSON depuis un texte (réponse de LLM).
    Gère les cas où le modèle ajoute du texte avant/après le JSON.
    """
    if not text:
        return {"error": "Texte vide"}
    
    text = text.strip()
    
    # Supprimer les balises markdown
    text = text.replace("```json", "").replace("```", "").strip()
    
    # Supprimer les balises thinking si présentes
    if "<think>" in text and "</think>" in text:
        import re
        text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
    
    # Essayer de parser directement
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Chercher un JSON dans le texte
    import re
    # Pattern pour trouver un objet JSON
    json_patterns = [
        r'\{[^{}]*\}',  # Simple object
        r'\{.*?\}',  # Any object (non-greedy)
        r'(\{[\s\S]*\})',  # Any object with newlines
    ]
    
    for pattern in json_patterns:
        matches = re.findall(pattern, text, re.DOTALL)
        for match in matches:
            try:
                parsed = json.loads(match)
                if isinstance(parsed, dict) and any(k in parsed for k in ['score', 'matching_analysis', 'description']):
                    return parsed
            except json.JSONDecodeError:
                continue
    
    # Dernier essai: essayer de nettoyer le texte
    try:
        # Supprimer tout avant le premier { et après le dernier }
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            cleaned = text[start:end+1]
            return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    
    return {"error": "Impossible d'extraire le JSON", "raw_text": text[:500]}


def generate_cache_key(cv_text: str, job_text: str) -> str:
    """Génère une clé MD5 unique basée sur le texte combiné du CV et de l'offre."""
    combined = f"{cv_text.strip()}|||{job_text.strip()}"
    return hashlib.md5(combined.encode('utf-8')).hexdigest()


def call_groq_api(prompt: str) -> Dict[str, Any]:
    """
    Appel à l'API Groq pour l'analyse CV/Offre.
    Modèle/clé/endpoint résolus à chaque appel depuis settings (source centrale).
    """
    api_key = _resolve_api_key()
    if not api_key:
        raise ValueError("Aucune clé API configurée (GROQ_API_KEY ou BAKELI_AI_KEY)")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    def _fallback_models(primary: str):
        try:
            from django.conf import settings as dj_settings
            fallbacks = list(getattr(dj_settings, "GROQ_FALLBACK_MODELS", []) or [])
        except Exception:
            fallbacks = []
        return [m for m in [primary, *fallbacks] if m]

    models = _fallback_models(_resolve_model())
    last_error = None
    for attempt_model in models:
        payload = {
            "model": attempt_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 2000
        }

        try:
            response = requests.post(_resolve_endpoint(), headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                if attempt_model != models[0]:
                    logger.warning(f"Groq modèle principal '{models[0]}' indisponible, repli sur '{attempt_model}'")
                return response.json()
            if response.status_code == 404 and "model_not_found" in response.text:
                logger.warning(f"Groq modèle '{attempt_model}' introuvable, essai du suivant")
                last_error = f"Erreur Groq API (Code {response.status_code}): {response.text}"
                continue
            raise ValueError(f"Erreur Groq API (Code {response.status_code}): {response.text}")
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Erreur réseau Groq : {str(e)}")
    raise ValueError(last_error or "Aucun modèle Groq disponible")


def build_scoring_prompt(cv_text: str, job_text: str) -> str:
    """Construit le prompt pour l'analyse de correspondance CV/Offre."""
    return f"""Tu es un expert en recrutement. Analyse la correspondance entre ce CV et cette offre d'emploi.

CV:
{cv_text[:3000]}

OFFRE:
{job_text[:3000]}

IMPORTANT: Tu dois répondre UNIQUEMENT avec un objet JSON valide (pas de texte avant ou après, pas de markdown).

Voici le format exact attendu:
{{
  "matching_analysis": ["compétence1", "compétence2"],
  "description": "Analyse détaillée en 2-3 phrases",
  "score": 75,
  "recommendation": "Conseils concrets en 2-3 phrases"
}}

Règles:
- matching_analysis: liste des compétences EXACTEMENT IDENTIQUES entre le CV et l'offre. Si aucune, mets [].
- score: un nombre entier entre 0 et 100. Sois réaliste.
- description: analyse honnête de la correspondance.
- recommendation: conseils concrets pour améliorer la candidature.

Réponds UNIQUEMENT avec le JSON, rien d'autre."""


def analyze_cv_job_match(cv_text: str, job_text: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Analyse la correspondance entre un CV et une offre d'emploi.
    
    Args:
        cv_text: Texte extrait du CV
        job_text: Texte extrait de l'offre d'emploi
        use_cache: Utiliser le cache pour les analyses similaires
        
    Returns:
        Dict contenant score, matching_analysis, description, recommendation
    """
    # Vérification du cache
    cache_key = generate_cache_key(cv_text, job_text)
    if use_cache and cache_key in analysis_cache:
        logger.info(f"Analyse trouvée dans le cache pour la clé: {cache_key[:8]}...")
        return {
            "source": "cache",
            "result": analysis_cache[cache_key]
        }

    # Construction du prompt
    prompt = build_scoring_prompt(cv_text, job_text)
    
    # Appel API
    groq_response = call_groq_api(prompt)
    if "choices" not in groq_response:
        raise ValueError("Aucune réponse valide de l'API Groq")
    
    content = groq_response["choices"][0]["message"]["content"]
    extracted_json = extract_json_from_text(content)
    
    # Enregistrement dans le cache
    if use_cache:
        analysis_cache[cache_key] = extracted_json
    
    return {
        "source": "api_call",
        "result": extracted_json
    }


def analyze_cv_job_from_urls(cv_url: str, job_url: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Analyse la correspondance entre un CV et une offre d'emploi via URLs.
    
    Args:
        cv_url: URL du CV (PDF, DOCX, TXT)
        job_url: URL de l'offre (PDF, DOCX, TXT, ou page web)
        use_cache: Utiliser le cache
        
    Returns:
        Dict contenant le résultat de l'analyse
    """
    # Téléchargement du CV
    cv_response = requests.get(cv_url, timeout=30)
    if cv_response.status_code != 200:
        raise ValueError(f"Impossible de télécharger le CV depuis l'URL: {cv_url}")
    
    # Téléchargement de l'offre
    job_response = requests.get(job_url, timeout=30)
    if job_response.status_code != 200:
        raise ValueError(f"Impossible de télécharger l'offre depuis l'URL: {job_url}")

    # Extraction du texte du CV
    cv_text = extract_text_from_file(io.BytesIO(cv_response.content), cv_url)

    # Détermination du format de l'offre
    content_type = job_response.headers.get('content-type', '').lower()
    
    if 'pdf' in content_type or 'word' in content_type or job_url.lower().endswith(('.pdf', '.docx', '.txt', '.md')):
        job_text = extract_text_from_file(io.BytesIO(job_response.content), job_url)
    else:
        # Extraction de texte depuis une page web
        soup = BeautifulSoup(job_response.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.decompose()
        job_text = soup.get_text(separator="\n")
        job_text = '\n'.join([line.strip() for line in job_text.splitlines() if line.strip()])

    if not cv_text or not job_text:
        raise ValueError("Impossible d'extraire du contenu valide des URLs fournies.")

    # Analyse
    return analyze_cv_job_match(cv_text, job_text, use_cache=use_cache)
