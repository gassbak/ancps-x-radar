from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfile(models.Model):
    """
    Profil utilisateur pour le CV Scoring.
    Stocke le CV et les informations du profil candidat.
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='cv_profile'
    )
    cv_file = models.FileField(
        upload_to='cv_scoring/cvs/',
        blank=True,
        null=True,
        help_text="Fichier CV (PDF, DOCX, TXT, MD)"
    )
    cv_text = models.TextField(
        blank=True,
        null=True,
        help_text="Texte extrait du CV (pour recherche et analyse)"
    )
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    target_job = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Poste recherché (ex: Développeur Python, Data Analyst)"
    )
    target_sector = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Secteur ciblé (ex: Informatique, Marketing, Finance)"
    )
    current_score = models.IntegerField(
        default=0,
        help_text="Dernier score de correspondance obtenu"
    )
    total_analyses = models.IntegerField(
        default=0,
        help_text="Nombre total d'analyses effectuées"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil CV"
        verbose_name_plural = "Profils CV"

    def __str__(self):
        return f"Profil CV de {self.user.email}"


class CVAnalysis(models.Model):
    """
    Historique des analyses CV/Offre d'emploi.
    Chaque enregistrement = une analyse effectuée.
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='cv_analyses'
    )
    job_title = models.CharField(
        max_length=255,
        help_text="Titre du poste analysé"
    )
    job_company = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Entreprise (si disponible)"
    )
    job_url = models.URLField(
        blank=True, 
        null=True,
        help_text="URL de l'offre d'emploi"
    )
    job_description = models.TextField(
        blank=True,
        null=True,
        help_text="Description du poste (extrait)"
    )
    score = models.IntegerField(
        help_text="Score de correspondance (0-100)"
    )
    matching_skills = models.JSONField(
        default=list,
        blank=True,
        help_text="Liste des compétences correspondantes"
    )
    analysis = models.TextField(
        help_text="Analyse détaillée de la correspondance"
    )
    recommendation = models.TextField(
        help_text="Recommandations pour améliorer la candidature"
    )
    source = models.CharField(
        max_length=20,
        choices=[
            ('cache', 'Cache'),
            ('api_call', 'Appel API'),
        ],
        default='api_call',
        help_text="Source du résultat"
    )
    cv_snapshot = models.TextField(
        blank=True,
        null=True,
        help_text="Snapshot du CV utilisé pour cette analyse"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Analyse CV"
        verbose_name_plural = "Analyses CV"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.job_title} (Score: {self.score})"
