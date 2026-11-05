// ============================================================
//  Matériel Dev & QA — logique de la page (version simplifiée)
// ============================================================
import { db } from "../../js/firebase-config.js";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { applyAssignmentChange, buildAssignmentId } from "../../js/assignment-lifecycle.js";

// Constantes de statut (depuis Assets/js/equipements.js, réexposées ici)
const STATUT_BADGE = {
  "En service":   "badge-blue",
  "Labo testing": "badge-purple",
  "En stock":     "badge-success",
  "Maintenance":  "badge-warning",
};

// Empêche l'injection de HTML via un champ de formulaire
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

// Catégories comptées comme "Postes Dev" dans les statistiques
const DEV_CATEGORIES = ["Workstation", "Laptop Dev"];

// Identifiant de l'équipement en cours de modification (null = ajout)
let equipementEnCours = null;


// ---------- 1. Les données ----------
//
// La liste vit dans Assets/js/equipements.js (chargé juste avant
// ce fichier) et sert de point de départ. On en prend une copie de
// travail : l'écran peut la modifier sans toucher au fichier source.
// Rien n'est enregistré dans le navigateur — un rafraîchissement de
// la page repart de la liste du code.

let equipements = [];

onSnapshot(collection(db, "equipements"), (snapshot) => {
  equipements = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      docId: doc.id,
      id: data.idMateriel,
      categorie: data.categorie,
      modele: data.modele,
      os: data.systemeOS,
      statut: data.statut,
      assigneA: data.assigneA,
      collaborateurId: data.collaborateurId || null,
      pole: data.poleExpertise,
    };
  });
  refreshAll();
});

// Historique des remises / restitutions et collaborateurs (pour la modale Affectation)
let affectations = [];
let collaborateurs = [];

onSnapshot(collection(db, "affectations"), (snapshot) => {
  affectations = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
  refreshAssignModal();
});

onSnapshot(collection(db, "collaborateurs"), (snapshot) => {
  collaborateurs = snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        id: data.id || d.id,
        nom: data.nom || data.name || "-",
        statut: data.statut || data.status || "Actif",
      };
    })
    .filter((c) => c.statut === "Actif" || c.statut === "Active")
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  refreshAssignModal();
});

// escapeHtml() vient également de Assets/js/equipements.js :
// elle empêche d'insérer du HTML via un champ texte.


// ---------- 2. Afficher le tableau ----------

function renderTable(data) {
  const tbody = document.getElementById("inventory-body");

  // Aucun résultat
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="cell-empty">
          Aucun équipement ne correspond à votre recherche.
        </td>
      </tr>`;
    return;
  }

  // Une ligne par équipement
  tbody.innerHTML = data.map((item) => {
    const badge = STATUT_BADGE[item.statut] || "";

    return `
      <tr>
        <td class="fw-600">#${escapeHtml(item.id)}</td>
        <td class="cell-muted">${escapeHtml(item.categorie)}</td>
        <td title="${escapeHtml(item.modele)}">${escapeHtml(item.modele)}</td>
        <td class="cell-muted">${escapeHtml(item.os)}</td>
        <td>
          <span class="badge ${badge}">${escapeHtml(item.statut)}</span>
        </td>
        <td class="cell-muted hide-mobile">${escapeHtml(item.assigneA)}</td>
        <td class="cell-muted hide-mobile" title="${escapeHtml(item.pole)}">${escapeHtml(item.pole)}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="icon-btn icon-info" data-action="assign" data-id="${escapeHtml(item.docId)}" title="Affectation" aria-label="Affectation de ${escapeHtml(item.id)}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
            </button>
            <button type="button" class="icon-btn icon-edit" data-action="edit" data-id="${escapeHtml(item.docId)}" title="Modifier" aria-label="Modifier ${escapeHtml(item.id)}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
            <button type="button" class="icon-btn icon-delete" data-action="delete" data-id="${escapeHtml(item.docId)}" title="Supprimer" aria-label="Supprimer ${escapeHtml(item.id)}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");
}


// ---------- 3. Statistiques (les 4 cartes du haut) ----------

function updateStats(data) {
  const dev         = data.filter((it) => DEV_CATEGORIES.includes(it.categorie)).length;
  const qa          = data.filter((it) => it.categorie.toLowerCase().includes("qa")).length;
  const enService   = data.filter((it) => it.statut === "En service").length;
  const maintenance = data.filter((it) => it.statut === "Maintenance").length;

  document.getElementById("stat-dev").textContent = dev;
  document.getElementById("stat-qa").textContent = qa;
  document.getElementById("stat-service").textContent = enService;
  document.getElementById("stat-maintenance").textContent = maintenance;
}


