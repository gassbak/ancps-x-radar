# Radar Jobs — Documentation Développeur

> Module de scraping multi-sites + IA RAG pour les offres d'emploi au Sénégal. Alimente le CSV `media/data/jobs_senegal_processed.csv` et le chat `POST /api/radar_jobs/chat/`.

*Dernière mise à jour : 07/09/2026 — 4 sites actifs, dedupe 429 fix, concoursn ajouté.*

---

## 1. Architecture

```
radar_jobs/
├── data/sites_config.py      # Liste des sites à scraper (4 actifs)
├── services/
│   ├── pipeline.py           # Orchestrateur async multi-sites
│   └── scrapers/
│       ├── base_scraper.py       # HTTP (curl_cffi) + fallback Selenium/nodriver
│       ├── expat_dakar.py        # expat-dakar.com
│       ├── emploi_dakar.py       # emploidakar.com
│       ├── jobsenegal.py         # jobsenegal.com
│       ├── concours_sn.py        # concoursn.com (Sénégal)
│       └── generic_scraper.py    # Fallback si site sans scraper dédié
├── processing/
│   └── cleaner.py            # Normalisation, géocodage, déduplication, enrichissement
├── utils/ai_client.py        # Client Groq (résolu via settings.GROQ_MODEL) + strip <think>
├── views_helpers.py          # SYNONYMS, expand_query, ensure_type_column, clean_df_for_json
├── views_chat.py             # POST chat/ (RAG + Groq)
├── views_jobs.py             # GET status/, jobs/, jobs/<id>/, download/csv/
├── views_system.py           # POST scrape/, GET health/, monitoring/
├── views.py                  # Ré-exports compatibilité
├── views_alerts.py           # Alertes candidats + statut Brevo
├── tasks.py                  # Tâche Celery Beat
├── management/commands/scrape_jobs.py
└── urls.py
```

**Flux :**
```
SITES_TO_TEST (4 URLs) → pipeline.run_pipeline(max_pages=2) → curl_cffi (HTTP pur, impersonate chrome124)
→ df_raw → DataCleaner → fusion incrémentale par offer_url + title+company → jobs_senegal_processed.csv (98-120 offres)
→ chat_view RAG (rapidfuzz WRatio/token_set, limit 10, score>40) + Groq (cache 5min, fallback local)
```

---

## 2. Sites scrapés

| Site | URL | Scraper | `allow_browser` | ~Volume |
|------|-----|---------|-----------------|---------|
| expat-dakar | `https://www.expat-dakar.com/emploi` | `ExpatDakarScraper` | `False` | 20 |
| jobsenegal | `https://jobsenegal.com/` | `JobSenegalScraper` | `False` | 42-46 |
| emploidakar | `https://www.emploidakar.com/offres` | `EmploiDakarScraper` | `False` | 20-40 |
| **concoursn** | `https://concoursn.com/category/senegal/recrutement-senegal/` | `ConcoursSNScraper` | `False` | 20 |

> emploisenegal : retiré (Cloudflare Turnstile, décision 100% auto). Voir `PRODUCTION.md` §5.4 historique.

> Tous les sites actifs tournent en `curl_cffi` (`base_scraper.py:188` `impersonate="chrome124"`), sans Selenium → pas de fenêtre, 100% compatible cron. `concoursn` utilise `article.vce-post` + `h2.entry-title a`.

---

## 3. Pipeline

**`services/pipeline.py:46`**

```python
async def run_pipeline(max_pages=2) -> PipelineResult
```

