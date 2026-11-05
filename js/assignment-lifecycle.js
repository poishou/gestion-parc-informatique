export function validateAssignments(assignments = []) {
  const byEquipment = new Map();

  for (const assignment of assignments) {
    const equipmentId = assignment?.equipmentId || assignment?.equipementId;
    if (!equipmentId) continue;

    if (!byEquipment.has(equipmentId)) {
      byEquipment.set(equipmentId, []);
    }

    byEquipment.get(equipmentId).push(assignment);
  }

  for (const [equipmentId, equipmentAssignments] of byEquipment.entries()) {
    const activeAssignments = equipmentAssignments.filter(
      (assignment) => assignment?.dateRestitution == null || assignment?.dateRestitution === ''
    );

    if (activeAssignments.length > 1) {
      throw new Error(
        `L'équipement ${equipmentId} a plus d'une affectation active. Il doit en avoir exactement une.`
      );
    }
  }

  return true;
}

export function buildAssignmentId(existingAssignments = []) {
  const ids = existingAssignments
    .map((assignment) => assignment?.id)
    .filter(Boolean)
    .map((id) => {
      const match = /^AFF-(\d+)$/i.exec(String(id));
      return match ? Number(match[1]) : null;
    })
    .filter((value) => Number.isInteger(value));

  const nextNumber = ids.length ? Math.max(...ids) + 1 : 1;
  return `AFF-${String(nextNumber).padStart(3, '0')}`;
}

export function applyAssignmentChange({
  equipmentId,
  previousAssignments = [],
  newCollaboratorId,
  newCollaboratorNom,
  date,
  newAssignmentId,
}) {
  if (!equipmentId) {
    throw new Error('Un identifiant d’équipement est requis pour créer une affectation.');
  }

  if (!newCollaboratorId || !newCollaboratorNom || !date) {
    throw new Error('Le collaborateur, son nom et la date de remise sont requis.');
  }

  const existingAssignments = [...previousAssignments];
  validateAssignments(existingAssignments);

  const activeAssignments = existingAssignments.filter(
    (assignment) =>
      (assignment?.equipmentId || assignment?.equipementId) === equipmentId &&
      (assignment?.dateRestitution == null || assignment?.dateRestitution === '')
  );

  const closedAssignment = activeAssignments[0]
    ? {
        ...activeAssignments[0],
        dateRestitution: date,
      }
    : null;

  const createdAssignment = {
    id: newAssignmentId || buildAssignmentId(existingAssignments),
    equipmentId,
    equipementId: equipmentId,
    collaboratorId: newCollaboratorId,
    collaborateurId: newCollaboratorId,
    collaboratorNom: newCollaboratorNom,
    collaborateurNom: newCollaboratorNom,
    dateRemise: date,
    dateRestitution: null,
  };

  const updatedAssignments = existingAssignments.map((assignment) => {
    if (closedAssignment && assignment.id === closedAssignment.id) {
      return closedAssignment;
    }
    return assignment;
  });

  updatedAssignments.push(createdAssignment);
  validateAssignments(updatedAssignments);

  return {
    closedAssignment,
    newAssignment: createdAssignment,
    allAssignments: updatedAssignments,
  };
}
