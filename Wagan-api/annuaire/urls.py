from django.urls import path

from .views import annuaire_health_view, formation_detail_view, formations_list_view
from .views_favorites import favorite_delete_view, favorites_view
from .views_tracking import stats_view, track_event_view

urlpatterns = [
    path('formations/', formations_list_view, name='annuaire_formations_list'),
    path('formations/<str:cert_id>/', formation_detail_view, name='annuaire_formation_detail'),
    path('health/', annuaire_health_view, name='annuaire_health'),
    path('events/', track_event_view, name='annuaire_events'),
    path('stats/', stats_view, name='annuaire_stats'),
    path('me/favorites/', favorites_view, name='annuaire_favorites'),
    path('me/favorites/<str:formation_id>/', favorite_delete_view, name='annuaire_favorite_delete'),
]
