import { db } from "../js/firebase-config.js";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// =========================================
// DONNÉES (chargées depuis Firestore)
// =========================================

let stockMateriel = [];
let licencesLogicielles = [];

onSnapshot(collection(db, "stockMateriel"), (snapshot) => {
  stockMateriel = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      docId: doc.id,
      id: data.id || doc.id,
      categorie: data.categorie || "-",
      modele: data.modele || "-",
      quantite: Number(data.quantite ?? 0),
      agence: data.agence || "-",
      fournisseur: data.fournisseur || "-",
      statut: data.statut || "Disponible",
    };
  });
  rafraichirStock();
  mettreAJourStats();
});

onSnapshot(collection(db, "licences"), (snapshot) => {
  licencesLogicielles = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      docId: doc.id,
      id: data.id || doc.id,
      nom: data.nom || "-",
      editeur: data.editeur || "-",
      type: data.type || "Abonnement",
      sieges: data.sieges || "0/0",
      expiration: data.expiration || "—",
      cout: data.cout || "0 MAD",
      pole: data.pole || "-",
      statut: data.statut || "Actif",
    };
  });
  rafraichirLicences();
  mettreAJourStats();
});

// =========================================
// FONCTIONS D'AFFICHAGE ET RENDU (TABLEAUX)
// =========================================

function classeBadge(statut) {
  if (statut === "Disponible" || statut === "Actif" || statut === "Perpétuelle") return "badge-success";
  if (statut === "Stock Bas" || statut === "Expire bientôt") return "badge-warning";
  if (statut === "Épuisé") return "badge-danger";
  return "";
}

