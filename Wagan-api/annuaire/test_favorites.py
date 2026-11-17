from unittest.mock import patch

import requests
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from annuaire.models import Favorite
from annuaire.test_tracking import make_token

ITEMS = [
    {"_id": "f1", "title": "Python Pro", "organisme": {"nom": "Sonatel Academy"}},
    {"_id": "f2", "title": "Comptabilité", "organisme": "ISM"},
]


class FakeResponse:
    status_code = 200

    def __init__(self, payload):
        self._payload = payload

    def json(self):
        return self._payload


URL = '/api/annuaire/me/favorites/'


class FavoritesTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.a = f'Bearer {make_token("user-a")}'
        self.b = f'Bearer {make_token("user-b")}'

    def test_non_connecte_refuse(self):
        self.assertEqual(self.client.get(URL).status_code, 401)
        self.assertEqual(self.client.post(URL, {'formation_id': 'f1'}, format='json').status_code, 401)
        self.assertEqual(self.client.delete(URL + 'f1/').status_code, 401)

    def test_ajout_sans_doublon_et_retrait(self):
        r = self.client.post(URL, {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=self.a)
        self.assertEqual((r.status_code, r.data['created']), (201, True))
        r = self.client.post(URL, {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=self.a)
        self.assertEqual((r.status_code, r.data['created']), (200, False))
        self.assertEqual(Favorite.objects.count(), 1)
        self.assertEqual(self.client.delete(URL + 'f1/', HTTP_AUTHORIZATION=self.a).status_code, 204)
        self.assertEqual(Favorite.objects.count(), 0)
        self.assertEqual(self.client.delete(URL + 'f1/', HTTP_AUTHORIZATION=self.a).status_code, 204)

    @patch('annuaire.services.requests.get')
    def test_liste_avec_fiche(self, mock_get):
        mock_get.return_value = FakeResponse(ITEMS)
        self.client.post(URL, {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=self.a)
        r = self.client.get(URL, HTTP_AUTHORIZATION=self.a)
        self.assertEqual(r.data['count'], 1)
        self.assertEqual(r.data['favorites'][0]['formation']['title'], 'Python Pro')

    def test_un_utilisateur_ne_voit_pas_les_favoris_dautrui(self):  # T08
        self.client.post(URL, {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=self.a)
        with patch('annuaire.services.requests.get', side_effect=requests.ConnectionError()):
            r = self.client.get(URL, HTTP_AUTHORIZATION=self.b)
        self.assertEqual(r.data['count'], 0)
        self.client.delete(URL + 'f1/', HTTP_AUTHORIZATION=self.b)
        self.assertEqual(Favorite.objects.filter(radar_user_id='user-a').count(), 1)

    def test_liste_si_ancps_indisponible(self):
        self.client.post(URL, {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=self.a)
        with patch('annuaire.services.requests.get', side_effect=requests.ConnectionError()):
            r = self.client.get(URL, HTTP_AUTHORIZATION=self.a)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['favorites'][0]['formation_id'], 'f1')
        self.assertIsNone(r.data['favorites'][0]['formation'])

    def test_entrees_invalides_et_limite(self):
        for payload in ({}, {'formation_id': 'a b'}, {'formation_id': 12}):
            r = self.client.post(URL, payload, format='json', HTTP_AUTHORIZATION=self.a)
            self.assertEqual(r.status_code, 400, payload)
        with patch('annuaire.views_favorites.MAX_FAVORITES', 1):
            self.client.post(URL, {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=self.a)
            r = self.client.post(URL, {'formation_id': 'f2'}, format='json', HTTP_AUTHORIZATION=self.a)
            self.assertEqual(r.status_code, 400)
            r = self.client.post(URL, {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=self.a)
            self.assertEqual(r.status_code, 200)