1. `SITES_TO_TEST` → `asyncio.wait_for(scrape, timeout=60)` (`pipeline.py:95`)
2. `df_raw.to_csv(RAW_DATA_DIR/jobs_senegal_raw.csv)`
3. `DataCleaner.clean()` → normalisation
4. Fusion incrémentale : `existing_urls = set(previous['offer_url'])`, `new_mask`, `concat + drop_duplicates(offer_url)` (`pipeline.py:158-167`). Si `new_jobs==0` → `df_clean = previous` (garde historique, n'écrase pas) (`pipeline.py:171`).
5. Sauvegarde `PROCESSED_FILE`

**Déduplication :** `offer_url` + `title+company` (`views.py:154` + `pipeline.py:167`). Seules les nouvelles `offer_url` sont ajoutées.

---

## 4. BaseScraper

**`services/scrapers/base_scraper.py`**

- `_init_session()` : `curl_cffi.Session` sinon `requests` (`:125`)
- `get_soup(url, target_selector)` : `curl` d'abord, Selenium/nodriver seulement si `allow_browser=True` (`:145`)
- `_fetch_with_curl()` : vérifie `Just a moment`, `soup.select_one(target_selector)` (`:182`)
- `allow_browser=False` sur les 4 sites actifs → HTTP pur
- Cookies Cloudflare : `chrome_profile/cf_cookies.json` (`:67`)

---

## 5. API Endpoints — `urls.py:4` (`/api/radar_jobs/`)

| Méthode | URL | Vue | Auth | Description |
|---------|-----|-----|------|-------------|
| POST | `chat/` | `chat_view:70` | `AllowAny` | RAG + Groq. Body `{messages:[{role,content}]}`. `429` avec `Retry-After` ou fallback local |
| GET | `jobs/` | `jobs_list_view:278` | `AllowAny` | `?sector=&location=&search=&page=&limit=` |
| GET | `status/` | `status_view:220` | `AllowAny` | total, sectors, last_update |
| GET | `health/` | `health_check_view:380` | `AllowAny` | scraping + config |
| GET | `monitoring/` | `scraping_status_view:422` | `AllowAny` | par source/région |
| GET | `download/csv/` | `download_csv_view:261` | `AllowAny` | CSV |
| POST | `scrape/` | `trigger_scrape_view:361` | `IsCoachOrAdmin` | lance `run_pipeline` en thread |

```bash
curl -X POST http://localhost:8000/api/radar_jobs/chat/ \
 -H "Content-Type: application/json" \
 -d '{"messages":[{"role":"user","content":"chauffeur"}]}'
```

---

## 6. Chat IA — RAG

**`views.py:70`**

1. `SYNONYMS` (`:30`) : `développeur→informatique data cloud`, `chauffeur→chauffeurs conducteur transport`, gère avec/sans accent
2. `market_metadata` allégé : top 3 secteurs/lieux seulement (`:126`)
3. `rapidfuzz.process.extract(query, corpus, scorer=fuzz.token_set_ratio, limit=10)` (`:142`), `score>40` (`:143`), dedupe `offer_url` + `title+company` + `head(10)` (`:154`), suppression fallback `recent 10`
4. `cols_context = ['title','company','location','contract_type','key_skills','offer_url']` (`:165`)
5. `system_prompt` : injecte `_offer_count` (`:175`), exemple concret `Ingénieur Cloud Infrastructure` (pas `[Titre]`), règles strictes `INTERDIT [Titre]` (`:207`)
6. `ask()` → Groq `qwen/qwen3.6-27b` (`utils/ai_client.py:15`)
7. Strip `<think>...</think>` y compris non fermé + `Here's a thinking` (`:248`), cache 5min `_CHAT_CACHE` (`:27`), fallback local si `429` (`:252`), bypass `comment postuler` sans IA (`:210`)

**429 :** `ai_client.py:33` lève `RATE_LIMIT`, `views.py:252` renvoie fallback cartes locales au lieu de bloquer.

---

## 7. Configuration — `wagan_project/settings.py:268`

```python
DATA_DIR = MEDIA_ROOT / "data"
PROCESSED_FILE = DATA_DIR / "jobs_senegal_processed.csv" # 98 offres 07/09
SCRAPING_CONFIG = {'MAX_PAGES': 5, 'TIMEOUT_PER_SITE': 120}
CELERY_BEAT_SCHEDULE = {'scrape-jobs-daily': {'task': 'radar_jobs.tasks.scrape_jobs_task', 'schedule': crontab(hour=2, minute=0)}}
```

Env : `GROQ_API_KEY`, `BAKELI_AI_URL`, `JWT_SECRET`

---

## 8. Automatisation

**Windows local**
```powershell
scripts/run_scrape.ps1  # auto venv, logs/scrape_YYYYMMDD.log
schtasks /query /tn "WaganScraping" # 02:00 quotidien, AllowStartIfOnBatteries, StartWhenAvailable
```

**VPS Linux**
```bash
pip install -r requirements.txt # curl_cffi, cloudscraper
bash scripts/setup_cron.sh      # 0 2 * * * /path/scripts/run_scrape.sh
crontab -l; tail -f logs/scrape_$(date +%Y%m%d).log
python manage.py scrape_jobs    # 126 scrapées → 20 concoursn → 98-120 total
```

**Celery** : `celery -A wagan_project worker --pool=solo` + `beat` (Redis `172.27.103.7:6379/0`)

---

## 9. Commandes

```bash
python manage.py scrape_jobs
python manage.py runserver
python -c "import pandas as pd; df=pd.read_csv('media/data/jobs_senegal_processed.csv', encoding='utf-8-sig'); print(df['source'].value_counts()); print(df['scraped_date'].unique())"
curl http://localhost:8000/api/radar_jobs/health/
```

---

## 10. Troubleshooting

| Symptôme | Cause | Fix |
|----------|-------|-----|
| 101 bloqué | Cron inactif | `schtasks /query` / `crontab -l` |
| 0 offre timeout | Selenium | `allow_browser=False` (fait) |
| `curl_cffi` manquant | mauvais Python | `python -m pip install curl_cffi` |
| 429 Groq | prompt 50 offres | `limit=10`, `cols_context=6`, cache 5min, fallback |
| `[Titre]` placeholder | exemple `[Titre]` copié | exemple concret + règle INTERDIT |
| `<think>` qui fuit | `qwen` reasoning non fermé | strip `DOTALL|IGNORECASE` + coupe jusqu'à `🎯` |
| 10 vs 4 | cache 5min | restart `runserver` |
| 10 aléatoires chauffeur | `>60` + recent | `>40` + SYNONYMS + no recent |
| 83 depuis 04/09 | batterie Interactive | `Set-ScheduledTask DisallowStartIfOnBatteries=$false` |

---

## 11. Ajouter un site

1. `services/scrapers/nouveau.py` : `BaseScraper`, `allow_browser=False`, `get_soup` + `_parse_jobs`
2. `data/sites_config.py` : entrée `name/url/scraper/selectors`
3. `services/pipeline.py` : import + `DEDICATED_SCRAPER_MAP`
4. `python manage.py scrape_jobs` → vérif `offer_url` unique

Exemple concoursn : `article.vce-post` + `h2.entry-title a` + `https://concoursn.com/category/senegal/recrutement-senegal/`

---

## 12. Déploiement PR

```bash
git pull
pip install -r requirements.txt
bash scripts/setup_cron.sh
python manage.py scrape_jobs
```

Modifs récentes : `concoursn` ajouté (20 offres, dedupe `offer_url`+`title`), `emploi_senegal` retiré, `base_scraper` HTTP pur, `views` cache/fallback/think strip, `ai_client` 429, `setup_cron.sh`.

---
*Wagan — admin@bakeli.radar*
