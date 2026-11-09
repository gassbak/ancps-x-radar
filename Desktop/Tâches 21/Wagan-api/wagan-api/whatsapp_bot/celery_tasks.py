from celery import shared_task
from django.conf import settings
from .nlp_utils import analyser_message_whatsapp, analyser_sentiment_global
from .agent_brain import generer_reponse, generer_amorce
from .whatsapp_sender import send_whatsapp_message
from .models import Message



@shared_task(bind=True, max_retries=3, acks_late=True)
def process_message_async(self, phone_number, message_text, message_type, message_id, raw_webhook_data):
    """
    Tâche async: Analyse sentiment + génère réponse + envoie WhatsApp.

    Args:
        phone_number: Numéro WhatsApp du client
        message_text: Texte du message
        message_type: Type (text, image, video, etc.)
        message_id: UUID du message en DB
        raw_webhook_data: Données brutes du webhook
    """
    try:
        sentiment_label = None
        sentiment_score = None
        derniers_messages = None

        print(f"🔄 Traitement async commencé: {phone_number}")

        # 0. Vérifier si le message a déjà été traité (Concurrence / Retry Meta)
        message_obj = Message.objects.filter(id=message_id).first()
        if not message_obj:
            print(f"❌ Message introuvable au moment du traitement: {message_id}")
            return
        if message_obj.processed:
            print(f"⚠️  Message déjà traité (ignorer doublon): {message_id}")
            return

        # Verrouillage immédiat pour éviter les doublons de webhook
        message_obj.processed = True
        message_obj.save()

        # --- Commande de test pour le développeur ---
        if message_type == 'text' and message_text.strip().lower() == 'reset':
            Message.objects.filter(phone_number=phone_number).delete()
            send_whatsapp_message(phone_number, "🔄 Session réinitialisée. Vous pouvez envoyer un message pour tester l'amorce depuis zéro.")
            return

        # --- Amorce IA : premier message ou nouvelle session (après 12h d'inactivité)
        from django.utils import timezone
        from datetime import timedelta
        
        dernier_message_avant = Message.objects.filter(
            phone_number=phone_number,
            processed=True
        ).exclude(id=message_id).order_by('-timestamp').first()

        premier_message = False
        if not dernier_message_avant:
            premier_message = True
        elif (timezone.now() - dernier_message_avant.timestamp) > timedelta(hours=12):
            premier_message = True

        if premier_message and message_type == 'text':
            print(f"👋 Premier message détecté pour {phone_number} — envoi des boutons d'amorce")
            try:
                from .whatsapp_sender import envoyer_boutons_amorce
                envoyer_boutons_amorce(phone_number)
                Message.objects.create(
                    phone_number=phone_number,
                    message_text="Bonjour 👋, je suis l'Assistant Bakeli.\nPour quel métier ou domaine cherchez-vous une formation ?\n[Boutons: Je veux me former | J'ai une question | Être rappelé(e)]",
                    role='bot',
                    processed=True
                )
            except Exception as e:
                print(f"❌ Erreur envoi boutons amorce: {e}")
                # Ne JAMAIS laisser le prospect sans réponse : fallback texte.
                try:
                    reponse_secours = generer_amorce(message_text, phone_number)
                    send_whatsapp_message(phone_number, reponse_secours)
                    Message.objects.create(
                        phone_number=phone_number,
                        message_text=reponse_secours,
                        role='bot',
                        processed=True
                    )
                    print("✅ Fallback amorce texte envoyé")
                except Exception as e2:
                    print(f"❌ Fallback amorce texte impossible: {e2}")
            # L'amorce étant le point de sortie, le message reste 'processed'
            return  # Premier message traité par l'amorce, on s'arrête là

        # 1. Analyser sentiment GLOBAL (basé sur les 4 DERNIERS messages de la conversation)
        if message_type in ['text', 'interactive']:
            try:
                # Récupérer les 4 derniers messages texte du client pour cette conversation
                derniers_messages = list(
                    Message.objects.filter(
                        phone_number=phone_number,
                        message_text__isnull=False
                    ).exclude(
                        message_text=''
                    ).order_by('-timestamp')[:4].values_list('message_text', flat=True)
                )

                # Le message actuel (s'il n'est pas encore dans la liste) doit être en première position (le plus récent)
                if message_text not in derniers_messages:
                    derniers_messages.insert(0, message_text)

                # Inverser pour l'ordre chronologique à envoyer au LLM
                derniers_messages = derniers_messages[::-1]

                print(f"📊 Analyse sentiment sur les {len(derniers_messages)} dernier(s) message(s)")

                resultat_ia = analyser_sentiment_global(derniers_messages)
                sentiment_label = resultat_ia['label']
                sentiment_score = resultat_ia['score']
                print(f"📊 Sentiment GLOBAL: {sentiment_label} ({sentiment_score})")
            except Exception as e:
                print(f"❌ Erreur Sentiment Analysis: {e}. Valeurs par défaut appliquées.")
                sentiment_label = "neutral"
                sentiment_score = 0.5

        # 2. Générer réponse IA
        reponse_ia, is_panne = generer_reponse(
            message_utilisateur=message_text,
            numero_tel=phone_number,
            sentiment=sentiment_label,
            score=sentiment_score
        )
        print(f"🧠 Réponse IA générée: {len(reponse_ia)} chars")

        # 3. Envoyer réponse WhatsApp
        if reponse_ia:
            try:
                result = send_whatsapp_message(phone_number, reponse_ia)
                Message.objects.create(
                    phone_number=phone_number,
                    message_text=reponse_ia,
                    role='bot',
                    processed=True
                )
                print(f"📤 Message WhatsApp envoyé: {result}")
            except Exception as e:
                print(f"❌ Impossible d'envoyer le WhatsApp final: {e}")

        # 3.5. Déclenchement de la tâche d'alerte asynchrone découplée
        if is_panne:
            try:
                send_admin_alerts_async.delay(
                    phone_number=phone_number,
                    message_text=message_text,
                    sentiment_score=0.0,
                    derniers_messages=None,
                    is_panne=True
                )
                print(f"🚨 Tâche d'alerte PANNE IA planifiée pour le numéro {phone_number}")
            except Exception as e:
                print(f"❌ Impossible de planifier la tâche d'alerte panne: {e}")
        elif sentiment_label == 'negative':
            try:
                send_admin_alerts_async.delay(
                    phone_number=phone_number,
                    message_text=message_text,
                    sentiment_score=float(sentiment_score) if sentiment_score is not None else 0.5,
                    derniers_messages=derniers_messages,
                    is_panne=False
                )
                print(f"🚨 Tâche d'alerte asynchrone planifiée pour le client mécontent {phone_number}")
            except Exception as e:
                print(f"❌ Impossible de planifier la tâche d'alerte: {e}")

        # 4. Mettre à jour le message en DB avec son sentiment
        try:
            message_obj.sentiment_label = sentiment_label
            message_obj.sentiment_score = sentiment_score
            message_obj.save()
        except Exception as e:
            print(f"❌ Erreur lors de la mise à jour sentiment DB: {e}")

        print(f"✅ Message traité avec succès: {phone_number}")

    except Message.DoesNotExist:
        print(f"❌ Message non trouvé: {message_id}")
    except Exception as e:
        print(f"❌ Erreur traitement async: {e}")
        # Retry avec backoff exponentiel (3s, 6s, 12s)
        try:
            self.retry(exc=e, countdown=3 ** self.request.retries)
        except Exception as retry_e:
            print(f"❌ Retry échoué: {retry_e}")
            # Marquer comme erreur en DB
            try:
                message_obj = Message.objects.get(id=message_id)
                message_obj.processed = False
                message_obj.save()
            except:
                pass


