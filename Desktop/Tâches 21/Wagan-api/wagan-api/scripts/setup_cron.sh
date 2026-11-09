#!/bin/bash
# Installe le cron quotidien 02:00 pour le scraping (persiste après reboot)
# Usage: bash scripts/setup_cron.sh
set -e
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_CMD="$PROJECT_DIR/scripts/run_scrape.sh"
chmod +x "$PROJECT_DIR/scripts/run_scrape.sh"
# Supprime ancienne entrée si existe, puis ajoute
(crontab -l 2>/dev/null | grep -v "run_scrape.sh"; echo "0 2 * * * $CRON_CMD") | crontab -
echo "✅ Cron installé : 0 2 * * * $CRON_CMD"
crontab -l | grep run_scrape
