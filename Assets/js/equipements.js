/* ============================================================
   LISTE DES ÉQUIPEMENTS — source de données partagée
   ------------------------------------------------------------
   Chargée par :
     - Dashboard/index.html   (tableau « Inventaire Récent »)
     - materiel/index.html    (tableau « Inventaire matériel »)

   Les données vivent uniquement ici, dans le code. Elles sont
   rechargées telles quelles à chaque rafraîchissement de la
   page : les ajouts, modifications et suppressions faits dans
   l'interface ne sont pas conservés d'une visite à l'autre.
   C'est le même fonctionnement que les pages Collaborateurs et
   Stocks & Licences.

   (Auparavant, la page Matériel recopiait cette liste dans
   localStorage['equipements'] ; la copie du navigateur prenait
   ensuite le pas sur le code, si bien que modifier la liste
   ici n'avait plus aucun effet. Cette clé a été supprimée.)

   Chaque page se sert de cette liste comme point de départ et
   en garde sa propre copie de travail en mémoire.
   ============================================================ */

const EQUIPEMENTS = [
  { id: "NRS-LPT-108", categorie: "Workstation",  modele: 'MacBook Pro 16" M2',        os: "macOS",            statut: "En service",   assigneA: "Yassine M.", pole: "Architecture" },
  { id: "NRS-MOB-042", categorie: "Mobile QA",    modele: "Samsung Galaxy S23",        os: "Android 13",       statut: "Labo testing", assigneA: "Karim B.",   pole: "QA & Auto" },
  { id: "NRS-LPT-215", categorie: "Laptop Dev",   modele: "Dell Latitude 7420",        os: "Windows 11 Pro",   statut: "En service",   assigneA: "Sofia A.",   pole: "DevSecOps" },
  { id: "NRS-ECR-099", categorie: "Périphérique", modele: 'Écran Dell UltraSharp 27"', os: "-",                statut: "En stock",     assigneA: "-",          pole: "Infrastructure" },
  { id: "NRS-LPT-088", categorie: "Laptop Dev",   modele: "HP EliteBook 840",          os: "Ubuntu 22.04",     statut: "Maintenance",  assigneA: "Support IT", pole: "Support interne" },
  { id: "NRS-LPT-131", categorie: "Laptop Dev",   modele: "Lenovo ThinkPad X1",        os: "Windows 11 Pro",   statut: "En service",   assigneA: "Nadia F.",   pole: "Backend" },
  { id: "NRS-MOB-057", categorie: "Mobile QA",    modele: "iPhone 14",                 os: "iOS 17",           statut: "Labo testing", assigneA: "Reda T.",    pole: "QA & Auto" },
  { id: "NRS-WKS-020", categorie: "Workstation",  modele: "Dell Precision 5570",       os: "Windows 11 Pro",   statut: "En service",   assigneA: "Omar Z.",    pole: "Data & IA" },
  { id: "NRS-SRV-004", categorie: "Serveur",      modele: "PowerEdge R750 (staging)",  os: "Ubuntu 22.04 LTS", statut: "En service",   assigneA: "DevOps",     pole: "Infrastructure" },
  { id: "NRS-LPT-176", categorie: "Laptop Dev",   modele: "MacBook Air M1",            os: "macOS",            statut: "En stock",     assigneA: "-",          pole: "Frontend" },
];

/* Les 4 statuts possibles, dans l'ordre d'affichage des menus déroulants. */
const STATUTS = ["En service", "Labo testing", "En stock", "Maintenance"];

/* Couleur du badge selon le statut. Les classes viennent du thème
   partagé (assets/css/theme.css) et sont donc identiques sur les
   deux pages. */
const STATUT_BADGE = {
  "En service":   "badge-blue",
  "Labo testing": "badge-purple",
  "En stock":     "badge-success",
  "Maintenance":  "badge-warning",
};

/* Empêche l'injection de HTML via un champ de formulaire. */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
