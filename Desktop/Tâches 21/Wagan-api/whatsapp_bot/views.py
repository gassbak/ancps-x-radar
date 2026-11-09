from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

# logging écrit sur stderr (non bufferisé), contrairement aux print() qui
# peuvent rester invisibles sous Gunicorn/systemd sans PYTHONUNBUFFERED=1.
logger = logging.getLogger(__name__)
from django.conf import settings
from .models import Message, BotKnowledge, ConversationState
from .celery_tasks import process_message_async
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response


def extract_message_data(webhook_data):
    """
    Extrait le numéro de téléphone, le texte du message et le type du webhook WhatsApp.
    Retourne un tuple (phone_number, message_text, message_type) ou (None, None, None) si extraction échouée.
    """
    try:
        entry = webhook_data.get('entry', [{}])[0]
        changes = entry.get('changes', [{}])[0]
        value = changes.get('value', {})

        # Vérifier si c'est un nouveau message
        if 'messages' not in value:
            return None, None, None, None

        message_obj = value['messages'][0]
        phone_number = message_obj.get('from')
        message_type = message_obj.get('type')
        external_message_id = message_obj.get('id')

        if not phone_number:
            return None, None, None, None

        # Extraire le texte selon le type de message
        message_text = None

        if message_type == 'text':
            message_text = message_obj.get('text', {}).get('body', '')

        elif message_type == 'interactive':
            # Si l'utilisateur a cliqué sur un bouton
            interactive_obj = message_obj.get('interactive', {})
            interactive_type = interactive_obj.get('type')
            if interactive_type == 'button_reply':
                message_text = interactive_obj.get('button_reply', {}).get('title', '')
                print(f"🔘 Bouton cliqué : {message_text}")
            elif interactive_type == 'list_reply':
                message_text = interactive_obj.get('list_reply', {}).get('title', '')
            else:
                message_text = "[Interaction reçue]"

        elif message_type == 'image':
            # Récupérer la légende si elle existe
            message_text = message_obj.get('image', {}).get('caption')
            if not message_text:
                message_text = "[Image reçue sans légende]"

        elif message_type == 'video':
            message_text = message_obj.get('video', {}).get('caption')
            if not message_text:
                message_text = "[Vidéo reçue sans légende]"

        elif message_type == 'audio':
            message_text = "[Message audio reçu]"

        elif message_type == 'document':
            # Récupérer le nom du document si possible
            filename = message_obj.get('document', {}).get('filename', 'document')
            message_text = f"[Document reçu: {filename}]"

        elif message_type == 'location':
            message_text = "[Localisation reçue]"

        else:
            message_text = f"[Type de message non géré: {message_type}]"

        return phone_number, message_text if message_text else "", message_type, external_message_id

    except (KeyError, IndexError, TypeError) as e:
        print(f"❌ Erreur lors de l'extraction du message: {e}")
        return None, None, None, None


