import asyncio

from django.core.management.base import BaseCommand, CommandError

from radar_jobs.services.ancps_certifications import scrape_ancps_certifications


class Command(BaseCommand):
    help = "Scrape les fiches visibles dans l'annuaire public ANCPS."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Nombre maximum de fiches à scraper (utile pour un essai).",
        )

    def handle(self, *args, **options):
        limit = options["limit"]
        if limit is not None and limit < 1:
            raise CommandError("--limit doit être un entier supérieur à zéro.")

        self.stdout.write("Scraping du catalogue ANCPS depuis le navigateur...")
        try:
            result = asyncio.run(scrape_ancps_certifications(limit=limit))
        except Exception as exc:
            raise CommandError(f"Le scraping ANCPS a échoué: {exc}") from exc

        self.stdout.write(self.style.SUCCESS(
            f"Scraping terminé: {result['scraped']} fiche(s) enregistrée(s) "
            f"sur {result['total_found']} trouvée(s)."
        ))
