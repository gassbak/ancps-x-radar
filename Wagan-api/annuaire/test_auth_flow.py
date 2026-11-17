"""Connexion réelle (Djoser) puis usage des favoris et des statistiques."""
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from wagan_app.models import CustomUser


def login(client, email, password='Secret123!'):
    r = client.post('/api/auth/jwt/create/', {'email': email, 'password': password}, format='json')
    assert r.status_code == 200, r.data
    return r.data


class AuthFlowTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        CustomUser.objects.create_user(email='etu@test.sn', password='Secret123!')
        CustomUser.objects.create_user(email='autre@test.sn', password='Secret123!')
        CustomUser.objects.create_user(email='staff@test.sn', password='Secret123!', is_staff=True)

    def test_favoris_avec_jeton_djoser(self):
        tokens = login(self.client, 'etu@test.sn')
        auth = f"Bearer {tokens['access']}"
        r = self.client.post('/api/annuaire/me/favorites/', {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=auth)
        self.assertEqual(r.status_code, 201)
        r = self.client.get('/api/annuaire/me/favorites/', HTTP_AUTHORIZATION=auth)
        self.assertEqual(r.data['count'], 1)

    def test_favoris_prives_entre_comptes(self):  # T08
        a = f"Bearer {login(self.client, 'etu@test.sn')['access']}"
        b = f"Bearer {login(self.client, 'autre@test.sn')['access']}"
        self.client.post('/api/annuaire/me/favorites/', {'formation_id': 'f1'}, format='json', HTTP_AUTHORIZATION=a)
        self.assertEqual(self.client.get('/api/annuaire/me/favorites/', HTTP_AUTHORIZATION=b).data['count'], 0)

    def test_renouvellement_du_jeton(self):
        tokens = login(self.client, 'etu@test.sn')
        r = self.client.post('/api/auth/jwt/refresh/', {'refresh': tokens['refresh']}, format='json')
        self.assertEqual(r.status_code, 200)
        auth = f"Bearer {r.data['access']}"
        self.assertEqual(self.client.get('/api/annuaire/me/favorites/', HTTP_AUTHORIZATION=auth).status_code, 200)

    def test_jeton_invalide_refuse(self):
        r = self.client.get('/api/annuaire/me/favorites/', HTTP_AUTHORIZATION='Bearer nimporte.quoi.xx')
        self.assertIn(r.status_code, (401, 403))

    def test_stats_staff_django(self):
        etu = f"Bearer {login(self.client, 'etu@test.sn')['access']}"
        staff = f"Bearer {login(self.client, 'staff@test.sn')['access']}"
        self.assertEqual(self.client.get('/api/annuaire/stats/', HTTP_AUTHORIZATION=etu).status_code, 403)
        self.assertEqual(self.client.get('/api/annuaire/stats/', HTTP_AUTHORIZATION=staff).status_code, 200)
