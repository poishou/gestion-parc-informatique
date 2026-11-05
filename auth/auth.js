import { app } from "../js/firebase-config.js";
import { auth } from "../js/firebase-config.js";

import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// ===============================
// Éléments HTML
// ===============================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");
const forgotPassword = document.getElementById("forgotPassword");


// ===============================
// Connexion
// ===============================

loginForm.addEventListener("submit", async (event) => {

    // Empêche le formulaire de recharger la page
    event.preventDefault();

    // Récupération des valeurs
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Nettoyer l'ancien message
    errorMessage.textContent = "";

    try {

        // Connexion avec Firebase
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        // Utilisateur connecté
        const user = userCredential.user;

        console.log("Utilisateur connecté :", user.email);

        // Redirection vers le dashboard
        window.location.href = "../Dashboard/index.html";

    } catch (error) {

        console.error("Erreur de connexion :", error);

        // Messages personnalisés
        switch (error.code) {

            case "auth/invalid-credential":
                errorMessage.textContent =
                    "Email ou mot de passe incorrect.";
                break;

            default:
                errorMessage.textContent =
                    "Une erreur est survenue lors de la connexion.";
        }
    }
});


// ===============================
// Mot de passe oublié
// ===============================

forgotPassword.addEventListener("click", async (event) => {

    event.preventDefault();

    const email = emailInput.value.trim();

    // Vérifier que l'utilisateur a entré son email
    if (!email) {
        errorMessage.textContent =
            "Entrez votre adresse email avant de cliquer sur « Mot de passe oublié ? ».";
        return;
    }

    try {

        // Envoyer l'email de réinitialisation
        await sendPasswordResetEmail(auth, email);

        errorMessage.textContent =
            "Un email de réinitialisation a été envoyé.";

    } catch (error) {

        console.error("Erreur :", error);

        if (error.code === "auth/invalid-email") {
            errorMessage.textContent =
                "Adresse email invalide.";
        } else if (error.code === "auth/user-not-found") {
            errorMessage.textContent =
                "Aucun compte ne correspond à cet email.";
        } else {
            errorMessage.textContent =
                "Impossible d'envoyer l'email de réinitialisation.";
        }
    }
});

