from django.urls import path
from . import views

urlpatterns = [
    path('webhook/', views.whatsapp_webhook, name='whatsapp_webhook'),
    path('dashboard/api/', views.dashboard_api, name='dashboard_api'),

    path('config/', views.bot_config_api, name='bot_config_api'),
    path('hot-leads/', views.hot_leads_api, name='hot_leads_api'),
    path('prospects/<str:phone_number>/messages/', views.prospect_messages_api, name='prospect_messages_api'),

]
