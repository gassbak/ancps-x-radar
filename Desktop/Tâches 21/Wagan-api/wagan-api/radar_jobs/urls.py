from django.urls import path
from .views_chat import chat_view
from .views_jobs import status_view, download_csv_view, jobs_list_view, job_detail_view, partners_view
from .views_system import trigger_scrape_view, health_check_view, scraping_status_view
from .views_alerts import alert_create_view, alert_list_view, alert_delete_view, alert_status_view

urlpatterns = [
    path('chat/', chat_view, name='chat'),
    path('status/', status_view, name='status'),
    path('download/csv/', download_csv_view, name='download_csv'),
    path('jobs/', jobs_list_view, name='jobs_list'),
    path('jobs/<path:job_id>/', job_detail_view, name='job_detail'),
    path('partners/', partners_view, name='partners_list'),
    path('scrape/', trigger_scrape_view, name='trigger_scrape'),
    path('health/', health_check_view, name='health_check'),
    path('monitoring/', scraping_status_view, name='scraping_status'),
    path('alerts/', alert_create_view, name='alert_create'),
    path('alerts/list/', alert_list_view, name='alert_list'),
    path('alerts/<int:alert_id>/', alert_delete_view, name='alert_delete'),
    path('alerts/status/', alert_status_view, name='alert_status'),
]
