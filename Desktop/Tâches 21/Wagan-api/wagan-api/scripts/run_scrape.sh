#!/bin/bash

# Script pour lancer le scraping des jobs via cron en production
# Usage: ./run_scrape.sh

# 1. Dossier du projet
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# 2. Journalisation
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/scrape_$(date +%Y%m%d).log"

echo "[$(date)] Démarrage du cron job de scraping..." >> "$LOG_FILE"

# 3. Environnement Virtuel (auto-détection)
if [ -d "$PROJECT_DIR/venv/bin" ]; then
    source "$PROJECT_DIR/venv/bin/activate"
elif [ -d "$PROJECT_DIR/.venv/bin" ]; then
    source "$PROJECT_DIR/.venv/bin/activate"
fi
# Python binaire (venv si activé, sinon système)
PYTHON_BIN="$(command -v python3 || command -v python)"

# 4. Chargement des variables d'environnement (si non gérées par le système)
# export $(grep -v '^#' .env | xargs)

# 5. Lancement de la commande Django
$PYTHON_BIN manage.py scrape_jobs >> "$LOG_FILE" 2>&1

# 6. Fin
echo "[$(date)] Cron job terminé." >> "$LOG_FILE"
