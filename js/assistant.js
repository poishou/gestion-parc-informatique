import { auth } from "./firebase-config.js";
const localAssistantUrl = "http://127.0.0.1:8787/assistant";

async function callAssistantServer(data) {
    const user = auth.currentUser;
    if (!user) throw new Error("Connexion requise.");
    const response = await fetch(localAssistantUrl, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Erreur assistant.");
    return {data: result};
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

function addAssistant() {
    if (document.getElementById("assistant-widget")) return;

    if (!document.querySelector("link[data-assistant-style]")) {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "../Assets/css/assistant.css";
        style.dataset.assistantStyle = "true";
        document.head.appendChild(style);
    }

    const widget = document.createElement("section");
    widget.id = "assistant-widget";
    widget.innerHTML = `
        <button id="assistant-toggle" type="button" aria-expanded="false" aria-controls="assistant-panel">
            <span aria-hidden="true">?</span> Assistant du parc
        </button>
        <div id="assistant-panel" hidden>
            <div class="assistant-heading">
                <div><strong>Assistant du parc</strong><small>Consultation sécurisée</small></div>
                <button id="assistant-close" type="button" aria-label="Fermer">&times;</button>
            </div>
            <div id="assistant-messages" aria-live="polite">
                <p class="assistant-message assistant-message-bot">Bonjour. Que souhaitez-vous vérifier dans le parc ?</p>
            </div>
            <form id="assistant-form">
                <label class="sr-only" for="assistant-input">Votre demande</label>
                <input id="assistant-input" maxlength="2000" required placeholder="Ex. Quels équipements sont en stock ?" autocomplete="off">
                <button type="submit" aria-label="Envoyer">Envoyer</button>
            </form>
        </div>`;
    document.body.appendChild(widget);

    const toggle = widget.querySelector("#assistant-toggle");
    const panel = widget.querySelector("#assistant-panel");
    const messages = widget.querySelector("#assistant-messages");
    const form = widget.querySelector("#assistant-form");
    const input = widget.querySelector("#assistant-input");

    const appendMessage = (text, kind = "bot") => {
        const message = document.createElement("p");
        message.className = `assistant-message assistant-message-${kind}`;
        message.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    };

    // Bulle « l'assistant réfléchit » : points animés + étape en cours.
    const showThinking = () => {
        const steps = ["Analyse de la question", "Consultation du parc", "Rédaction de la réponse"];
        const bubble = document.createElement("div");
        bubble.className = "assistant-message assistant-message-bot assistant-thinking";
        bubble.innerHTML = `<span class="assistant-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="assistant-step">${steps[0]}…</span>`;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
        const label = bubble.querySelector(".assistant-step");
        let index = 0;
        const timer = setInterval(() => {
            index = Math.min(index + 1, steps.length - 1);
            label.textContent = `${steps[index]}…`;
        }, 6000);
        return () => {
            clearInterval(timer);
            bubble.remove();
        };
    };

    // Affiche la réponse progressivement, comme si elle était tapée.
    const typeMessage = async (text) => {
        const message = appendMessage("");
        message.classList.add("assistant-typing");
        const chunk = Math.max(1, Math.ceil(text.length / 250));
        for (let i = 0; i < text.length; i += chunk) {
            message.innerHTML = escapeHtml(text.slice(0, i + chunk)).replace(/\n/g, "<br>");
            messages.scrollTop = messages.scrollHeight;
            await new Promise((resolve) => setTimeout(resolve, 15));
        }
        message.classList.remove("assistant-typing");
    };

    toggle.addEventListener("click", () => {
        const open = panel.hidden;
        panel.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
        if (open) input.focus();
    });
    widget.querySelector("#assistant-close").addEventListener("click", () => {
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) return;
        appendMessage(question, "user");
        input.value = "";
        input.disabled = true;
        const stopThinking = showThinking();

        try {
            const result = (await callAssistantServer({message: question})).data;
            stopThinking();
            await typeMessage(result.message || "");
            if (result.type === "proposal") {
                const confirmation = document.createElement("button");
                confirmation.type = "button";
                confirmation.className = "assistant-confirm";
                confirmation.textContent = "Confirmer cette modification";
                confirmation.addEventListener("click", async () => {
                    confirmation.disabled = true;
                    try {
                        const done = (await callAssistantServer({mode: "confirm", confirmationToken: result.confirmationToken})).data;
                        appendMessage(done.message);
                    } catch (error) {
                        appendMessage(error.message || "Confirmation refusée.", "error");
                        confirmation.disabled = false;
                    }
                });
                messages.appendChild(confirmation);
            }
        } catch (error) {
            stopThinking();
            appendMessage(error.message || "La demande n'a pas pu être traitée.", "error");
        } finally {
            input.disabled = false;
            input.focus();
        }
    });
}

export function initializeAssistant() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addAssistant, {once: true});
    } else {
        addAssistant();
    }
}