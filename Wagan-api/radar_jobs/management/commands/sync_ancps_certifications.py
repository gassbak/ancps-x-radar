from django.core.management.base import BaseCommand

from radar_jobs.services.ancps_sync import sync_ancps_certifications


class Command(BaseCommand):
    help = 'Scrape les certifications publiées sur le site ANCPS vers la base Radar.'

    def handle(self, *args, **options):
        result = sync_ancps_certifications()
        self.stdout.write(self.style.SUCCESS(
            'Scraping terminé: '
            f"{result['received']} reçue(s), "
            f"{result['created']} créée(s), "
            f"{result['updated']} mise(s) à jour, "
            f"{result['deactivated']} désactivée(s)."
        ))
