# =========================================================
# Wagan - Scraping automatique des offres d'emploi (Windows)
# À utiliser avec le Planificateur de tâches Windows.
# =========================================================

$ErrorActionPreference = "Stop"

# Chemin du projet (chemin absolu recommandé)
$ProjectDir = if ($env:WAGAN_PROJECT_DIR) {
    $env:WAGAN_PROJECT_DIR
} else {
    "C:\Users\hp\wagan-api"
}

# Binaire Python (venv si existe, sinon python système)
$PythonExe = Join-Path $ProjectDir "venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $PythonExe)) {
    $PythonExe = (Get-Command python -ErrorAction SilentlyContinue).Source
}
if (-not $PythonExe -or -not (Test-Path -LiteralPath $PythonExe)) {
    $PythonExe = "C:\Users\hp\AppData\Local\Programs\Python\Python311\python.exe"
}
if (-not (Test-Path -LiteralPath $PythonExe)) {
    Write-Host "[ERROR] Python introuvable : $PythonExe" -ForegroundColor Red
    exit 1
}

# Dossier de logs
$LogDir = Join-Path $ProjectDir "logs"
if (-not (Test-Path -LiteralPath $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}
$LogFile = Join-Path $LogDir ("scrape_{0}.log" -f (Get-Date -Format "yyyyMMdd"))

# Ajout d'une entrée de début
$Header = "[{0}] Démarrage du scraping automatique (Task Scheduler)" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Add-Content -LiteralPath $LogFile -Value $Header -Encoding UTF8

# Exécution
Push-Location -LiteralPath $ProjectDir
try {
    & $PythonExe manage.py scrape_jobs | Out-File -LiteralPath $LogFile -Append -Encoding UTF8
    $ExitCode = $LASTEXITCODE
} catch {
    $ExitCode = 1
    $err = "[{0}] Erreur : {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $_.Exception.Message
    Add-Content -LiteralPath $LogFile -Value $err -Encoding UTF8
} finally {
    Pop-Location
}

$Footer = "[{0}] Scraping terminé (code: {1})" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $ExitCode
Add-Content -LiteralPath $LogFile -Value $Footer -Encoding UTF8

exit $ExitCode
