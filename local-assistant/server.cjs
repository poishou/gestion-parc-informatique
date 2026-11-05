const http = require("http");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const {
  COLLECTIONS,
  isAdmin,
  validateProposal,
  signProposal,
  verifyProposal,
} = require("../functions/assistant-core.cjs");

const port = Number(process.env.ASSISTANT_PORT || 8787);
const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const signingSecret = process.env.ASSISTANT_SIGNING_SECRET;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!signingSecret) {
  throw new Error("Définis ASSISTANT_SIGNING_SECRET avant de démarrer le serveur.");
}
if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  throw new Error("Définis GOOGLE_APPLICATION_CREDENTIALS vers une clé Firebase hors du dépôt.");
}

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
}
const db = admin.firestore();

const toolDefinitions = [{
  type: "function",
  function: {
    name: "query_inventory",
    description: "Interprète une demande de consultation du parc.",
    parameters: {
      type: "object",
      properties: {
        collection: {type: "string", enum: COLLECTIONS},
        search: {type: "string"},
        status: {type: "string"},
        collaborator: {type: "string"},
      },
      required: ["collection"],
    },
  },
}, {
  type: "function",
  function: {
    name: "propose_change",
    description: "Interprète une modification sans l'exécuter.",
    parameters: {
      type: "object",
      properties: {
        action: {type: "string", enum: ["create", "update", "delete"]},
        collection: {type: "string", enum: ["collaborateurs", "equipements", "stockMateriel", "licences"]},
        id: {type: "string"},
        data: {type: "object"},
      },
      required: ["action", "collection", "id"],
    },
  },
}];

function compact(value) {
  const safe = {...value};
  delete safe.cin;
  delete safe.rib;
  delete safe.bankName;
  delete safe.residence;
  return safe;
}

async function readInventory() {
  const snapshots = await Promise.all(COLLECTIONS.map((name) => db.collection(name).get()));
  return Object.fromEntries(snapshots.map((snapshot, index) => [
    COLLECTIONS[index], snapshot.docs.map((item) => compact({docId: item.id, ...item.data()})),
  ]));
}

async function ollama(messages, tools) {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({
      model: ollamaModel,
      stream: false,
      messages,
      tools,
      options: {temperature: 0.1},
    }),
  });
  if (!response.ok) throw new Error(`Ollama indisponible (${response.status})`);
  return (await response.json()).message;
}

// Petit modèle : il renomme parfois le champ "collection" (ex. "object").
function resolveCollection(args) {
  const candidates = [args.collection, args.object, args.collection_name, args.table];
  return candidates.find((value) => COLLECTIONS.includes(value));
}

// Chaque mot significatif doit apparaître (ex. "en maintenance" trouve "Maintenance").
function filterCollection(rows, args) {
  const words = [args.search, args.collaborator, args.status]
    .filter((value) => typeof value === "string")
    .flatMap((value) => value.toLowerCase().split(/\s+/))
    .filter((word) => word.length > 2);
  return rows.filter((row) => {
    const text = JSON.stringify(row).toLowerCase();
    return words.every((word) => text.includes(word));
  }).slice(0, 40);
}

async function answerQuestion(message, inventory) {
  const toolMessage = await ollama([
    {role: "system", content: "Tu es l'assistant du parc Norsys. Réponds en français. Utilise query_inventory pour consulter. Utilise propose_change pour toute modification. Ne rédige pas encore la réponse."},
    {role: "user", content: message},
  ], toolDefinitions);
  const toolCall = toolMessage.tool_calls && toolMessage.tool_calls[0];
  if (!toolCall) throw new Error("Le modèle n'a pas compris la demande.");
  const args = typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
  if (toolCall.function.name === "propose_change") return {type: "proposal", proposal: args};
  const collection = resolveCollection(args);
  if (toolCall.function.name !== "query_inventory" || !collection) {
    throw new Error("Demande non autorisée.");
  }
  const result = filterCollection(inventory[collection], args);
  const draft = await ollama([
    {role: "system", content: "Rédige en français une réponse concise à partir uniquement des données fournies. Ne propose aucune écriture."},
    {role: "user", content: JSON.stringify({question: message, result})},
  ]);
  return {type: "answer", message: draft.content || "Aucune réponse disponible.", data: result};
}

function jsonResponse(response, status, body) {
  response.writeHead(status, {"content-type": "application/json"});
  response.end(JSON.stringify(body));
}

async function authenticate(request) {
  const header = request.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new Error("Connexion requise.");
  return admin.auth().verifyIdToken(header.slice(7));
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return JSON.parse(body || "{}");
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "Origin");
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204, {"access-control-allow-headers": "Content-Type, Authorization", "access-control-allow-methods": "POST, OPTIONS"});
    return response.end();
  }
  if (request.method !== "POST" || request.url !== "/assistant") return jsonResponse(response, 404, {error: "Route inconnue."});

  try {
    const auth = await authenticate(request);
    const data = await readBody(request);
    if (data.mode === "confirm") {
      if (!isAdmin({token: auth})) return jsonResponse(response, 403, {error: "Action réservée aux administrateurs."});
      const proposal = validateProposal(verifyProposal(data.confirmationToken, auth.uid, signingSecret), {token: auth});
      const reference = db.collection(proposal.collection).doc(proposal.id);
      if (proposal.action === "create") await reference.create(proposal.data);
      if (proposal.action === "update") await reference.update(proposal.data);
      if (proposal.action === "delete") await reference.delete();
      return jsonResponse(response, 200, {type: "confirmation", message: "La modification a été effectuée.", proposal});
    }

    if (typeof data.message !== "string" || data.message.trim().length < 2 || data.message.length > 2000) {
      return jsonResponse(response, 400, {error: "Question invalide."});
    }
    const result = await answerQuestion(data.message, await readInventory());
    if (result.type === "proposal") {
      if (!isAdmin({token: auth})) return jsonResponse(response, 200, {type: "refused", message: "Les utilisateurs simples peuvent uniquement consulter le parc."});
      const proposal = validateProposal(result.proposal, {token: auth});
      return jsonResponse(response, 200, {
        type: "proposal",
        message: "Voici la modification proposée. Confirmez pour l'exécuter.",
        proposal,
        confirmationToken: signProposal(proposal, auth.uid, signingSecret),
      });
    }
    return jsonResponse(response, 200, result);
  } catch (error) {
    console.error(error);
    return jsonResponse(response, 500, {error: error.message || "Erreur assistant."});
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Assistant local disponible sur http://127.0.0.1:${port}/assistant avec ${ollamaModel}`);
});