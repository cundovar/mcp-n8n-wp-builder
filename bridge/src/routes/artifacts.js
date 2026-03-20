import { listSupportedArtifactTypes, validateArtifact } from '../services/artifact-validator.js';

// Génère un plan en format Markdown
function generateMarkdownPlan(aiPlan) {
  const lines = [];

  lines.push(`# Plan WordPress: ${aiPlan.metadata.site_name}`);
  lines.push('');
  lines.push(`> Request ID: \`${aiPlan.metadata.request_id}\``);
  lines.push(`> Type: ${aiPlan.metadata.site_type}`);
  lines.push(`> Généré le: ${aiPlan.metadata.generated_at}`);
  lines.push('');

  // Brief
  if (aiPlan.brief.original_input) {
    lines.push('## 1. Brief Original');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(aiPlan.brief.original_input, null, 2));
    lines.push('```');
    lines.push('');
  }

  // Architecture
  if (aiPlan.architecture) {
    lines.push('## 2. Architecture du Site');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(aiPlan.architecture, null, 2));
    lines.push('```');
    lines.push('');
  }

  // Content
  if (aiPlan.content) {
    lines.push('## 3. Plan de Contenu');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(aiPlan.content, null, 2));
    lines.push('```');
    lines.push('');
  }

  // Design
  if (aiPlan.design) {
    lines.push('## 4. Plan de Design');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(aiPlan.design, null, 2));
    lines.push('```');
    lines.push('');
  }

  // WordPress
  if (aiPlan.wordpress) {
    lines.push('## 5. Configuration WordPress');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(aiPlan.wordpress, null, 2));
    lines.push('```');
    lines.push('');
  }

  // Execution
  if (aiPlan.execution) {
    lines.push('## 6. Plan d\'Exécution');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(aiPlan.execution, null, 2));
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

