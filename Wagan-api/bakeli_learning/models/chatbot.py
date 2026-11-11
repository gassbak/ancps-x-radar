from django.db import models
import uuid

class ChatSession(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=(("user", "User"), ("bot", "Bot")))
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
