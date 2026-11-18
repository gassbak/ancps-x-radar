import jwt
from django.conf import settings
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from annuaire.models import AnnuaireEvent


def make_token(user_id='u1', statut='etudiant'):
    key = settings.SIMPLE_JWT['SIGNING_KEY']
    return jwt.encode({'sub': user_id, 'email': f'{user_id}@test.sn', 'statut': statut}, key, algorithm='HS256')


class TrackingTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_evenement_enregistre(self):
        r = self.client.post('/api/annuaire/events/', {
            'event': 'outbound_registration_clicked', 'formation_id': 'abc123',
            'detail': 'website', 'session_id': 'sess-12345678'}, format='json')
        self.assertEqual(r.status_code, 204)
        ev = AnnuaireEvent.objects.get()
        self.assertEqual((ev.event, ev.formation_id, ev.detail), ('outbound_registration_clicked', 'abc123', 'website'))

    def test_recherche_sans_resultat_compte(self):
        r = self.client.post('/api/annuaire/events/', {'event': 'formation_search_performed', 'result_count': 0}, format='json')
        self.assertEqual(r.status_code, 204)
        self.assertEqual(AnnuaireEvent.objects.get().result_count, 0)

    def test_entrees_invalides_refusees(self):
        bad = [
            {'event': 'inconnu'},
            {'event': 'formation_viewed', 'formation_id': 'a b;c'},
            {'event': 'formation_search_performed', 'result_count': -1},
            {'event': 'formation_search_performed', 'result_count': True},
            {'event': 'directory_opened', 'session_id': 'x'},
            {'event': 'filter_applied', 'detail': 'x' * 61},
            {},
        ]
        for payload in bad:
            r = self.client.post('/api/annuaire/events/', payload, format='json')
            self.assertEqual(r.status_code, 400, payload)
        self.assertEqual(AnnuaireEvent.objects.count(), 0)

    def test_stats_reservees_aux_admins(self):
        self.assertEqual(self.client.get('/api/annuaire/stats/').status_code, 401)
        r = self.client.get('/api/annuaire/stats/', HTTP_AUTHORIZATION=f'Bearer {make_token("u1", "etudiant")}')
        self.assertEqual(r.status_code, 403)

    def test_stats_agregees(self):
        for payload in [
            {'event': 'outbound_registration_clicked', 'formation_id': 'A', 'session_id': 'sess-aaaaaaaa'},
            {'event': 'outbound_registration_clicked', 'formation_id': 'A', 'session_id': 'sess-bbbbbbbb'},
            {'event': 'outbound_registration_clicked', 'formation_id': 'B', 'session_id': 'sess-bbbbbbbb'},
            {'event': 'formation_search_performed', 'result_count': 0, 'session_id': 'sess-aaaaaaaa'},
            {'event': 'formation_search_performed', 'result_count': 4, 'session_id': 'sess-aaaaaaaa'},
        ]:
            self.client.post('/api/annuaire/events/', payload, format='json')
        r = self.client.get('/api/annuaire/stats/?days=7', HTTP_AUTHORIZATION=f'Bearer {make_token("a1", "admin")}')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['events']['outbound_registration_clicked'], 3)
        self.assertEqual(r.data['unique_sessions'], 2)
        self.assertEqual(r.data['searches_total'], 2)
        self.assertEqual(r.data['searches_without_results'], 1)
        self.assertEqual(r.data['top_outbound_clicks'][0], {'formation_id': 'A', 'clicks': 2})
        self.assertEqual(self.client.get('/api/annuaire/stats/?days=0',
                                         HTTP_AUTHORIZATION=f'Bearer {make_token("a1", "admin")}').status_code, 400)
