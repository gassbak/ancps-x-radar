from unittest.mock import patch

import requests
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from annuaire.services import LIST_CACHE_KEY

ITEMS = [
    {"_id": "1", "title": "Python Pro", "sigle": "PY", "organisme": {"nom": "Sonatel Academy"},
     "domaine": "Informatique", "lieu": "Dakar", "cout": "Gratuit", "statutVerification": "verifie"},
    {"_id": "2", "title": "Comptabilité", "organisme": "ISM", "domaine": "Gestion",
     "lieu": "Thiès", "cout": "150000"},
    {"_id": "3", "title": "Cybersécurité", "organisme": "ESP", "domaine": "Informatique", "lieu": "Dakar"},
]


class FakeResponse:
    def __init__(self, payload=None, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.text = ''

    def json(self):
        if self._payload is None:
            raise ValueError("not json")
        return self._payload


@patch('annuaire.services.requests.get')
class AnnuaireApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_liste_pagination(self, mock_get):
        mock_get.return_value = FakeResponse({"data": ITEMS})
        r = self.client.get('/api/annuaire/formations/?page_size=2')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['count'], 3)
        self.assertEqual(len(r.data['results']), 2)
        self.assertEqual(r.data['total_pages'], 2)
        r2 = self.client.get('/api/annuaire/formations/?page_size=2&page=2')
        self.assertEqual(len(r2.data['results']), 1)

    def test_liste_format_tableau_simple(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        r = self.client.get('/api/annuaire/formations/')
        self.assertEqual(r.data['count'], 3)

    def test_recherche_par_mot_cle(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        r = self.client.get('/api/annuaire/formations/?q=python')
        self.assertEqual(r.data['count'], 1)
        r = self.client.get('/api/annuaire/formations/?q=sonatel')  # organisme (objet)
        self.assertEqual(r.data['count'], 1)

    def test_filtres_cumulables(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        r = self.client.get('/api/annuaire/formations/?domain=Informatique&region=Dakar')
        self.assertEqual(r.data['count'], 2)
        r = self.client.get('/api/annuaire/formations/?domain=Informatique&region=Dakar&cost=free')
        self.assertEqual(r.data['count'], 1)

    def test_cout_inconnu_et_non_renseigne(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        r = self.client.get('/api/annuaire/formations/?cost=unknown')
        self.assertEqual([i['_id'] for i in r.data['results']], ["3"])
        r = self.client.get('/api/annuaire/formations/?status=__missing__')
        self.assertEqual(r.data['count'], 2)

    def test_facettes_sans_invention(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        r = self.client.get('/api/annuaire/formations/')
        self.assertEqual(r.data['facets']['domain'], ["Gestion", "Informatique"])
        self.assertEqual(r.data['facets']['organization'], ["ESP", "ISM", "Sonatel Academy"])

    def test_parametres_invalides(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        self.assertEqual(self.client.get('/api/annuaire/formations/?page=abc').status_code, 400)
        self.assertEqual(self.client.get('/api/annuaire/formations/?page_size=999').status_code, 400)
        self.assertEqual(self.client.get('/api/annuaire/formations/?cost=cher').status_code, 400)

    def test_detail(self, mock_get):
        mock_get.return_value = FakeResponse({"data": ITEMS[0]})
        r = self.client.get('/api/annuaire/formations/1/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['data']['title'], "Python Pro")

    def test_detail_introuvable(self, mock_get):
        mock_get.return_value = FakeResponse({}, status_code=404)
        self.assertEqual(self.client.get('/api/annuaire/formations/999/').status_code, 404)

    def test_detail_identifiant_invalide(self, mock_get):
        self.assertEqual(self.client.get('/api/annuaire/formations/a%20b%3Bc/').status_code, 400)
        mock_get.assert_not_called()

    def test_panne_ancps_erreur_maitrisee(self, mock_get):
        mock_get.side_effect = requests.ConnectionError()
        r = self.client.get('/api/annuaire/formations/')
        self.assertEqual(r.status_code, 503)
        self.assertIn('error', r.data)

    def test_timeout_ancps(self, mock_get):
        mock_get.side_effect = requests.Timeout()
        self.assertEqual(self.client.get('/api/annuaire/formations/').status_code, 503)

    def test_copie_de_secours_si_ancps_tombe(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        self.assertFalse(self.client.get('/api/annuaire/formations/').data['stale'])
        cache.delete(LIST_CACHE_KEY)  # cache frais expiré, copie de secours conservée
        mock_get.side_effect = requests.ConnectionError()
        r = self.client.get('/api/annuaire/formations/')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data['stale'])
        self.assertEqual(r.data['count'], 3)

    def test_cache_evite_un_second_appel(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        self.client.get('/api/annuaire/formations/')
        self.client.get('/api/annuaire/formations/?q=python')
        self.assertEqual(mock_get.call_count, 1)

    def test_health(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        r = self.client.get('/api/annuaire/health/')
        self.assertEqual(r.data['status'], 'ok')
        mock_get.side_effect = requests.ConnectionError()
        cache.clear()
        self.assertEqual(self.client.get('/api/annuaire/health/').status_code, 503)




        
    def test_description_polluee_devient_indisponible(self, mock_get):
        polluee = ("Agriculture, EnvironnementAgroalimentaireArt, Culture, DesignAudit et "
                   "GestionAutomobileBien-être, BeautéHôtellerie, TourismeInformatique, "
                   "TélécomTransport, Logistique")
        items = [
            {"_id": "1", "title": "BTS Nutrition", "description": polluee},
            {"_id": "2", "title": "Python", "description": "Apprendre Python en 3 mois."},
        ]
        mock_get.return_value = FakeResponse(items)
        r = self.client.get('/api/annuaire/formations/')
        by_id = {i['_id']: i for i in r.data['results']}
        self.assertIsNone(by_id["1"]["description"])
        self.assertEqual(by_id["2"]["description"], "Apprendre Python en 3 mois.")
        mock_get.return_value = FakeResponse({"data": items[0]})
        d = self.client.get('/api/annuaire/formations/1/')
        self.assertIsNone(d.data['data']['description'])