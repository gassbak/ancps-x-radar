from django.urls import path
from . import views

app_name = 'cv_scoring'

urlpatterns = [
    # =============================================
    # Endpoints PUBLICS (pas d'auth requise)
    # =============================================
    path('match/', views.match_cv_job_view, name='match_cv_job'),
    path('match-url/', views.match_cv_job_url_view, name='match_cv_job_url'),
    path('health/', views.cv_scoring_health_view, name='cv_scoring_health'),
    # Scoring via offre scrapée (public: upload CV + job_id)
    path('analyze-scraped/', views.analyze_scraped_job_view, name='analyze_scraped_job'),
    
    # =============================================
    # Endpoints AUTHENTIFIÉS (auth requise)
    # =============================================
    # Profil
    path('profile/', views.profile_view, name='profile'),
    path('profile/delete-cv/', views.profile_delete_cv_view, name='profile_delete_cv'),
    
    # Analyse avec le profil (URL externe)
    path('analyze/', views.analyze_with_profile_view, name='analyze_with_profile'),
    # Scoring via offre scrapée avec CV du profil
    path('analyze-scraped/profile/', views.analyze_scraped_with_profile_view, name='analyze_scraped_with_profile'),
    
    # Historique
    path('history/', views.analysis_history_view, name='analysis_history'),
    path('history/<int:analysis_id>/', views.analysis_detail_view, name='analysis_detail'),
    
    # Statistiques
    path('stats/', views.user_stats_view, name='user_stats'),
]
