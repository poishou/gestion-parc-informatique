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

const db = admin.firestore();

const now = () => new Date().toISOString();

const collaborators = [
  { id: 'C-001', nom: 'Amina Benali', name: 'Amina Benali', telephone: '(212) 555-0101', phone: '(212) 555-0101', email: 'amina.benali@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-01-10', dateAdded: '2024-01-10', photo: '', role: 'utilisateur' },
  { id: 'C-002', nom: 'Youssef El Idrissi', name: 'Youssef El Idrissi', telephone: '(212) 555-0102', phone: '(212) 555-0102', email: 'youssef.elidrissi@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-01-18', dateAdded: '2024-01-18', photo: '', role: 'utilisateur' },
  { id: 'C-003', nom: 'Salma Alaoui', name: 'Salma Alaoui', telephone: '(212) 555-0103', phone: '(212) 555-0103', email: 'salma.alaoui@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-02-02', dateAdded: '2024-02-02', photo: '', role: 'utilisateur' },
  { id: 'C-004', nom: 'Karim Bensaid', name: 'Karim Bensaid', telephone: '(212) 555-0104', phone: '(212) 555-0104', email: 'karim.bensaid@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-02-08', dateAdded: '2024-02-08', photo: '', role: 'admin' },
  { id: 'C-005', nom: 'Nadia Lahlou', name: 'Nadia Lahlou', telephone: '(212) 555-0105', phone: '(212) 555-0105', email: 'nadia.lahlou@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-03-11', dateAdded: '2024-03-11', photo: '', role: 'utilisateur' },
  { id: 'C-006', nom: 'Omar Tazi', name: 'Omar Tazi', telephone: '(212) 555-0106', phone: '(212) 555-0106', email: 'omar.tazi@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-03-19', dateAdded: '2024-03-19', photo: '', role: 'utilisateur' },
  { id: 'C-007', nom: 'Leila Berrada', name: 'Leila Berrada', telephone: '(212) 555-0107', phone: '(212) 555-0107', email: 'leila.berrada@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-04-05', dateAdded: '2024-04-05', photo: '', role: 'utilisateur' },
  { id: 'C-008', nom: 'Hicham Saad', name: 'Hicham Saad', telephone: '(212) 555-0108', phone: '(212) 555-0108', email: 'hicham.saad@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-04-14', dateAdded: '2024-04-14', photo: '', role: 'utilisateur' },
  { id: 'C-009', nom: 'Meriem Chraibi', name: 'Meriem Chraibi', telephone: '(212) 555-0109', phone: '(212) 555-0109', email: 'meriem.chraibi@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-05-07', dateAdded: '2024-05-07', photo: '', role: 'utilisateur' },
  { id: 'C-010', nom: 'Adil Kabbaj', name: 'Adil Kabbaj', telephone: '(212) 555-0110', phone: '(212) 555-0110', email: 'adil.kabbaj@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-05-21', dateAdded: '2024-05-21', photo: '', role: 'utilisateur' },
  { id: 'C-011', nom: 'Sara Ibrahimi', name: 'Sara Ibrahimi', telephone: '(212) 555-0111', phone: '(212) 555-0111', email: 'sara.ibrahimi@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-06-03', dateAdded: '2024-06-03', photo: '', role: 'utilisateur' },
  { id: 'C-012', nom: 'Rachid Alami', name: 'Rachid Alami', telephone: '(212) 555-0112', phone: '(212) 555-0112', email: 'rachid.alami@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-06-13', dateAdded: '2024-06-13', photo: '', role: 'utilisateur' },
  { id: 'C-013', nom: 'Imane Hassani', name: 'Imane Hassani', telephone: '(212) 555-0113', phone: '(212) 555-0113', email: 'imane.hassani@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-07-02', dateAdded: '2024-07-02', photo: '', role: 'utilisateur' },
  { id: 'C-014', nom: 'Tarik El Mansouri', name: 'Tarik El Mansouri', telephone: '(212) 555-0114', phone: '(212) 555-0114', email: 'tarik.elmansouri@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-07-08', dateAdded: '2024-07-08', photo: '', role: 'utilisateur' },
  { id: 'C-015', nom: 'Ines Zerouali', name: 'Ines Zerouali', telephone: '(212) 555-0115', phone: '(212) 555-0115', email: 'ines.zerouali@norsys.ma', statut: 'Inactif', status: 'Inactif', dateAjout: '2023-08-22', dateAdded: '2023-08-22', photo: '', role: 'utilisateur' },
  { id: 'C-016', nom: 'Anass Driouech', name: 'Anass Driouech', telephone: '(212) 555-0116', phone: '(212) 555-0116', email: 'anass.driouech@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-08-10', dateAdded: '2024-08-10', photo: '', role: 'utilisateur' },
  { id: 'C-017', nom: 'Aya Mokhtari', name: 'Aya Mokhtari', telephone: '(212) 555-0117', phone: '(212) 555-0117', email: 'aya.mokhtari@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-08-27', dateAdded: '2024-08-27', photo: '', role: 'utilisateur' },
  { id: 'C-018', nom: 'Fouad Rami', name: 'Fouad Rami', telephone: '(212) 555-0118', phone: '(212) 555-0118', email: 'fouad.rami@norsys.ma', statut: 'Inactif', status: 'Inactif', dateAjout: '2023-09-15', dateAdded: '2023-09-15', photo: '', role: 'utilisateur' },
  { id: 'C-019', nom: 'Bouchra El Amrani', name: 'Bouchra El Amrani', telephone: '(212) 555-0119', phone: '(212) 555-0119', email: 'bouchra.elamrani@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-09-09', dateAdded: '2024-09-09', photo: '', role: 'utilisateur' },
  { id: 'C-020', nom: 'Zakaria Naciri', name: 'Zakaria Naciri', telephone: '(212) 555-0120', phone: '(212) 555-0120', email: 'zakaria.naciri@norsys.ma', statut: 'Actif', status: 'Actif', dateAjout: '2024-09-20', dateAdded: '2024-09-20', photo: '', role: 'utilisateur' },
];

