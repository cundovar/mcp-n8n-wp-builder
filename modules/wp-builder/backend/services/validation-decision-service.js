import ValidationDecision from '../db/models/ValidationDecision.js';
import Request from '../db/models/Request.js';
import { getArtifactByVersion } from './artifact-store.js';
import { markDescendantsAsStale } from './dependency-graph.js';

/**
 * Crée une décision de validation pour un artefact.
 *
 * @param {Object} params
 * @param {string} params.requestId - ID de la demande
 * @param {string} params.artifact_type - Type d'artefact ciblé
 * @param {number} params.artifact_version - Version de l'artefact ciblé
 * @param {string} params.decision - Décision (approved, changes_requested, rejected)
 * @param {string} [params.comment] - Commentaire libre
 * @param {string[]} [params.requested_changes] - Liste des changements demandés
 * @param {string} params.created_by - Identifiant de l'utilisateur
 * @returns {Promise<Object>} Décision créée et request mise à jour
 */
export async function createValidationDecision({
  requestId,
  artifact_type,
  artifact_version,
  decision,
  comment = '',
  requested_changes = [],
  created_by,
}) {
  // Vérifier que la request existe
  const request = await Request.findOne({ requestId });
  if (!request) {
    const error = new Error(`Request not found: ${requestId}`);
    error.code = 'REQUEST_NOT_FOUND';
    throw error;
  }

  // Vérifier que l'artefact ciblé existe
  const artifact = await getArtifactByVersion(requestId, artifact_type, artifact_version);
  if (!artifact) {
    const error = new Error(`Artifact not found: ${artifact_type} v${artifact_version}`);
    error.code = 'ARTIFACT_NOT_FOUND';
    throw error;
  }

  // Créer la décision
  const validationDecision = new ValidationDecision({
    requestId,
    artifact_type,
    artifact_version,
    decision,
    comment,
    requested_changes,
    created_by,
  });

  await validationDecision.save();

  // Mettre à jour Request.validation selon la décision
  const validationUpdate = {
    'validation.status': decision,
    'validation.target_artifact': artifact_type,
    'validation.target_version': artifact_version,
    'validation.last_decision_at': new Date(),
    'validation.last_decision_by': created_by,
  };

  let statusUpdate = {};
  let staleResult = null;

  switch (decision) {
    case 'approved':
      validationUpdate['validation.approved_at'] = new Date();
      statusUpdate = { status: 'approved' };
      break;

    case 'changes_requested':
      statusUpdate = { status: 'waiting_validation' };
      // Marquer les descendants comme stale
      staleResult = await markDescendantsAsStale(requestId, artifact_type);
      break;

    case 'rejected':
      statusUpdate = { status: 'failed' };
      break;
  }

  await Request.findOneAndUpdate(
    { requestId },
    { ...validationUpdate, ...statusUpdate }
  );

  return {
    decision: validationDecision.toObject(),
    request_status: statusUpdate.status || request.status,
    stale_artifacts: staleResult?.marked || [],
  };
}

/**
 * Liste les décisions de validation d'une demande.
 *
 * @param {string} requestId - ID de la demande
 * @param {Object} [options]
 * @param {string} [options.artifact_type] - Filtrer par type d'artefact
 * @returns {Promise<Array>} Liste des décisions
 */
export async function listValidationDecisions(requestId, options = {}) {
  const query = { requestId };

  if (options.artifact_type) {
    query.artifact_type = options.artifact_type;
  }

  return ValidationDecision.find(query)
    .sort({ created_at: -1 })
    .lean();
}

/**
 * Récupère la dernière décision pour un artefact.
 *
 * @param {string} requestId - ID de la demande
 * @param {string} artifact_type - Type d'artefact
 * @param {number} [artifact_version] - Version spécifique (optionnel)
 * @returns {Promise<Object|null>} Dernière décision ou null
 */
export async function getLatestDecision(requestId, artifact_type, artifact_version = null) {
  const query = { requestId, artifact_type };

  if (artifact_version) {
    query.artifact_version = artifact_version;
  }

  return ValidationDecision.findOne(query)
    .sort({ created_at: -1 })
    .lean();
}

export default {
  createValidationDecision,
  listValidationDecisions,
  getLatestDecision,
};