@csrf_exempt
@require_http_methods(["GET", "POST"])
def whatsapp_webhook(request):
    print(f"\n{'='*90}")
    print(f"REQUÊTE REÇUE - Méthode: {request.method} | Path: {request.path}")
    print(f"{'='*90}")

    if request.method == "GET":
        mode = request.GET.get("hub.mode")
        token = request.GET.get("hub.verify_token")
        challenge = request.GET.get("hub.challenge")

        print(f"GET - Verify Token reçu: {token}")

        if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
            print("✅ Webhook vérifié avec succès par Meta !")
            return JsonResponse(int(challenge), safe=False, status=200)
        
        print("❌ Verify token invalide")
        return JsonResponse({"error": "Invalid verify token"}, status=403)

    # === POST ===
    try:
        data = json.loads(request.body)
        print("✅ POST REÇU AVEC SUCCÈS !")

        phone_number, message_text, message_type, external_message_id = extract_message_data(data)

        if phone_number and message_text:
            if external_message_id:
                existing_message = Message.objects.filter(whatsapp_message_id=external_message_id).first()
                if existing_message:
                    print(f"⚠️  Message déjà reçu : {external_message_id}. Aucune nouvelle tâche créée.")
                else:
                    message_obj = Message.objects.create(
                        phone_number=phone_number,
                        message_text=message_text,
                        raw_webhook_data=data,
                        whatsapp_message_id=external_message_id,
                        processed=False
                    )
                    print(f"✅ Message créé en DB: {message_obj.id}")

                    # 2. Queue la tâche async (NE PAS ATTENDRE)
                    try:
                        process_message_async.delay(
                            phone_number=phone_number,
                            message_text=message_text,
                            message_type=message_type,
                            message_id=str(message_obj.id),
                            raw_webhook_data=data
                        )
                        print(f"⏳ Tâche queued pour traitement async")
                    except Exception as celery_err:
                        logger.exception(f"Erreur Redis/Celery — tâche NON queuée pour le message {message_obj.id}")
                        print(f"❌ Erreur Redis/Celery (message non traité) : {celery_err}")
            else:
                message_obj = Message.objects.create(
                    phone_number=phone_number,
                    message_text=message_text,
                    raw_webhook_data=data,
                    processed=False
                )
                print(f"✅ Message créé en DB sans ID externe: {message_obj.id}")

                try:
                    process_message_async.delay(
                        phone_number=phone_number,
                        message_text=message_text,
                        message_type=message_type,
                        message_id=str(message_obj.id),
                        raw_webhook_data=data
                    )
                    print(f"⏳ Tâche queued pour traitement async")
                except Exception as celery_err:
                    logger.exception(f"Erreur Redis/Celery — tâche NON queuée pour le message {message_obj.id}")
                    print(f"❌ Erreur Redis/Celery (message non traité) : {celery_err}")
        else:
            print("⚠️  Aucun message à traiter")

        print(f"{'='*90}\n")

        # 3. Répondre IMMÉDIATEMENT (< 0.2s) sans attendre le traitement
        return JsonResponse({"status": "received"}, status=200)

    except json.JSONDecodeError:
        print("❌ Erreur : Le body n'est pas du JSON valide")
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        logger.exception("Erreur inattendue dans le webhook WhatsApp (200 renvoyé à Meta quand même)")
        print(f"❌ Erreur inattendue : {e}")
        # Toujours retourner 200 à WhatsApp pour éviter les retries en boucle
        return JsonResponse({"status": "error_acknowledged"}, status=200)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_api(request):
    try:
        # On filtre uniquement sur les messages entrants du prospect (role='user')
        # Les messages du bot (role='bot') ne doivent pas être comptabilisés dans les KPIs.
        qs = Message.objects.filter(role='user')
        
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        from django.utils.dateparse import parse_datetime
        if start_date:
            parsed_start = parse_datetime(start_date)
            if parsed_start:
                qs = qs.filter(timestamp__gte=parsed_start)
        if end_date:
            parsed_end = parse_datetime(end_date)
            if parsed_end:
                qs = qs.filter(timestamp__lte=parsed_end)
                
        total = qs.count()
        utilisateurs = qs.values('phone_number').distinct().count()
        pending = qs.filter(processed=False).count()
        
        users_latest_sentiment = {}
        user_messages = {}
        
        for msg in qs.order_by('timestamp'):
            if msg.phone_number not in user_messages:
                user_messages[msg.phone_number] = []
            user_messages[msg.phone_number].append(msg)
            
            if msg.sentiment_label:
                users_latest_sentiment[msg.phone_number] = msg.sentiment_label

        statuts_persistants = dict(
            ConversationState.objects.filter(
                phone_number__in=user_messages.keys(),
                statut_updated_at__isnull=False,
            ).values_list('phone_number', 'statut_prospect')
        )
        users_latest_sentiment = {**users_latest_sentiment, **statuts_persistants}

        labels_values = list(users_latest_sentiment.values())
        positifs      = labels_values.count('positive')
        neutres       = labels_values.count('neutral')
        nb_lost_leads = labels_values.count('lost_lead')
        nb_bot_stuck  = labels_values.count('bot_stuck')
        nb_angry      = labels_values.count('angry')

        nb_analyses = positifs + neutres + nb_lost_leads + nb_bot_stuck + nb_angry

        p_positif = round((positifs / nb_analyses * 100), 1) if nb_analyses > 0 else 0
        p_neutre  = round((neutres  / nb_analyses * 100), 1) if nb_analyses > 0 else 0
        
        conversion_counts = []
        nb_prospects_convertis = 0
        
        for phone, msgs in user_messages.items():
            sentiments_timeline = []
            for i, m in enumerate(msgs):
                if m.sentiment_label:
                    sentiments_timeline.append({
                        'msg_total_index': i + 1,
                        'label': m.sentiment_label,
                        'score': m.sentiment_score or 0.5
                    })
            
            if not sentiments_timeline:
                continue
            
            if users_latest_sentiment.get(phone) != 'positive':
                continue

            point_de_bascule_index = None
            for idx in range(len(sentiments_timeline)):
                if sentiments_timeline[idx]['label'] != 'positive':
                    continue
                remaining = sentiments_timeline[idx:]
                if all(s['label'] in ('positive', 'neutral') for s in remaining):
                    point_de_bascule_index = sentiments_timeline[idx]['msg_total_index']
                    break
                    
            if point_de_bascule_index is not None:
                nb_prospects_convertis += 1
                conversion_counts.append(point_de_bascule_index)
                
        avg_messages_to_convert = 0
        if conversion_counts:
            avg_messages_to_convert = round(sum(conversion_counts) / len(conversion_counts), 1)
            
        taux_conversion = 0
        if utilisateurs > 0:
            taux_conversion = round((nb_prospects_convertis / utilisateurs * 100), 1)
            
        STATUT_MAP = {
            'positive':  ('Chaud 🔥',         '#22c55e'),
            'neutral':   ('En exploration 🔎', '#6b7280'),
            'lost_lead': ('Perdu 🚨',         '#f59e0b'),
            'bot_stuck': ('Bloqué 🧱',       '#f97316'),
            'angry':     ('Irrité 😡',       '#ef4444'),
        }

        prospects_list = []
        for phone, msgs in user_messages.items():
            first_contact = msgs[0].timestamp.isoformat()
            last_contact = msgs[-1].timestamp.isoformat()
            nb_msgs = Message.objects.filter(phone_number=phone).count()
            sentiment = users_latest_sentiment.get(phone, 'inconnu')
            
            scores = [m.sentiment_score for m in msgs if m.sentiment_score is not None]
            avg_score = round(sum(scores) / len(scores), 2) if scores else 0
            
            statut_info = STATUT_MAP.get(sentiment, ('En attente ⏳', '#3b82f6'))
            statut = statut_info[0]
            color  = statut_info[1]

            prospects_list.append({
                'phone': phone,
                'nb_messages': nb_msgs,
                'first_contact': first_contact,
                'last_contact': last_contact,
                'sentiment': sentiment,
                'statut': statut,
                'color': color,
                'avg_score': avg_score,
            })
        
        prospects_list.sort(key=lambda x: x['last_contact'], reverse=True)

        from datetime import timedelta
        prospects_with_stuck = sum(
            1 for msgs in user_messages.values()
            if any(m.sentiment_label == 'bot_stuck' for m in msgs)
        )
        taux_bot_stuck = round((prospects_with_stuck / utilisateurs * 100), 1) if utilisateurs > 0 else 0

        hier = timezone.now() - timedelta(hours=24)
        hot_leads_today = sum(
            1 for phone, msgs in user_messages.items()
            if users_latest_sentiment.get(phone) == 'positive' and msgs[-1].timestamp >= hier
        )

        context = {
            'total': total,
            'utilisateurs': utilisateurs,
            'positifs': positifs,
            'neutres': neutres,
            'nb_lost_leads': nb_lost_leads,
            'nb_bot_stuck': nb_bot_stuck,
            'nb_angry': nb_angry,
            'pending': pending,
            'nb_analyses': nb_analyses,
            'p_positif': p_positif,
            'p_neutre': p_neutre,
            'avg_messages_to_convert': avg_messages_to_convert,
            'nb_prospects_convertis': nb_prospects_convertis,
            'taux_conversion': taux_conversion,
            'taux_bot_stuck': taux_bot_stuck,
            'hot_leads_today': hot_leads_today,
            'prospects_list': prospects_list,
            'now': timezone.now().isoformat()
        }
        return Response(context)
    except Exception as e:
        import traceback
        with open("dashboard_error.log", "w") as f:
            f.write(traceback.format_exc())
        return Response({"detail": str(e), "traceback": traceback.format_exc()}, status=500)


