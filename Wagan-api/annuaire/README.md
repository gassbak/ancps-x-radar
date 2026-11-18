# Module Annuaire (formations et certifications ANCPS) — documentation technique

Tâche 21 — intégration de l'annuaire national ANCPS dans Bakeli Radar.
Cahier des charges de référence : v1.0 du 26 octobre 2026.

## 1. Architecture

```
Radar (React)  →  /api/annuaire/…  (app Django « annuaire », Wagan-api)  →  API ANCPS
                  cache + délais + erreurs maîtrisées                      (source de vérité)
Favoris, événements : tables Django (annuaire_favorite, annuaire_annuaireevent)
Assistant IA : radar_jobs/views_chat.py  →  annuaire/ai_context.py  →  même cache ANCPS
```

- ANCPS reste la source de vérité : aucune fiche n'est copiée en base. Seuls les identifiants ANCPS sont stockés.
- L'app `ancps/` (locale, non utilisée par Radar) n'est ni modifiée ni appelée par ce module.
- Une panne d'ANCPS ne bloque pas le reste de Radar : erreurs 503 explicites, copie de secours, chat inchangé.

## 2. API (préfixe `/api/annuaire/`)

| Méthode et route | Accès | Rôle |
|---|---|---|
| `GET formations/?q=&page=&page_size=&type=&domain=&level=&region=&modality=&duration=&organization=&status=&category=&cost=` | public | liste paginée (12 par défaut, 50 max), compteur, facettes ; `cost` = free/paid/unknown ; `__missing__` = champ non renseigné |
| `GET formations/<id>/` | public | fiche telle que fournie par ANCPS (description polluée → null) |
| `GET health/` | public | état de la liaison avec ANCPS |
| `POST events/` | public | événement d'usage anonyme (liste fermée de 9 événements) |
| `GET stats/?days=30` | admin/coach/staff | comptages agrégés |
| `GET/POST me/favorites/`, `DELETE me/favorites/<id>/` | compte connecté | favoris (chaque compte ne voit que les siens) |

## 3. Cache et fiabilité (T11, T12)

- Données fraîches : `ANCPS_CACHE_TTL` (300 s). Copie de secours : `ANCPS_STALE_TTL` (24 h), servie avec `"stale": true` si ANCPS est injoignable.
- Délai d'appel : `ANCPS_TIMEOUT` (45 s, Render peut mettre ~30 s à se réveiller) ; pour le chat : `ANCPS_CHAT_TIMEOUT` (8 s).
- Cache Django par défaut (mémoire du processus) ; `REDIS_CACHE_URL` active Redis (déjà prévu dans `settings/base.py`).
- Une modification dans ANCPS est visible dans Radar au plus tard `ANCPS_CACHE_TTL` secondes après.
- Limitation de débit par IP : 120 requêtes/min (90/min pour les événements).

## 4. Variables d'environnement

| Variable | Où | Défaut | Rôle |
|---|---|---|---|
| `ANCPS_API_URL` | backend | `https://ancps-senegal-cvke.onrender.com/api` | adresse de l'API ANCPS |
| `ANCPS_TIMEOUT`, `ANCPS_CACHE_TTL`, `ANCPS_STALE_TTL`, `ANCPS_CHAT_TIMEOUT` | backend | 45, 300, 86400, 8 | voir §3 |
| `VITE_ANNUAIRE_API_URL` | frontend (Vercel) | vide | adresse du backend annuaire, ex. `https://api-wagan.bakeli.tech/api/annuaire`. Vide = ancien catalogue (appel direct à ANCPS) |
| `VITE_AUTH_API_URL` | frontend | déjà existante | connexion (`/jwt/create/`, `/jwt/refresh/`) |

Aucun secret n'est exposé au navigateur.

## 5. Données personnelles et analytics

- Événements : `directory_opened`, `formation_search_performed`, `filter_applied`, `formation_viewed`, `formation_saved`, `comparison_started`, `outbound_registration_clicked` (+ `recommendation_*` réservés).
- Stockés : nom de l'événement, identifiant de formation, un détail court (filtre utilisé, site visité), nombre de résultats, identifiant de session aléatoire (navigateur), date. **Jamais** : utilisateur, IP, texte de recherche.
- Favoris : `radar_user_id` + `formation_id` ; supprimés à la demande de l'utilisateur (bouton « Retirer »).
- À décider avec le Product Owner : durée de conservation des événements et conformité à la loi n° 2008-12.

