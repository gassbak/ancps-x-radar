import requests
from django.conf import settings

# Clés Meta API — lues depuis Django settings
VERSION = "v21.0"
TOKEN = settings.WHATSAPP_TOKEN
PHONE_NUMBER_ID = settings.WHATSAPP_PHONE_NUMBER_ID

def envoyer_alerte_whatsapp(message_alerte, numero_admin):
    """Envoie une alerte par WhatsApp à l'admin."""
    url = f"https://graph.facebook.com/{VERSION}/{PHONE_NUMBER_ID}/messages"

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": numero_admin,
        "type": "text",
        "text": {
            "body": message_alerte
        }
    }

    response = requests.post(url, headers=headers, json=payload, timeout=10)

    # === DEBUG META API ===
    print(f"--- DEBUG META API ---")
    print(f"URL appelée: {url}")
    print(f"Numéro destinataire: {numero_admin}")
    print(f"Status Code: {response.status_code}")
    print(f"Réponse Meta: {response.text}")
    print(f"-----------------------")

    if response.status_code not in [200, 201]:
        raise Exception(f"Erreur Meta (Status {response.status_code}): {response.text}")

    return response.json()

if __name__ == "__main__":
    response = envoyer_alerte_whatsapp("Test réussi !", "221776746609")
    print(f"Réponse : {response}")