function afficherStock(liste = stockMateriel) {
  const tbody = document.getElementById("table-stock");
  if (!tbody) return; // Sécurité si le tableau n'existe pas sur la page
  tbody.innerHTML = liste.map(item => `
    <tr data-id="${item.id}">
      <td class="fw-600">#${item.id}</td>
      <td class="cell-muted">${item.categorie}</td>
      <td>${item.modele}</td>
      <td>${item.quantite}</td>
      <td class="cell-muted hide-mobile">${item.agence}</td>
      <td class="cell-muted hide-mobile">${item.fournisseur}</td>
      <td><span class="badge ${classeBadge(item.statut)}">${item.statut}</span></td>
      <td class="admin-only-cell">
        <div class="row-actions">
          <button type="button" class="icon-btn icon-edit" onclick="modifierArticle('${item.id}')" title="Modifier" aria-label="Modifier ${item.id}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
          <button type="button" class="icon-btn icon-delete" onclick="supprimerArticle('${item.id}')" title="Supprimer" aria-label="Supprimer ${item.id}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function afficherLicences(liste = licencesLogicielles) {
  const tbody = document.getElementById("table-licences");
  if (!tbody) return; // Sécurité si le tableau n'existe pas sur la page
  tbody.innerHTML = liste.map(item => {
    const [utilises, total] = item.sieges.split("/").map(Number);
    const pourcentage = total ? Math.round((utilises / total) * 100) : 0;
    return `
    <tr data-id="${item.id}">
      <td class="fw-600">
        ${item.nom}
        <span class="licence-ref">#${item.id}</span>
      </td>
      <td class="cell-muted">${item.editeur}</td>
      <td class="cell-muted hide-mobile">${item.type}</td>
      <td>
        <strong>${item.sieges}</strong>
        <span class="seat-gauge"><span style="width:${pourcentage}%"></span></span>
      </td>
      <td class="cell-muted hide-mobile">${item.expiration}</td>
      <td class="cell-muted hide-mobile">${item.cout}</td>
      <td class="cell-muted hide-mobile">${item.pole}</td>
      <td><span class="badge ${classeBadge(item.statut)}">${item.statut}</span></td>
      <td class="admin-only-cell">
        <div class="row-actions">
          <button type="button" class="icon-btn icon-edit" onclick="modifierLicence('${item.id}')" title="Modifier" aria-label="Modifier ${item.id}">✎</button>
          <button type="button" class="icon-btn icon-delete" onclick="supprimerLicence('${item.id}')" title="Supprimer" aria-label="Supprimer ${item.id}">×</button>
        </div>
      </td>
    </tr>
  `;
  }).join("");
}

// =========================================
// ACTIONS CRUD (ÉlÉMENTS INDIVIDUELS)
// =========================================

// Article en cours de modification (null = on est en train d'en ajouter un)
let articleEnCours = null;
let licenceEnCours = null;

// Réaffiche le tableau du stock en conservant la recherche et le filtre
// de statut en cours. Sans cela, ajouter ou supprimer un article ferait
// réapparaître toute la liste sans prévenir l'utilisateur.
function rafraichirStock() {
  const texte = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  const statut = document.getElementById("filtre-statut-stock")?.value || "all";

  afficherStock(stockMateriel.filter(item => {
    const correspondTexte = !texte ||
      item.id.toLowerCase().includes(texte) ||
      item.modele.toLowerCase().includes(texte) ||
      item.categorie.toLowerCase().includes(texte);
    const correspondStatut = statut === "all" || item.statut === statut;
    return correspondTexte && correspondStatut;
  }));

  mettreAJourStats();
}

function modifierLicence(id) {
  const licence = licencesLogicielles.find(item => item.id === id);
  if (!licence) return;

  licenceEnCours = licence.id;
  document.getElementById("lic-nom").value = licence.nom;
  document.getElementById("lic-editeur").value = licence.editeur;
  document.getElementById("lic-type").value = licence.type;
  document.getElementById("lic-sieges").value = licence.sieges;
  document.getElementById("lic-expiration").value = licence.expiration === "—" ? "" : licence.expiration;
  document.getElementById("lic-cout").value = licence.cout;
  document.getElementById("lic-pole").value = licence.pole;
  document.getElementById("lic-statut").value = licence.statut;
  document.querySelector("#modal-licence h2").textContent = `Modifier la Licence #${licence.id}`;
  document.querySelector("#modal-licence button[type='submit']").textContent = "Enregistrer";
  ouvrirModal("modal-licence");
}

function supprimerLicence(id) {
  const licence = licencesLogicielles.find(item => item.id === id);
  if (!licence || !confirm(`Supprimer la licence ${licence.nom} ?`)) return;

  deleteDoc(doc(db, "licences", licence.docId)).catch(error => {
    console.error("Erreur lors de la suppression Firestore :", error);
    alert(`Erreur : ${error.message}`);
  });
}

// Même principe pour le tableau des licences
function rafraichirLicences() {
  const texte = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

  afficherLicences(licencesLogicielles.filter(item =>
    !texte ||
    item.id.toLowerCase().includes(texte) ||
    item.nom.toLowerCase().includes(texte) ||
    item.editeur.toLowerCase().includes(texte)
  ));

  mettreAJourStats();
}

// Ouvre la fenêtre en mode « ajout »
function ouvrirModalArticle() {
  articleEnCours = null;
  document.getElementById("form-article").reset();
  document.getElementById("titre-modal-article").textContent = "Nouvel Article";
  document.getElementById("valider-article").textContent = "Ajouter";
  ouvrirModal("modal-article");
}

function ouvrirModalLicence() {
  licenceEnCours = null;
  document.getElementById("form-licence").reset();
  document.querySelector("#modal-licence h2").textContent = "Nouvelle Licence";
  document.querySelector("#modal-licence button[type='submit']").textContent = "Ajouter";
  ouvrirModal("modal-licence");
}

// Ouvre la même fenêtre, pré-remplie, en mode « modification »
function modifierArticle(id) {
  const article = stockMateriel.find(item => item.id === id);
  if (!article) return;

  articleEnCours = article.id;

  document.getElementById("art-categorie").value = article.categorie;
  document.getElementById("art-modele").value = article.modele;
  document.getElementById("art-quantite").value = article.quantite;
  document.getElementById("art-agence").value = article.agence;
  document.getElementById("art-fournisseur").value = article.fournisseur;
  document.getElementById("art-statut").value = article.statut;

  document.getElementById("titre-modal-article").textContent = "Modifier l'Article #" + article.id;
  document.getElementById("valider-article").textContent = "Enregistrer";
  ouvrirModal("modal-article");
}

function supprimerArticle(id) {
  const article = stockMateriel.find(item => item.id === id);
  if (!article) return;

  if (confirm(`Supprimer l'article ${article.id} (${article.modele}) ?`)) {
    deleteDoc(doc(db, "stockMateriel", article.docId)).catch(error => {
      console.error("Erreur lors de la suppression Firestore :", error);
      alert(`Erreur : ${error.message}`);
    });
  }
}

// =========================================
// GESTION DES POPUPS (MODALES)
// =========================================

// Même convention que les autres pages : la modale est masquée
// tant qu'elle porte la classe "hidden".
function ouvrirModal(idModal) {
  document.getElementById(idModal).classList.remove("hidden");
}

function fermerModal(idModal) {
  document.getElementById(idModal).classList.add("hidden");
  const form = document.getElementById(idModal).querySelector("form");
  if (form) form.reset();
  if (idModal === "modal-article") articleEnCours = null;
  if (idModal === "modal-licence") licenceEnCours = null;
}

// Ferme la popup si on clique en dehors de la boîte (sur le fond sombre)
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      fermerModal(overlay.id);
    }
  });
});

