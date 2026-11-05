/* eslint-disable max-len, require-jsdoc */
const crypto = require("crypto");

const ADMIN_ROLES = new Set(["admin", "administrateur"]);
const COLLECTIONS = [
  "collaborateurs",
  "equipements",
  "stockMateriel",
  "licences",
  "affectations",
];

const ACTIONS = new Set(["create", "update", "delete"]);
const WRITABLE_COLLECTIONS = new Set([
  "collaborateurs",
  "equipements",
  "stockMateriel",
  "licences",
]);

const ALLOWED_STATUSES = {
  collaborateurs: new Set(["Actif", "Inactif", "Active", "Inactive"]),
  equipements: new Set(["En service", "Labo testing", "En stock", "Maintenance"]),
  stockMateriel: new Set(["Disponible", "Stock Bas", "Épuisé"]),
  licences: new Set(["Actif", "Expire bientôt", "Expirée", "Perpétuelle"]),
};

function isAdmin(auth) {
  return Boolean(auth && ADMIN_ROLES.has(auth.token && auth.token.role));
}

function assertText(value, name, maxLength = 200) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new Error(`${name} invalide`);
  }
  return value.trim();
}

function validateProposal(proposal, admin) {
  if (!isAdmin(admin)) throw new Error("Action réservée aux administrateurs");
  if (!proposal || !ACTIONS.has(proposal.action) || !WRITABLE_COLLECTIONS.has(proposal.collection)) {
    throw new Error("Action assistant non autorisée");
  }

  const id = assertText(proposal.id, "Identifiant", 120);
  const data = proposal.data && typeof proposal.data === "object" ? proposal.data : {};
  const allowedFields = {
    collaborateurs: new Set(["id", "nom", "name", "telephone", "phone", "email", "statut", "status", "role"]),
    equipements: new Set(["id", "idMateriel", "categorie", "modele", "os", "systemeOS", "statut", "assigneA", "pole", "poleExpertise"]),
    stockMateriel: new Set(["id", "categorie", "modele", "agence", "fournisseur", "quantite", "statut"]),
    licences: new Set(["id", "nom", "editeur", "type", "sieges", "expiration", "cout", "pole", "statut"]),
  }[proposal.collection];

  if (proposal.action !== "delete") {
    for (const key of Object.keys(data)) {
      if (!allowedFields.has(key)) throw new Error(`Champ ${key} non autorisé`);
    }
    if (Object.keys(data).length === 0) throw new Error("La proposition ne contient aucune donnée");
  } else if (Object.keys(data).length > 0) {
    throw new Error("Une suppression ne peut pas contenir de données");
  }

  if (data.quantite !== undefined && (!Number.isInteger(data.quantite) || data.quantite < 0)) {
    throw new Error("La quantité doit être un entier positif");
  }
  if (data.statut !== undefined && !ALLOWED_STATUSES[proposal.collection].has(data.statut)) {
    throw new Error("Valeur de statut non autorisée");
  }

  return {action: proposal.action, collection: proposal.collection, id, data};
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signProposal(proposal, uid, secret, now = Date.now()) {
  const payload = {proposal, uid, exp: now + 10 * 60 * 1000};
  const encoded = encode(payload);
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyProposal(token, uid, secret, now = Date.now()) {
  if (typeof token !== "string") throw new Error("Confirmation invalide");
  const [encoded, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(encoded || "").digest("base64url");
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Confirmation invalide");
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (payload.uid !== uid || payload.exp < now) throw new Error("Confirmation expirée");
  return payload.proposal;
}

module.exports = {
  ACTIONS,
  COLLECTIONS,
  isAdmin,
  validateProposal,
  signProposal,
  verifyProposal,
};