# Gestion du parc informatique — Norsys Afrique

Application web interne de gestion du parc informatique, réalisée dans le cadre d'un stage d'été (ENSIAS).
Elle centralise les **équipements**, les **collaborateurs**, les **affectations**, le **stock matériel** et les **licences**, avec un **assistant conversationnel local** (Ollama) qui répond en langage naturel.

## Fonctionnalités

- Connexion Firebase (email / mot de passe, réinitialisation) et deux rôles : **administrateur** et **utilisateur simple**
- Tableau de bord temps réel (indicateurs + inventaire récent, export CSV)
- Équipements : recherche, filtres, création / modification / suppression
- **Affectations** : historique des remises et restitutions, une seule affectation active par équipement (écriture atomique)
- Collaborateurs, stock matériel et licences
- Assistant local : consultation en langage naturel ; toute modification proposée doit être **confirmée** par un administrateur (proposition signée HMAC, expire après 10 min)

## Architecture

```
Navigateur (HTML/CSS/JS)  ──►  Firebase Authentication + Cloud Firestore
        │
        └─► Serveur Node.js local :8787  ──►  Ollama (qwen2.5:3b) :11434
              (vérifie le token, lit Firestore, valide et signe les propositions)
```

| Dossier | Rôle |
|---|---|
| `auth/` | Page de connexion |
| `Dashboard/`, `materiel/`, `collaborateur/`, `Stock-et-Licences/` | Pages métier |
| `js/` | Configuration Firebase, garde d'authentification, logique des affectations, widget assistant |
| `local-assistant/` | Serveur Node.js de l'assistant |
| `functions/` | Cœur de validation des propositions de l'assistant (+ tests) |
| `firestore.rules` | Règles de sécurité : lecture si connecté, écriture réservée aux admins |
| `seed/` | Données initiales et création des comptes / rôles |
| `tests/` | Tests de la logique des affectations |
| `diagramme/`, `rapport.tex` | Cahier des charges, diagrammes UML et rapport |

## Prérequis

- [Node.js](https://nodejs.org/) 18+ et Python 3
- [Ollama](https://ollama.com/download) avec le modèle : `ollama pull qwen2.5:3b`
- Une clé de compte de service Firebase **hors du dépôt**, par exemple `C:\Secrets\parc-info-norsys-service-account.json`

## Lancement

**Automatique (Windows)** : double-cliquer sur `start-project.cmd`.

**Manuel** (deux terminaux PowerShell à la racine) :

```powershell
npm install   # une seule fois

# Terminal 1 — assistant
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\Secrets\parc-info-norsys-service-account.json"
$env:ASSISTANT_SIGNING_SECRET = "une-phrase-secrete-aleatoire-d-au-moins-32-caracteres"
node local-assistant/server.cjs

# Terminal 2 — site web
python -m http.server 5500
```

Puis ouvrir <http://127.0.0.1:5500/auth/connexion.html>.

Les comptes sont créés avec `npm run seed:roles` (voir [ROLE_SETUP_GUIDE.md](ROLE_SETUP_GUIDE.md)) et les données de démonstration avec `npm run seed:firestore`.

## Tests

```powershell
node --test tests/assignment-lifecycle.test.mjs functions/assistant-core.test.cjs
```

## Sécurité

La configuration Firebase présente dans `js/firebase-config.js` identifie seulement le projet ; elle est publique par conception. La protection repose sur les **règles Firestore**, les **Custom Claims** de rôle et le serveur local. La clé de compte de service et le secret de signature ne sont jamais versionnés.
