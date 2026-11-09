from rest_framework import serializers
from ..models import ChatSession, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

class MessagePairSerializer(serializers.Serializer):
    user_message = MessageSerializer(allow_null=True)
    bot_message  = MessageSerializer(allow_null=True)

class SendMessagePairsResponseSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    pairs      = serializers.ListField(child=MessagePairSerializer())


class ConversationPairsSerializer(serializers.Serializer):
    """
    Entrée attendue dans .data:
      {"messages": <QuerySet or list[Message]>}  # déjà ordonné croissant (created_at / id)
    Sortie:
      {"pairs": [ {"user_message": {...}|null, "bot_message": {...}|null }, ... ]}
    """
    pairs = serializers.SerializerMethodField()

    def get_pairs(self, obj):
        messages = obj.get("messages", [])
        messages = list(messages)  # si QuerySet

        pairs = []
        current_user = None

        for msg in messages:
            # adpate 'role' si ton champ diffère
            role = getattr(msg, "role", None)

            if role == "user":
                # Si on avait un précédent user sans réponse, on le pousse quand même
                if current_user is not None:
                    pairs.append({
                        "user_message": MessageSerializer(current_user).data,
                        "bot_message":  None,
                    })
                current_user = msg

            elif role == "bot":
                if current_user is None:
                    # bot sans user précédent
                    pairs.append({
                        "user_message": None,
                        "bot_message":  MessageSerializer(msg).data,
                    })
                else:
                    pairs.append({
                        "user_message": MessageSerializer(current_user).data,
                        "bot_message":  MessageSerializer(msg).data,
                    })
                    current_user = None

            else:
                # Si tu as d'autres rôles (ex: "system"), ignore ou traite à part
                pass

        # Reste-t-il un user sans réponse ?
        if current_user is not None:
            pairs.append({
                "user_message": MessageSerializer(current_user).data,
                "bot_message":  None,
            })

        return pairs


class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['session_id', 'created_at']
