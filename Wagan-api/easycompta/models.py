from django.db import models
from django.contrib.auth.models import User

class ChatSession(models.Model):
    session_id = models.CharField(max_length=100, unique=True)
    started_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.session_id}"

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=(('user', 'User'), ('bot', 'Bot')))
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class Document(models.Model):
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    text_content = models.TextField(blank=True)