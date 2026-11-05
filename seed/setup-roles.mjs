import admin from 'firebase-admin';
import fs from 'fs';

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  throw new Error('Définis GOOGLE_APPLICATION_CREDENTIALS vers une clé Firebase hors du projet.');
}
const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const auth = admin.auth();

// Liste des comptes à créer/mettre à jour avec leurs rôles
const users = [
  { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin', displayName: 'Administrateur Norsys' },
  { email: process.env.USER_ONE_EMAIL, password: process.env.USER_ONE_PASSWORD, role: 'utilisateur', displayName: 'Utilisateur 1' },
  { email: process.env.USER_TWO_EMAIL, password: process.env.USER_TWO_PASSWORD, role: 'utilisateur', displayName: 'Utilisateur 2' },
];

for (const user of users) {
  if (!user.email || !user.password) {
    throw new Error('Définis les variables *_EMAIL et *_PASSWORD avant de lancer seed:roles.');
  }
}

async function setupRoles() {
  console.log('Configuration des rôles et création des comptes utilisateurs...\n');

  for (const userData of users) {
    try {
      let user;
      try {
        // Vérifier si l'utilisateur existe
        user = await auth.getUserByEmail(userData.email);
        console.log(`✓ Utilisateur ${userData.email} existe déjà.`);
      } catch (error) {
        // Créer l'utilisateur s'il n'existe pas
        if (error.code === 'auth/user-not-found') {
          user = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName,
          });
          console.log(`✓ Utilisateur créé : ${userData.email}`);
        } else {
          throw error;
        }
      }

      // Assigner les Custom Claims (rôle)
      await auth.setCustomUserClaims(user.uid, { role: userData.role });
      console.log(`✓ Rôle assigné : ${userData.email} → ${userData.role}`);

    } catch (error) {
      console.error(`✗ Erreur pour ${userData.email} :`, error.message);
    }
  }

  console.log('\n✅ Configuration des rôles terminée !');
  console.log('\nComptes créés :');
  users.forEach(u => {
    console.log(`  • ${u.email} (rôle: ${u.role})`);
  });
}

setupRoles().catch(error => {
  console.error('Erreur générale :', error);
  process.exitCode = 1;
});
