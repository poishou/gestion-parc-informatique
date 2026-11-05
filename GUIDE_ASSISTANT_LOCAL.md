# Guide de lancement et de fonctionnement de l'assistant

## 1. Demarrage automatique

Double-cliquer sur `start-project.cmd` a la racine du projet.
Le lanceur verifie les ressources, genere automatiquement le secret de signature
si necessaire, demarre Ollama, le serveur assistant et le site, puis ouvre le Dashboard.

### Ce qui reste installe

- Ollama et le modele `qwen2.5:3b`.
- La cle Firebase situee hors du projet : `C:\Secrets\parc-info-norsys-service-account.json`.
- Le code du projet.

### Fonctionnement automatique

Ollama demarre normalement automatiquement avec Windows. Il n'est donc pas necessaire de lancer `ollama serve` a chaque fois.

Verifier que le modele est installe :

```powershell
ollama list
```

Si `qwen2.5:3b` n'apparait pas, le telecharger une seule fois :

```powershell
ollama pull qwen2.5:3b
```

Le lanceur utilise automatiquement :

- la cle Firebase externe `C:\Secrets\parc-info-norsys-service-account.json` ;
- le modele Ollama `qwen2.5:3b` ;
- le serveur assistant sur `127.0.0.1:8787` ;
- le site sur `127.0.0.1:5500` (ou sur le premier port libre entre `5501` et `5599` si `5500` est déjà utilisé par un autre programme).

Le message attendu est :

```text
Assistant local disponible sur http://127.0.0.1:8787/assistant
```

Si le message `EADDRINUSE` apparait, cela signifie que le serveur assistant est deja lance. Il ne faut pas le demarrer une deuxieme fois.

Se connecter avec Firebase. Le bouton **Assistant du parc** apparait en bas de la page.

### Arret de l'application

Dans les fenetres du serveur assistant et du serveur web, appuyer sur `Ctrl+C`.

## 2. Fonctionnement par rapport au cahier des charges

Oui, la logique implementee suit le cahier des charges et le diagramme de sequence :

1. L'utilisateur est deja authentifie par Firebase.
2. Le navigateur envoie la question au serveur local avec le token Firebase.
3. Le serveur verifie le token et recupere le role dans les claims Firebase.
4. Le serveur consulte les cinq collections presentes dans le projet : `collaborateurs`, `equipements`, `stockMateriel`, `licences` et `affectations`.
5. Ollama interprete la demande avec un appel de fonction.
6. Pour une consultation, le serveur filtre les donnees puis demande au modele de rediger une reponse.
7. Pour une modification, le serveur produit une proposition structuree.
8. Aucune ecriture n'est effectuee a ce stade.
9. Apres clic explicite sur **Confirmer cette modification**, le serveur verifie a nouveau le role, la signature et l'expiration de la proposition.
10. L'ecriture Firestore est executee uniquement apres toutes ces validations.

Cette sequence correspond au diagramme : authentification, controle du role, interpretation, consultation des donnees, redaction, proposition, confirmation puis execution.

## 3. Difference entre les roles

### Utilisateur simple

Un utilisateur simple peut :

- poser des questions de consultation ;
- consulter les equipements, collaborateurs, stock materiel, licences et affectations ;
- recevoir une reponse redigee en langage naturel.

Il ne peut pas :

- creer une donnee ;
- modifier une donnee ;
- supprimer une donnee ;
- confirmer une proposition de modification.

Si le modele detecte une demande de modification, le serveur refuse l'action et renvoie un message indiquant que seuls les administrateurs peuvent modifier le parc.

### Administrateur

Un administrateur peut :

- poser les memes questions de consultation ;
- demander une creation, modification ou suppression autorisee ;
- recevoir une proposition structuree ;
- confirmer ou refuser cette proposition.

Même un administrateur ne declenche aucune ecriture simplement en posant la question. L'ecriture n'arrive qu'apres le clic explicite sur le bouton de confirmation.

## 4. Ce qui est gratuit et ce qui est local

- Ollama et le modele fonctionnent localement sur l'ordinateur.
- Aucune cle API de service IA n'est necessaire.
- Le serveur assistant est local sur `127.0.0.1:8787`.
- Firestore et Firebase Authentication restent utilises comme services Firebase existants.
- Cette variante ne necessite pas de deployer une Cloud Function ni d'activer Blaze.

Le serveur local doit donc rester demarre pendant l'utilisation de l'assistant. Pour un usage par plusieurs ordinateurs ou un acces permanent en ligne, il faudrait ensuite heberger le serveur sur une infrastructure securisee.

## 5. Resume tres court

A chaque utilisation, lancer uniquement `start-project.cmd`.
Les processus deja actifs ne sont pas demarres une deuxieme fois.
