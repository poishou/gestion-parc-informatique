import { db } from "../js/firebase-config.js";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// --- Helpers DOM ---
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
const toggleModal = (modal, show) => modal && modal.classList.toggle('hidden', !show);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Thème Sombre/Clair
    const themeBtn = $('.theme-toggle');
    const themeIcon = $('.theme-toggle i');
    const applyTheme = (isDark) => {
        document.documentElement.classList.toggle('dark', isDark);
        if (themeIcon) themeIcon.className = isDark ? "fa-solid fa-sun" : "fa-regular fa-moon";
    };
    applyTheme(localStorage.getItem('theme') === 'dark');

    themeBtn?.addEventListener('click', () => {
        const isDark = !document.documentElement.classList.contains('dark');
        applyTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // 2. Dropdown Profil
    const profileBtn = $('.user-profile');
    const profileDropdown = $('#profileDropdown');
    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown?.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (profileDropdown && !profileDropdown.contains(e.target) && !profileBtn?.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    // 3. Navigation mobile (même principe que les autres pages)
    const sidebar = $('.sidebar');
    const menuToggle = $('.menu-toggle');
    const mainContent = $('.main-content');

    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation(); // Évite que le clic referme aussitôt la barre
        sidebar?.classList.toggle('open');
    });
    mainContent?.addEventListener('click', () => sidebar?.classList.remove('open'));
});

