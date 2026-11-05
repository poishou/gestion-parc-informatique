# Modele reel de l'application

Ce document est la source de verite pour remplacer les anciens diagrammes dans le rapport.

## Collections Firestore

Le projet utilise cinq collections :

- `equipements` : une fiche par equipement individuel, y compris les equipements `En stock`.
- `collaborateurs` : fiches des collaborateurs et leur role metier.
- `stockMateriel` : articles regroupes par categorie, modele et agence, avec `quantite` et `statut`.
- `licences` : licences logicielles et suivi des sieges.
- `affectations` : historique des remises et restitutions d'equipements.

`stockMateriel` n'est pas recalcule automatiquement depuis `equipements` dans le code actuel. Il est gere directement par la page Stocks & Licences.

## Diagramme de classes / donnees

```mermaid
classDiagram
    class Equipement {
        +string id
        +string idMateriel
        +string categorie
        +string modele
        +string os
        +string systemeOS
        +string statut
        +string assigneA
        +string collaborateurId
        +string pole
        +string poleExpertise
        +string numeroSerie
        +string agence
        +string fournisseur
    }

    class Collaborateur {
        +string id
        +string nom
        +string name
        +string email
        +string telephone
        +string phone
        +string statut
        +string status
        +string role
    }

    class StockMateriel {
        +string id
        +string categorie
        +string modele
        +string agence
        +string fournisseur
        +number quantite
        +string statut
    }

    class Licence {
        +string id
        +string nom
        +string editeur
        +string type
        +string sieges
        +string expiration
        +string cout
        +string pole
        +string statut
    }

    class Affectation {
        +string id
        +string equipmentId
        +string equipementId
        +string collaboratorId
        +string collaborateurId
        +string collaborateurNom
        +string dateRemise
        +string dateRestitution
    }

    Collaborateur "1" --> "0..*" Equipement : assigne
    Equipement "1" --> "0..*" Affectation : historique
    Collaborateur "1" --> "0..*" Affectation : historique
```

## Flux d'affectation reel

```mermaid
flowchart TD
    A[Administrateur ouvre Materiel Dev et QA] --> B[Selectionne un equipement et un collaborateur]
    B --> C[Lecture de la collection affectations]
    C --> D{Affectation active existante ?}
    D -- Oui --> E[Date de restitution de l'ancienne affectation]
    D -- Non --> F[Pas de restitution a ajouter]
    E --> G[Creation de la nouvelle affectation]
    F --> G
    G --> H[Validation : une seule affectation active par equipement]
    H --> I[Ecriture dans affectations]
    I --> J[Mise a jour de equipements]
    J --> K[Les quantites de stockMateriel ne sont pas recalculees automatiquement]
```

## Assistant local

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant W as Navigateur
    participant S as Serveur local Ollama
    participant F as Firebase Auth
    participant D as Firestore

    U->>W: Saisit une question
    W->>S: Question + token Firebase
    S->>F: Verifie le token
    F-->>S: UID + role
    S->>D: Lit les cinq collections autorisees
    D-->>S: Donnees du parc
    S->>S: Filtre les resultats et appelle Ollama
    S-->>W: Reponse ou proposition de modification
    W-->>U: Affiche le resultat
    U->>W: Confirme une proposition
    W->>S: Token de confirmation signe
    S->>D: Ecrit seulement apres validation du role et du token
```
