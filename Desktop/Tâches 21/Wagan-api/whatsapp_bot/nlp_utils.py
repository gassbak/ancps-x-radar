import json
import re
from decouple import config
from utils.ai_client import ask

def analyser_sentiment_global(messages_textes):
    """
    Analyse le sentiment GLOBAL et l'INTENTION d'une conversation complète.
    Utilise LLaMA 3.1 via Groq pour une analyse sémantique profonde du contexte métier.
    """
    if not messages_textes:
        return {'label': 'neutral', 'score': 0.5}

    # On prépare la conversation pour l'IA
    conversation = "\n".join([f"- {m}" for m in messages_textes])

    prompt_system = """Tu es un expert en qualification de leads pour le centre de formation Bakeli.
Ta mission est d'analyser cette conversation WhatsApp et de déterminer le statut du prospect BASÉ UNIQUEMENT SUR SON TOUT DERNIER MESSAGE.

RÈGLES MÉTIER DE CLASSIFICATION :
1. "positive" (PROSPECT CHAUD / CONVERTION) : Le prospect exprime une intention claire de s'inscrire, demande comment payer, ou confirme son choix de formation.
2. "neutral" (DÉCOUVERTE / FROID) : Le prospect dit bonjour, pose des questions, ou cherche des infos. C'est l'état normal d'une discussion.
3. "negative" (ALERTE HUMAINE / PERDU) : Le prospect exprime une plainte forte, OU un désintérêt définitif (ex: "ça ne m'intéresse plus", "les horaires ne conviennent pas").

RÈGLE D'OR : L'historique n'est là que pour le contexte. Le label final DOIT refléter l'intention du DERNIER message. Si le dernier message est "Bonjour", le statut est "neutral", même s'il était mécontent hier.

Réponds UNIQUEMENT au format JSON avec cette structure exacte :
{"label": "positive", "score": 0.95}

Le champ 'label' doit être "positive", "neutral", ou "negative".
Le champ 'score' est ta confiance entre 0.0 et 1.0.
"""

    prompt_user = f"""CONVERSATION RÉCENTE DU PROSPECT:
{conversation}"""

    try:
        print("🧠 Appel à Bakeli AI pour analyse d'intention (Sentiment)...")
        reponse_texte = ask(
            messages=[
                {"role": "system", "content": prompt_system},
                {"role": "user", "content": prompt_user}
            ], 
            model="openai/gpt-oss-20b"
        )

        # Nettoyage d'éventuels blocs markdown retournés par le LLM
        reponse_texte = reponse_texte.strip()
        if reponse_texte.startswith("```json"):
            reponse_texte = reponse_texte[7:]
        if reponse_texte.startswith("```"):
            reponse_texte = reponse_texte[3:]
        if reponse_texte.endswith("```"):
            reponse_texte = reponse_texte[:-3]
            
        data = json.loads(reponse_texte.strip())
        
        label = data.get('label', 'neutral').lower()
        if label not in ['positive', 'neutral', 'negative']:
            label = 'neutral'

        score = float(data.get('score', 0.5))

        # On filtre les faux positifs : un score trop bas sur un "negative" devient "neutral"
        if label == 'negative' and score < 0.72:
            label = 'neutral'
            
        print(f"📊 Résultat Intention: {label} (confiance: {score})")
        return {'label': label, 'score': score}

    except Exception as e:
        print(f"❌ Erreur Groq IA Sentiment: {e}")
        # Logique de secours basique par mots-clés sur le DERNIER message uniquement
        texte_complet = messages_textes[-1].lower() if messages_textes else ""

        mots_negatifs_graves = ['escroc', 'arnaque', 'rembourser', 'remboursement', 'plainte', 'incompétent', 'honte', 'intéresse plus', 'pas satisfait', 'laisse tomber', 'plus intéressé', 'au revoir']
        mots_positifs = ['oui', 'inscription', 'payer', 'comment', 'intéressé', 'super', 'génial', 'commencer', 'je veux le faire', 'prix']
        
        if any(mot in texte_complet for mot in mots_negatifs_graves):
            return {'label': 'negative', 'score': 0.8}
        if any(mot in texte_complet for mot in mots_positifs):
            return {'label': 'positive', 'score': 0.8}
            
        return {'label': 'neutral', 'score': 0.5}

def analyser_message_whatsapp(texte):
    """
    Rétrocompatibilité si appelée individuellement.
    """
    return analyser_sentiment_global([texte])