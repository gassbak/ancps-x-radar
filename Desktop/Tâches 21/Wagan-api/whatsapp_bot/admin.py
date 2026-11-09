from django.contrib import admin
from .models import Message, BotKnowledge, ConversationState

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'role', 'sentiment_label', 'sentiment_score', 'timestamp', 'processed')
    list_filter = ('role', 'sentiment_label', 'processed', 'timestamp')
    search_fields = ('phone_number', 'message_text')
    ordering = ('-timestamp',)

@admin.register(BotKnowledge)
class BotKnowledgeAdmin(admin.ModelAdmin):
    list_display = ('etablissement_nom', 'etablissement_site', 'updated_at')
    search_fields = ('etablissement_nom', 'etablissement_description')

@admin.register(ConversationState)
class ConversationStateAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'statut_prospect', 'statut_score', 'statut_updated_at')
    list_filter = ('statut_prospect', 'statut_updated_at')
    search_fields = ('phone_number',)
