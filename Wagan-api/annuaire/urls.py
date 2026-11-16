from django.urls import path

from .views import annuaire_health_view, formation_detail_view, formations_list_view

urlpatterns = [
    path('formations/', formations_list_view, name='annuaire_formations_list'),
    path('formations/<str:cert_id>/', formation_detail_view, name='annuaire_formation_detail'),
    path('health/', annuaire_health_view, name='annuaire_health'),
]