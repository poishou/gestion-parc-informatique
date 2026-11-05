# Configuration des Rôles et Contrôle d'Accès

## 🎯 Vue d'ensemble

Le système de rôles comporte deux niveaux :

1. **Custom Claims (Firebase)** → Défini le rôle réel de l'utilisateur
2. **Firestore Rules** → Contrôle qui peut lire/écrire dans Firestore
3. **UI Controls (CSS/JS)** → Masque les boutons d'écriture aux non-admin

---

## 📋 Étape 1 : Créer les comptes utilisateurs avec leurs rôles

### Option A : Utiliser le script Node.js (Recommandé)

```bash
cd c:\Users\hp\Desktop\projet-basic
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\Secrets\parc-info-norsys-service-account.json'
$env:ADMIN_EMAIL='admin@exemple.local'
$env:ADMIN_PASSWORD='mot-de-passe-admin-unique'
$env:USER_ONE_EMAIL='utilisateur1@exemple.local'
$env:USER_ONE_PASSWORD='mot-de-passe-utilisateur-unique'
$env:USER_TWO_EMAIL='utilisateur2@exemple.local'
$env:USER_TWO_PASSWORD='autre-mot-de-passe-utilisateur-unique'
npm run seed:roles
```

Ce script :
- ✅ Crée un compte **admin@norsys.ma** avec rôle `admin`
- ✅ Crée 2 comptes **utilisateur** avec rôle `utilisateur`
- ✅ Assigne automatiquement les **Custom Claims** à chaque compte

**Comptes créés :**
Les adresses et mots de passe sont fournis par variables d'environnement et ne doivent pas être écrits dans le dépôt.

### Option B : Créer les comptes manuellement dans Firebase Console

1. Va dans **Firebase Console** → Authentication
2. Clique **Ajouter un utilisateur**
3. Entre email et mot de passe
4. Coche "Utilisateur personnalisé"
5. **Puis**, va dans **Users** → Clique sur l'utilisateur → Onglet **Custom claims**
6. Ajoute : `{ "role": "admin" }` ou `{ "role": "utilisateur" }`

---

## 🔐 Étape 2 : Configurer les Firestore Security Rules

1. Va dans **Firebase Console** → Firestore Database → Onglet **Règles**
2. Remplace le contenu par le fichier [FIRESTORE_RULES.txt](FIRESTORE_RULES.txt)
3. Clique **Publier**

**Important** : Sans ces règles, n'importe qui peut écrire dans Firestore !

Les règles actuelles :
- ✅ **Lecture** : tout utilisateur connecté peut lire
- ✅ **Écriture** : administrateurs uniquement (role == "admin")

---

## 🖥️ Étape 3 : Tester le système

### Test 1 : Connexion en tant qu'administrateur

1. Ouvre l'application
2. Clique **Se connecter**
3. Entre les identifiants administrateur définis dans ton environnement
4. Accède au **Tableau de bord** ou **Matériel Dev & QA**
5. ✅ Le bouton **"Nouvel Équipement"** doit être **visible** et actif
6. ✅ Tu peux **ajouter/modifier/supprimer** des équipements
7. Ouvre la console du navigateur (F12) → Console
8. Tu devrais voir : `admin` (confirmant le rôle)

### Test 2 : Connexion en tant qu'utilisateur

1. **Se déconnecter** (clique profil → Se déconnecter)
2. Clique **Se connecter**
3. Entre les identifiants utilisateur définis dans ton environnement
4. Accède au **Tableau de bord** ou **Matériel Dev & QA**
5. ✅ Le bouton **"Nouvel Équipement"** doit être **masqué**
6. ✅ Tu peux **voir** les équipements mais **pas les modifier**
7. Ouvre la console (F12) → Console
8. Tu devrais voir : `utilisateur`

---

## 📝 Ajouter des scripts npm

Ajoute ceci à [package.json](package.json) :

```json
"scripts": {
  "seed:firestore": "node seed/firestore-seed.mjs",
  "seed:roles": "node seed/setup-roles.mjs"
}
```

Puis tu peux lancer :
- `npm run seed:firestore` → Remplir la base de données
- `npm run seed:roles` → Créer les comptes et assigner les rôles

---

## 🔧 Dépannage

### ❌ Les boutons "Ajouter" sont toujours visibles

**Cause possible** : Le rôle n'a pas été assigné correctement.

**Solution** :
1. Va dans Firebase Console → Authentication → Users
2. Clique sur l'utilisateur
3. Onglet **Custom claims** → Ajoute `{ "role": "admin" }`
4. Déconnecte-toi et reconnecte-toi

### ❌ Je ne peux pas écrire dans Firestore même en tant qu'admin

**Cause possible** : Les règles Firestore ne sont pas mises à jour.

**Solution** :
1. Va dans Firebase Console → Firestore → Règles
2. Vérifie que le code correspond à [FIRESTORE_RULES.txt](FIRESTORE_RULES.txt)
3. Clique **Publier**

### ❌ "Erreur : permission-denied" dans la console

**Cause** : Les règles refusent l'accès (pas authentifié ou pas admin pour l'écriture).

**Solution** :
1. Vérifie que tu es connecté
2. Vérifie que tu as le bon rôle (console F12 → voir `admin` ou `utilisateur`)
3. Vérifie que les règles Firestore sont publiées

---

## 📚 Fichiers clés

- [seed/setup-roles.mjs](seed/setup-roles.mjs) → Script de création des comptes et rôles
- [FIRESTORE_RULES.txt](FIRESTORE_RULES.txt) → Règles de sécurité à copier
- [Assets/css/role-access.css](Assets/css/role-access.css) → CSS pour masquer les boutons
- [js/auth-guard.js](../js/auth-guard.js) → Récupère le rôle de l'utilisateur

---

## 🎓 Résumé technique

**Flux d'authentification avec rôles :**

```
1. Utilisateur se connecte → signInWithEmailAndPassword()
2. Firebase Auth valide les identifiants
3. auth-guard.js récupère le rôle via tokenResult.claims.role
4. Document.body.dataset.role = "admin" ou "utilisateur"
5. CSS masque/affiche les boutons en fonction du rôle
6. Les opérations Firestore respectent les Firestore Rules
```

**Conservation du rôle après rechargement :**
- Le rôle est stocké dans le **token JWT** de l'utilisateur
- À chaque rechargement, `onAuthStateChanged()` remet à jour le rôle
- Le rôle persiste tant que la session est active

---

## ✅ Checklist finale

- [ ] Script `seed/setup-roles.mjs` créé
- [ ] Comptes utilisateurs créés avec `npm run seed:roles`
- [ ] Custom Claims assignés aux utilisateurs
- [ ] Firestore Rules publiées depuis [FIRESTORE_RULES.txt](FIRESTORE_RULES.txt)
- [ ] CSS role-access.css ajouté aux pages HTML
- [ ] Test 1 : Connexion admin → boutons visibles ✅
- [ ] Test 2 : Connexion utilisateur → boutons masqués ✅
- [ ] Firestore règles testées (lecture/écriture)

Prêt à tester ! 🚀