const activeCollaborators = collaborators.filter((c) => c.statut === 'Actif');

const equipments = [
  { id: 'NRS-LPT-101', idMateriel: 'NRS-LPT-101', categorie: 'Laptop Dev', modele: 'Dell Latitude 7440', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Amina Benali', collaborateurId: 'C-001', colaborateurId: 'C-001', collaboratorId: 'C-001', poleExpertise: 'Backend', pole: 'Backend', numeroSerie: 'DL7440-101', agence: 'Agadir', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-102', idMateriel: 'NRS-LPT-102', categorie: 'Laptop Dev', modele: 'HP EliteBook 840 G10', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Youssef El Idrissi', collaborateurId: 'C-002', colaborateurId: 'C-002', collaboratorId: 'C-002', poleExpertise: 'Architecture', pole: 'Architecture', numeroSerie: 'HP840-102', agence: 'Agadir', fournisseur: 'HP', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-103', idMateriel: 'NRS-LPT-103', categorie: 'Laptop Dev', modele: 'Lenovo ThinkPad T14', os: 'Ubuntu 22.04', systemeOS: 'Ubuntu 22.04', statut: 'En service', assigneA: 'Salma Alaoui', collaborateurId: 'C-003', colaborateurId: 'C-003', collaboratorId: 'C-003', poleExpertise: 'DevSecOps', pole: 'DevSecOps', numeroSerie: 'LNV-T14-103', agence: 'Casablanca', fournisseur: 'Lenovo', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-104', idMateriel: 'NRS-LPT-104', categorie: 'Laptop Dev', modele: 'MacBook Pro 14" M3', os: 'macOS Sonoma', systemeOS: 'macOS Sonoma', statut: 'En service', assigneA: 'Karim Bensaid', collaborateurId: 'C-004', colaborateurId: 'C-004', collaboratorId: 'C-004', poleExpertise: 'Architecture', pole: 'Architecture', numeroSerie: 'MBP14-104', agence: 'Casablanca', fournisseur: 'Apple', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-105', idMateriel: 'NRS-LPT-105', categorie: 'Laptop Dev', modele: 'Dell Latitude 7440', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Nadia Lahlou', collaborateurId: 'C-005', colaborateurId: 'C-005', collaboratorId: 'C-005', poleExpertise: 'Frontend', pole: 'Frontend', numeroSerie: 'DL7440-105', agence: 'Marrakech', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-106', idMateriel: 'NRS-LPT-106', categorie: 'Laptop Dev', modele: 'HP ZBook Studio G10', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Omar Tazi', collaborateurId: 'C-006', colaborateurId: 'C-006', collaboratorId: 'C-006', poleExpertise: 'Data & IA', pole: 'Data & IA', numeroSerie: 'ZBOOK-106', agence: 'Agadir', fournisseur: 'HP', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-107', idMateriel: 'NRS-LPT-107', categorie: 'Laptop Dev', modele: 'Dell XPS 15', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Leila Berrada', collaborateurId: 'C-007', colaborateurId: 'C-007', collaboratorId: 'C-007', poleExpertise: 'Frontend', pole: 'Frontend', numeroSerie: 'XPS15-107', agence: 'Casablanca', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-108', idMateriel: 'NRS-LPT-108', categorie: 'Laptop Dev', modele: 'Lenovo ThinkPad X1 Carbon', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Hicham Saad', collaborateurId: 'C-008', colaborateurId: 'C-008', collaboratorId: 'C-008', poleExpertise: 'Backend', pole: 'Backend', numeroSerie: 'X1C-108', agence: 'Marrakech', fournisseur: 'Lenovo', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-109', idMateriel: 'NRS-LPT-109', categorie: 'Laptop Dev', modele: 'MacBook Air M2', os: 'macOS Ventura', systemeOS: 'macOS Ventura', statut: 'En service', assigneA: 'Meriem Chraibi', collaborateurId: 'C-009', colaborateurId: 'C-009', collaboratorId: 'C-009', poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MBA-M2-109', agence: 'Agadir', fournisseur: 'Apple', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-110', idMateriel: 'NRS-LPT-110', categorie: 'Laptop Dev', modele: 'Dell Latitude 5540', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Adil Kabbaj', collaborateurId: 'C-010', colaborateurId: 'C-010', collaboratorId: 'C-010', poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'L5540-110', agence: 'Casablanca', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-111', idMateriel: 'NRS-LPT-111', categorie: 'Laptop Dev', modele: 'Microsoft Surface Laptop 5', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Sara Ibrahimi', collaborateurId: 'C-011', colaborateurId: 'C-011', collaboratorId: 'C-011', poleExpertise: 'Support interne', pole: 'Support interne', numeroSerie: 'SL5-111', agence: 'Marrakech', fournisseur: 'Microsoft', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-112', idMateriel: 'NRS-LPT-112', categorie: 'Laptop Dev', modele: 'HP ProBook 450 G9', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Rachid Alami', collaborateurId: 'C-012', colaborateurId: 'C-012', collaboratorId: 'C-012', poleExpertise: 'Backend', pole: 'Backend', numeroSerie: 'PB450-112', agence: 'Agadir', fournisseur: 'HP', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-113', idMateriel: 'NRS-LPT-113', categorie: 'Laptop Dev', modele: 'Lenovo Legion 5', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'Maintenance', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'LEGION-113', agence: 'Casablanca', fournisseur: 'Lenovo', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-114', idMateriel: 'NRS-LPT-114', categorie: 'Laptop Dev', modele: 'Dell Latitude 5430', os: 'Windows 10 Pro', systemeOS: 'Windows 10 Pro', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'DL5430-114', agence: 'Agadir', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-115', idMateriel: 'NRS-LPT-115', categorie: 'Laptop Dev', modele: 'HP EliteBook 845', os: 'Ubuntu 22.04', systemeOS: 'Ubuntu 22.04', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Support interne', pole: 'Support interne', numeroSerie: 'HP845-115', agence: 'Marrakech', fournisseur: 'HP', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-116', idMateriel: 'NRS-LPT-116', categorie: 'Laptop Dev', modele: 'Apple MacBook Air M1', os: 'macOS Monterey', systemeOS: 'macOS Monterey', statut: 'Labo testing', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MBA-M1-116', agence: 'Casablanca', fournisseur: 'Apple', createdAt: now(), updatedAt: now() },
  { id: 'NRS-WKS-201', idMateriel: 'NRS-WKS-201', categorie: 'Workstation', modele: 'Dell Precision 5570', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Imane Hassani', collaborateurId: 'C-013', colaborateurId: 'C-013', collaboratorId: 'C-013', poleExpertise: 'Data & IA', pole: 'Data & IA', numeroSerie: 'WS-201', agence: 'Agadir', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-WKS-202', idMateriel: 'NRS-WKS-202', categorie: 'Workstation', modele: 'HP Z2 Tower G9', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Tarik El Mansouri', collaborateurId: 'C-014', colaborateurId: 'C-014', collaboratorId: 'C-014', poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'WS-202', agence: 'Casablanca', fournisseur: 'HP', createdAt: now(), updatedAt: now() },
  { id: 'NRS-WKS-203', idMateriel: 'NRS-WKS-203', categorie: 'Workstation', modele: 'Dell Precision 3650', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'Maintenance', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'WS-203', agence: 'Marrakech', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-WKS-204', idMateriel: 'NRS-WKS-204', categorie: 'Workstation', modele: 'Lenovo ThinkStation P360', os: 'Ubuntu 22.04', systemeOS: 'Ubuntu 22.04', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Backend', pole: 'Backend', numeroSerie: 'WS-204', agence: 'Agadir', fournisseur: 'Lenovo', createdAt: now(), updatedAt: now() },
  { id: 'NRS-WKS-205', idMateriel: 'NRS-WKS-205', categorie: 'Workstation', modele: 'HP Z2 Mini G9', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'Labo testing', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'DevSecOps', pole: 'DevSecOps', numeroSerie: 'WS-205', agence: 'Casablanca', fournisseur: 'HP', createdAt: now(), updatedAt: now() },
  { id: 'NRS-MOB-301', idMateriel: 'NRS-MOB-301', categorie: 'Mobile QA', modele: 'Samsung Galaxy S24', os: 'Android 14', systemeOS: 'Android 14', statut: 'En service', assigneA: 'Anass Driouech', collaborateurId: 'C-016', colaborateurId: 'C-016', collaboratorId: 'C-016', poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MOB-301', agence: 'Casablanca', fournisseur: 'Samsung', createdAt: now(), updatedAt: now() },
  { id: 'NRS-MOB-302', idMateriel: 'NRS-MOB-302', categorie: 'Mobile QA', modele: 'iPhone 15 Pro', os: 'iOS 17', systemeOS: 'iOS 17', statut: 'En service', assigneA: 'Aya Mokhtari', collaborateurId: 'C-017', colaborateurId: 'C-017', collaboratorId: 'C-017', poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MOB-302', agence: 'Agadir', fournisseur: 'Apple', createdAt: now(), updatedAt: now() },
  { id: 'NRS-MOB-303', idMateriel: 'NRS-MOB-303', categorie: 'Mobile QA', modele: 'Google Pixel 8', os: 'Android 14', systemeOS: 'Android 14', statut: 'Labo testing', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MOB-303', agence: 'Marrakech', fournisseur: 'Google', createdAt: now(), updatedAt: now() },
  { id: 'NRS-MOB-304', idMateriel: 'NRS-MOB-304', categorie: 'Mobile QA', modele: 'Samsung Galaxy A55', os: 'Android 14', systemeOS: 'Android 14', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MOB-304', agence: 'Casablanca', fournisseur: 'Samsung', createdAt: now(), updatedAt: now() },
  { id: 'NRS-MOB-305', idMateriel: 'NRS-MOB-305', categorie: 'Mobile QA', modele: 'OnePlus 12', os: 'Android 14', systemeOS: 'Android 14', statut: 'Maintenance', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MOB-305', agence: 'Agadir', fournisseur: 'OnePlus', createdAt: now(), updatedAt: now() },
  { id: 'NRS-ECR-401', idMateriel: 'NRS-ECR-401', categorie: 'Périphérique', modele: 'Écran Dell UltraSharp 27"', os: '-', systemeOS: '-', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'ECR-401', agence: 'Agadir', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-ECR-402', idMateriel: 'NRS-ECR-402', categorie: 'Périphérique', modele: 'Écran LG UltraFine 27"', os: '-', systemeOS: '-', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'ECR-402', agence: 'Casablanca', fournisseur: 'LG', createdAt: now(), updatedAt: now() },
  { id: 'NRS-ECR-403', idMateriel: 'NRS-ECR-403', categorie: 'Périphérique', modele: 'Écran Philips 24"', os: '-', systemeOS: '-', statut: 'Maintenance', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'ECR-403', agence: 'Marrakech', fournisseur: 'Philips', createdAt: now(), updatedAt: now() },
  { id: 'NRS-ECR-404', idMateriel: 'NRS-ECR-404', categorie: 'Périphérique', modele: 'Clavier Logitech MX Keys', os: '-', systemeOS: '-', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Support interne', pole: 'Support interne', numeroSerie: 'ECR-404', agence: 'Agadir', fournisseur: 'Logitech', createdAt: now(), updatedAt: now() },
  { id: 'NRS-ECR-405', idMateriel: 'NRS-ECR-405', categorie: 'Périphérique', modele: 'Souris Logitech MX Master', os: '-', systemeOS: '-', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Support interne', pole: 'Support interne', numeroSerie: 'ECR-405', agence: 'Casablanca', fournisseur: 'Logitech', createdAt: now(), updatedAt: now() },
  { id: 'NRS-SRV-501', idMateriel: 'NRS-SRV-501', categorie: 'Serveur', modele: 'Dell PowerEdge R750', os: 'Ubuntu 22.04 LTS', systemeOS: 'Ubuntu 22.04 LTS', statut: 'En service', assigneA: 'Bouchra El Amrani', collaborateurId: 'C-019', colaborateurId: 'C-019', collaboratorId: 'C-019', poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'SRV-501', agence: 'Casablanca', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-SRV-502', idMateriel: 'NRS-SRV-502', categorie: 'Serveur', modele: 'HP ProLiant DL380 Gen10', os: 'Ubuntu 22.04 LTS', systemeOS: 'Ubuntu 22.04 LTS', statut: 'En service', assigneA: 'Zakaria Naciri', collaborateurId: 'C-020', colaborateurId: 'C-020', collaboratorId: 'C-020', poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'SRV-502', agence: 'Marrakech', fournisseur: 'HP', createdAt: now(), updatedAt: now() },
  { id: 'NRS-SRV-503', idMateriel: 'NRS-SRV-503', categorie: 'Serveur', modele: 'Lenovo SR650', os: 'Windows Server 2022', systemeOS: 'Windows Server 2022', statut: 'Maintenance', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'SRV-503', agence: 'Agadir', fournisseur: 'Lenovo', createdAt: now(), updatedAt: now() },
  { id: 'NRS-SRV-504', idMateriel: 'NRS-SRV-504', categorie: 'Serveur', modele: 'Dell PowerEdge R650', os: 'Ubuntu 22.04 LTS', systemeOS: 'Ubuntu 22.04 LTS', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Infrastructure', pole: 'Infrastructure', numeroSerie: 'SRV-504', agence: 'Casablanca', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-117', idMateriel: 'NRS-LPT-117', categorie: 'Laptop Dev', modele: 'Dell Inspiron 15', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En stock', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'Support interne', pole: 'Support interne', numeroSerie: 'INSP-117', agence: 'Marrakech', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
  { id: 'NRS-LPT-118', idMateriel: 'NRS-LPT-118', categorie: 'Laptop Dev', modele: 'HP Pavilion 15', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Amina Benali', collaborateurId: 'C-001', colaborateurId: 'C-001', collaboratorId: 'C-001', poleExpertise: 'Support interne', pole: 'Support interne', numeroSerie: 'PAV-118', agence: 'Agadir', fournisseur: 'HP', createdAt: now(), updatedAt: now() },
  { id: 'NRS-MOB-306', idMateriel: 'NRS-MOB-306', categorie: 'Mobile QA', modele: 'iPhone 14', os: 'iOS 17', systemeOS: 'iOS 17', statut: 'En service', assigneA: 'Leila Berrada', collaborateurId: 'C-007', colaborateurId: 'C-007', collaboratorId: 'C-007', poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MOB-306', agence: 'Marrakech', fournisseur: 'Apple', createdAt: now(), updatedAt: now() },
  { id: 'NRS-MOB-307', idMateriel: 'NRS-MOB-307', categorie: 'Mobile QA', modele: 'Samsung Galaxy S23', os: 'Android 13', systemeOS: 'Android 13', statut: 'Labo testing', assigneA: '—', collaborateurId: null, collaboratorId: null, poleExpertise: 'QA & Auto', pole: 'QA & Auto', numeroSerie: 'MOB-307', agence: 'Casablanca', fournisseur: 'Samsung', createdAt: now(), updatedAt: now() },
  { id: 'NRS-WKS-206', idMateriel: 'NRS-WKS-206', categorie: 'Workstation', modele: 'Dell Precision 7820', os: 'Windows 11 Pro', systemeOS: 'Windows 11 Pro', statut: 'En service', assigneA: 'Salma Alaoui', collaborateurId: 'C-003', colaborateurId: 'C-003', collaboratorId: 'C-003', poleExpertise: 'Data & IA', pole: 'Data & IA', numeroSerie: 'WS-206', agence: 'Marrakech', fournisseur: 'Dell', createdAt: now(), updatedAt: now() },
];

const stockMateriel = [
  { id: 'STK-001', categorie: 'Périphérique', modele: 'Écran Dell UltraSharp 27"', agence: 'Agadir', fournisseur: 'Dell', quantite: 8, statut: 'Disponible' },
  { id: 'STK-002', categorie: 'Périphérique', modele: 'Écran LG UltraFine 27"', agence: 'Casablanca', fournisseur: 'LG', quantite: 4, statut: 'Disponible' },
  { id: 'STK-003', categorie: 'Périphérique', modele: 'Clavier Logitech MX Keys', agence: 'Marrakech', fournisseur: 'Logitech', quantite: 12, statut: 'Disponible' },
  { id: 'STK-004', categorie: 'Laptop Dev', modele: 'Dell Latitude 7440', agence: 'Agadir', fournisseur: 'Dell', quantite: 2, statut: 'Stock Bas' },
  { id: 'STK-005', categorie: 'Laptop Dev', modele: 'HP EliteBook 840 G10', agence: 'Casablanca', fournisseur: 'HP', quantite: 3, statut: 'Stock Bas' },
  { id: 'STK-006', categorie: 'Laptop Dev', modele: 'Lenovo ThinkPad T14', agence: 'Marrakech', fournisseur: 'Lenovo', quantite: 2, statut: 'Stock Bas' },
  { id: 'STK-007', categorie: 'Mobile QA', modele: 'Samsung Galaxy S24', agence: 'Casablanca', fournisseur: 'Samsung', quantite: 1, statut: 'Disponible' },
  { id: 'STK-008', categorie: 'Mobile QA', modele: 'Google Pixel 8', agence: 'Marrakech', fournisseur: 'Google', quantite: 2, statut: 'Disponible' },
  { id: 'STK-009', categorie: 'Mobile QA', modele: 'OnePlus 12', agence: 'Agadir', fournisseur: 'OnePlus', quantite: 1, statut: 'Stock Bas' },
  { id: 'STK-010', categorie: 'Workstation', modele: 'Dell Precision 5570', agence: 'Agadir', fournisseur: 'Dell', quantite: 1, statut: 'Stock Bas' },
  { id: 'STK-011', categorie: 'Workstation', modele: 'HP Z2 Tower G9', agence: 'Casablanca', fournisseur: 'HP', quantite: 1, statut: 'Disponible' },
  { id: 'STK-012', categorie: 'Serveur', modele: 'Dell PowerEdge R650', agence: 'Casablanca', fournisseur: 'Dell', quantite: 1, statut: 'Stock Bas' },
];

const licences = [
  { id: 'LIC-001', nom: 'Microsoft 365 Business Premium', editeur: 'Microsoft', type: 'Abonnement', siegesOccupes: 45, siegesTotal: 50, expiration: '2026-09-15', coutAnnuel: 42000, poleAssigne: 'Support interne', statut: 'Actif', sieges: '45/50', cout: '42 000 MAD', pole: 'Support interne' },
  { id: 'LIC-002', nom: 'Adobe Creative Cloud', editeur: 'Adobe', type: 'Abonnement', siegesOccupes: 8, siegesTotal: 10, expiration: '2026-08-03', coutAnnuel: 18500, poleAssigne: 'Architecture', statut: 'Expire bientôt', sieges: '8/10', cout: '18 500 MAD', pole: 'Architecture' },
  { id: 'LIC-003', nom: 'JetBrains All Products Pack', editeur: 'JetBrains', type: 'Abonnement', siegesOccupes: 12, siegesTotal: 12, expiration: '2027-01-20', coutAnnuel: 15000, poleAssigne: 'DevSecOps', statut: 'Actif', sieges: '12/12', cout: '15 000 MAD', pole: 'DevSecOps' },
  { id: 'LIC-004', nom: 'AutoCAD 2026', editeur: 'Autodesk', type: 'Perpétuelle', siegesOccupes: 4, siegesTotal: 5, expiration: null, coutAnnuel: 0, poleAssigne: 'Infrastructure', statut: 'Perpétuelle', sieges: '4/5', cout: '0 MAD', pole: 'Infrastructure' },
  { id: 'LIC-005', nom: 'CrowdStrike Falcon EDR', editeur: 'CrowdStrike', type: 'Abonnement', siegesOccupes: 340, siegesTotal: 350, expiration: '2026-07-28', coutAnnuel: 95000, poleAssigne: 'Support interne', statut: 'Expire bientôt', sieges: '340/350', cout: '95 000 MAD', pole: 'Support interne' },
  { id: 'LIC-006', nom: 'GitHub Enterprise', editeur: 'GitHub', type: 'Abonnement', siegesOccupes: 28, siegesTotal: 30, expiration: '2026-11-10', coutAnnuel: 32000, poleAssigne: 'DevSecOps', statut: 'Actif', sieges: '28/30', cout: '32 000 MAD', pole: 'DevSecOps' },
  { id: 'LIC-007', nom: 'Zoom Business', editeur: 'Zoom', type: 'Abonnement', siegesOccupes: 20, siegesTotal: 20, expiration: '2026-07-15', coutAnnuel: 9800, poleAssigne: 'Support interne', statut: 'Expire bientôt', sieges: '20/20', cout: '9 800 MAD', pole: 'Support interne' },
  { id: 'LIC-008', nom: 'Notion Plus', editeur: 'Notion', type: 'Abonnement', siegesOccupes: 18, siegesTotal: 25, expiration: '2026-12-12', coutAnnuel: 12000, poleAssigne: 'Frontend', statut: 'Actif', sieges: '18/25', cout: '12 000 MAD', pole: 'Frontend' },
  { id: 'LIC-009', nom: 'Figma Professional', editeur: 'Figma', type: 'Abonnement', siegesOccupes: 13, siegesTotal: 15, expiration: '2026-03-16', coutAnnuel: 11000, poleAssigne: 'Architecture', statut: 'Expirée', sieges: '13/15', cout: '11 000 MAD', pole: 'Architecture' },
  { id: 'LIC-010', nom: 'SAP Business One', editeur: 'SAP', type: 'Perpétuelle', siegesOccupes: 2, siegesTotal: 3, expiration: null, coutAnnuel: 0, poleAssigne: 'Data & IA', statut: 'Perpétuelle', sieges: '2/3', cout: '0 MAD', pole: 'Data & IA' },
];

const affectations = [
  { id: 'AFF-001', equipementId: 'NRS-LPT-101', collaborateurId: 'C-001', collaborateurNom: 'Amina Benali', dateRemise: '2025-01-15', dateRestitution: null },
  { id: 'AFF-002', equipementId: 'NRS-LPT-102', collaborateurId: 'C-002', collaborateurNom: 'Youssef El Idrissi', dateRemise: '2025-02-02', dateRestitution: null },
  { id: 'AFF-003', equipementId: 'NRS-LPT-103', collaborateurId: 'C-003', collaborateurNom: 'Salma Alaoui', dateRemise: '2025-02-18', dateRestitution: null },
  { id: 'AFF-004', equipementId: 'NRS-LPT-104', collaborateurId: 'C-004', collaborateurNom: 'Karim Bensaid', dateRemise: '2025-03-11', dateRestitution: null },
  { id: 'AFF-005', equipementId: 'NRS-LPT-105', collaborateurId: 'C-005', collaborateurNom: 'Nadia Lahlou', dateRemise: '2025-04-03', dateRestitution: null },
  { id: 'AFF-006', equipementId: 'NRS-LPT-106', collaborateurId: 'C-006', collaborateurNom: 'Omar Tazi', dateRemise: '2025-04-17', dateRestitution: null },
  { id: 'AFF-007', equipementId: 'NRS-LPT-107', collaborateurId: 'C-007', collaborateurNom: 'Leila Berrada', dateRemise: '2025-05-10', dateRestitution: null },
  { id: 'AFF-008', equipementId: 'NRS-LPT-108', collaborateurId: 'C-008', collaborateurNom: 'Hicham Saad', dateRemise: '2025-06-05', dateRestitution: null },
  { id: 'AFF-009', equipementId: 'NRS-LPT-109', collaborateurId: 'C-009', collaborateurNom: 'Meriem Chraibi', dateRemise: '2025-06-14', dateRestitution: null },
  { id: 'AFF-010', equipementId: 'NRS-LPT-110', collaborateurId: 'C-010', collaborateurNom: 'Adil Kabbaj', dateRemise: '2025-07-06', dateRestitution: null },
  { id: 'AFF-011', equipementId: 'NRS-LPT-111', collaborateurId: 'C-011', collaborateurNom: 'Sara Ibrahimi', dateRemise: '2025-07-21', dateRestitution: null },
  { id: 'AFF-012', equipementId: 'NRS-LPT-112', collaborateurId: 'C-012', collaborateurNom: 'Rachid Alami', dateRemise: '2025-08-01', dateRestitution: null },
  { id: 'AFF-013', equipementId: 'NRS-WKS-201', collaborateurId: 'C-013', collaborateurNom: 'Imane Hassani', dateRemise: '2025-01-09', dateRestitution: null },
  { id: 'AFF-014', equipementId: 'NRS-WKS-202', collaborateurId: 'C-014', collaborateurNom: 'Tarik El Mansouri', dateRemise: '2025-02-23', dateRestitution: null },
  { id: 'AFF-015', equipementId: 'NRS-MOB-301', collaborateurId: 'C-016', collaborateurNom: 'Anass Driouech', dateRemise: '2025-03-20', dateRestitution: null },
  { id: 'AFF-016', equipementId: 'NRS-MOB-302', collaborateurId: 'C-017', collaborateurNom: 'Aya Mokhtari', dateRemise: '2025-04-16', dateRestitution: null },
  { id: 'AFF-017', equipementId: 'NRS-SRV-501', collaborateurId: 'C-019', collaborateurNom: 'Bouchra El Amrani', dateRemise: '2024-12-01', dateRestitution: null },
  { id: 'AFF-018', equipementId: 'NRS-LPT-118', collaborateurId: 'C-001', collaborateurNom: 'Amina Benali', dateRemise: '2025-08-15', dateRestitution: null },
  { id: 'AFF-019', equipementId: 'NRS-MOB-306', collaborateurId: 'C-007', collaborateurNom: 'Leila Berrada', dateRemise: '2025-06-20', dateRestitution: null },
  { id: 'AFF-020', equipementId: 'NRS-WKS-206', collaborateurId: 'C-003', collaborateurNom: 'Salma Alaoui', dateRemise: '2025-07-20', dateRestitution: null },
  { id: 'AFF-021', equipementId: 'NRS-LPT-101', collaborateurId: 'C-004', collaborateurNom: 'Karim Bensaid', dateRemise: '2024-10-18', dateRestitution: '2024-12-31' },
  { id: 'AFF-022', equipementId: 'NRS-LPT-102', collaborateurId: 'C-005', collaborateurNom: 'Nadia Lahlou', dateRemise: '2024-11-10', dateRestitution: '2025-01-25' },
  { id: 'AFF-023', equipementId: 'NRS-WKS-201', collaborateurId: 'C-008', collaborateurNom: 'Hicham Saad', dateRemise: '2024-09-04', dateRestitution: '2024-12-15' },
  { id: 'AFF-024', equipementId: 'NRS-MOB-301', collaborateurId: 'C-010', collaborateurNom: 'Adil Kabbaj', dateRemise: '2024-08-12', dateRestitution: '2024-12-03' },
];

async function collectionExists(collectionName) {
  const snapshot = await db.collection(collectionName).limit(1).get();
  return !snapshot.empty;
}

async function writeCollection(collectionName, docs) {
  const batchSize = 500;
  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    const batch = db.batch();
    for (const doc of chunk) {
      const ref = db.collection(collectionName).doc(doc.id);
      batch.set(ref, doc);
    }
    await batch.commit();
  }
}

async function ensureSeed() {
  const desiredCollections = [
    { name: 'collaborateurs', docs: collaborators },
    { name: 'equipements', docs: equipments },
    { name: 'stockMateriel', docs: stockMateriel.map((s) => ({ ...s, quantite: s.quantite ?? 0, statut: s.statut ?? 'Disponible' })) },
    { name: 'licences', docs: licences },
    { name: 'affectations', docs: affectations },
  ];

  for (const collection of desiredCollections) {
    const alreadyHasData = await collectionExists(collection.name);
    if (alreadyHasData) {
      console.log(`Collection ${collection.name} existe déjà. Vérification des doublons puis mise à jour uniquement des documents absents.`);
      for (const doc of collection.docs) {
        const ref = db.collection(collection.name).doc(doc.id);
        const snap = await ref.get();
        if (!snap.exists) {
          await ref.set(doc);
        }
      }
      console.log(`Collection ${collection.name} vérifiée.`);
      continue;
    }

    console.log(`Création de ${collection.name} (${collection.docs.length} documents)`);
    await writeCollection(collection.name, collection.docs);
  }

  console.log('Seed Firestore terminé avec succès pour le projet parc-info-norsys.');
}

try {
  await ensureSeed();
} catch (error) {
  console.error('Erreur pendant le seed Firestore :', error);
  process.exitCode = 1;
}
