from django.urls import path

from bakeli_learning.views.chatbot import ChatMessage, StartChatSession

urlpatterns = [
    path("learning/start/", StartChatSession.as_view(), name="start_chat"),
    path("learning/<uuid:session_id>/message/", ChatMessage.as_view(), name="chat_message"),
]
