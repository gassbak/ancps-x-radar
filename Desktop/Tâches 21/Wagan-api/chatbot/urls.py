from django.urls import path
from .views import ChatView, DocumentUploadView

urlpatterns = [
    path("bot/", ChatView.as_view(), name="chatbot"),
    path("upload/", DocumentUploadView.as_view(), name="upload_document"),
]
