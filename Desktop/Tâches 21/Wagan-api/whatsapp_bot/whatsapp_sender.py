import json
import requests
from django.conf import settings

VERSION = "v21.0"


def send_whatsapp_message(phone_number, message_text):
    """
    Envoie un message WhatsApp via l'API Meta.
    """
    url = f"https://graph.facebook.com/{VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {
            "body": message_text
        }
    }

    try:
        print(f"📤 Envoi WhatsApp vers {phone_number} (v{VERSION})")
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        print(f"📥 Réponse Meta status={response.status_code}: {response.text}")

        if response.status_code not in [200, 201]:
            print("❌ Envoi WhatsApp échoué: statut non 2xx")
            return {"error": response.text, "status_code": response.status_code}

        return response.json()
    except Exception as e:
        print(f"❌ Erreur envoi WhatsApp: {e}")
        return {"error": str(e)}

def envoyer_boutons_amorce(phone_number):
    """
    Envoie un menu interactif avec 3 boutons pour guider l'utilisateur.
    """
    url = f"https://graph.facebook.com/{VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone_number,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {
                "text": "Bienvenue chez WORK.BAKELI.TECH ! ✨\nJe suis l'Assistant Bakeli 👋\nComment puis-je vous accompagner aujourd'hui ?"
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {"id": "btn_former", "title": "🚀 Je veux me former"}
                    },
                    {
                        "type": "reply",
                        "reply": {"id": "btn_question", "title": "❓ J'ai une question"}
                    },
                    {
                        "type": "reply",
                        "reply": {"id": "btn_rappel", "title": "📞 Être rappelé(e)"}
                    }
                ]
            }
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        return response.json()
    except Exception as e:
        print(f"❌ Erreur envoi boutons WhatsApp: {e}")
        return {"error": str(e)}