// ---------- 4. Listes déroulantes de catégories ----------

// Renvoie la liste des catégories, sans doublon, triée
function getCategories(data) {
  const uniques = [...new Set(data.map((it) => it.categorie))];
  return uniques.sort((a, b) => a.localeCompare(b, "fr"));
}

// Remplit un <select> avec les catégories
// withAllOption = true => ajoute l'option "Toutes catégories" (pour le filtre)
function fillSelect(select, categories, withAllOption) {
  select.innerHTML = withAllOption ? '<option value="">Toutes catégories</option>' : "";
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}


// ---------- 5. Recherche + filtre par catégorie ----------

function applyFilters() {
  const data = equipements;
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  const category = document.getElementById("category-filter").value;

  const filtered = data.filter((it) => {
    const matchQuery =
      !query ||
      it.id.toLowerCase().includes(query) ||
      it.modele.toLowerCase().includes(query);
    const matchCategory = !category || it.categorie === category;
    return matchQuery && matchCategory;
  });

  renderTable(filtered);
}


// ---------- 6. Tout rafraîchir ----------

function refreshAll() {
  const data = equipements;
  const categories = getCategories(data);
  const filtre = document.getElementById("category-filter");

  // On mémorise le filtre choisi pour le rétablir après avoir
  // reconstruit la liste des catégories (sinon supprimer ou ajouter
  // un équipement réinitialiserait le filtre sans prévenir).
  const categorieChoisie = filtre.value;

  updateStats(data);
  fillSelect(filtre, categories, true);
  fillSelect(document.getElementById("field-categorie"), categories, false);
  if (categories.includes(categorieChoisie)) filtre.value = categorieChoisie;

  applyFilters();
}


// ---------- 7. Fenêtre "Nouvel équipement" / "Modifier" (modal) ----------

// Sans argument : ajout. Avec un id : modification de cet équipement.
function openModal(id) {
  const form = document.getElementById("equipment-form");
  const titre = document.getElementById("modal-title");
  const boutonValider = document.getElementById("modal-submit");
  const champId = document.getElementById("field-id");

  const item = id ? equipements.find((it) => it.docId === id) : null;
  equipementEnCours = item ? item.id : null;

  if (item) {
    titre.textContent = "Modifier l'équipement";
    boutonValider.textContent = "Enregistrer";
    form.elements.id.value        = item.id;
    form.elements.categorie.value = item.categorie;
    form.elements.modele.value    = item.modele;
    form.elements.os.value        = item.os === "-" ? "" : item.os;
    form.elements.statut.value    = item.statut;
    form.elements.assigneA.value  = item.assigneA === "-" ? "" : item.assigneA;
    form.elements.pole.value      = item.pole === "-" ? "" : item.pole;
  } else {
    titre.textContent = "Nouvel équipement";
    boutonValider.textContent = "Ajouter";
    form.reset();
  }

  document.getElementById("modal-overlay").classList.remove("hidden");
  champId.focus();
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  document.getElementById("equipment-form").reset();
  equipementEnCours = null;
}

// ---------- Fonctions de synchronisation Firestore ----------

