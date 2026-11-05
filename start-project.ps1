$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$credentialsPath = "C:\Secrets\parc-info-norsys-service-account.json"
$secretPath = "C:\Secrets\parc-info-norsys-assistant-secret.txt"
$ollamaPath = (Get-Command ollama -ErrorAction Stop).Source
$nodePath = (Get-Command node -ErrorAction Stop).Source
$pythonPath = (Get-Command python -ErrorAction Stop).Source

if (-not (Test-Path $credentialsPath)) {
    throw "Clé Firebase introuvable : $credentialsPath"
}

if (-not (Test-Path $secretPath)) {
    $bytes = New-Object byte[] 48
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    [Convert]::ToBase64String($bytes) | Set-Content -Path $secretPath -NoNewline
}

$env:GOOGLE_APPLICATION_CREDENTIALS = $credentialsPath
$env:ASSISTANT_SIGNING_SECRET = (Get-Content $secretPath -Raw).Trim()
[Environment]::SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", $credentialsPath, "User")
[Environment]::SetEnvironmentVariable("ASSISTANT_SIGNING_SECRET", $env:ASSISTANT_SIGNING_SECRET, "User")

function Test-LocalPort([int] $port) {
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $connection
}

function Test-ProjectWebServer([int] $port) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/Dashboard/index.html" -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content.Contains("Supervision du Parc Informatique")
    } catch {
        return $false
    }
}

try {
    Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 2 | Out-Null
} catch {
    Start-Process -FilePath $ollamaPath -ArgumentList "serve" -WindowStyle Minimized
}

if (-not (Test-LocalPort 8787)) {
    Start-Process -FilePath $nodePath -WorkingDirectory $projectRoot -ArgumentList "local-assistant/server.cjs" -WindowStyle Minimized
}

$webPort = 5500
$startWebServer = $false
if (-not (Test-ProjectWebServer $webPort)) {
    if (Test-LocalPort $webPort) {
        $webPort = $null
        for ($candidatePort = 5501; $candidatePort -le 5599; $candidatePort++) {
            if (Test-ProjectWebServer $candidatePort) {
                $webPort = $candidatePort
                break
            }
            if (-not (Test-LocalPort $candidatePort)) {
                $webPort = $candidatePort
                $startWebServer = $true
                break
            }
        }
        if ($null -eq $webPort) {
            throw "Les ports 5500 à 5599 sont occupés. Libère un port puis relance le projet."
        }
    } else {
        $startWebServer = $true
    }
}

if ($startWebServer) {
    Start-Process -FilePath $pythonPath -WorkingDirectory $projectRoot -ArgumentList "-m", "http.server", "$webPort" -WindowStyle Minimized

    $webServerReady = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if (Test-ProjectWebServer $webPort) {
            $webServerReady = $true
            break
        }
        Start-Sleep -Milliseconds 500
    }
    if (-not $webServerReady) {
        throw "Le serveur Web ne répond pas sur le port $webPort. Vérifie Python puis relance le projet."
    }
}

$dashboardUrl = "http://127.0.0.1:$webPort/Dashboard/index.html"
Start-Process $dashboardUrl
Write-Host "Projet démarré : $dashboardUrl"