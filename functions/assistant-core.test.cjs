/* eslint-disable max-len */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isAdmin,
  validateProposal,
  signProposal,
  verifyProposal,
} = require("./assistant-core.cjs");

const admin = {uid: "admin-1", token: {role: "administrateur"}};

test("accepte les deux rôles administrateur du projet", () => {
  assert.equal(isAdmin(admin), true);
  assert.equal(isAdmin({token: {role: "utilisateur"}}), false);
});

test("signe une proposition et refuse sa modification", () => {
  const proposal = validateProposal({
    action: "update",
    collection: "equipements",
    id: "NRS-LPT-101",
    data: {statut: "Maintenance"},
  }, admin);
  const token = signProposal(proposal, admin.uid, "test-secret", 1000);
  assert.deepEqual(verifyProposal(token, admin.uid, "test-secret", 1001), proposal);
  assert.throws(() => verifyProposal(`${token}x`, admin.uid, "test-secret", 1001));
});

test("refuse une écriture non supportée ou un champ sensible", () => {
  assert.throws(() => validateProposal({
    action: "update",
    collection: "licences",
    id: "LIC-001",
    data: {rib: "interdit"},
  }, admin));
  assert.throws(() => validateProposal({
    action: "update",
    collection: "affectations",
    id: "AFF-001",
    data: {dateRestitution: "2026-09-06"},
  }, admin));
});