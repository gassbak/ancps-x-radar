from django.db import models
from django.utils import timezone
import uuid

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    phone_number = models.CharField(max_length=20, db_index=True)
    message_text = models.TextField()
    role = models.CharField(max_length=10, default='user', choices=[('user', 'User'), ('bot', 'Bot')])
    
    sentiment_score = models.FloatField(null=True, blank=True)   # ex: 0.85
    sentiment_label = models.CharField(
        max_length=10,
        choices=[
            ('positive', 'Positive'),
            ('negative', 'Negative'),
            ('neutral', 'Neutral'),
        ],
        null=True,
        blank=True
    )
    
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    # Pour garder le payload complet du webhook (très utile pour debug)
    raw_webhook_data = models.JSONField(null=True, blank=True)
    whatsapp_message_id = models.CharField(max_length=128, unique=True, null=True, blank=True, db_index=True)
    
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['phone_number', 'timestamp']),
        ]
        verbose_name = "Message WhatsApp"
        verbose_name_plural = "Messages WhatsApp"

    def __str__(self):
        return f"{self.phone_number} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class BotKnowledge(models.Model):
    etablissement_nom = models.CharField(max_length=255, default="Bakeli School of Technology")
    etablissement_description = models.TextField(blank=True, null=True)
    etablissement_site = models.URLField(blank=True, null=True)
    etablissement_inscription = models.URLField(blank=True, null=True)
    catalogue_formations = models.TextField(blank=True, null=True)
    horaires = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration du Bot"
        verbose_name_plural = "Configurations du Bot"

    def __str__(self):
        return self.etablissement_nom or "Configuration du Bot"

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


class ConversationState(models.Model):
    phone_number = models.CharField(max_length=20, unique=True, db_index=True)
    statut_prospect = models.CharField(max_length=50, default='neutral', db_index=True)
    statut_score = models.FloatField(default=0.0, blank=True, null=True)
    statut_updated_at = models.DateTimeField(blank=True, null=True)
    history = models.JSONField(default=list, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "État de Conversation"
        verbose_name_plural = "États de Conversation"

    def __str__(self):
        return f"{self.phone_number} - {self.statut_prospect}"
