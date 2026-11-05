import { auth } from "./firebase-config.js";
import {
    onAuthStateChanged,
    signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { initializeAssistant } from "./assistant.js";

// Page de connexion, relative aux pages protégées (Dashboard/, collaborateur/, ...)
const LOGIN_PAGE = "../auth/connexion.html";

onAuthStateChanged(auth, callback);

async function callback(user){
    if(user===null){
        window.location.href=LOGIN_PAGE;
    }
    else{
        console.log("Connexion en cours");
        // Alimente la popup du profil avec la session Firebase réellement active
        showSessionInProfileMenu(user);
        
        const tokenResult = await user.getIdTokenResult(true);
        const role = tokenResult.claims.role;
        const roleEffectif = role === "admin" || role === "administrateur"
            ? "admin"
            : "utilisateur";
        document.body.dataset.role=roleEffectif;
        initializeAssistant();
        console.log( roleEffectif);
    }

}


export async function signOut() {

    try {

        await firebaseSignOut(auth);

        // replace() : la page protégée ne reste pas dans l'historique
        window.location.replace(LOGIN_PAGE);

        return true;

    } catch (error) {

        console.error("Erreur lors de la déconnexion :", error);

        // L'application reste utilisable : on n'interrompt rien, on informe.
        const dropdown = document.getElementById("profileDropdown");
        const feedback = dropdown?.querySelector(".profile-error");
        if (feedback) {
            feedback.textContent = "Déconnexion impossible. Réessayez.";
        }

        return false;
    }
}



function showSessionInProfileMenu(user) {

    const dropdown = document.getElementById("profileDropdown");
    if (!dropdown) return; // Pages sans popup de profil

    // 1. Email de la session Firebase en cours
    const mail = dropdown.querySelector(".profile-mail");
    if (mail) {
        mail.textContent = user.email || "Utilisateur sans email";
        mail.title = mail.textContent;
    }

    // 2. Indicateur de session active
    const statusLabel = dropdown.querySelector(".profile-status");
    if (statusLabel) {
        statusLabel.hidden = false;
    }

    // 3. Bouton « Se déconnecter » -> signOut()
    const logoutBtn = dropdown.querySelector(".profile-logout");
    if (logoutBtn && !logoutBtn.dataset.bound) {

        logoutBtn.dataset.bound = "true";

        logoutBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            logoutBtn.disabled = true;

            const ok = await signOut();

            // En cas d'échec, le bouton redevient utilisable
            if (!ok) logoutBtn.disabled = false;
        });
    }
}
