import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient

from cv_scoring.models import UserProfile, CVAnalysis
from cv_scoring.services.cv_analyzer import normalize_score, _resolve_model

MOCK_JSON = json.dumps({
    "matching_analysis": ["Python"],
    "description": "Bon profil.",
    "score": 82,
    "recommendation": "Ajouter Docker.",
})
MOCK_PAYLOAD = {"choices": [{"message": {"content": MOCK_JSON}}]}


class NormalizeScoreTests(APITestCase):
    def test_clamp(self):
        self.assertEqual(normalize_score(82), 82)
        self.assertEqual(normalize_score(150), 100)
        self.assertEqual(normalize_score(-5), 0)
        self.assertEqual(normalize_score("abc"), 0)
        self.assertEqual(normalize_score(None), 0)

    def test_model_central(self):
        self.assertTrue(_resolve_model())


class HealthTests(APITestCase):
    def test_health(self):
        r = self.client.get("/api/cv-scoring/health/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("groq_model", r.data)


class MatchValidationTests(APITestCase):
    def test_bad_extension_rejected(self):
        cv = SimpleUploadedFile("cv.txt", b"dev python", content_type="text/plain")
        bad = SimpleUploadedFile("job.exe", b"x", content_type="application/octet-stream")
        r = self.client.post("/api/cv-scoring/match/", data={"cv": cv, "job": bad}, format="multipart")
        self.assertEqual(r.status_code, 400)

    @patch("cv_scoring.services.cv_analyzer.call_groq_api", return_value=MOCK_PAYLOAD)
    def test_match_ok(self, _):
        cv = SimpleUploadedFile("cv.txt", b"dev python django", content_type="text/plain")
        job = SimpleUploadedFile("job.txt", b"offre dev python django", content_type="text/plain")
        r = self.client.post("/api/cv-scoring/match/", data={"cv": cv, "job": job}, format="multipart")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["result"]["score"], 82)


class ScrapedPublicTests(APITestCase):
    @patch("cv_scoring.services.cv_analyzer.call_groq_api", return_value=MOCK_PAYLOAD)
    def test_ok_and_score_int(self, _):
        cv = SimpleUploadedFile("cv.txt", b"Je suis dev Python", content_type="text/plain")
        r = self.client.post("/api/cv-scoring/analyze-scraped/", data={"job_id": "0", "cv": cv}, format="multipart")
        self.assertEqual(r.status_code, 200)
        self.assertIn("job", r.data)
        self.assertIsInstance(r.data["result"]["score"], int)

    def test_not_found(self):
        cv = SimpleUploadedFile("cv.txt", b"x", content_type="text/plain")
        r = self.client.post("/api/cv-scoring/analyze-scraped/", data={"job_id": "999999", "cv": cv}, format="multipart")
        self.assertEqual(r.status_code, 404)

    def test_bad_extension(self):
        bad = SimpleUploadedFile("cv.exe", b"x", content_type="application/octet-stream")
        r = self.client.post("/api/cv-scoring/analyze-scraped/", data={"job_id": "0", "cv": bad}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_missing_job_id(self):
        cv = SimpleUploadedFile("cv.txt", b"x", content_type="text/plain")
        r = self.client.post("/api/cv-scoring/analyze-scraped/", data={"cv": cv}, format="multipart")
        self.assertEqual(r.status_code, 400)


class ScrapedProfileTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email="scoring@test.sn", username="scoring", password="pass12345")
        self.profile, _ = UserProfile.objects.get_or_create(user=self.user)
        self.profile.cv_text = "CV test : developpeur Python Django 5 ans"
        self.profile.save()
        self.client.force_authenticate(user=self.user)

    @patch("cv_scoring.services.cv_analyzer.call_groq_api", return_value=MOCK_PAYLOAD)
    def test_ok_creates_history_and_updates_profile(self, _):
        before = CVAnalysis.objects.filter(user=self.user).count()
        r = self.client.post("/api/cv-scoring/analyze-scraped/profile/", data={"job_id": "1"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("analysis_id", r.data)
        self.assertEqual(CVAnalysis.objects.filter(user=self.user).count(), before + 1)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_score, 82)
        self.assertGreaterEqual(self.profile.total_analyses, 1)


class HistoryValidationTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email="hist@test.sn", username="hist", password="pass12345")
        self.client.force_authenticate(user=self.user)

    def test_invalid_limit_returns_400_not_500(self):
        r = self.client.get("/api/cv-scoring/history/?limit=abc")
        self.assertEqual(r.status_code, 400)

    def test_limit_clamped(self):
        r = self.client.get("/api/cv-scoring/history/?limit=9999")
        self.assertEqual(r.status_code, 200)
        self.assertLessEqual(r.data["limit"], 100)