// Génère le prochain ID au format PREFIX-00X
function prochainId(liste, prefixe) {
  const numeros = liste.map(item => parseInt(item.id.split("-")[1], 10));
  const max = numeros.length ? Math.max(...numeros) : 0;
  return prefixe + "-" + String(max + 1).padStart(3, "0");
}

// Recalcule les 4 cartes statistiques en haut de page
function mettreAJourStats() {
  const totalUnites = stockMateriel.reduce((somme, item) => somme + item.quantite, 0);
  document.getElementById("stat-unites").textContent = totalUnites;

  document.getElementById("stat-licences").textContent = licencesLogicielles.length;

  const expirentBientot = licencesLogicielles.filter(l => l.statut === "Expire bientôt").length;
  document.getElementById("stat-expirent").textContent = expirentBientot;

  const coutTotal = licencesLogicielles.reduce((somme, item) => {
    const nombre = parseInt(item.cout.replace(/[^\d]/g, ""), 10) || 0;
    return somme + nombre;
  }, 0);
  document.getElementById("stat-cout").textContent = coutTotal.toLocaleString("fr-FR") + " MAD";
}

// =========================================
// AJOUT OU MODIFICATION D'UN ARTICLE (Stock Matériel)
// =========================================

async function enregistrerArticle(event) {
  event.preventDefault();

  const saisie = {
    categorie: document.getElementById("art-categorie").value,
    modele: document.getElementById("art-modele").value,
    quantite: parseInt(document.getElementById("art-quantite").value, 10) || 0,
    agence: document.getElementById("art-agence").value,
    fournisseur: document.getElementById("art-fournisseur").value,
    statut: document.getElementById("art-statut").value,
  };

  try {
    if (articleEnCours) {
      const article = stockMateriel.find(item => item.id === articleEnCours);
      await updateDoc(doc(db, "stockMateriel", article.docId), {
        ...saisie,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, "stockMateriel"), {
        id: prochainId(stockMateriel, "STK"),
        ...saisie,
        createdAt: serverTimestamp()
      });
    }
    fermerModal("modal-article");
  } catch (error) {
    console.error("Erreur lors de la sauvegarde Firestore :", error);
    alert(`Erreur : ${error.message}`);
  }
}

// =========================================
// AJOUT D'UNE NOUVELLE LICENCE
// =========================================