# ============================================================
# API CONFIGURATION DU BOT (Base de Connaissances Dynamique)
# ============================================================

@api_view(['GET', 'PUT'])
@permission_classes([IsAdminUser])
def bot_config_api(request):
    """
    GET  /whatsapp/config/ — Retourne la configuration actuelle du bot.
    PUT  /whatsapp/config/ — Met à jour la configuration du bot.
    """
    config = BotKnowledge.get_solo()

    if request.method == 'GET':
        return Response({
            'etablissement_nom': config.etablissement_nom,
            'etablissement_description': config.etablissement_description,
            'etablissement_site': config.etablissement_site,
            'etablissement_inscription': config.etablissement_inscription,
            'catalogue_formations': config.catalogue_formations,
            'horaires': config.horaires,
            'updated_at': config.updated_at.isoformat() if config.updated_at else None,
        })

    # Traitement du PUT
    try:
        # request.data est un dictionnaire avec DRF (plus besoin de json.loads)
        data = request.data
    except Exception as e:
        return Response({'success': False, 'error': 'Invalid JSON'}, status=400)

    champs_autorises = [
        'etablissement_nom',
        'etablissement_description',
        'etablissement_site',
        'etablissement_inscription',
        'catalogue_formations',
        'horaires',
    ]

    for champ in champs_autorises:
        if champ in data:
            setattr(config, champ, data[champ])

    config.save()
    print(f"✅ BotKnowledge mis à jour par l'admin à {timezone.now()}")

    return Response({
        'success': True,
        'message': 'Configuration du bot mise à jour avec succès.',
        'updated_at': config.updated_at.isoformat(),
    })