async function saveEquipmentToFirestore(equipmentData, docId = null) {
  try {
    const payload = {
      idMateriel: equipmentData.id,
      categorie: equipmentData.categorie,
      modele: equipmentData.modele,
      systemeOS: equipmentData.os,
      statut: equipmentData.statut,
      assigneA: equipmentData.assigneA,
      poleExpertise: equipmentData.pole,
      updatedAt: serverTimestamp(),
    };

    if (docId) {
      // Modification
      await updateDoc(doc(db, "equipements", docId), payload);
      console.log(`Équipement ${equipmentData.id} mis à jour dans Firestore`);
    } else {
      // Ajout
      await addDoc(collection(db, "equipements"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      console.log(`Équipement ${equipmentData.id} ajouté à Firestore`);
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde Firestore :", error);
    alert(`Erreur : ${error.message}`);
  }
}

async function deleteEquipmentFromFirestore(docId) {
  try {
    await deleteDoc(doc(db, "equipements", docId));
    console.log(`Équipement supprimé de Firestore (docId: ${docId})`);
  } catch (error) {
    console.error("Erreur lors de la suppression Firestore :", error);
    alert(`Erreur : ${error.message}`);
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;

  // Vérifie les champs "required"
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const saisie = {
    id:        formData.get("id").trim(),
    categorie: formData.get("categorie"),
    modele:    formData.get("modele").trim(),
    os:        formData.get("os").trim() || "-",
    statut:    formData.get("statut"),
    assigneA:  formData.get("assigneA").trim() || "-",
    pole:      formData.get("pole").trim() || "-",
  };

  // L'ID sert de clé : il doit rester unique
  const doublon = equipements.some(
    (it) => it.id === saisie.id && it.id !== equipementEnCours
  );
  if (doublon) {
    alert(`L'identifiant ${saisie.id} est déjà utilisé par un autre équipement.`);
    return;
  }

  if (equipementEnCours) {
    // Modification : trouver le docId et mettre à jour Firestore
    const item = equipements.find((it) => it.id === equipementEnCours);
    if (item && item.docId) {
      saveEquipmentToFirestore(saisie, item.docId);
    }
  } else {
    // Ajout : ajouter à Firestore
    saveEquipmentToFirestore(saisie);
  }

  closeModal();
}


// ---------- 7 bis. Boutons Modifier / Supprimer du tableau ----------
//
// renderTable() réécrit tout le contenu du <tbody> à chaque
// affichage : des écouteurs posés sur chaque bouton seraient
// détruits au premier filtrage. On écoute donc une seule fois sur
// le <tbody>, qui, lui, ne change jamais (délégation d'événement).

function supprimerEquipement(id) {
  const item = equipements.find((it) => it.docId === id);
  if (!item) return;

  if (!confirm(`Supprimer l'équipement ${item.id} (${item.modele}) ?`)) return;

  // Supprimer de Firestore
  deleteEquipmentFromFirestore(id);
}

function initActionsTableau() {
  document.getElementById("inventory-body").addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-action]");
    if (!bouton) return;

    const id = bouton.dataset.id;
    if (bouton.dataset.action === "edit") openModal(id);
    if (bouton.dataset.action === "delete") supprimerEquipement(id);
    if (bouton.dataset.action === "assign") openAssignModal(id);
  });
}


// ---------- 7 ter. Affectation d'un équipement ----------
//
// La règle métier (une seule affectation active par équipement) est
// appliquée par js/assignment-lifecycle.js ; les trois écritures
// (clôture, nouvelle affectation, mise à jour de l'équipement) partent
// dans un seul lot Firestore : soit tout est écrit, soit rien.

let equipementAffecte = null; // docId de l'équipement affiché dans la modale

const estActive = (a) => a.dateRestitution == null || a.dateRestitution === "";
const affectationsDe = (equipmentId) =>
  affectations.filter((a) => (a.equipementId || a.equipmentId) === equipmentId);

function openAssignModal(docId) {
  equipementAffecte = docId;
  document.getElementById("assign-date").value = new Date().toISOString().split("T")[0];
  document.getElementById("assign-error").textContent = "";
  refreshAssignModal();
  document.getElementById("assign-overlay").classList.remove("hidden");
}

function closeAssignModal() {
  document.getElementById("assign-overlay").classList.add("hidden");
  equipementAffecte = null;
}

// Réaffiche la modale si elle est ouverte (appelé aussi par les onSnapshot)
function refreshAssignModal() {
  if (!equipementAffecte) return;
  const item = equipements.find((it) => it.docId === equipementAffecte);
  if (!item) return closeAssignModal();

  const historique = affectationsDe(item.id)
    .sort((a, b) => String(b.dateRemise).localeCompare(String(a.dateRemise)));
  const active = historique.find(estActive);

  document.getElementById("assign-title").textContent = `Affectation — ${item.id}`;
  document.getElementById("assign-current").textContent = active
    ? `${item.modele} — détenu par ${active.collaborateurNom || active.collaboratorNom} depuis le ${active.dateRemise}.`
    : `${item.modele} — aucun détenteur actuel.`;

  document.getElementById("assign-history-body").innerHTML = historique.length
    ? historique.map((a) => `
        <tr>
          <td>${escapeHtml(a.id || a.docId)}</td>
          <td>${escapeHtml(a.collaborateurNom || a.collaboratorNom)}</td>
          <td>${escapeHtml(a.dateRemise)}</td>
          <td>${estActive(a) ? '<span class="badge badge-blue">En cours</span>' : escapeHtml(a.dateRestitution)}</td>
        </tr>`).join("")
    : '<tr><td colspan="4" class="cell-empty">Aucune affectation enregistrée.</td></tr>';

  const select = document.getElementById("assign-collaborateur");
  const choix = select.value;
  select.innerHTML = collaborateurs
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nom)}</option>`)
    .join("");
  if (choix) select.value = choix;

  document.getElementById("assign-return").disabled = !active;
}

async function affecterEquipement(e) {
  e.preventDefault();
  const item = equipements.find((it) => it.docId === equipementAffecte);
  const erreur = document.getElementById("assign-error");
  const collaborateur = collaborateurs.find(
    (c) => c.id === document.getElementById("assign-collaborateur").value
  );
  const date = document.getElementById("assign-date").value;
  erreur.textContent = "";
  if (!item || !collaborateur || !date) {
    erreur.textContent = "Choisissez un collaborateur et une date.";
    return;
  }

  try {
    const precedentes = affectationsDe(item.id);
    if (precedentes.some((a) => estActive(a) && (a.collaborateurId || a.collaboratorId) === collaborateur.id)) {
      throw new Error(`${item.id} est déjà affecté à ${collaborateur.nom}.`);
    }

    const { closedAssignment, newAssignment } = applyAssignmentChange({
      equipmentId: item.id,
      previousAssignments: precedentes,
      newCollaboratorId: collaborateur.id,
      newCollaboratorNom: collaborateur.nom,
      date,
      // Numéro calculé sur toutes les affectations pour rester unique
      newAssignmentId: buildAssignmentId(affectations),
    });

    const batch = writeBatch(db);
    if (closedAssignment) {
      batch.update(doc(db, "affectations", closedAssignment.docId), { dateRestitution: date });
    }
    batch.set(doc(db, "affectations", newAssignment.id), newAssignment);
    batch.update(doc(db, "equipements", item.docId), {
      assigneA: collaborateur.nom,
      collaborateurId: collaborateur.id,
      statut: "En service",
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    console.error("Erreur lors de l'affectation :", error);
    erreur.textContent = error.message;
  }
}

async function restituerEquipement() {
  const item = equipements.find((it) => it.docId === equipementAffecte);
  const erreur = document.getElementById("assign-error");
  const date = document.getElementById("assign-date").value;
  const active = item && affectationsDe(item.id).find(estActive);
  erreur.textContent = "";
  if (!active || !date) return;

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "affectations", active.docId), { dateRestitution: date });
    batch.update(doc(db, "equipements", item.docId), {
      assigneA: "-",
      collaborateurId: null,
      statut: "En stock",
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    console.error("Erreur lors de la restitution :", error);
    erreur.textContent = error.message;
  }
}


// ---------- 8. Mode sombre ----------

function initTheme() {
  const bouton = document.getElementById("theme-toggle");
  const icone = bouton.querySelector("i");

  const appliquerIcone = (isDark) => {
    if (icone) icone.className = isDark ? "fa-solid fa-sun" : "fa-regular fa-moon";
  };

  appliquerIcone(document.documentElement.classList.contains("dark"));

  bouton.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    appliquerIcone(isDark);
  });
}


// ---------- 8 bis. Navigation mobile ----------

function initNavigationMobile() {
  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.querySelector(".menu-toggle");
  const mainContent = document.querySelector(".main-content");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation(); // Évite que le clic referme aussitôt la barre
      sidebar.classList.toggle("open");
    });
  }

  if (mainContent && sidebar) {
    mainContent.addEventListener("click", () => sidebar.classList.remove("open"));
  }
}


// ---------- 9. Démarrage (quand la page est chargée) ----------

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavigationMobile();
  initActionsTableau();

  document.getElementById("search-input").addEventListener("input", applyFilters);
  document.getElementById("category-filter").addEventListener("change", applyFilters);

  // Sans la fonction fléchée, openModal recevrait l'événement du clic
  // comme identifiant et croirait qu'il s'agit d'une modification.
  document.getElementById("add-equipment-btn").addEventListener("click", () => openModal());
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);

  // Fermer en cliquant sur le fond gris
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });

  // Fermer avec la touche Échap
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeAssignModal();
    }
  });

  document.getElementById("equipment-form").addEventListener("submit", handleFormSubmit);

  document.getElementById("assign-close").addEventListener("click", closeAssignModal);
  document.getElementById("assign-overlay").addEventListener("click", (e) => {
    if (e.target.id === "assign-overlay") closeAssignModal();
  });
  document.getElementById("assign-form").addEventListener("submit", affecterEquipement);
  document.getElementById("assign-return").addEventListener("click", restituerEquipement);
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