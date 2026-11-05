import { db } from "../js/firebase-config.js";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Constantes de statut (depuis Assets/js/equipements.js)
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

// ============================================================
//  Tableau de bord — logique de la page
// ------------------------------------------------------------
//  Les données viennent désormais de Firestore. Le fichier
//  Assets/js/equipements.js n'est utilisé que comme secours UI
//  (statuts, badges et utilitaires) mais la source de vérité est
//  la collection "equipements" de Firebase.
// ============================================================

let equipements = [];

// Identifiant de l'équipement en cours de modification (null = ajout)
let equipementEnCours = null;

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

    // 1. Charger la préférence sauvegardée au chargement de la page
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeIcon) {
            themeIcon.className = "fa-solid fa-sun"; // Remplace la Lune par le Soleil
        }
    } else {
        document.documentElement.classList.remove('dark');
        if (themeIcon) {
            themeIcon.className = "fa-regular fa-moon"; // Garde la Lune
        }
    }

    // 2. Écouter le clic sur ton bouton pour changer de mode
    if (themeToggle && themeIcon) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');

            if (isDark) {
                themeIcon.className = "fa-solid fa-sun";
                localStorage.setItem('theme', 'dark');
            } else {
                themeIcon.className = "fa-regular fa-moon";
                localStorage.setItem('theme', 'light');
            }
        });
    }

    const categoryFilter = document.querySelector('.category-filter');
    const inventoryTableBody = document.getElementById('inventory-body');
    const searchInput = document.querySelector('.search-bar input');

    // 3. Affichage du tableau
    //    Une ligne par équipement, avec la même colonne Action que la
    //    page Matériel Dev & QA (mêmes icônes, mêmes classes .icon-btn
    //    définies dans Assets/css/theme.css).
    function renderTable(data) {
        if (!inventoryTableBody) return;

        if (data.length === 0) {
            inventoryTableBody.innerHTML = `
                <tr><td colspan="8" class="cell-empty">
                    Aucun équipement ne correspond à votre recherche.
                </td></tr>`;
            return;
        }

        inventoryTableBody.innerHTML = data.map(item => `
            <tr>
                <td class="fw-600">#${escapeHtml(item.id)}</td>
                <td class="cell-muted">${escapeHtml(item.categorie)}</td>
                <td>${escapeHtml(item.modele)}</td>
                <td class="cell-muted">${escapeHtml(item.os)}</td>
                <td><span class="badge ${STATUT_BADGE[item.statut] || ''}">${escapeHtml(item.statut)}</span></td>
                <td class="cell-muted hide-mobile">${escapeHtml(item.assigneA)}</td>
                <td class="cell-muted hide-mobile">${escapeHtml(item.pole)}</td>
                <td data-export="skip">
                    <div class="row-actions">
                        <button type="button" class="icon-btn icon-edit" data-action="edit" data-id="${escapeHtml(item.id)}" title="Modifier" aria-label="Modifier ${escapeHtml(item.id)}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button type="button" class="icon-btn icon-delete" data-action="delete" data-id="${escapeHtml(item.id)}" title="Supprimer" aria-label="Supprimer ${escapeHtml(item.id)}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </td>
            </tr>`).join('');
    }

    // 4. Recherche + filtre par catégorie (les deux s'appliquent ensemble)
    function applyFilters() {
        const terme = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const categorie = categoryFilter ? categoryFilter.value : 'all';

        renderTable(equipements.filter(item => {
            const correspondCategorie = categorie === 'all' || item.categorie === categorie;
            const correspondTerme = !terme || Object.values(item)
                .join(' ')
                .toLowerCase()
                .includes(terme);
            return correspondCategorie && correspondTerme;
        }));
    }

    // 5. Remplir un <select> à partir d'une liste de valeurs
    function fillSelect(select, valeurs, optionToutes) {
        if (!select) return;
        const choix = select.value;
        select.innerHTML = optionToutes ? `<option value="all">${optionToutes}</option>` : '';
        valeurs.forEach(valeur => {
            const option = document.createElement('option');
            option.value = valeur;
            option.textContent = valeur;
            select.appendChild(option);
        });
        // On rétablit la sélection si elle existe toujours, pour qu'une
        // suppression ne réinitialise pas le filtre en cours.
        if (valeurs.includes(choix)) select.value = choix;
    }

    function getCategories() {
        return [...new Set(equipements.map(item => item.categorie))]
            .sort((a, b) => a.localeCompare(b, 'fr'));
    }

    // 6. Cartes statistiques
    function updateDashboardStats() {
        const cards = document.querySelectorAll('.stat-card');
        if (cards.length < 4) return;

        const compteurs = [
            equipements.filter(it => it.statut === 'En service').length,   // Actifs déployés
            equipements.filter(it => it.categorie === 'Mobile QA').length, // Flotte mobile (QA)
            equipements.filter(it => it.statut === 'En stock').length,     // En stock / préparation
            equipements.filter(it => it.statut === 'Maintenance').length,  // Maintenance requise
        ];

        compteurs.forEach((compteur, i) => {
            const span = cards[i].querySelector('.stat-number');
            if (span) span.textContent = compteur;
        });
    }

    // 7. Tout rafraîchir après une modification des données
    function refreshAll() {
        fillSelect(categoryFilter, getCategories(), 'Toutes les catégories');
        fillSelect(document.getElementById('eqCategory'), getCategories(), null);
        fillSelect(document.getElementById('eqStatus'), STATUTS, null);
        updateDashboardStats();
        applyFilters();
    }

    // ===== METTRE EN PLACE LE LISTENER FIRESTORE (MAINTENANT QUE refreshAll() EST DÉFINIE) =====
    onSnapshot(collection(db, "equipements"), (snapshot) => {
        // Les fiches ajoutées ou modifiées en dernier apparaissent en tête
        const dateMaj = (data) => (data.updatedAt || data.createdAt)?.toMillis?.() || 0;
        const docs = [...snapshot.docs].sort((a, b) => dateMaj(b.data()) - dateMaj(a.data()));
        equipements = docs.map((doc) => {
            const data = doc.data();
            return {
                docId: doc.id,
                id: data.idMateriel || data.id || doc.id,
                categorie: data.categorie || "-",
                modele: data.modele || "-",
                os: data.systemeOS || data.os || "-",
                statut: data.statut || "En stock",
                assigneA: data.assigneA || "-",
                pole: data.poleExpertise || data.pole || "-",
            };
        });
        refreshAll();
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

    // 9. Navigation mobile (même principe que Stocks & Licences)
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const mainContent = document.querySelector('.main-content');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Évite que le clic referme aussitôt la barre
            sidebar.classList.toggle('open');
        });
    }
    if (mainContent && sidebar) {
        mainContent.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    // 10. Modale : ajout et modification d'un équipement
    const equipbtn = document.querySelector('.btn-primary');
    const equipmentModal = document.getElementById('equipmentModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelModalBtn = document.getElementById('cancelModal');
    const equipmentForm = document.getElementById('equipmentForm');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubmit = document.getElementById('modalSubmit');

    // Sans argument : ajout. Avec un id : modification de cet équipement.
    function showModal(id) {
        const item = id ? equipements.find(it => it.id === id) : null;
        equipementEnCours = item ? item.id : null;

        if (item) {
            if (modalTitle) modalTitle.textContent = "Modifier l'Équipement";
            if (modalSubmit) modalSubmit.textContent = 'Enregistrer';
            document.getElementById('eqId').value = item.id;
            document.getElementById('eqCategory').value = item.categorie;
            document.getElementById('eqStatus').value = item.statut;
            document.getElementById('eqModel').value = item.modele;
            document.getElementById('eqOs').value = item.os === '-' ? '' : item.os;
            document.getElementById('eqAssignee').value = item.assigneA === '-' ? '' : item.assigneA;
            document.getElementById('eqPole').value = item.pole === '-' ? '' : item.pole;
        } else {
            if (modalTitle) modalTitle.textContent = 'Ajouter un Équipement';
            if (modalSubmit) modalSubmit.textContent = 'Ajouter';
            equipmentForm.reset();
            // Pré-remplir un ID Matériel unique aléatoire pour aller plus vite
            const randomNum = Math.floor(100 + Math.random() * 900);
            document.getElementById('eqId').value = `NRS-LPT-${randomNum}`;
        }

        equipmentModal.classList.remove('hidden');
    }

    const hideModal = () => {
        equipmentModal.classList.add('hidden');
        equipmentForm.reset();
        equipementEnCours = null;
    };

    if (equipbtn && equipmentModal) {
        equipbtn.addEventListener('click', () => showModal());

        if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
        if (cancelModalBtn) cancelModalBtn.addEventListener('click', hideModal);

        // Fermer si clic sur l'arrière-plan flouté
        equipmentModal.addEventListener('click', (e) => {
            if (e.target === equipmentModal) hideModal();
        });

        // Fermer avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hideModal();
        });

        // Soumission du formulaire : ajout ou mise à jour selon le cas
        if (equipmentForm) {
            equipmentForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const saisie = {
                    id:        document.getElementById('eqId').value.trim().replace(/^#/, ''),
                    categorie: document.getElementById('eqCategory').value,
                    statut:    document.getElementById('eqStatus').value,
                    modele:    document.getElementById('eqModel').value.trim(),
                    os:        document.getElementById('eqOs').value.trim() || '-',
                    assigneA:  document.getElementById('eqAssignee').value.trim() || '-',
                    pole:      document.getElementById('eqPole').value.trim() || '-',
                };

                // L'ID sert de clé : il doit rester unique
                const doublon = equipements.some(
                    it => it.id === saisie.id && it.id !== equipementEnCours
                );
                if (doublon) {
                    alert(`L'identifiant ${saisie.id} est déjà utilisé par un autre équipement.`);
                    return;
                }

                // Mêmes noms de champs que la page Matériel ; onSnapshot
                // réaffiche ensuite le tableau et les cartes.
                const payload = {
                    idMateriel:    saisie.id,
                    categorie:     saisie.categorie,
                    modele:        saisie.modele,
                    systemeOS:     saisie.os,
                    statut:        saisie.statut,
                    assigneA:      saisie.assigneA,
                    poleExpertise: saisie.pole,
                    updatedAt:     serverTimestamp(),
                };

                try {
                    const item = equipements.find(it => it.id === equipementEnCours);
                    if (item) {
                        await updateDoc(doc(db, 'equipements', item.docId), payload);
                    } else {
                        await addDoc(collection(db, 'equipements'), { ...payload, createdAt: serverTimestamp() });
                    }
                    hideModal();
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde Firestore :', error);
                    alert(`Erreur : ${error.message}`);
                }
            });
        }
    }

    // 11. Boutons Modifier / Supprimer du tableau
    //     renderTable() réécrit tout le <tbody> à chaque affichage : des
    //     écouteurs posés sur chaque bouton seraient détruits au premier
    //     filtrage. On écoute donc une seule fois sur le <tbody>.
    if (inventoryTableBody) {
        inventoryTableBody.addEventListener('click', (e) => {
            const bouton = e.target.closest('[data-action]');
            if (!bouton) return;

            const id = bouton.dataset.id;

            if (bouton.dataset.action === 'edit') {
                showModal(id);
            }

            if (bouton.dataset.action === 'delete') {
                const item = equipements.find(it => it.id === id);
                if (!item) return;
                if (!confirm(`Supprimer l'équipement ${item.id} (${item.modele}) ?`)) return;
                deleteDoc(doc(db, 'equipements', item.docId)).catch(error => {
                    console.error('Erreur lors de la suppression Firestore :', error);
                    alert(`Erreur : ${error.message}`);
                });
            }
        });
    }

    // 12. Recherche et filtre
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);

    refreshAll();
});

