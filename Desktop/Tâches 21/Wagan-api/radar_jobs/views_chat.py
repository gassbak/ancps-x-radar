"""Vue chat RAG (Radar AI) : recherche floue sur le CSV + Groq."""
import ast
import json
import logging
import os

import pandas as pd
from django.conf import settings
from django.http import JsonResponse
from rapidfuzz import process, fuzz
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny

from radar_jobs.services.jobs_store import load_jobs_df as load_jobs_df_cached
from radar_jobs.utils.ai_client import ask
from radar_jobs.views_helpers import (
    _resolve_ai_model,
    clean_df_for_json,
    expand_query,
    is_empty_value,
)

logger = logging.getLogger(__name__)

# Cache simple en mémoire pour éviter de retaper Groq sur même requête (5 min)
_CHAT_CACHE = {}
_CHAT_CACHE_TTL = 300  # secondes

TECH_KEYWORDS = ['dev', 'développeur', 'developpeur', 'informatique', 'data', 'software', 'programmeur', 'cloud', 'web', 'mobile']
TECH_TITLE_PATTERN = 'develop|développ|informatic|data|software|cloud|technicien en informatique|technicien\\(ne\\) en informatique|numérique|programmeur'


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def chat_view(request):
    try:
        body = request.data
        messages = body.get("messages", [])

        # Debug: logger le format reçu
        logger.info(f"Chat request - Body keys: {list(body.keys()) if isinstance(body, dict) else 'not dict'}")
        logger.info(f"Chat request - Messages count: {len(messages)}")

        # Gérer différents formats de messages
        if not messages:
            message = body.get("message", "") or body.get("query", "") or body.get("content", "")
            if message:
                messages = [{"role": "user", "content": message}]
            else:
                return JsonResponse({"error": "Aucun message fourni"}, status=400)

        user_query = messages[-1].get("content", "") if isinstance(messages[-1], dict) else str(messages[-1])
        if not user_query:
            return JsonResponse({"error": "Le message est vide"}, status=400)

        logger.info(f"User query: {user_query}")
        expanded_query_str = expand_query(user_query)

        # Stratégie de RAG (Fuzzy Search)
        context_jobs = "Aucun job spécifique trouvé pour cette recherche dans la base de données actuelle."
        market_metadata = "Aucune donnée statistique globale disponible."

        df = None
        if os.path.exists(settings.PROCESSED_FILE):
            try:
                df = load_jobs_df_cached()
            except Exception as e:
                logger.error(f"Erreur lors de la lecture du CSV: {e}")

        if df is not None:
            df = clean_df_for_json(df)

            # Stats globales
            total_jobs = len(df)
            last_scraped = df['scraped_date'].max() if 'scraped_date' in df.columns else "N/A"
            sector_dist = df['sector'].value_counts().to_dict() if 'sector' in df.columns else {}
            location_dist = df['location'].value_counts().to_dict() if 'location' in df.columns else {}
            edu_dist = df['min_education'].value_counts().to_dict() if 'min_education' in df.columns else {}
            contract_dist = df['contract_type'].value_counts().to_dict() if 'contract_type' in df.columns else {}

            if 'min_exp' in df.columns:
                valid_exp = pd.to_numeric(df['min_exp'], errors='coerce').dropna()
                avg_exp = round(valid_exp.mean(), 1) if not valid_exp.empty else "N/A"
            else:
                avg_exp = "N/A"

            # Allégé pour économiser les tokens Groq
            top_sectors = dict(list(sector_dist.items())[:3]) if sector_dist else {}
            top_locations = dict(list(location_dist.items())[:3]) if location_dist else {}
            market_summary = {
                "total_offers": total_jobs,
                "data_freshness": f"Dernière mise à jour le {last_scraped}",
                "top_sectors": top_sectors,
                "top_locations": top_locations,
            }
            market_metadata = json.dumps(market_summary, ensure_ascii=False)

            # Recherche : pré-filtre + classement par mots-clés si la requête est
            # ciblée (tech), fuzzy pondéré sinon. Le fuzzy seul sur requête
            # élargie donne du bruit (ex. "Poste De Gerant" pour "développeurs").
            df_search = df.fillna("")
            query_low = user_query.lower()
            use_keyword_ranking = any(k in query_low for k in TECH_KEYWORDS)
            relevant_indices = []

            if use_keyword_ranking:
                df_search = df_search[
                    df_search['title'].str.lower().str.contains(TECH_TITLE_PATTERN, na=False)
                    | (df_search['sector'].str.lower() == 'informatique')
                ]
                if not df_search.empty:
                    # Score = nb de mots-clés tech dans le titre (+ bonus entreprise connue)
                    def _tech_rank(row):
                        t = f" {str(row.get('title', '')).lower()} "
                        score = sum(1 for k in ('develop', 'développ', 'informatic', 'data', 'software', 'cloud', 'programmeur') if k in t)
                        if str(row.get('company', '')).strip().lower() not in ('', 'nan', 'non spécifiée', 'non spécifié'):
                            score += 1
                        if str(row.get('key_skills', '')).strip().lower() not in ('', 'nan'):
                            score += 1
                        return score
                    ranked = sorted(
                        ((idx, _tech_rank(row)) for idx, row in df_search.iterrows()),
                        key=lambda t: t[1], reverse=True,
                    )
                    relevant_indices = [idx for idx, s in ranked if s > 0][:10]

            if not relevant_indices:
                search_corpus = (
                    df_search['title'].fillna("") + " " +
                    df_search['sector'].fillna("") + " " +
                    df_search['key_skills'].fillna("") + " " +
                    df_search['location'].fillna("")
                ).tolist()

                fuzzy_results = process.extract(expanded_query_str, search_corpus, scorer=fuzz.token_set_ratio, limit=10)
                # Seuil 45 : en dessous c'est du bruit
                scored = sorted(((res[2], res[1]) for res in fuzzy_results if res[1] > 45), key=lambda t: t[1], reverse=True)
                relevant_indices = [df_search.index[i] for i, _ in scored]

            if not relevant_indices:
                # Pas de fallback récent -> laisse vide pour réponse "0 offre"
                pass

            if relevant_indices:
                filtered_df = df.loc[relevant_indices].copy()
                # Dedupe sur offer_url et titre+entreprise avant de limiter à 10
                if 'offer_url' in filtered_df.columns:
                    filtered_df = filtered_df.drop_duplicates(subset='offer_url', keep='first')
                if 'title' in filtered_df.columns and 'company' in filtered_df.columns:
                    filtered_df = filtered_df.drop_duplicates(subset=['title','company'], keep='first')
                filtered_df = filtered_df.head(10)

                # Enrichissement Front
                if 'coordinates' in filtered_df.columns:
                    filtered_df['coordinates'] = filtered_df['coordinates'].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) and x.startswith('[') else x)
                if 'key_skills' in filtered_df.columns:
                    filtered_df['key_skills'] = filtered_df['key_skills'].apply(lambda x: [s.strip() for s in x.split(',')] if isinstance(x, str) else x)

                cols_context = ['title', 'company', 'location', 'contract_type', 'key_skills', 'offer_url']
                available_cols = [c for c in cols_context if c in filtered_df.columns]
                records = filtered_df[available_cols].to_dict(orient='records')
                # Retire les champs "Non spécifié"/vides du contexte : le LLM ne doit
                # plus les afficher, seulement omettre la ligne correspondante
                cleaned_records = []
                for rec in records:
                    cleaned_records.append({k: v for k, v in rec.items() if not is_empty_value(v)})
                context_jobs = json.dumps(cleaned_records, ensure_ascii=False)

        # Compte réel pour header (évite 0 vs 4)
        try:
            _offer_count = len(filtered_df) if 'filtered_df' in locals() and filtered_df is not None else 0
        except:
            _offer_count = 0

        system_prompt = f"""Tu es l'Expert Analyste de 'Sénégal Job IA'. Tu aides les candidats à trouver des opportunités au Sénégal.

### STATISTIQUES DU MARCHÉ
{market_metadata}

### OFFRES DISPONIBLES ({_offer_count} offres)
{context_jobs}

### FORMAT DE RÉPONSE POUR LES RECHERCHES D'OFFRES
Quand l'utilisateur cherche des offres, utilise EXACTEMENT ce format :

🎯 **{_offer_count} offres trouvées** pour « [terme recherché] »

Puis pour CHAQUE offre réelle dans OFFRES DISPONIBLES, utilise ce format (remplace les valeurs par le JSON, ne copie pas l'exemple ; OMETS toute ligne dont le champ est absent du JSON) :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Ingénieur Cloud Infrastructure**
🏢 Stellarix • 📍 Dakar
💰 Stage
🔑 Compétences : Cloud, Data
🔗 https://www.emploidakar.com/offre-demploi/ingenieur-cloud-infrastructure/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Termine par une phrase d'accroche avec un emoji.

### RÈGLES STRICTES
- Utilise des emojis pour chaque section (📌🏢📍💰🔑🔗)
- Mets les titres en gras
- Sépare visuellement chaque offre avec des lignes
- Reste pro et percutant
- INTERDIT d'afficher [Titre], [Type de contrat], [Entreprise], [Ligne], [Expérience requise], [Niveau d'études] ou [compétences] entre crochets.
- INTERDIT d'afficher "Non spécifié" : si un champ est absent du JSON, OMETS simplement la ligne (ex. pas de ligne 🔑 s'il n'y a pas de compétences).
- INTERDIT d'inventer une carte template. N'affiche qu'une carte par offre réelle listée dans OFFRES DISPONIBLES, en reprenant exactement ses champs JSON.
- Si aucune offre n'est trouvée, propose des alternatives (secteur similaire, région élargie)
"""
        # Cache 5 min par query normalisée
        import time
        _cache_key = user_query.lower().strip()[:80]
        _cached = _CHAT_CACHE.get(_cache_key)
        if _cached and (time.time() - _cached[0] < _CHAT_CACHE_TTL):
            logger.info(f"Cache hit for: {_cache_key}")
            return JsonResponse({"response": _cached[1]})

        # Follow-up "comment postuler" -> réponse directe sans IA (évite 429)
        _q_low = user_query.lower().strip()
        if any(k in _q_low for k in ["comment postuler", "comment candidater", "ou postuler", "où postuler", "candidature"]):
            urls = []
            try:
                if 'filtered_df' in locals() and filtered_df is not None and not filtered_df.empty and 'offer_url' in filtered_df.columns:
                    urls = filtered_df['offer_url'].dropna().tolist()[:3]
            except:
                pass
            if urls:
                links = "\n".join([f"🔗 {u}" for u in urls])
                resp_text = f"Pour postuler, clique sur le lien de l'offre :\n{links}\n\nPuis dépose ton CV sur le site de l'entreprise. Besoin d'aide pour ton CV ? 🚀"
            else:
                resp_text = "👉 Clique sur 🔗 [Voir l'offre & candidater] sur la carte de l'offre, puis dépose ton CV sur le site. Besoin d'aide CV ? 🚀"
            return JsonResponse({"response": resp_text})

        full_messages = [{"role": "system", "content": system_prompt}] + messages

        import re

        try:
            logger.info(f"Calling ask with {len(full_messages)} messages")
            raw_response = ask(full_messages, model=_resolve_ai_model())

            # Nettoyer les balises <think>...</think> (gère aussi balise non fermée)
            clean_response = re.sub(r'<think[^>]*>.*?</think>', '', raw_response, flags=re.DOTALL | re.IGNORECASE).strip()
            # Si <think> sans fermeture (troncature), coupe depuis <think> jusqu'au premier 🎯
            if '<think' in clean_response.lower():
                idx = clean_response.lower().find('<think')
                j = clean_response.find('🎯', idx)
                if j != -1:
                    clean_response = clean_response[j:].strip()
                else:
                    clean_response = re.sub(r'<think.*', '', clean_response, flags=re.DOTALL | re.IGNORECASE).strip()
            # Fallback réflexion sans balises
            if clean_response.startswith("Here's a thinking") or clean_response.startswith("Here is a thinking"):
                idx = clean_response.find("🎯")
                if idx != -1:
                    clean_response = clean_response[idx:].strip()

            logger.info(f"Response length: {len(raw_response)}, clean: {len(clean_response)}")
            # Met en cache 5 min
            _CHAT_CACHE[_cache_key] = (time.time(), clean_response)
            return JsonResponse({"response": clean_response})
        except Exception as api_error:
            err_str = str(api_error)
            # 429 Rate Limit -> fallback local sans IA pour ne pas bloquer l'utilisateur
            if "RATE_LIMIT" in err_str or getattr(api_error, "status_code", None) == 429:
                retry_after = getattr(api_error, "retry_after", "20")
                if ":" in err_str:
                    try:
                        retry_after = err_str.split(":")[1].strip()
                    except:
                        pass
                logger.warning(f"Rate limit 429, fallback local, Retry-After: {retry_after}")
                # Fallback : renvoie les offres directement sans passer par Groq
                if 'filtered_df' in locals() and filtered_df is not None and not filtered_df.empty:
                    fallback_lines = [f"🎯 **{len(filtered_df)} offres trouvées** pour « {user_query} »\n"]
                    for _, row in filtered_df.iterrows():
                        fallback_lines.append(
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            f"📌 **{row.get('title','Non spécifié')}**\n"
                            f"🏢 {row.get('company','Non spécifiée')} • 📍 {row.get('location','Non spécifié')}\n"
                            f"💰 {row.get('contract_type','Non spécifié')}\n"
                            f"🔗 {row.get('offer_url','')}\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                        )
                    fallback_text = "\n".join(fallback_lines) + "\n\n💡 Astuce : clique sur 🔗 pour postuler 🚀"
                    _CHAT_CACHE[_cache_key] = (time.time(), fallback_text)
                    return JsonResponse({"response": fallback_text})
                # Si pas d'offres, renvoie 429 classique
                resp = JsonResponse({"error": "IA saturée, réessaie dans quelques secondes", "retry_after": int(retry_after)}, status=429)
                resp["Retry-After"] = str(retry_after)
                return resp
            logger.error(f"API error: {api_error}")
            return JsonResponse({"error": f"Erreur lors de la génération: {str(api_error)}"}, status=500)

    except Exception as e:
        logger.error(f"Error in chat view: {e}")
        return JsonResponse({"error": str(e)}, status=500)
