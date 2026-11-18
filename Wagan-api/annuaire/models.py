from django.db import models

# Événements de suivi prévus par le cahier des charges (section 11).
EVENT_NAMES = [
    'directory_opened',
    'formation_search_performed',
    'filter_applied',
    'formation_viewed',
    'formation_saved',
    'comparison_started',
    'outbound_registration_clicked',
    'recommendation_viewed',
    'recommendation_clicked',
]


class AnnuaireEvent(models.Model):
    """Événement d'usage anonyme. Aucune donnée personnelle : pas d'utilisateur, pas d'IP,
    pas de texte de recherche. `session_id` est un identifiant aléatoire créé par le navigateur."""

    event = models.CharField(max_length=40, db_index=True)
    formation_id = models.CharField(max_length=64, blank=True, default='')
    detail = models.CharField(max_length=60, blank=True, default='')  # ex. site, filtre utilisé
    result_count = models.PositiveIntegerField(null=True, blank=True)
    session_id = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event} {self.formation_id}".strip()


class Favorite(models.Model):
    """Formation enregistrée par un utilisateur Radar (la fiche reste dans ANCPS)."""

    radar_user_id = models.CharField(max_length=64, db_index=True)
    formation_id = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['radar_user_id', 'formation_id'], name='annuaire_unique_favorite'),
        ]

    def __str__(self):
        return f"{self.radar_user_id} → {self.formation_id}"