// Fonction pour exporter le tableau HTML en fichier CSV (Globale pour l'onclick inline)
function exporterCSV() {
    const table = document.querySelector('.inventory-table');
    if (!table) return;
    let csvContent = "";

    // Récupérer toutes les lignes du tableau
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        // Optionnel : ignorer les lignes masquées par le filtre
        if (row.style.display === 'none') return;

        let rowData = [];
        // Récupérer les en-têtes (th) et les cellules (td), sauf la colonne Action
        const cols = row.querySelectorAll('th:not([data-export="skip"]), td:not([data-export="skip"])');

        cols.forEach(col => {
            // Nettoyer le texte (retirer les sauts de ligne multiples)
            let text = col.textContent.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            // Encadrer avec des guillemets pour éviter les bugs avec les virgules
            rowData.push('"' + text + '"');
        });

        // Joindre les colonnes avec une virgule et ajouter un saut de ligne
        csvContent += rowData.join(",") + "\n";
    });

    // Créer le fichier avec l'encodage UTF-8 (le code [0xEF, 0xBB, 0xBF] est crucial pour Excel sur Windows)
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Créer un lien de téléchargement invisible et cliquer dessus
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Inventaire_Norsys_Agadir.csv");
    document.body.appendChild(link);
    link.click();

    // Nettoyer
    document.body.removeChild(link);
}
