from rest_framework import serializers
from .models import UserProfile, CVAnalysis


# =============================================
# serializers pour les requêtes d'analyse
# =============================================

class CVJobMatchRequestSerializer(serializers.Serializer):
    """Serializer pour l'analyse par upload de fichiers."""
    cv = serializers.FileField(
        help_text="Fichier CV (PDF, DOCX, TXT, MD)",
        required=True
    )
    job = serializers.FileField(
        help_text="Fichier offre d'emploi (PDF, DOCX, TXT, MD)",
        required=True
    )
    use_cache = serializers.BooleanField(
        default=True,
        help_text="Utiliser le cache pour les analyses similaires"
    )


class CVJobMatchUrlRequestSerializer(serializers.Serializer):
    """Serializer pour l'analyse par URLs."""
    cv_url = serializers.URLField(
        help_text="URL du CV (PDF, DOCX, TXT, MD)",
        required=True
    )
    job_url = serializers.URLField(
        help_text="URL de l'offre (PDF, DOCX, TXT, MD, ou page web)",
        required=True
    )
    use_cache = serializers.BooleanField(
        default=True,
        help_text="Utiliser le cache pour les analyses similaires"
    )


class AnalyzeWithProfileSerializer(serializers.Serializer):
    """Serializer pour l'analyse avec le CV du profil (via URL externe)."""
    job_url = serializers.URLField(
        help_text="URL de l'offre d'emploi",
        required=True
    )
    job_title = serializers.CharField(
        max_length=255,
        help_text="Titre du poste",
        required=False
    )
    job_company = serializers.CharField(
        max_length=255,
        help_text="Nom de l'entreprise",
        required=False
    )
    use_cache = serializers.BooleanField(
        default=True,
        help_text="Utiliser le cache pour les analyses similaires"
    )


class AnalyzeScrapedJobSerializer(serializers.Serializer):
    """Serializer pour analyser une offre scrapée avec upload de CV (public)."""
    job_id = serializers.CharField(
        help_text="ID de l'offre scrapée (index du CSV) ou offer_url",
        required=True
    )
    cv = serializers.FileField(
        help_text="Fichier CV (PDF, DOCX, TXT, MD)",
        required=True
    )
    use_cache = serializers.BooleanField(
        default=True,
        required=False,
        help_text="Utiliser le cache pour les analyses similaires"
    )


class AnalyzeScrapedWithProfileSerializer(serializers.Serializer):
    """Serializer pour analyser une offre scrapée avec le CV du profil (auth)."""
    job_id = serializers.CharField(
        help_text="ID de l'offre scrapée (index du CSV) ou offer_url",
        required=True
    )
    use_cache = serializers.BooleanField(
        default=True,
        required=False,
        help_text="Utiliser le cache pour les analyses similaires"
    )


# =============================================
# serializers pour les réponses
# =============================================

class MatchingAnalysisSerializer(serializers.Serializer):
    """Serializer pour le détail de l'analyse."""
    matching_analysis = serializers.ListField(
        child=serializers.CharField(),
        help_text="Liste des compétences correspondantes"
    )
    description = serializers.CharField(
        help_text="Analyse détaillée de la correspondance"
    )
    score = serializers.IntegerField(
        min_value=0,
        max_value=100,
        help_text="Score de correspondance (0-100)"
    )
    recommendation = serializers.CharField(
        help_text="Recommandations pour améliorer la candidature"
    )


class CVJobMatchResponseSerializer(serializers.Serializer):
    """Serializer pour la réponse de l'analyse."""
    source = serializers.ChoiceField(
        choices=['cache', 'api_call'],
        help_text="Source du résultat (cache ou appel API)"
    )
    result = MatchingAnalysisSerializer(
        help_text="Résultat de l'analyse"
    )


class ErrorResponseSerializer(serializers.Serializer):
    """Serializer pour les erreurs."""
    error = serializers.CharField(
        help_text="Message d'erreur"
    )


class HealthCheckResponseSerializer(serializers.Serializer):
    """Serializer pour le health check."""
    status = serializers.CharField()
    groq_api_configured = serializers.BooleanField()
    cache_size = serializers.IntegerField()
    timestamp = serializers.CharField()


# =============================================
# serializers pour le profil utilisateur
# =============================================

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil CV de l'utilisateur."""
    email = serializers.EmailField(source='user.email', read_only=True)
    cv_file_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id', 'email', 'cv_file', 'cv_file_url', 'cv_text',
            'first_name', 'last_name', 'phone',
            'target_job', 'target_sector',
            'current_score', 'total_analyses',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['current_score', 'total_analyses', 'created_at', 'updated_at']

    def get_cv_file_url(self, obj):
        if obj.cv_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cv_file.url)
            return obj.cv_file.url
        return None


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour partielle du profil."""
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'phone',
            'target_job', 'target_sector'
        ]


# =============================================
# serializers pour l'historique des analyses
# =============================================

class CVAnalysisSerializer(serializers.ModelSerializer):
    """Serializer pour un enregistrement d'analyse."""
    class Meta:
        model = CVAnalysis
        fields = [
            'id', 'job_title', 'job_company', 'job_url',
            'score', 'matching_skills', 'analysis', 'recommendation',
            'source', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CVAnalysisListSerializer(serializers.ModelSerializer):
    """Serializer allégé pour la liste des analyses."""
    class Meta:
        model = CVAnalysis
        fields = [
            'id', 'job_title', 'job_company', 'score',
            'matching_skills', 'created_at'
        ]


# =============================================
# serializers pour les statistiques
# =============================================

class UserStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques personnelles."""
    total_analyses = serializers.IntegerField()
    average_score = serializers.FloatField()
    best_score = serializers.IntegerField()
    worst_score = serializers.IntegerField()
    skills_frequency = serializers.DictField()
    recent_analyses = CVAnalysisListSerializer(many=True)
    improvement_trend = serializers.ListField(
        child=serializers.DictField()
    )