## 6. Déploiement

1. Déployer le backend (nouveau code) puis appliquer **uniquement** la migration du module : `python manage.py migrate annuaire` (crée 2 tables, ne modifie aucune table existante).
2. Vérifier `GET /api/annuaire/health/` (peut prendre ~30 s au réveil d'ANCPS) puis `GET /api/annuaire/formations/?page_size=2`.
3. Vérifier que le CORS du backend autorise le domaine du frontend Radar.
4. **Seulement ensuite**, définir `VITE_ANNUAIRE_API_URL` sur Vercel et redéployer le frontend.
5. Vérifier en production : catalogue, fiche, comparateur, connexion, favoris, assistant IA (« quelles formations en informatique ? »).
6. Si le serveur lance gunicorn, vérifier que son `--timeout` est supérieur à `ANCPS_TIMEOUT`.

## 7. Retour arrière

- Rapide (sans toucher au code) : supprimer `VITE_ANNUAIRE_API_URL` sur Vercel et redéployer → retour à l'ancien catalogue.
- Backend : retirer `'annuaire'` de `INSTALLED_APPS`, la route `api/annuaire/` de `wagan_project/urls.py`, les 4 lignes ajoutées dans `radar_jobs/views_chat.py`, puis (facultatif) `python manage.py migrate annuaire zero` pour supprimer les 2 tables.
- Les données d'ANCPS ne sont jamais modifiées par Radar.

## 8. Recette (cahier des charges, section 14)

| Test | Vérification | Couverture automatique |
|---|---|---|
| T01 | ouvrir « Formations & Certifications » depuis Radar, revenir au tableau de bord | manuelle |
| T02–T04 | recherche, filtres cumulés, réinitialisation | `annuaire/tests.py` + manuelle |
| T05 | fiche : champs absents indiqués « Non renseigné », description polluée masquée | `test_description_polluee…` + manuelle |
| T06 | liens externes = site officiel de l'organisme | manuelle |
| T07 | ajout / retrait d'un favori | `test_favorites.py`, `test_auth_flow.py` |
| T08 | un compte ne voit pas les favoris d'un autre | `test_un_utilisateur_ne_voit_pas…`, `test_favoris_prives…` |
| T09 | comparaison de 2 à 3 formations, données manquantes signalées | manuelle |
| T10 | usage sur smartphone | manuelle |
| T11 | ANCPS indisponible : erreur maîtrisée | `test_panne_ancps…`, `test_timeout…` |
| T12 | modification ANCPS visible selon le cache | manuelle (attendre 5 min) |
| T13 | aucune régression | `python manage.py test radar_jobs cv_scoring annuaire` |
| T14 | événements enregistrés | `test_tracking.py` + manuelle (`/api/annuaire/stats/`) |
| T15 (à ajouter) | l'assistant répond aux questions de formation avec les fiches ANCPS, sans rien inventer | `test_ai_context.py` |
| T16 (à ajouter) | ANCPS en panne : l'assistant répond toujours sur les offres d'emploi | `test_ancps_en_panne_le_chat_repond`, `test_question_emploi_inchangee` |

## 9. Anomalies connues et travaux reportés

- F07 : « Voir les modalités d'inscription » et « Contacter l'organisme » non implémentés (les champs ANCPS correspondants n'ont pas été confirmés) ; « Visiter le site officiel » et « Voir la source » sont disponibles et comptabilisés.
- Les fiches sans coût renseigné (cas de la fiche examinée) s'affichent « Non renseigné » ; ANCPS ne fournit pas de champ coût dans l'échantillon vérifié.
- Pas de page d'inscription (création de compte) dans Radar : la connexion utilise les comptes existants.
- V1.1 non réalisé : recommandations personnalisées, écarts de compétences, plan de développement.
- Ancienne page catalogue (`FormationsPage.jsx`) conservée tant que la production n'a pas validé le nouveau catalogue ; à retirer ensuite.
- Le cache par défaut est local à chaque processus : plusieurs workers = plusieurs caches (Redis recommandé en production).
- `ancps/` (dossier local non versionné) fait doublon avec `annuaire` et n'est utilisé par rien : à retirer après vérification (`git grep "api/ancps"`).
