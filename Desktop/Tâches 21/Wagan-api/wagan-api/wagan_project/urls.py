"""wagan_project URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path
from utils.config import schema_view
from wagan_app.views.google_oauth import GoogleCallbackView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('wagan_app.urls')),
    path('api/', include('chatbot.urls')),
    path('api/', include('bakeli_learning.urls')),
    path('api/', include('easycompta.urls')),
    path('api/', include('radar.urls')),
    path('api/radar_jobs/', include('radar_jobs.urls')),
    path('api/job-insights/', include('radar_jobs.urls')),
    path('api/cv-scoring/', include('cv_scoring.urls')),
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),
    path('api/auth/social/', include('social_django.urls', namespace='social')),
    path('api/auth/', include('djoser.social.urls')),
    # ✅ Callback Google backend-side (pas de cookie cross-origin requis)
    path('api/auth/google/callback/', GoogleCallbackView.as_view(), name='google-callback'),
    path('whatsapp/', include('whatsapp_bot.urls')),

    # Swagger & Redoc
    re_path(r"^api/swagger/$", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    re_path(r"^api/redoc/$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]