@api_view(['GET'])
@permission_classes([IsAdminUser])
def hot_leads_api(request):
    # Un hot lead = un prospect dont le statut CRM persistant est 'positive'
    # (machine à états, qualification.py) — plus le label du dernier message,
    # qu'une simple politesse de clôture ("ok merci") suffisait à masquer.
    hot_leads = []
    for state in ConversationState.objects.filter(statut_prospect='positive'):
        dernier_message = Message.objects.filter(phone_number=state.phone_number).order_by('-timestamp').first()
        if not dernier_message:
            continue
        hot_leads.append({
            'phone_number': state.phone_number,
            'last_message': dernier_message.message_text,
            'sentiment_score': state.statut_score,
            'timestamp': (state.statut_updated_at or dernier_message.timestamp).isoformat(),
        })
    hot_leads.sort(key=lambda x: x['timestamp'], reverse=True)
    return Response({'hot_leads': hot_leads})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def prospect_messages_api(request, phone_number):
    """
    GET /whatsapp/prospects/<phone_number>/messages/
    Retourne l'historique complet de la conversation stocké dans Message.
    """
    messages_qs = Message.objects.filter(phone_number=phone_number).order_by('timestamp')
    
    history = []
    for msg in messages_qs:
        history.append({
            'role': msg.role,
            'content': msg.message_text,
            'timestamp': msg.timestamp.isoformat()
        })
        
    return Response({'messages': history})
