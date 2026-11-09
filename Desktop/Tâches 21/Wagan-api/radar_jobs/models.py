from django.db import models


class JobAlert(models.Model):
    """Alerte email candidat : notifié des nouvelles offres correspondant à ses critères."""

    FREQUENCY_CHOICES = [
        ('instant', 'Instantanée'),
        ('daily', 'Résumé quotidien'),
        ('weekly', 'Résumé hebdomadaire'),
    ]

    email = models.EmailField(db_index=True, help_text="Email du candidat à notifier")
    keywords = models.CharField(max_length=255, blank=True, default='', help_text="Mots-clés (ex: développeur python)")
    sector = models.CharField(max_length=100, blank=True, default='')
    location = models.CharField(max_length=100, blank=True, default='')
    job_type = models.CharField(max_length=50, blank=True, default='', help_text="Emploi, Stage, Bourse...")
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='daily')
    is_active = models.BooleanField(default=True)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Alerte emploi"
        verbose_name_plural = "Alertes emploi"
        ordering = ['-created_at']

    def __str__(self):
        criteria = self.keywords or self.sector or self.job_type or 'toutes offres'
        return f"{self.email} — {criteria} ({self.frequency})"
