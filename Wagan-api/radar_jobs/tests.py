import pandas as pd
from unittest.mock import AsyncMock, patch
from rest_framework.test import APITestCase

from radar_jobs.models import ANCPSCertification, JobAlert

from radar_jobs.processing.cleaner import DataCleaner
from radar_jobs.services.jobs_store import load_jobs_df


class JobsStoreTests(APITestCase):
    def test_cache_returns_data_twice(self):
        df1 = load_jobs_df()
        df2 = load_jobs_df()
        self.assertIsNotNone(df1)
        self.assertIsNotNone(df2)
        self.assertEqual(len(df1), len(df2))
        # Copies indépendantes
        self.assertIsNot(df1, df2)


class JobsApiTests(APITestCase):
    def test_list_ok_with_pagination(self):
        r = self.client.get("/api/radar_jobs/jobs/?limit=2")
        self.assertEqual(r.status_code, 200)
        for key in ("total", "page", "limit", "pages", "jobs"):
            self.assertIn(key, r.data)
        self.assertLessEqual(len(r.data["jobs"]), 2)

    def test_detail_ok(self):
        r = self.client.get("/api/radar_jobs/jobs/0/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("title", r.data)

    def test_detail_not_found(self):
        r = self.client.get("/api/radar_jobs/jobs/999999/")
        self.assertEqual(r.status_code, 404)

    def test_detail_too_long(self):
        r = self.client.get("/api/radar_jobs/jobs/" + "a" * 3000 + "/")
        self.assertEqual(r.status_code, 400)

    def test_detail_by_offer_url(self):
        df = load_jobs_df()
        self.assertIsNotNone(df)
        url = df.iloc[0]["offer_url"]
        from urllib.parse import quote
        r = self.client.get(f"/api/radar_jobs/jobs/{quote(url, safe='')}/")
        self.assertEqual(r.status_code, 200)

    def test_status_ok(self):
        r = self.client.get("/api/radar_jobs/status/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("total_jobs", r.data)
        for key in ("top_skills", "contracts_distribution", "top_companies", "sectors_distribution", "top_sector_share"):
            self.assertIn(key, r.data)


class ANCPSCertificationApiTests(APITestCase):
    def setUp(self):
        self.payload = {
            "_id": "ancps-cert-1",
            "title": "Certification Python",
            "published": True,
            "domaine": {"nom": "Numérique"},
        }
        ANCPSCertification.objects.create(
            source_id="ancps-cert-1",
            title="Certification Python",
            data=self.payload,
        )

    def test_list_returns_synchronized_certifications(self):
        response = self.client.get("/api/radar_jobs/certifications/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"], [self.payload])
        self.assertEqual(response.data["pagination"]["total"], 1)

    def test_detail_returns_synchronized_certification(self):
        response = self.client.get("/api/radar_jobs/certifications/ancps-cert-1/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, self.payload)

    def test_detail_returns_404_for_missing_certification(self):
        response = self.client.get("/api/radar_jobs/certifications/missing/")

        self.assertEqual(response.status_code, 404)

    def test_api_adds_official_source_without_changing_scraped_source_url(self):
        certification = ANCPSCertification.objects.create(
            source_id="crm-cert",
            title="Certificat CRM Salesforce",
            data={
                "_id": "crm-cert",
                "title": "Certificat CRM Salesforce",
                "sourceUrl": "https://ancps.example/certification/crm-cert",
            },
        )

        response = self.client.get(f"/api/radar_jobs/certifications/{certification.source_id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["officialUrl"],
            "https://online.groupeism.sn/formations-isf-certifiantes/certificat-crm-salesforce",
        )
        self.assertEqual(
            response.data["sourceUrl"],
            "https://ancps.example/certification/crm-cert",
        )
        self.assertNotIn("officialUrl", certification.data)

    def test_api_adds_google_researched_source_without_changing_ancps_source(self):
        certification = ANCPSCertification.objects.create(
            source_id="nutrition-bts",
            title="BTS Nutrition diététique",
            data={
                "_id": "nutrition-bts",
                "title": "BTS Nutrition diététique",
                "sourceUrl": "https://ancps.example/certification/nutrition-bts",
            },
        )

        response = self.client.get(f"/api/radar_jobs/certifications/{certification.source_id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["officialUrl"],
            "https://www.sencampus.com/formations/bts-nutrition-dietetique-ifaa",
        )
        self.assertEqual(
            response.data["sourceUrl"],
            "https://ancps.example/certification/nutrition-bts",
        )
        self.assertNotIn("officialUrl", certification.data)

class ANCPSCertificationSyncTests(APITestCase):
    @patch(
        "radar_jobs.services.ancps_sync._scrape_published_certifications",
        new_callable=AsyncMock,
        return_value=[
            {
                "_id": "new-cert",
                "title": "Nouvelle fiche",
                "published": True,
            },
        ],
    )
    def test_sync_creates_and_deactivates_records_from_complete_scrape(self, mock_scrape):
        from radar_jobs.services.ancps_sync import sync_ancps_certifications

        stale = ANCPSCertification.objects.create(
            source_id="old-cert",
            title="Ancienne fiche",
            data={"_id": "old-cert", "title": "Ancienne fiche"},
        )

        result = sync_ancps_certifications(annuaire_url="https://ancps.example/annuaire")

        self.assertEqual(result, {"received": 1, "created": 1, "updated": 0, "deactivated": 1})
        self.assertFalse(ANCPSCertification.objects.get(pk=stale.pk).is_published)
        self.assertEqual(
            ANCPSCertification.objects.get(source_id="new-cert").data["title"],
            "Nouvelle fiche",
        )
        mock_scrape.assert_called_once_with("https://ancps.example/annuaire")

    @patch(
        "radar_jobs.services.ancps_sync._scrape_published_certifications",
        new_callable=AsyncMock,
        return_value=[],
    )
    def test_empty_scrape_does_not_deactivate_existing_records(self, mock_scrape):
        from radar_jobs.services.ancps_sync import sync_ancps_certifications

        record = ANCPSCertification.objects.create(
            source_id="existing-cert",
            title="Fiche existante",
            data={"title": "Fiche existante"},
        )

        result = sync_ancps_certifications()

        self.assertEqual(result, {"received": 0, "created": 0, "updated": 0, "deactivated": 0})
        self.assertTrue(ANCPSCertification.objects.get(pk=record.pk).is_published)


class ANCPSCertificationScraperTests(APITestCase):
    def test_listing_parser_extracts_cards_and_checks_complete_result_count(self):
        from radar_jobs.services.ancps_sync import _parse_listing

        html = """
        <main>
          <p>2 certifications trouvées</p>
          <a href="/certification/cert-1">
            <div class="flex flex-wrap gap-2">
              <span>Licence</span><span>Formation / Diplôme</span>
            </div>
            <h2>Licence Informatique</h2>
            <p>Domaine</p><p>Numérique</p>
          </a>
          <a href="/certification/cert-2">
            <div class="flex flex-wrap gap-2"><span>Certification</span></div>
            <h2>Développeur Web</h2>
            <p>Domaine</p><p>Informatique</p>
          </a>
        </main>
        """

        cards = _parse_listing(html, "https://ancps.example/annuaire")

        self.assertEqual(len(cards), 2)
        self.assertEqual(cards[0]["source_id"], "cert-1")
        self.assertEqual(cards[0]["title"], "Licence Informatique")
        self.assertEqual(cards[0]["type"], "Formation / Diplôme")
        self.assertEqual(cards[0]["level"], "Licence")
        self.assertEqual(cards[0]["domain"], "Numérique")
        self.assertEqual(cards[1]["url"], "https://ancps.example/certification/cert-2")

    def test_listing_parser_rejects_partial_or_changed_listing(self):
        from radar_jobs.services.ancps_sync import _parse_listing

        with self.assertRaisesRegex(ValueError, "Liste ANCPS incomplète"):
            _parse_listing(
                '<main><p>2 certifications trouvées</p>'
                '<a href="/certification/cert-1"><h2>Certification</h2></a></main>',
                "https://ancps.example/annuaire",
            )

    def test_detail_parser_extracts_scraped_fields(self):
        from radar_jobs.services.ancps_sync import _detail_data

        html = """
        <header><div>
          <div><span>Formation / Diplôme</span><span>Licence</span><span>Vérifiée</span></div>
          <h1>Licence Informatique</h1>
          <p>Université de Dakar<span>Sénégal</span></p>
        </div></header>
        <main>
          <section><h2>Présentation</h2><p>Formation professionnelle en informatique.</p></section>
          <section><h2>Objectifs de la formation</h2><p>Former des professionnels.</p></section>
          <section><h2>Blocs de compétences</h2><ul><li>Développement web</li></ul></section>
          <section><h2>Informations complémentaires</h2><div>
            <div><p>Sigle</p><p>LI</p></div>
            <div><p>Domaine</p><p>Numérique</p></div>
            <div><p>Métiers associés</p><p>Développeur</p></div>
            <div><p>Établissements</p><p>Université de Dakar</p></div>
          </div></section>
          <aside><div>
            <h2>Informations clés</h2>
            <div><div><p>Niveau</p><p>Licence</p></div>
            <div><p>Type</p><p>Formation / Diplôme</p></div>
            <div><p>Durée</p><p>3 ans</p></div>
            <div><p>Modalité</p><p>Présentiel</p></div>
            <div><p>Organisme certificateur</p><p>Université de Dakar</p></div>
            <div><p>Domaine</p><p>Numérique</p></div>
            <div><p>Pays</p><p>Sénégal</p></div></div>
          </div></aside>
        </main>
        """
        card = {
            "source_id": "cert-1",
            "title": "Licence Informatique",
            "type": "Formation / Diplôme",
            "level": "Licence",
            "domain": "Numérique",
        }

        record = _detail_data(html, card, "https://ancps.example/certification/cert-1")

        self.assertEqual(record["title"], "Licence Informatique")
        self.assertEqual(record["organisme"], "Université de Dakar")
        self.assertEqual(record["niveauSortie"], "Licence")
        self.assertEqual(record["duree"], "3 ans")
        self.assertEqual(record["competences"], ["Développement web"])
        self.assertEqual(record["statutVerification"], "Vérifiée")
        self.assertTrue(record["published"])


class CleanerTests(APITestCase):
    def test_fallback_description_never_empty(self):
        df_raw = pd.DataFrame([{
            "title": "Dev Python",
            "company": "Bakeli",
            "location": "Dakar",
            "description": "",
            "date": "",
            "url": "https://example.com/offre-1",
            "contract_type": "CDI",
            "sector": "Informatique",
            "source": "test",
            "source_url": "https://example.com",
        }])
        df = DataCleaner().clean(df_raw)
        self.assertIsNotNone(df)
        desc = str(df.iloc[0]["description"])
        self.assertTrue(len(desc) > 20)
        self.assertNotIn("nan", desc.lower())


class CleanerEnrichmentTests(APITestCase):
    def test_company_sector_skills_extraction(self):
        df_raw = pd.DataFrame([{
            "title": "Sightsavers Recrute 01 Technical Tool Development",
            "company": "",
            "location": "Dakar",
            "description": "",
            "date": "",
            "url": "https://example.com/offre-2",
            "contract_type": "",
            "sector": "",
            "source": "test",
            "source_url": "https://example.com",
        }])
        df = DataCleaner().clean(df_raw)
        self.assertEqual(df.iloc[0]["company"], "Sightsavers")
        self.assertEqual(df.iloc[0]["sector"], "Informatique")
        self.assertIn("Développement", str(df.iloc[0]["key_skills"]))

    def test_no_rh_false_positive_on_recrutement_prefix(self):
        df_raw = pd.DataFrame([{
            "title": "Recrutement Keloora : Commerciaux / Business Developers",
            "company": "",
            "location": "Dakar",
            "description": "",
            "date": "",
            "url": "https://example.com/offre-3",
            "contract_type": "",
            "sector": "",
            "source": "test",
            "source_url": "https://example.com",
        }])
        df = DataCleaner().clean(df_raw)
        self.assertNotEqual(str(df.iloc[0]["key_skills"]).strip(), "RH")
        self.assertEqual(df.iloc[0]["sector"], "Commerce")


class JobAlertApiTests(APITestCase):
    def test_create_requires_criteria(self):
        r = self.client.post("/api/radar_jobs/alerts/", data={"email": "a@test.sn"}, format="json")
        self.assertEqual(r.status_code, 400)

    @patch("radar_jobs.services.brevo_service.send_email", return_value=True)
    def test_create_list_delete_flow(self, mock_send):
        r = self.client.post(
            "/api/radar_jobs/alerts/",
            data={"email": "a@test.sn", "keywords": "python dakar", "frequency": "daily"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.data["email_sent"])
        self.assertTrue(mock_send.called)
        alert_id = r.data["alert"]["id"]
        # Doublon exact -> 200, pas de 2e ligne
        r2 = self.client.post(
            "/api/radar_jobs/alerts/",
            data={"email": "a@test.sn", "keywords": "python dakar", "frequency": "daily"},
            format="json",
        )
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(JobAlert.objects.filter(email="a@test.sn", is_active=True).count(), 1)
        # Liste
        rl = self.client.get("/api/radar_jobs/alerts/list/?email=a@test.sn")
        self.assertEqual(rl.status_code, 200)
        self.assertEqual(rl.data["total"], 1)
        # Suppression avec mauvais email -> 404
        rd = self.client.delete(f"/api/radar_jobs/alerts/{alert_id}/?email=autre@test.sn")
        self.assertEqual(rd.status_code, 404)
        # Suppression OK
        rd = self.client.delete(f"/api/radar_jobs/alerts/{alert_id}/?email=a@test.sn")
        self.assertEqual(rd.status_code, 200)
        self.assertEqual(JobAlert.objects.filter(email="a@test.sn", is_active=True).count(), 0)

    def test_status_endpoint(self):
        r = self.client.get("/api/radar_jobs/alerts/status/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("brevo_configured", r.data)

    @staticmethod
    def _fresh_jobs_df():
        from datetime import date
        return pd.DataFrame([{
            'id': '0', 'title': 'Ingénieur Cloud Infrastructure', 'company': 'Stellarix',
            'location': 'Dakar', 'sector': 'Informatique', 'type': 'Stage',
            'contract_type': 'Stage', 'description': 'Administration Cloud et DevOps',
            'key_skills': 'Cloud', 'offer_url': 'https://example.com/offre-1',
            'source': 'test', 'scraped_date': date.today().isoformat(),
        }])

    @patch("radar_jobs.services.brevo_service.send_email", return_value=True)
    def test_matching_sends_for_keywords(self, mock_send):
        JobAlert.objects.create(email="dev@test.sn", keywords="Ingénieur Cloud", frequency="daily")
        from radar_jobs.tasks import send_job_alerts_for_frequencies
        with patch("radar_jobs.services.jobs_store.load_jobs_df", return_value=self._fresh_jobs_df()):
            sent = send_job_alerts_for_frequencies(["daily"])
        self.assertEqual(sent, 1)
        self.assertTrue(mock_send.called)
        subject = mock_send.call_args[0][1]
        self.assertIn("Ingénieur Cloud", subject)

    @patch("radar_jobs.services.brevo_service.send_email", return_value=True)
    def test_no_match_no_send(self, mock_send):
        JobAlert.objects.create(email="x@test.sn", keywords="astronaute martien zzz", frequency="daily")
        from radar_jobs.tasks import send_job_alerts_for_frequencies
        with patch("radar_jobs.services.jobs_store.load_jobs_df", return_value=self._fresh_jobs_df()):
            sent = send_job_alerts_for_frequencies(["daily"])
        self.assertEqual(sent, 0)
        self.assertFalse(mock_send.called)


class ChatDevQueryTests(APITestCase):
    def test_dev_query_returns_relevant_offers_without_gerant(self):
        captured = {}

        def fake_ask(messages, model=None):
            captured["prompt"] = messages[0]["content"]
            return "réponse mock"

        with patch("radar_jobs.views_chat.ask", side_effect=fake_ask):
            r = self.client.post(
                "/api/radar_jobs/chat/",
                data={"messages": [{"role": "user", "content": "développeurs logiciel xyz123"}]},
                format="json",
            )
        self.assertEqual(r.status_code, 200)
        prompt = captured.get("prompt", "")
        self.assertNotIn("Poste De Gerant", prompt)
        self.assertIn("Non spécifié", prompt, "sanity: le CSV contient encore des champs vides")
        # Le contexte JSON des offres ne doit plus contenir de "Non spécifié"
        context_part = prompt.split("### OFFRES DISPONIBLES", 1)[-1].split("### FORMAT", 1)[0]
        self.assertNotIn("Non spécifié", context_part)


class PartnersApiTests(APITestCase):
    def test_partners_aggregation_and_filtering(self):
        df_mock = pd.DataFrame([
            {'id': '1', 'company': 'Sonatel', 'sector': 'Telecom', 'offer_url': 'https://example.com/1'},
            {'id': '2', 'company': 'Sonatel', 'sector': 'Telecom', 'offer_url': 'https://example.com/2'},
            {'id': '3', 'company': 'Orange Sénégal', 'sector': 'Telecom', 'offer_url': 'https://example.com/3'},
            {'id': '4', 'company': '', 'sector': 'Informatique', 'offer_url': 'https://example.com/4'},
            {'id': '5', 'company': 'Dakar', 'sector': 'Informatique', 'offer_url': 'https://example.com/5'},
        ])
        with patch("radar_jobs.views_jobs.load_jobs_df_cached", return_value=df_mock):
            r = self.client.get("/api/radar_jobs/partners/")
            self.assertEqual(r.status_code, 200)
            self.assertTrue(r.data["success"])
            partners = r.data["partners"]
            # Should have Sonatel (2), Orange Sénégal (1), Non spécifié (2: empty + Dakar)
            self.assertEqual(len(partners), 3)
            self.assertEqual(partners[0]["name"], "Sonatel")
            self.assertEqual(partners[0]["activeOffers"], 2)
            self.assertEqual(partners[1]["name"], "Orange Sénégal")
            self.assertEqual(partners[1]["activeOffers"], 1)
            # Find Non spécifié
            non_spec = next(p for p in partners if p["name"] == "Non spécifié")
            self.assertEqual(non_spec["activeOffers"], 2)
