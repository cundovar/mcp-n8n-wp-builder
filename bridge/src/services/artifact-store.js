import RequestArtifact from '../db/models/RequestArtifact.js';
import { validateArtifact, listSupportedArtifactTypes } from './artifact-validator.js';

/**
 * Crée un nouvel artefact avec auto-incrément de version.
 * Valide le payload avant stockage si un schéma existe.
 *
 * @param {Object} params
 * @param {string} params.requestId - ID de la demande parente
 * @param {string} params.artifact_type - Type d'artefact
 * @param {Object} params.payload - Contenu de l'artefact
 * @param {Object} [params.generator] - Infos sur le générateur
 * @param {Array} [params.source_artifacts] - Artefacts sources
 * @param {boolean} [params.skipValidation=false] - Ignorer la validation schéma
 * @returns {Promise<Object>} Artefact créé
 */
export async function createArtifact({
  requestId,
  artifact_type,
  payload,
  generator = {},
  source_artifacts = [],
  skipValidation = false,
}) {
  if (!requestId || !artifact_type || !payload) {
    throw new Error('Missing required fields: requestId, artifact_type, payload');
  }

  // Valider le payload si un schéma existe
  const supportedTypes = listSupportedArtifactTypes();
  if (!skipValidation && supportedTypes.includes(artifact_type)) {
    const validation = validateArtifact(artifact_type, payload);
    if (!validation.valid) {
      const error = new Error(`Artifact validation failed for ${artifact_type}`);
      error.validationErrors = validation.errors;
      throw error;
    }
  }

  // Calculer la prochaine version
  const lastArtifact = await RequestArtifact.findOne({
    requestId,
    artifact_type,
  })
    .sort({ version: -1 })
    .lean();

  const nextVersion = lastArtifact ? lastArtifact.version + 1 : 1;

  // Créer l'artefact
  const artifact = new RequestArtifact({
    requestId,
    artifact_type,
    version: nextVersion,
    status: 'generated',
    payload,
    generator,
    source_artifacts,
  });

  await artifact.save();
  return artifact.toObject();
}

/**
 * Liste tous les artefacts d'une demande.
 *
 * @param {string} requestId - ID de la demande
 * @param {Object} [options]
 * @param {string} [options.status] - Filtrer par statut
 * @returns {Promise<Array>} Liste des artefacts
 */
export async function listArtifacts(requestId, options = {}) {
  const query = { requestId };

  if (options.status) {
    query.status = options.status;
  }

  return RequestArtifact.find(query)
    .sort({ artifact_type: 1, version: -1 })
    .lean();
}

/**
 * Récupère la version active d'un type d'artefact.
 * La version active est la dernière version avec status 'validated' ou 'generated'.
 *
 * @param {string} requestId - ID de la demande
 * @param {string} artifact_type - Type d'artefact
 * @returns {Promise<Object|null>} Artefact actif ou null
 */
export async function getActiveArtifact(requestId, artifact_type) {
  // Priorité : validated > generated
  const validated = await RequestArtifact.findOne({
    requestId,
    artifact_type,
    status: 'validated',
  })
    .sort({ version: -1 })
    .lean();

  if (validated) {
    return validated;
  }

  return RequestArtifact.findOne({
    requestId,
    artifact_type,
    status: 'generated',
  })
    .sort({ version: -1 })
    .lean();
}

/**
 * Liste toutes les versions d'un type d'artefact.
 *
 * @param {string} requestId - ID de la demande
 * @param {string} artifact_type - Type d'artefact
 * @returns {Promise<Array>} Liste des versions (ordonnées décroissant)
 */
export async function listArtifactVersions(requestId, artifact_type) {
  return RequestArtifact.find({
    requestId,
    artifact_type,
  })
    .sort({ version: -1 })
    .lean();
}

/**
 * Récupère un artefact par type et version.
 *
 * @param {string} requestId - ID de la demande
 * @param {string} artifact_type - Type d'artefact
 * @param {number} version - Numéro de version
 * @returns {Promise<Object|null>} Artefact ou null
 */
export async function getArtifactByVersion(requestId, artifact_type, version) {
  return RequestArtifact.findOne({
    requestId,
    artifact_type,
    version,
  }).lean();
}

/**
 * Met à jour le statut d'un artefact.
 *
 * @param {string} requestId - ID de la demande
 * @param {string} artifact_type - Type d'artefact
 * @param {number} version - Numéro de version
 * @param {string} status - Nouveau statut
 * @returns {Promise<Object|null>} Artefact mis à jour ou null
 */
export async function updateArtifactStatus(requestId, artifact_type, version, status) {
  return RequestArtifact.findOneAndUpdate(
    { requestId, artifact_type, version },
    { status },
    { new: true }
  ).lean();
}

/**
 * Marque toutes les versions d'un type comme 'stale'.
 * Utile avant une régénération.
 *
 * @param {string} requestId - ID de la demande
 * @param {string} artifact_type - Type d'artefact
 * @returns {Promise<number>} Nombre d'artefacts mis à jour
 */
export async function markArtifactsAsStale(requestId, artifact_type) {
  const result = await RequestArtifact.updateMany(
    {
      requestId,
      artifact_type,
      status: { $in: ['generated', 'validated'] },
    },
    { status: 'stale' }
  );

  return result.modifiedCount;
}

export default {
  createArtifact,
  listArtifacts,
  getActiveArtifact,
  listArtifactVersions,
  getArtifactByVersion,
  updateArtifactStatus,
  markArtifactsAsStale,
};
