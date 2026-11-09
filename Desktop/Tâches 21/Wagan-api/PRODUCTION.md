# Guide de Mise en Production (Cron Job)

Pour automatiser le scraping des offres d'emploi sur votre serveur de production, suivez ces étapes :

## 1. Configurer le script de lancement

Assurez-vous que le script `scripts/run_scrape.sh` est exécutable et correctement configuré (chemin vers l'environnement virtuel, etc.).

```bash
chmod +x scripts/run_scrape.sh
```

## 2. Configurer la Crontab

Ouvrez la crontab de l'utilisateur qui fait tourner le serveur web (ou un utilisateur dédié) :

```bash
crontab -e
```

Ajoutez la ligne suivante pour lancer le scraping tous les jours à 2h du matin :

```cron
0 2 * * * /chemin/vers/votre/projet/scripts/run_scrape.sh
```

## 3. Logs et Surveillance

Les logs seront générés dans le dossier `logs/`.
Vous pouvez surveiller l'activité avec :

```bash
tail -f logs/scrape_$(date +%Y%m%d).log
```

## 4. Recommandations de Production

- **Base de données** : Utilisez PostgreSQL ou MySQL au lieu de SQLite si le volume de données devient important.
- **Sécurité** : Ne commitez jamais votre fichier `.env`. Utilisez des secrets gérés par votre plateforme de déploiement.
- **Volume Docker** : Si vous utilisez Docker, assurez-vous que le dossier `media/data/` est monté sur un volume persistant.
- **Timeout** : Le scraping peut être long. Assurez-vous que le cron n'est pas tué par un gestionnaire de processus.


## 5. Automatisation sur Windows (Planificateur de taches)

Le script `scripts/run_scrape.ps1` lance `manage.py scrape_jobs` et journalise dans `logs/scrape_AAAAAMMJJ.log`.

### 5.1 Tester le script manuellement

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Amadou Sow\Desktop\wagan\wagan-api\scripts\run_scrape.ps1"
```

### 5.2 Creer la tache planifiee

1. Ouvrez le **Planificateur de taches** (`taskschd.msc`).
2. Menu **Action > Creer une tache...**.
3. Onglet **General** :
   - Nom : `Wagan Scraping Quotidien`
   - Cochez « Executer avec les autorisations les plus elevees ».
4. Onglet **Declencheurs** :
   - **Nouveau...** -> Quotidien, tous les 1 jours, heure de debut : 02:00.
5. Onglet **Actions** :
   - **Nouveau...** -> Action « Demarrer un programme ».
   - Programme/script : `powershell.exe`
   - Arguments :
     ```
     -ExecutionPolicy Bypass -File "C:\Users\Amadou Sow\Desktop\wagan\wagan-api\scripts\run_scrape.ps1"
     ```
   - Repertoire : `C:\Users\Amadou Sow\Desktop\wagan\wagan-api`
6. **OK** puis saisissez le mot de passe Windows.

### 5.3 Suivi des logs

```powershell
Get-Content "C:\Users\Amadou Sow\Desktop\wagan\wagan-api\logs\scrape_$(Get-Date -Format yyyyMMdd).log"
```

### 5.4 EmploiSenegal et Cloudflare

Le site EmploiSenegal est protege par Cloudflare Turnstile. La premiere execution peut necessiter
une resolution manuelle du challenge. Une fois resolu, les cookies (`cf_clearance`) sont sauvegardes
dans `chrome_profile/cf_cookies.json` et reutilises automatiquement aux executions suivantes.
Les autres sources (EmploiDakar, Expat-Dakar, JobSenegal) sont scrapees de maniere 100%
automatique sans interaction.
