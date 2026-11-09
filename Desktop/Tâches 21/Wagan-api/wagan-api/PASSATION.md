# 🚀 GUIDE DE PASSATION TECHNIQUE : WAGAN-API & BAKELI-RADAR

Ce document résume l'architecture actuelle, les fonctionnalités implémentées, l'état de la liaison front-back, et les axes d'amélioration pour le prochain développeur.

---

## 📂 1. ARCHITECTURE DES REPOS
Le projet est divisé en deux parties distinctes :
1. **Backend Django API (`wagan-api`)** — Localisé dans `C:\Users\hp\wagan-api`
   - Gère le scraping multi-sources (`radar_jobs`), l'intelligence artificielle Groq (`qwen/qwen3.8-27b`), et le CV Scoring (`cv_scoring`).
2. **Frontend React / Vite (`Bakeli_radar`)** — Localisé dans `C:\Users\hp\Desktop\Bakeli_radar`
   - Interface utilisateur moderne (Tailwind CSS, Lucide Icons, Recharts).

---

## ⚙️ 2. FONCTIONNALITÉS IMPLÉMENTÉES & FLUX CLÉS

### A. Pipeline de Scraping & Normalisation (`radar_jobs`)
- **Sites actifs** : EmploiDakar, Expat-Dakar, JobSenegal, ConcoursSN.
- **Stockage unifié** : `media/data/jobs_senegal_processed.csv`.
- **Enrichissement des descriptions** : Le `DataCleaner` intègre un mécanisme de génération de description contextuelle par défaut si le site source charge son contenu dynamiquement en JS.

### B. Scoring CV depuis une Offre Scrapée (Cœur de la demande)
L'utilisateur peut cliquer sur **« Scorer mon CV sur cette offre »** depuis n'importe quelle carte d'opportunité :
1. **Sélection de l'offre** : L'ID ou l'`offer_url` de l'offre est passé au modal de scoring (`CvScoringModal.jsx`).
2. **Requête API Backend** :
   - *Mode Public (Upload unique)* : `POST /api/cv-scoring/analyze-scraped/` (multipart: `job_id` + fichier `cv`).
   - *Mode Authentifié (Profil stocké)* : `POST /api/cv-scoring/analyze-scraped/profile/` (JSON: `job_id`, authentifié par JWT).
3. **Résultat** : L'IA Groq analyse la correspondance, renvoie un score (0-100), les compétences communes et des recommandations. L'historique est enregistré dans la table `CVAnalysis`.

---

## 🛠️ 3. CONFIGURATION ET LANCEMENT LOCAL

### Backend (`wagan-api`)
- Fichier `.env` requis à la racine :
  ```env
  GROQ_API_KEY=gsk_...
  DJANGO_SECRET_KEY=...
  ```
- Commandes :
  ```bash
  python manage.py migrate
  python manage.py runserver
  ```

### Frontend (`Bakeli_radar`)
- Fichier `.env` configuré pour pointer vers le backend local :
  ```env
  VITE_API_BASE_URL=http://127.0.0.1:8000/api/radar_jobs
  VITE_CV_API_URL=http://127.0.0.1:8000/api/cv-scoring
  VITE_AUTH_API_URL=http://127.0.0.1:8000/api/auth
  ```
- Commandes :
  ```bash
  npm install
  npm run dev
  ```

---

## 🔮 4. AXES D'AMÉLIORATION POUR LE PROCHAIN DÉVELOPPEUR

1. **Scraping Headless Avancé (Playwright / Selenium)** :
   - Actuellement, certains sites utilisent du rendu lourd React/Vue. Remplacer ou compléter le scraping par un script Playwright asynchrone permettrait d'extraire les descriptions HTML profondes de manière 100% fidèle sans fallback textuel.
2. **Pagination & Filtres Avancés Frontend** :
   - Le frontend charge actuellement les offres en une seule fois (limite 1000). Implémenter une vraie pagination côté UI si le volume d'offres dépasse plusieurs milliers.
3. **Tests Unitaires & End-to-End** :
   - ✅ Fait (25/09/2026) : `cv_scoring/tests.py` (13 tests : normalize_score, health+groq_model, match validation, scraped public 200/404/400, scraped profile + historique, history limit invalide→400) et `radar_jobs/tests.py` (7 tests : cache partagé, jobs_list pagination, job_detail 200/404/400/offer_url, status, cleaner fallback). Commande : `python manage.py test cv_scoring radar_jobs` → 20/20 OK.

## ✅ 5. VÉRIF PROD DU 25/09/2026 (api-wagan.bakeli.tech)
- `GET /api/radar_jobs/jobs/?limit=1` → 200 mais données datées (total 101, `scraped_date` 2026-08-31, `last_update` 2026-09-03) vs local 216 → re-scraper + redéployer.
- `GET /api/radar_jobs/status/` → 200, mêmes données datées.
- `GET /api/cv-scoring/health/` → **404** ; `POST /api/cv-scoring/analyze-scraped/` → **404** ; `GET /api/radar_jobs/health/` et `/monitoring/` → **404** → la prod tourne sur un commit antérieur aux nouveaux endpoints.

## 🚀 6. CHECKLIST DÉPLOIEMENT PROD
1. `git push origin ibrahima-radar` (inclut points 1-4) puis merger/déployer la branche sur l'hébergeur.
2. Variables d'env prod : `GROQ_API_KEY`, `GROQ_MODEL=qwen/qwen3.8-27b` (ou `BAKELI_AI_MODEL`), `JWT_SECRET`, `DATABASE` si Postgres, `CORS_ALLOWED_ORIGINS` (domaine Vercel).
3. `python manage.py migrate` puis `python manage.py scrape_jobs --max-pages=2` (ou laisser Celery Beat 2h) — vérifie `media/data/last_run.json` et `GET /monitoring/`.
4. Persistance `media/data/` en volume (sinon le CSV redescend à 0 à chaque redéploiement).
5. Re-tester prod : `jobs/`, `status/`, `health/`, `monitoring/`, `cv-scoring/health/`, `cv-scoring/analyze-scraped/`.
