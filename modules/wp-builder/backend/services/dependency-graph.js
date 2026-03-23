import RequestArtifact from '../db/models/RequestArtifact.js';

/**
 * Graphe de dépendances des artefacts V2.
 * Clé = artefact, Valeur = liste des artefacts dont il dépend (sources).
 */
const DEPENDENCY_GRAPH = {
  normalized_brief: [],
  discovery_brief: ['normalized_brief'],
  site_architecture: ['discovery_brief'],
  content_plan: ['site_architecture'],
  design_plan: ['site_architecture'],
  wordpress_plan: ['content_plan'],
  execution_plan: ['wordpress_plan', 'design_plan'],
  execution_report: ['execution_plan'],
};

/**
 * Graphe inversé : artefact -> liste des artefacts qui en dépendent (descendants directs).
 */
const REVERSE_GRAPH = buildReverseGraph(DEPENDENCY_GRAPH);

/**
 * Ordre topologique pour la reconstruction.
 */
const TOPOLOGICAL_ORDER = [
  'normalized_brief',
  'discovery_brief',
  'site_architecture',
  'content_plan',
  'design_plan',
  'wordpress_plan',
  'execution_plan',
  'execution_report',
];

/**
 * Construit le graphe inversé à partir du graphe de dépendances.
 */
function buildReverseGraph(graph) {
  const reverse = {};

  for (const type of Object.keys(graph)) {
    reverse[type] = [];
  }

  for (const [type, dependencies] of Object.entries(graph)) {
    for (const dep of dependencies) {
      if (!reverse[dep]) {
        reverse[dep] = [];
      }
      reverse[dep].push(type);
    }
  }

  return reverse;
}

/**
 * Retourne les dépendances directes d'un artefact (ses sources).
 *
 * @param {string} artifactType - Type d'artefact
 * @returns {string[]} Liste des types sources
 */
export function getDirectDependencies(artifactType) {
  return DEPENDENCY_GRAPH[artifactType] || [];
}

/**
 * Retourne les descendants directs d'un artefact (qui dépendent de lui).
 *
 * @param {string} artifactType - Type d'artefact
 * @returns {string[]} Liste des types descendants directs
 */
export function getDirectDependents(artifactType) {
  return REVERSE_GRAPH[artifactType] || [];
}

/**
 * Retourne tous les descendants d'un artefact (récursif).
 *
 * @param {string} artifactType - Type d'artefact
 * @returns {string[]} Liste des types descendants (ordre topologique)
 */
export function getAllDescendants(artifactType) {
  const descendants = new Set();
  const queue = [...getDirectDependents(artifactType)];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!descendants.has(current)) {
      descendants.add(current);
      queue.push(...getDirectDependents(current));
    }
  }

  // Retourner dans l'ordre topologique
  return TOPOLOGICAL_ORDER.filter((type) => descendants.has(type));
}

/**
 * Retourne tous les ancêtres d'un artefact (récursif).
 *
 * @param {string} artifactType - Type d'artefact
 * @returns {string[]} Liste des types ancêtres (ordre topologique inverse)
 */
export function getAllAncestors(artifactType) {
  const ancestors = new Set();
  const queue = [...getDirectDependencies(artifactType)];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!ancestors.has(current)) {
      ancestors.add(current);
      queue.push(...getDirectDependencies(current));
    }
  }

  // Retourner dans l'ordre topologique
  return TOPOLOGICAL_ORDER.filter((type) => ancestors.has(type));
}

/**
 * Retourne l'ordre de reconstruction à partir d'un artefact.
 * Inclut l'artefact lui-même et tous ses descendants.
 *
 * @param {string} artifactType - Type d'artefact de départ
 * @returns {string[]} Liste ordonnée des types à reconstruire
 */
export function getRebuildOrder(artifactType) {
  const descendants = getAllDescendants(artifactType);
  const toRebuild = [artifactType, ...descendants];

  // Garantir l'ordre topologique
  return TOPOLOGICAL_ORDER.filter((type) => toRebuild.includes(type));
}

/**
 * Marque tous les descendants d'un artefact comme 'stale' dans la DB.
 *
 * @param {string} requestId - ID de la demande
 * @param {string} artifactType - Type d'artefact source
 * @returns {Promise<Object>} Résultat du marquage
 */
export async function markDescendantsAsStale(requestId, artifactType) {
  const descendants = getAllDescendants(artifactType);

  if (descendants.length === 0) {
    return { marked: [], count: 0 };
  }

  const result = await RequestArtifact.updateMany(
    {
      requestId,
      artifact_type: { $in: descendants },
      status: { $in: ['generated', 'validated'] },
    },
    { status: 'stale' }
  );

  return {
    marked: descendants,
    count: result.modifiedCount,
  };
}

/**
 * Vérifie si un artefact a toutes ses dépendances satisfaites.
 *
 * @param {string} requestId - ID de la demande
 * @param {string} artifactType - Type d'artefact à vérifier
 * @returns {Promise<Object>} Résultat de la vérification
 */
export async function checkDependenciesSatisfied(requestId, artifactType) {
  const dependencies = getDirectDependencies(artifactType);

  if (dependencies.length === 0) {
    return { satisfied: true, missing: [], stale: [] };
  }

  const artifacts = await RequestArtifact.find({
    requestId,
    artifact_type: { $in: dependencies },
  })
    .sort({ version: -1 })
    .lean();

  // Grouper par type et prendre la dernière version
  const latestByType = {};
  for (const artifact of artifacts) {
    if (!latestByType[artifact.artifact_type]) {
      latestByType[artifact.artifact_type] = artifact;
    }
  }

  const missing = [];
  const stale = [];

  for (const dep of dependencies) {
    const artifact = latestByType[dep];
    if (!artifact) {
      missing.push(dep);
    } else if (artifact.status === 'stale') {
      stale.push(dep);
    } else if (!['generated', 'validated'].includes(artifact.status)) {
      missing.push(dep);
    }
  }

  return {
    satisfied: missing.length === 0 && stale.length === 0,
    missing,
    stale,
  };
}

/**
 * Retourne le graphe de dépendances complet.
 *
 * @returns {Object} Graphe de dépendances
 */
export function getDependencyGraph() {
  return { ...DEPENDENCY_GRAPH };
}

/**
 * Retourne l'ordre topologique complet.
 *
 * @returns {string[]} Ordre topologique
 */
export function getTopologicalOrder() {
  return [...TOPOLOGICAL_ORDER];
}

/**
 * Retourne la liste des types d'artefacts supportés.
 *
 * @returns {string[]} Types d'artefacts
 */
export function getSupportedArtifactTypes() {
  return Object.keys(DEPENDENCY_GRAPH);
}

export default {
  getDirectDependencies,
  getDirectDependents,
  getAllDescendants,
  getAllAncestors,
  getRebuildOrder,
  markDescendantsAsStale,
  checkDependenciesSatisfied,
  getDependencyGraph,
  getTopologicalOrder,
  getSupportedArtifactTypes,
};