async function ajouterLicence(event) {
  event.preventDefault();

  const nouvelleLicence = {
    id: licenceEnCours || prochainId(licencesLogicielles, "LIC"),
    nom: document.getElementById("lic-nom").value,
    editeur: document.getElementById("lic-editeur").value,
    type: document.getElementById("lic-type").value,
    sieges: document.getElementById("lic-sieges").value,
    expiration: document.getElementById("lic-expiration").value || "—",
    cout: document.getElementById("lic-cout").value,
    pole: document.getElementById("lic-pole").value,
    statut: document.getElementById("lic-statut").value,
  };

  try {
    if (licenceEnCours) {
      const licence = licencesLogicielles.find(item => item.id === licenceEnCours);
      await updateDoc(doc(db, "licences", licence.docId), {
        ...nouvelleLicence,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, "licences"), {
        ...nouvelleLicence,
        createdAt: serverTimestamp()
      });
    }
    fermerModal("modal-licence");
  } catch (error) {
    console.error("Erreur lors de la création Firestore :", error);
    alert(`Erreur : ${error.message}`);
  }
}

// =========================================
// SÉCURISATION ET INITIALISATION DE L'INTERFACE UI
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  // Affichage initial des tableaux et des compteurs
  // (les cartes sont calculées à partir des données dès le chargement,
  //  et non plus seulement après un ajout ou une suppression)
  rafraichirStock();
  rafraichirLicences();

  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");
  const searchInput = document.getElementById("searchInput");
  const filtreStock = document.getElementById("filtre-statut-stock");
  const themeToggleBtn = document.querySelector(".theme-toggle");

  // 1. FONCTIONNEMENT DE LA RECHERCHE (Sécurisé)
  //    rafraichirStock/rafraichirLicences relisent eux-mêmes la recherche
  //    et le filtre en cours : la même fonction sert au filtrage, à
  //    l'ajout, à la modification et à la suppression.
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      rafraichirStock();
      rafraichirLicences();
    });
  }

  // 2. FILTRAGE PAR STATUT (Sécurisé)
  if (filtreStock) {
    filtreStock.addEventListener("change", rafraichirStock);
  }

  // 3. FERMETURE DE LA SIDEBAR SUR MOBILE
  if (mainContent && sidebar) {
    mainContent.addEventListener("click", () => {
      if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    });
  }

  // 4. BOUTON SÉLECTEUR DE MENU HAMBURGER (Pour ouvrir la sidebar sur mobile)
  const menuToggle = document.querySelector(".menu-toggle");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation(); // Évite que le clic ferme immédiatement la barre
      sidebar.classList.toggle("open");
    });
  }

  // 5. COMMUTATEUR DE THÈME SOMBRE (Avec icône dynamique)
  //    La classe est posée sur <html>, comme sur les 3 autres pages,
  //    et la préférence est partagée via localStorage['theme'].
  const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector("i") : null;

  const appliquerTheme = (isDark) => {
    document.documentElement.classList.toggle("dark", isDark);
    if (themeIcon) {
      themeIcon.className = isDark ? "fa-solid fa-sun" : "fa-regular fa-moon";
    }
  };

  appliquerTheme(localStorage.getItem("theme") === "dark");

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isDark = !document.documentElement.classList.contains("dark");
      appliquerTheme(isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }
});

Object.assign(window, {
  ouvrirModalArticle,
  ouvrirModalLicence,
  ouvrirModal,
  fermerModal,
  enregistrerArticle,
  ajouterLicence,
  modifierArticle,
  supprimerArticle,
  modifierLicence,
  supprimerLicence
});


// 8. Gestion du Menu Déroulant du Profil
    const profileBtn = document.querySelector('.user-profile');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileBtn && profileDropdown) {
        // Toggle à l'ouverture/fermeture lors du clic sur le profil
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Évite la propagation du clic pour ne pas déclencher la fermeture globale
            profileDropdown.classList.toggle('hidden');
        });

        // Fermer automatiquement le menu si l'utilisateur clique en dehors du profil ou du menu
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }