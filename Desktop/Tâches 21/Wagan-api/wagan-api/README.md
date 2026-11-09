# Wagan - Plateforme IA & Bot WhatsApp / AI Platform & WhatsApp Bot

*(English version below)*

Wagan est une plateforme complète intégrant un tableau de bord (Dashboard) web et un Bot WhatsApp intelligent (Assistant Bakeli). Le système gère l'orientation des prospects, l'analyse des sentiments en temps réel, et déclenche des alertes humaines automatiques pour maximiser le taux de conversion.

## 🚀 Fonctionnalités Principales (FR)

- **Bot WhatsApp (Assistant Bakeli)** : IA propulsée par Groq (LLaMA 3) pour interagir naturellement avec les prospects, cerner leurs besoins et les orienter vers la bonne formation.
- **Analyse de Sentiment** : Détection des prospects chauds (positifs) et des pertes d'intérêt (négatifs) via le pipeline d'analyse de contexte.
- **Dashboard Web (React)** : Suivi en temps réel du taux de conversion et du volume d'interactions.
- **Alertes Admin** : Notification instantanée sur WhatsApp et Discord lorsqu'un prospect nécessite l'intervention humaine d'un conseiller (Client mécontent) ou lors d'une panne technique de l'API.

## 🏗 Architecture (FR)

- **Backend** : Django / Django REST Framework
- **Frontend** : React / TypeScript / Vite / TailwindCSS
- **IA** : API Groq via la surcouche Bakeli AI (`openai/gpt-oss-20b`)
- **Tâches Asynchrones** : Celery + Redis (indispensable pour l'envoi de messages sans bloquer les webhooks)
- **Base de Données** : SQLite (Dev) / PostgreSQL (Prod)

## 🛠 Prérequis (FR)

- Python 3.10+
- Node.js 18+
- Redis Server (doit être lancé en arrière-plan)
- Un compte développeur Meta (WhatsApp Cloud API)
- Un compte Discord (pour le webhook d'alerte)

## ⚙️ Installation & Lancement (FR)

### 1. Backend (Django)

```bash
# Cloner le dépôt et aller dans le dossier
cd wagan

# Créer un environnement virtuel et l'activer
python -m venv venv
venv\Scripts\activate  # Sous Windows

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier d'environnement
cp .env.example .env
```

**Variables d'environnement requises (`.env`) :**
```env
# Django
DJANGO_SECRET_KEY=votre_cle_secrete
DJANGO_SECURITY=True
DATABASE=sqlite:///db.sqlite3

# APIs
BAKELI_AI_KEY=votre_cle_bakeli_groq
WHATSAPP_TOKEN=votre_token_meta
WHATSAPP_PHONE_NUMBER_ID=votre_phone_id
WHATSAPP_VERIFY_TOKEN=votre_webhook_verify_token
WHATSAPP_ADMIN_NUMBER=221770000000

# Discord
DISCORD_WEBHOOK_URL=votre_url_webhook
DISCORD_MENTION=<@ID_DU_ROLE>
```

**Lancement du backend :**
```bash
# Migrations et lancement du serveur
python manage.py migrate
python manage.py runserver
```

**Lancement de Celery (Nécessite Redis) :**
Dans un nouveau terminal :
```bash
venv\Scripts\activate
celery -A wagan_project worker --loglevel=info --pool=solo
```

### 2. Frontend (React)

```bash
cd wagan-front
npm install
npm run dev
```

## 📈 Logique Métier & Dashboard (FR)

L'algorithme de conversion (dans `views.py`) se base sur le dernier sentiment calculé pour chaque prospect :
- **🔥 Prospect Chaud (`positive`)** : Prospect fortement intéressé. Il augmente le *Taux de conversion*.
- **❄️ Prospect Froid (`neutral`)** : En phase d'exploration ou a simplement dit "Bonjour".
- **🚨 Alerte Humaine (`negative`)** : Désintérêt ou besoin hyper-spécifique non couvert. Le système notifie immédiatement les administrateurs via Discord et WhatsApp.

---

# English Version 🇬🇧

Wagan is a comprehensive platform integrating a web Dashboard and an intelligent WhatsApp Bot (Bakeli Assistant). The system handles lead routing, real-time sentiment analysis, and triggers automatic human alerts to maximize the conversion rate.

## 🚀 Main Features

- **WhatsApp Bot (Bakeli Assistant)**: AI powered by Groq (LLaMA 3) to naturally interact with prospects, understand their needs, and guide them to the right training program.
- **Sentiment Analysis**: Detection of hot prospects (positive) and loss of interest (negative) via a contextual analysis pipeline.
- **Web Dashboard (React)**: Real-time tracking of the conversion rate and interaction volume.
- **Admin Alerts**: Instant notification on WhatsApp and Discord when a prospect requires human intervention (Dissatisfied Client) or during an API technical failure.

## 🏗 Architecture

- **Backend**: Django / Django REST Framework
- **Frontend**: React / TypeScript / Vite / TailwindCSS
- **AI**: Groq API via Bakeli AI wrapper (`openai/gpt-oss-20b`)
- **Asynchronous Tasks**: Celery + Redis (essential for sending messages without blocking Webhooks)
- **Database**: SQLite (Dev) / PostgreSQL (Prod)

## 🛠 Prerequisites

- Python 3.10+
- Node.js 18+
- Redis Server (must be running in the background)
- Meta Developer Account (WhatsApp Cloud API)
- Discord Account (for the alert webhook)

## ⚙️ Installation & Setup

### 1. Backend (Django)

```bash
# Clone the repository and navigate to the folder
cd wagan

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Create the environment file
cp .env.example .env
```

**Required environment variables (`.env`):**
```env
# Django
DJANGO_SECRET_KEY=your_secret_key
DJANGO_SECURITY=True
DATABASE=sqlite:///db.sqlite3

# APIs
BAKELI_AI_KEY=your_bakeli_groq_key
WHATSAPP_TOKEN=your_meta_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_ADMIN_NUMBER=221770000000

# Discord
DISCORD_WEBHOOK_URL=your_webhook_url
DISCORD_MENTION=<@ROLE_ID>
```

**Running the backend:**
```bash
# Migrations and starting the server
python manage.py migrate
python manage.py runserver
```

**Running Celery (Requires Redis):**
In a new terminal:
```bash
venv\Scripts\activate
celery -A wagan_project worker --loglevel=info --pool=solo
```

### 2. Frontend (React)

```bash
cd wagan-front
npm install
npm run dev
```

## 📈 Business Logic & Dashboard

The conversion algorithm (in `views.py`) relies on the latest calculated sentiment for each prospect:
- **🔥 Hot Prospect (`positive`)**: Highly interested prospect. Increases the *Conversion Rate*.
- **❄️ Cold Prospect (`neutral`)**: In the discovery phase or simply said "Hello".
- **🚨 Human Alert (`negative`)**: Disinterest or highly specific unmet need. The system immediately notifies administrators via Discord and WhatsApp.

## 🔐 Security & Audit

During our final audit, we validated:
- Total isolation of private keys via `.env`.
- Decoupling network requests to Meta via Celery to never exceed the 3-second Meta Webhook timeout.
- Robustness of the AI fallback (in case of a Groq failure, a specific "AI OUTAGE" alert is sent to the staff for manual takeover).

---
*This project was built and documented on the `chrys` branch.*