/* ==========================================
   Page Collaborateurs - Logique
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const tableBody = $('#tableBody');
    if (!tableBody) return;

    let rawCollaborateurs = [];

    const detailFieldsConfig = [
        { key: "phone", label: "Numéro de tél", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "sexe", label: "Sexe", type: "select", options: ["Homme", "Femme"] },
        { key: "age", label: "Âge", type: "number" },
        { key: "cin", label: "CIN", type: "text" },
        { key: "rib", label: "RIB", type: "text" },
        { key: "bankName", label: "Nom de la banque", type: "text" },
        { key: "residence", label: "Lieu de résidence", type: "text" },
        { key: "entryDate", label: "Date d'entrée à l'entreprise", type: "text" },
        { key: "projectLead", label: "Pilote de projet", type: "text" },
        { key: "currentProject", label: "Projet actuel", type: "text" },
        { key: "status", label: "Statut", type: "select", options: ["Active", "Inactive"] }
    ];

    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 8;

    function prochainId(liste, prefixe) {
        const numeros = liste
            .map(item => Number(String(item.id).split('-')[1]))
            .filter(Number.isFinite);
        const max = numeros.length ? Math.max(...numeros) : 0;
        return `${prefixe}-${String(max + 1).padStart(3, '0')}`;
    }

    onSnapshot(collection(db, "collaborateurs"), (snapshot) => {
        rawCollaborateurs = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                docId: doc.id,
                id: data.id ?? doc.id,
                name: data.name || data.nom || "-",
                phone: data.phone || data.telephone || "-",
                email: data.email || "-",
                status: data.status || data.statut || "Active",
                dateAdded: data.dateAdded || data.dateAjout || "",
                photo: data.photo || "",
                cin: data.cin || "-",
                rib: data.rib || "-",
                bankName: data.bankName || data.banque || "-",
                residence: data.residence || data.lieu || "-",
                entryDate: data.entryDate || data.dateEntree || "-",
                projectLead: data.projectLead || data.pilote || "-",
                currentProject: data.currentProject || data.projetActuel || "-",
                age: data.age ?? 0,
                sexe: data.sexe || "-",
            };
        });

        filteredData = [...rawCollaborateurs];
        updateStats();
        renderTable();
        applyFilters();
    });

    /* --- Photos ---
       Certaines fiches n'ont pas encore de fichier dans
       Assets/Collaborateurs/ (et un collaborateur ajouté depuis
       l'application n'en a pas du tout). Plutôt que l'icône d'image
       cassée du navigateur, on affiche une pastille avec ses
       initiales. */

    const initiales = (nom = '') => nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(mot => mot[0].toUpperCase())
        .join('');

    // Affiche la photo si elle se charge, les initiales sinon.
    function afficherPhoto(img, pastille, item) {
        if (!img || !pastille) return;
        pastille.textContent = initiales(item.name);

        if (!item.photo) {
            img.style.display = 'none';
            pastille.style.display = '';
            return;
        }

        img.style.display = '';
        pastille.style.display = 'none';
        img.onerror = () => {
            img.style.display = 'none';
            pastille.style.display = '';
        };
        img.src = item.photo;
    }

    // Génération dynamique des avatars de la carte stats
    const statAvatarsContainer = $('#statAvatars');
    if (statAvatarsContainer) {
        const avatarsHtml = rawCollaborateurs.slice(0, 5)
            .map(c => `<div class="avatar-circle" style="background-image: url('${c.photo}');"></div>`)
            .join('');
        statAvatarsContainer.innerHTML = avatarsHtml + '<div class="avatar-teal-box"></div>';
    }

    function updateStats() {
        const activeCount = rawCollaborateurs.filter(item => item.status === "Active").length;
        const totalActive = $('#totalActiveCount');
        if (totalActive) totalActive.textContent = activeCount + 26;
    }

    function applyFilters() {
        const globalQuery = $('#globalSearch')?.value.toLowerCase().trim() || '';
        const tableQuery = $('#tableSearch')?.value.toLowerCase().trim() || '';

        filteredData = rawCollaborateurs.filter(item => {
            const match = text => text.toLowerCase().includes(globalQuery) && text.toLowerCase().includes(tableQuery);
            return match(item.name) || match(item.email) || match(item.phone);
        });

        const sortBy = $('#sortSelect')?.value || 'recent';
        const sortFns = {
            name: (a, b) => a.name.localeCompare(b.name),
            status: (a, b) => a.status.localeCompare(b.status),
            recent: (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
        };
        if (sortFns[sortBy]) filteredData.sort(sortFns[sortBy]);

        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        tableBody.innerHTML = "";
        const paginated = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        if (!paginated.length) {
            tableBody.innerHTML = `<tr><td colspan="6" class="cell-empty">Aucun collaborateur trouvé</td></tr>`;
            renderPagination();
            return;
        }

        paginated.forEach(item => {
            const tr = document.createElement("tr");
            const badgeClass = item.status.toLowerCase() === "active" ? "active" : "inactive";
            tr.innerHTML = `
                <td>
                    <img class="row-avatar" alt="${item.name}">
                    <span class="avatar-fallback" style="display:none"></span>
                </td>
                <td class="collab-name">${item.name}</td>
                <td class="collab-phone">${item.phone}</td>
                <td class="collab-email">${item.email}</td>
                <td><span class="badge ${badgeClass}">${item.status}</span></td>
                <td class="admin-only-cell">
                    <div class="row-actions">
                        <button type="button" class="icon-btn icon-info" title="Plus d'informations"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
                        <button type="button" class="icon-btn icon-delete" title="Supprimer"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                </td>
            `;

            afficherPhoto($('.row-avatar', tr), $('.avatar-fallback', tr), item);

            $('.icon-info', tr).addEventListener('click', () => openDetailsModal(item));
            $('.icon-delete', tr).addEventListener('click', () => supprimerCollaborateur(item));
            tableBody.appendChild(tr);
        });

        renderPagination();
        updateSliderPosition();
    }

    function renderPagination() {
        const container = $('#paginationContainer');
        if (!container) return;
        container.innerHTML = "";
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (totalPages <= 1) return;

        const createBtn = (label, disabled, active, onClick) => {
            const btn = document.createElement("button");
            btn.className = `page-btn ${active ? 'active' : ''}`;
            btn.innerHTML = label;
            btn.disabled = disabled;
            btn.addEventListener("click", onClick);
            return btn;
        };

        container.appendChild(createBtn("‹", currentPage === 1, false, () => { currentPage--; renderTable(); }));
        for (let i = 1; i <= totalPages; i++) {
            container.appendChild(createBtn(i, false, i === currentPage, () => { currentPage = i; renderTable(); }));
        }
        container.appendChild(createBtn("›", currentPage === totalPages, false, () => { currentPage++; renderTable(); }));
    }

    ['#globalSearch', '#tableSearch'].forEach(s => $(s)?.addEventListener("input", applyFilters));
    $('#sortSelect')?.addEventListener("change", applyFilters);

    // Gestions des Pop-ups / Modales
    let currentItem = null;
    const detailsModal = $('#detailsModal');
    const editModal = $('#editModal');

    function openDetailsModal(item) {
        currentItem = item;
        afficherPhoto($('#detailsPhoto'), $('#detailsInitials'), item);
        $('#detailsName').textContent = item.name;
        $('#detailsProject').textContent = (item.currentProject && item.currentProject !== '-') ? `Projet actuel : ${item.currentProject}` : 'Aucun projet en cours';

        $('#detailsGrid').innerHTML = detailFieldsConfig.map(f => `
            <div class="detail-field">
                <span class="field-label">${f.label}</span>
                <span class="field-value">${item[f.key] ?? '-'}</span>
            </div>
        `).join('');

        toggleModal(detailsModal, true);
    }

    function openEditModal(item) {
        currentItem = item;
        const preview = $('#editPhotoPreview');
        const pastille = $('#editInitials');
        afficherPhoto(preview, pastille, item);

        const baseHtml = `
            <div class="edit-field full-width"><label for="edit-photo">Photo (URL)</label><input type="text" id="edit-photo" value="${item.photo || ''}"></div>
            <div class="edit-field full-width"><label for="edit-name">Nom du collaborateur</label><input type="text" id="edit-name" value="${item.name}"></div>
        `;

        const fieldsHtml = detailFieldsConfig.map(f => {
            const val = item[f.key] ?? '';
            const input = f.type === 'select'
                ? `<select id="edit-${f.key}">${f.options.map(opt => `<option value="${opt}" ${opt === val ? 'selected' : ''}>${opt}</option>`).join('')}</select>`
                : `<input type="${f.type}" id="edit-${f.key}" value="${val}">`;
            return `<div class="edit-field"><label for="edit-${f.key}">${f.label}</label>${input}</div>`;
        }).join('');

        const editForm = $('#editForm');
        editForm.innerHTML = baseHtml + fieldsHtml;

        // L'aperçu suit la saisie ; s'il n'y a pas d'URL valide on retombe
        // sur les initiales.
        $('#edit-photo')?.addEventListener('input', (e) => {
            afficherPhoto(preview, pastille, { name: $('#edit-name').value || item.name, photo: e.target.value.trim() });
        });

        toggleModal(editModal, true);
    }

    $$('.close-details').forEach(el => el.addEventListener('click', () => toggleModal(detailsModal, false)));
    $$('.close-edit').forEach(el => el.addEventListener('click', () => toggleModal(editModal, false)));

    $('#detailsToEditBtn')?.addEventListener('click', () => {
        toggleModal(detailsModal, false);
        if (currentItem) openEditModal(currentItem);
    });

    $('#editForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentItem) return;

        const updates = {
            photo: $('#edit-photo').value.trim(),
            name: $('#edit-name').value.trim() || currentItem.name
        };

        detailFieldsConfig.forEach(f => {
            const input = $(`#edit-${f.key}`);
            if (input) updates[f.key] = f.type === 'number' ? Number(input.value) || 0 : input.value.trim();
        });

        updateDoc(doc(db, 'collaborateurs', currentItem.docId), {
            ...updates,
            updatedAt: serverTimestamp()
        }).then(() => {
            Object.assign(currentItem, updates);
            toggleModal(editModal, false);
            updateStats();
            renderTable();
        }).catch(error => {
            console.error('Erreur lors de la sauvegarde Firestore :', error);
            alert(`Erreur : ${error.message}`);
        });
    });

    async function supprimerCollaborateur(item) {
        if (!confirm(`Supprimer le collaborateur ${item.name} ?`)) return;
        try {
            await deleteDoc(doc(db, 'collaborateurs', item.docId));
        } catch (error) {
            console.error('Erreur lors de la suppression Firestore :', error);
            alert(`Erreur : ${error.message}`);
        }
    }

    // Slider Mobile Position Update
    const tableWrapper = $('#tableWrapper');
    const sliderThumb = $('#sliderThumb');
    const sliderTrack = $('#sliderTrack');

    function updateSliderPosition() {
        if (!tableWrapper || !sliderThumb || !sliderTrack) return;
        const maxScrollLeft = tableWrapper.scrollWidth - tableWrapper.clientWidth;
        if (maxScrollLeft <= 0) {
            sliderThumb.style.width = "100%";
            sliderThumb.style.left = "0px";
            return;
        }
        const thumbWidth = Math.max((tableWrapper.clientWidth / tableWrapper.scrollWidth) * sliderTrack.clientWidth, 30);
        sliderThumb.style.width = `${thumbWidth}px`;
        sliderThumb.style.left = `${(tableWrapper.scrollLeft / maxScrollLeft) * (sliderTrack.clientWidth - thumbWidth)}px`;
    }

    tableWrapper?.addEventListener("scroll", updateSliderPosition);
    window.addEventListener("resize", updateSliderPosition);


    const modal = document.getElementById('collaboratorModal');
const form = document.getElementById('collaboratorForm');

document.getElementById('addCollaboratorBtn').addEventListener('click', () => {
    modal.classList.remove('hidden');
});

// La croix de l'en-tête et le bouton « Annuler » ferment tous deux la modale
$$('#cancelBtn, .close-add').forEach(btn => btn.addEventListener('click', () => {
    modal.classList.add('hidden');
    form.reset();
}));

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const collaborateur = {
        id: prochainId(rawCollaborateurs, 'C'),
        name: document.getElementById('collabName').value.trim(),
        phone: document.getElementById('collabPhone').value.trim(),
        email: document.getElementById('collabEmail').value.trim(),
        status: document.getElementById('collabStatus').value || 'Active',
        dateAdded: new Date().toISOString().split('T')[0],
        // Pas de fichier photo à ce stade : la pastille d'initiales
        // est affichée, et l'URL peut être renseignée via « Modifier ».
        photo: '',
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(collection(db, 'collaborateurs'), collaborateur);
        form.reset();
        modal.classList.add('hidden');
    } catch (error) {
        console.error('Erreur lors de la création Firestore :', error);
        alert(`Erreur : ${error.message}`);
    }
});

    updateStats();
    applyFilters();
});