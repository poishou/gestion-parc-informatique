import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyAssignmentChange,
  validateAssignments,
} from '../js/assignment-lifecycle.js';

test('clôt l’ancienne affectation et crée la nouvelle avec une date de remise', () => {
  const date = '2026-09-01';

  const result = applyAssignmentChange({
    equipmentId: 'NRS-LPT-101',
    previousAssignments: [
      {
        id: 'AFF-001',
        equipmentId: 'NRS-LPT-101',
        collaboratorId: 'C-001',
        collaboratorNom: 'Amina Benali',
        dateRemise: '2025-01-15',
        dateRestitution: null,
      },
      {
        id: 'AFF-021',
        equipmentId: 'NRS-LPT-101',
        collaboratorId: 'C-004',
        collaboratorNom: 'Karim Bensaid',
        dateRemise: '2024-10-18',
        dateRestitution: '2024-12-31',
      },
    ],
    newCollaboratorId: 'C-007',
    newCollaboratorNom: 'Leila Berrada',
    date,
  });

  assert.equal(result.closedAssignment?.id, 'AFF-001');
  assert.equal(result.closedAssignment?.dateRestitution, date);
  assert.equal(result.newAssignment?.dateRemise, date);
  assert.equal(result.newAssignment?.dateRestitution, null);
  assert.equal(result.newAssignment?.collaborateurId, 'C-007');
  assert.equal(result.newAssignment?.equipementId, 'NRS-LPT-101');
});

test('accepte les affectations Firestore avec les noms de champs français', () => {
  const result = applyAssignmentChange({
    equipmentId: 'NRS-LPT-102',
    previousAssignments: [{
      id: 'AFF-002',
      equipementId: 'NRS-LPT-102',
      collaborateurId: 'C-002',
      collaborateurNom: 'Youssef El Idrissi',
      dateRemise: '2025-02-02',
      dateRestitution: null,
    }],
    newCollaboratorId: 'C-008',
    newCollaboratorNom: 'Hicham Saad',
    date: '2026-09-01',
  });

  assert.equal(result.closedAssignment?.dateRestitution, '2026-09-01');
  assert.equal(result.newAssignment?.collaborateurId, 'C-008');
});

test('refuse un état où deux affectations actives coexistent pour un même équipement', () => {
  const assignments = [
    {
      id: 'AFF-100',
      equipmentId: 'NRS-LPT-118',
      collaboratorId: 'C-001',
      collaboratorNom: 'Amina Benali',
      dateRemise: '2025-08-15',
      dateRestitution: null,
    },
    {
      id: 'AFF-101',
      equipmentId: 'NRS-LPT-118',
      collaboratorId: 'C-002',
      collaboratorNom: 'Youssef El Idrissi',
      dateRemise: '2026-01-10',
      dateRestitution: null,
    },
  ];

  assert.throws(
    () => validateAssignments(assignments),
    /plus d'une affectation active|exactement une/i
  );
});
