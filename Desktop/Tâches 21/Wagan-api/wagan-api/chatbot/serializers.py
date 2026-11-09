from rest_framework import views, serializers, status
# Sérialiseurs pour la validation des données
class ChatInputSerializer(serializers.Serializer):
    message = serializers.CharField()

class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()

class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()