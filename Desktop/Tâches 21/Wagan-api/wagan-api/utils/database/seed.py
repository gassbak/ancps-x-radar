from django.core.management.base import BaseCommand
from django.db import transaction
from radar.models import PaysRadar, RegionRadar

REGIONS_SN = [
    "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack",
    "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis",
    "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor",
]

class Command(BaseCommand):
    help = "Crée le pays Sénégal et les 14 régions"

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            senegal, _ = PaysRadar.objects.get_or_create(nom="Sénégal")
            created = 0
            for r in REGIONS_SN:
                _, was_created = RegionRadar.objects.get_or_create(nom=r, pays=senegal)
                created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Fait ✅ — régions créées: {created}/14"))
