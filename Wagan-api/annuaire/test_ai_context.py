import json
from unittest.mock import patch

import requests
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from annuaire.ai_context import build_formations_context, is_formation_query
from radar_jobs import views_chat

ITEMS = [
    {"_id": "f1", "title": "Licence Informatique et Réseaux", "domaine": {"nom": "Informatique"},
     "organisme": {"nom": "ESMT", "siteWeb": "https://esmt.example"}, "lieu": "Dakar",
     "niveauSortie": {"nom": "Licence"}, "statutVerification": {"nom": "Vérifiée"},
     "sourceLastVerifiedAt": "2026-11-13", "cout": "Gratuit"},
    {"_id": "f2", "title": "Comptabilité et Gestion", "domaine": {"nom": "Gestion"}, "organisme": {"nom": "ISM"}},
    {"_id": "f3", "title": "Certification Cybersécurité", "domaine": {"nom": "Informatique"},
     "organisme": {"nom": "Orange Digital Center"}},
]


class FakeResponse:
    status_code = 200

    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload


class IntentTests(TestCase):
    def test_detection(self):
        for q in ["Quelles formations en informatique ?", "je cherche une certification cloud",
                  "un BTS en gestion", "Je veux me former au développement web", "licence en droit"]:
            self.assertTrue(is_formation_query(q), q)
        for q in ["Offres d'emploi développeur à Dakar", "stage marketing", "comment postuler ?",
                  "poste de formateur"]:
            self.assertFalse(is_formation_query(q), q)


@patch('annuaire.services.requests.get')
class ContextTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_pas_de_contexte_pour_une_offre_demploi(self, mock_get):
        self.assertIsNone(build_formations_context("offres développeur Dakar"))
        mock_get.assert_not_called()

    def test_resultats_classes_sans_champs_inventes(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        ctx = build_formations_context("formation en informatique à Dakar")
        self.assertTrue(ctx['available'])
        self.assertEqual(ctx['count'], 2)
        section = ctx['prompt_section']
        self.assertIn("Licence Informatique et Réseaux", section)
        self.assertNotIn("Comptabilité", section)
        payload = json.loads(section.split("\n")[2])
        f1 = payload[0]
        self.assertEqual((f1['organisme'], f1['site_officiel'], f1['statut_verification']),
                         ("ESMT", "https://esmt.example", "Vérifiée"))
        cyber = [p for p in payload if p['id'] == 'f3'][0]
        for absent in ('lieu', 'duree', 'cout', 'site_officiel', 'statut_verification', 'niveau'):
            self.assertNotIn(absent, cyber)
        self.assertIn("INTERDIT d'inventer", section)
        self.assertIn("accrédité", section)
        self.assertIn("🎓", ctx['fallback_text'])

    def test_aucune_correspondance(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        ctx = build_formations_context("formation en astrophysique quantique")
        self.assertEqual(ctx['count'], 0)
        self.assertIn("AUCUNE CORRESPONDANCE", ctx['prompt_section'])
        self.assertIsNone(ctx['fallback_text'])

    def test_annuaire_indisponible(self, mock_get):
        mock_get.side_effect = requests.ConnectionError()
        ctx = build_formations_context("quelles formations en gestion ?")
        self.assertFalse(ctx['available'])
        self.assertIn("INDISPONIBLE", ctx['prompt_section'])
        self.assertIn("AUCUNE formation précise", ctx['prompt_section'])

    def test_question_generale_donne_des_exemples(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        ctx = build_formations_context("quelles formations existent ?")
        self.assertIn("exemples non filtrés", ctx['prompt_section'])
        self.assertEqual(ctx['count'], 3)


@patch('annuaire.services.requests.get')
class ChatIntegrationTests(TestCase):
    def setUp(self):
        cache.clear()
        views_chat._CHAT_CACHE.clear()
        self.client = APIClient()

    def _chat(self, text):
        return self.client.post('/api/radar_jobs/chat/', {'messages': [{'role': 'user', 'content': text}]}, format='json')

    @patch('radar_jobs.views_chat.ask', return_value="Réponse IA")
    def test_question_formation_ajoute_les_fiches_au_prompt(self, mock_ask, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        r = self._chat("formation en informatique")
        self.assertEqual((r.status_code, r.json()['response']), (200, "Réponse IA"))
        system_prompt = mock_ask.call_args[0][0][0]['content']
        self.assertIn("Licence Informatique et Réseaux", system_prompt)
        self.assertIn("RÈGLES POUR LES FORMATIONS", system_prompt)

    @patch('radar_jobs.views_chat.ask', return_value="Réponse IA")
    def test_question_emploi_inchangee(self, mock_ask, mock_get):
        r = self._chat("offres de stage marketing")
        self.assertEqual(r.status_code, 200)
        system_prompt = mock_ask.call_args[0][0][0]['content']
        self.assertNotIn("FORMATIONS", system_prompt)
        mock_get.assert_not_called()

    @patch('radar_jobs.views_chat.ask', return_value="Réponse IA")
    def test_ancps_en_panne_le_chat_repond(self, mock_ask, mock_get):
        mock_get.side_effect = requests.ConnectionError()
        r = self._chat("une formation en gestion")
        self.assertEqual(r.status_code, 200)
        self.assertIn("INDISPONIBLE", mock_ask.call_args[0][0][0]['content'])

    @patch('radar_jobs.views_chat.ask', side_effect=Exception("RATE_LIMIT:20"))
    def test_groq_sature_renvoie_les_formations_sans_ia(self, mock_ask, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        r = self._chat("certification cybersécurité")
        self.assertEqual(r.status_code, 200)
        text = r.json()['response']
        self.assertIn("Certification Cybersécurité", text)
        self.assertIn("accréditation", text)