@shared_task(bind=True, max_retries=3, acks_late=True)
def send_admin_alerts_async(self, phone_number, message_text, sentiment_score, derniers_messages=None, is_panne=False):
    """
    Tâche Celery pour envoyer les alertes sur WhatsApp et Discord de manière isolée et résiliente.
    """
    print(f"🚨 Début d'envoi des alertes pour {phone_number} (Panne={is_panne})...")
    whatsapp_error = None
    discord_error = None

    # 1. Envoi Alerte WhatsApp
    try:
        from .whatsapp_service import envoyer_alerte_whatsapp
        if is_panne:
            message_alerte = f"⚠️ *ALERTE PANNE IA*\nL'API Groq est injoignable.\nLe bot a utilisé le message de secours pour le numéro: {phone_number}\nMessage client: {message_text}"
        else:
            message_alerte = f"⚠️ *ALERTE CLIENT MÉCONTENT*\nNuméro: {phone_number}\nMessage: {message_text}"
        envoyer_alerte_whatsapp(message_alerte, settings.WHATSAPP_ADMIN_NUMBER)
        print(f"✅ Alerte WhatsApp envoyée avec succès à {settings.WHATSAPP_ADMIN_NUMBER}")
    except Exception as e:
        print(f"❌ Échec de l'alerte WhatsApp: {e}")
        whatsapp_error = e

    # 2. Envoi Alerte Discord
    try:
        from .alerts import envoyer_alerte_discord
        if not is_panne:
            envoyer_alerte_discord(
                phone_number=phone_number,
                message_text=message_text,
                sentiment_score=sentiment_score,
                derniers_messages=derniers_messages
            )
        else:
            # On pourrait avoir une alerte Discord spécifique pour la panne, on l'omet ou on l'envoie avec un titre différent.
            # Pour l'instant on utilise la même fonction mais on pourrait l'adapter dans alerts.py
            envoyer_alerte_discord(
                phone_number=phone_number,
                message_text=f"PANNE IA: {message_text}",
                sentiment_score=0.0,
                derniers_messages=["L'API IA EST EN PANNE !"]
            )
    except Exception as e:
        print(f"❌ Échec de l'alerte Discord: {e}")
        discord_error = e

    # Relancer si au moins une erreur s'est produite
    if whatsapp_error or discord_error:
        erreurs = []
        if whatsapp_error:
            erreurs.append(f"WhatsApp: {whatsapp_error}")
        if discord_error:
            erreurs.append(f"Discord: {discord_error}")
        erreur_msg = " & ".join(erreurs)
        print(f"⚠️ Relance de la tâche d'alerte en raison des erreurs: {erreur_msg}")
        try:
            self.retry(exc=Exception(erreur_msg), countdown=5 ** self.request.retries)
        except Exception as retry_e:
            print(f"❌ Impossible de planifier le retry de l'alerte: {retry_e}")
