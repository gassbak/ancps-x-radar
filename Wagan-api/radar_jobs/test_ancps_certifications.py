from rest_framework.test import APITestCase

from radar_jobs.models import ANCPSCertification
from radar_jobs.services.ancps_certifications import (
    extract_certification_links,
    parse_certification_detail,
)


class ANCPSCertificationScraperTests(APITestCase):
    def test_extracts_detail_links_from_rendered_catalogue(self):
        html = """
        <main>
          <a href="/certification/abc123">Voir la certification</a>
          <a href="https://ancps-senegal.vercel.app/certification/def456/">Détail</a>
          <a href="/annuaire">Annuaire</a>
        </main>
        """

        self.assertEqual(
            extract_certification_links(html),
            {
                "abc123": "https://ancps-senegal.vercel.app/certification/abc123",
                "def456": "https://ancps-senegal.vercel.app/certification/def456/",
            },
        )

    def test_parses_visible_certification_fields(self):
        html = """
        <body>
          <div class="summary">
            <span>Formation / Diplôme</span><span>Vérifiée</span>
            <h1>Licence de gestion</h1>
          </div>
          <main>
            <section>
              <h2>Présentation</h2>
              <div><p>Formation en comptabilité et finance.</p></div>
            </section>
            <section>
              <h2>Objectifs de la formation</h2>
              <div><p>Former des gestionnaires.</p></div>
            </section>
            <section>
              <h2>Informations complémentaires</h2>
              <div><p>Sigle</p><p>LGCF</p></div>
              <div><p>Domaine</p><p>Gestion</p></div>
            </section>
            <section>
              <h2>Informations clés</h2>
              <div><p>Niveau</p><p>Licence</p></div>
              <div><p>Type</p><p>Formation / Diplôme</p></div>
              <div><p>Modalité</p><p>Présentiel</p></div>
            </section>
          </main>
        </body>
        """

        payload = parse_certification_detail(
            html,
            "abc123",
            "https://ancps-senegal.vercel.app/certification/abc123",
        )

        self.assertEqual(payload["title"], "Licence de gestion")
        self.assertEqual(payload["description"], "Formation en comptabilité et finance.")
        self.assertEqual(payload["domaine"], "Gestion")
        self.assertEqual(payload["sigle"], "LGCF")
        self.assertEqual(payload["niveauSortie"], "Licence")
        self.assertEqual(payload["type"], "Formation / Diplôme")
        self.assertEqual(payload["modalite"], "Présentiel")
        self.assertEqual(payload["objectifs"], ["Former des gestionnaires."])
        self.assertEqual(payload["statutVerification"], "Vérifiée")
        self.assertEqual(payload["id"], "abc123")


class ANCPSCertificationAPITests(APITestCase):
    def setUp(self):
        self.payload = {
            "_id": "abc123",
            "id": "abc123",
            "title": "Licence de gestion",
            "published": True,
        }
        ANCPSCertification.objects.create(
            source_id="abc123",
            title="Licence de gestion",
            source_url="https://ancps-senegal.vercel.app/certification/abc123",
            payload=self.payload,
        )

    def test_list_returns_scraped_certifications(self):
        response = self.client.get("/api/radar_jobs/certifications/?published=true")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"], [self.payload])

    def test_detail_returns_scraped_certification(self):
        response = self.client.get("/api/radar_jobs/certifications/abc123/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"], self.payload)

    def test_detail_returns_not_found_for_unknown_certification(self):
        response = self.client.get("/api/radar_jobs/certifications/missing/")

        self.assertEqual(response.status_code, 404)
