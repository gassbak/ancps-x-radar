import requests
import logging
from django.conf import settings
from .whatsapp_service import envoyer_alerte_whatsapp

logger = logging.getLogger(__name__)

def envoyer_alerte_discord(phone_number, message_text, sentiment_score, derniers_messages=None):
    """
    Envoie un Embed riche sur un salon Discord configuré via un Webhook.
    
    Args:
        phone_number (str): Le numéro WhatsApp du client.
        message_text (str): Le contenu du dernier message négatif.
        sentiment_score (float): Le score de sentiment négatif.
        derniers_messages (list): Facultatif, liste de l'historique récent de la conversation.
    """
    webhook_url = settings.DISCORD_WEBHOOK_URL
    if not webhook_url:
        logger.warning("⚠️ Discord Webhook non configuré (DISCORD_WEBHOOK_URL absent dans .env). Alerte Discord ignorée.")
        return False

    # Couleur Rouge de danger (Hex: #E74C3C -> Dec: 15158332)
    embed_color = 15158332
    
    # Construction du corps de l'embed
    embed = {
        "title": "🚨 ALERTE CLIENT MÉCONTENT (CRM Bot)",
        "description": "Une détérioration significative de l'humeur du client a été détectée par le module d'analyse locale de sentiment.",
        "color": embed_color,
        "fields": [
            {
                "name": "📱 Numéro de téléphone",
                "value": f"`{phone_number}`",
                "inline": True
            },
            {
                "name": "📊 Analyse Globale",
                "value": f"🔴 **Négatif** (Confiance: `{sentiment_score}`)",
                "inline": True
            },
            {
                "name": "💬 Dernier message reçu",
                "value": f"\"{message_text}\"",
                "inline": False
            }
        ],
        "footer": {
            "text": "Système d'Alerte WhatsApp-CRM • Résilience Active"
        }
    }

    # Intégration de l'historique récent si disponible
    if derniers_messages and len(derniers_messages) > 1:
        historique_str = ""
        for idx, msg in enumerate(derniers_messages, 1):
            # Tronquer les messages très longs
            msg_tronque = msg[:80] + "..." if len(msg) > 80 else msg
            # Mettre en valeur le dernier message
            prefix = "👉" if idx == len(derniers_messages) else "•"
            historique_str += f"{prefix} **Msg {idx}** : {msg_tronque}\n"
        
        embed["fields"].append({
            "name": "📜 Historique récent de la conversation",
            "value": historique_str,
            "inline": False
        })

    # Corps complet de la requête Webhook
    # Permet d'ajouter une mention discrète si souhaitée via l'env
    mention_str = getattr(settings, 'DISCORD_MENTION', '')
    payload = {
        "content": mention_str if mention_str else None,
        "embeds": [embed]
    }

    try:
        response = requests.post(webhook_url, json=payload, timeout=5)
        if response.status_code not in [200, 204]:
            logger.error(f"❌ Erreur lors de l'envoi Discord Webhook (Code: {response.status_code}): {response.text}")
            raise Exception(f"Discord API error status {response.status_code}")
        
        logger.info(f"✅ Alerte Discord envoyée avec succès pour le client {phone_number}.")
        return True
    except Exception as e:
        logger.exception(f"❌ Exception lors de l'envoi de l'alerte Discord: {e}")
        raise e
