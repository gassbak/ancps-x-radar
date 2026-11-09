from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('easycompta/upload/', views.UploadDocumentView.as_view(), name='upload_document'),
    path('easycompta/chat/start/', views.start_chat_session, name='start_chat_session'),
    path('easycompta/chat/<str:session_id>/', views.chat, name='chat'),
    path('easycompta/chat/<str:session_id>/history/', views.get_session_history, name='get_session_history'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)