// Génère un plan en format prompt pour IA
function generatePromptPlan(aiPlan) {
  const lines = [];

  lines.push('='.repeat(80));
  lines.push('PLAN DE CONSTRUCTION WORDPRESS');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Site: ${aiPlan.metadata.site_name}`);
  lines.push(`Type: ${aiPlan.metadata.site_type}`);
  lines.push(`ID: ${aiPlan.metadata.request_id}`);
  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('INSTRUCTIONS POUR L\'IA');
  lines.push('-'.repeat(80));
  lines.push('');
  lines.push('Tu dois construire un site WordPress en suivant ce plan.');
  lines.push('Chaque section contient des spécifications JSON à respecter.');
  lines.push('');

  // Architecture
  if (aiPlan.architecture) {
    lines.push('='.repeat(40));
    lines.push('ARCHITECTURE DU SITE');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push(JSON.stringify(aiPlan.architecture, null, 2));
    lines.push('');
  }

  // Content
  if (aiPlan.content) {
    lines.push('='.repeat(40));
    lines.push('CONTENU DES PAGES');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push(JSON.stringify(aiPlan.content, null, 2));
    lines.push('');
  }

  // Design
  if (aiPlan.design) {
    lines.push('='.repeat(40));
    lines.push('DESIGN ET STYLE');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push(JSON.stringify(aiPlan.design, null, 2));
    lines.push('');
  }

  // WordPress config
  if (aiPlan.wordpress) {
    lines.push('='.repeat(40));
    lines.push('CONFIGURATION WORDPRESS');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push(JSON.stringify(aiPlan.wordpress, null, 2));
    lines.push('');
  }

  // Execution steps
  if (aiPlan.execution) {
    lines.push('='.repeat(40));
    lines.push('ETAPES D\'EXECUTION');
    lines.push('='.repeat(40));
    lines.push('');
    lines.push(JSON.stringify(aiPlan.execution, null, 2));
    lines.push('');
  }

  lines.push('='.repeat(80));
  lines.push('FIN DU PLAN');
  lines.push('='.repeat(80));

  return lines.join('\n');
}
import {
  createArtifact,
  listArtifacts,
  listArtifactVersions,
  getActiveArtifact,
  getArtifactByVersion,
  updateArtifactStatus,
} from '../services/artifact-store.js';
import {
  markDescendantsAsStale,
  getRebuildOrder,
  checkDependenciesSatisfied,
} from '../services/dependency-graph.js';
import Request from '../db/models/Request.js';

const validateArtifactSchema = {
  body: {
    type: 'object',
    required: ['artifact_type', 'artifact'],
    properties: {
      artifact_type: {
        type: 'string',
        enum: listSupportedArtifactTypes(),
      },
      artifact: {
        type: 'object',
      },
    },
  },
};

const createArtifactSchema = {
  body: {
    type: 'object',
    required: ['artifact_type', 'payload'],
    properties: {
      artifact_type: {
        type: 'string',
        enum: listSupportedArtifactTypes(),
      },
      payload: {
        type: 'object',
      },
      source_artifacts: {
        type: 'array',
        default: [],
        items: {
          type: 'object',
          properties: {
            artifact_type: { type: 'string' },
            version: { type: 'integer', minimum: 1 },
          },
          additionalProperties: false,
        },
      },
      generator: {
        type: 'object',
        default: {},
      },
      skip_validation: {
        type: 'boolean',
        default: false,
      },
    },
  },
};

export default async function artifactsRoutes(fastify) {
  fastify.get('/schemas', async () => {
    return {
      artifact_types: listSupportedArtifactTypes(),
    };
  });

  fastify.get('/requests/:id/artifacts', async (request) => {
    const { id } = request.params;
    const { status } = request.query || {};
    const artifacts = await listArtifacts(id, { status });

    const artifacts_by_type = artifacts.reduce((accumulator, artifact) => {
      if (!accumulator[artifact.artifact_type]) {
        accumulator[artifact.artifact_type] = [];
      }

      accumulator[artifact.artifact_type].push(artifact);
      return accumulator;
    }, {});

    return {
      request_id: id,
      count: artifacts.length,
      artifacts,
      artifacts_by_type,
    };
  });

  fastify.post('/requests/:id/artifacts', { schema: createArtifactSchema }, async (request, reply) => {
    const { id } = request.params;
    const {
      artifact_type,
      payload,
      source_artifacts = [],
      generator = {},
      skip_validation = false,
    } = request.body;

    const requestDoc = await Request.findOne({ requestId: id }).lean();
    if (!requestDoc) {
      return reply.code(404).send({
        ok: false,
        error: 'Request not found',
        request_id: id,
      });
    }

    try {
      const artifact = await createArtifact({
        requestId: id,
        artifact_type,
        payload,
        source_artifacts,
        generator,
        skipValidation: skip_validation,
      });

      return reply.code(201).send({
        ok: true,
        request_id: id,
        ...artifact,
      });
    } catch (error) {
      if (error.validationErrors) {
        return reply.code(422).send({
          ok: false,
          error_type: 'artifact_schema_validation_error',
          artifact_type,
          errors: error.validationErrors,
        });
      }

      throw error;
    }
  });

  fastify.post('/artifacts/validate', { schema: validateArtifactSchema }, async (request, reply) => {
    const { artifact_type, artifact } = request.body;
    const result = validateArtifact(artifact_type, artifact);

    if (!result.valid) {
      return reply.code(422).send({
        ok: false,
        error_type: 'artifact_schema_validation_error',
        artifact_type,
        errors: result.errors,
      });
    }

    return {
      ok: true,
      artifact_type,
      valid: true,
    };
  });

  // GET /requests/:id/artifacts/:type - Récupère la version active d'un type
  fastify.get('/requests/:id/artifacts/:type', async (request, reply) => {
    const { id, type } = request.params;
    const { version } = request.query || {};

    let artifact;

    if (version) {
      artifact = await getArtifactByVersion(id, type, parseInt(version, 10));
    } else {
      artifact = await getActiveArtifact(id, type);
    }

    if (!artifact) {
      return reply.code(404).send({
        ok: false,
        error: 'Artifact not found',
        request_id: id,
        artifact_type: type,
      });
    }

    return {
      ok: true,
      request_id: id,
      artifact_type: type,
      artifact,
    };
  });

  // GET /requests/:id/artifacts/:type/versions - Historique complet des versions
  fastify.get('/requests/:id/artifacts/:type/versions', async (request) => {
    const { id, type } = request.params;

    const versions = await listArtifactVersions(id, type);

    return {
      ok: true,
      request_id: id,
      artifact_type: type,
      count: versions.length,
      versions: versions.map((v) => ({
        version: v.version,
        status: v.status,
        created_at: v.created_at,
        generator: v.generator,
      })),
      artifacts: versions,
    };
  });

  // GET /requests/:id/ai-ready-plan - Plan compilé pour IA
  fastify.get('/requests/:id/ai-ready-plan', async (request, reply) => {
    const { id } = request.params;
    const { format = 'json' } = request.query || {};

    // Vérifier que la request existe
    const requestDoc = await Request.findOne({ requestId: id }).lean();
    if (!requestDoc) {
      return reply.code(404).send({
        ok: false,
        error: 'Request not found',
        request_id: id,
      });
    }

    // Récupérer tous les artefacts actifs
    const artifactTypes = [
      'normalized_brief',
      'discovery_brief',
      'site_architecture',
      'content_plan',
      'design_plan',
      'wordpress_plan',
      'execution_plan',
    ];

    const artifacts = {};
    for (const type of artifactTypes) {
      const artifact = await getActiveArtifact(id, type);
      if (artifact) {
        artifacts[type] = artifact.payload;
      }
    }

    // Construire le plan AI-ready
    const aiPlan = {
      metadata: {
        request_id: id,
        site_name: requestDoc.input?.site_name || 'Site WordPress',
        site_type: requestDoc.input?.site_type || 'vitrine',
        status: requestDoc.status,
        validation_status: requestDoc.validation?.status || null,
        generated_at: new Date().toISOString(),
      },
      brief: {
        original_input: requestDoc.input || {},
        normalized: artifacts.normalized_brief || null,
        discovery: artifacts.discovery_brief || null,
      },
      architecture: artifacts.site_architecture || null,
      content: artifacts.content_plan || null,
      design: artifacts.design_plan || null,
      wordpress: artifacts.wordpress_plan || null,
      execution: artifacts.execution_plan || null,
    };

    // Format markdown si demandé
    if (format === 'markdown' || format === 'md') {
      const md = generateMarkdownPlan(aiPlan);
      reply.type('text/markdown');
      return md;
    }

    // Format texte prompt-ready si demandé
    if (format === 'prompt') {
      const prompt = generatePromptPlan(aiPlan);
      reply.type('text/plain');
      return prompt;
    }

    return {
      ok: true,
      request_id: id,
      format: 'json',
      plan: aiPlan,
    };
  });

  // POST /requests/:id/artifacts/:type/:version/revise - Demander une révision ciblée
  fastify.post('/requests/:id/artifacts/:type/:version/revise', async (request, reply) => {
    const { id, type, version } = request.params;
    const versionNum = parseInt(version, 10);
    const { reason, requested_by } = request.body || {};

    // Vérifier que la request existe
    const requestDoc = await Request.findOne({ requestId: id });
    if (!requestDoc) {
      return reply.code(404).send({
        ok: false,
        error: 'Request not found',
        request_id: id,
      });
    }

    // Vérifier que l'artefact ciblé existe
    const artifact = await getArtifactByVersion(id, type, versionNum);
    if (!artifact) {
      return reply.code(404).send({
        ok: false,
        error: 'Artifact not found',
        request_id: id,
        artifact_type: type,
        version: versionNum,
      });
    }

    // Vérifier les dépendances (les sources doivent être valides)
    const depsCheck = await checkDependenciesSatisfied(id, type);

    // Marquer l'artefact ciblé comme "pending" (en attente de régénération)
    await updateArtifactStatus(id, type, versionNum, 'pending');

    // Marquer les descendants comme stale
    const staleResult = await markDescendantsAsStale(id, type);

    // Calculer l'ordre de reconstruction
    const rebuildOrder = getRebuildOrder(type);

    // Mettre à jour Request avec les infos de révision
    await Request.findOneAndUpdate(
      { requestId: id },
      {
        status: 'processing',
        'validation.status': 'revising',
        'validation.target_artifact': type,
        'validation.target_version': versionNum,
        'validation.revision_requested_at': new Date(),
        'validation.revision_reason': reason || '',
        'validation.revision_requested_by': requested_by || 'unknown',
      }
    );

    return {
      ok: true,
      request_id: id,
      artifact_type: type,
      version: versionNum,
      action: 'revision_requested',
      dependencies_satisfied: depsCheck.satisfied,
      dependencies_missing: depsCheck.missing,
      dependencies_stale: depsCheck.stale,
      stale_artifacts: staleResult.marked,
      stale_count: staleResult.count,
      rebuild_order: rebuildOrder,
      // Webhook URL pour n8n (à implémenter côté n8n)
      next_step: 'awaiting_regeneration',
      regeneration_target: {
        artifact_type: type,
        from_version: versionNum,
        rebuild_chain: rebuildOrder,
      },
    };
  });
}
