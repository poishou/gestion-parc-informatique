# Assistant local gratuit

Cette variante ne nécessite ni Blaze, ni clé API IA, ni Secret Manager. Ollama exécute le modèle localement et ce serveur vérifie le token Firebase avant toute lecture ou écriture.

## Installation unique

1. Installer Ollama pour Windows depuis https://ollama.com/download/windows.
2. Ouvrir PowerShell et télécharger le modèle :

```powershell
ollama pull qwen2.5:3b
```

3. Placer une clé de compte de service Firebase hors du dépôt, par exemple dans `C:\Secrets\parc-info-norsys-service-account.json`.

## Démarrage

Dans PowerShell, depuis la racine du projet :

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\Secrets\parc-info-norsys-service-account.json'
$env:ASSISTANT_SIGNING_SECRET='une-phrase-secrete-aleatoire-d-au-moins-32-caracteres'
node local-assistant/server.cjs
```

Laisser cette fenêtre ouverte pendant l'utilisation de l'application. Le navigateur appelle `http://127.0.0.1:8787/assistant` et la clé de service ne quitte jamais le serveur local.