import { randomUUID } from 'node:crypto';
import config from '../../../../bridge/config/default.js';
import Request from '../db/models/Request.js';
import RequestArtifact from '../db/models/RequestArtifact.js';
import ValidationDecision from '../db/models/ValidationDecision.js';
import RequestExecution from '../db/models/RequestExecution.js';
import { getActiveArtifact } from '../services/artifact-store.js';

const WAIT_WEBHOOK_SUFFIX = 'wp-site-builder-core-validation';
const V2_VALIDATION_WEBHOOK = 'wp-builder-v2-validation-loop';

function getCallbackUrl(requestId) {
  return `${config.server.publicBaseUrl}/requests/${requestId}/callback`;
}

async function getV2ValidationTarget(requestId, validation = {}) {
  if (validation.target_artifact) {
    const artifact = await getActiveArtifact(requestId, validation.target_artifact);
    if (artifact) {
      return artifact;
    }
  }

  const preferredArtifacts = ['execution_plan', 'wordpress_plan', 'site_architecture'];
  for (const artifactType of preferredArtifacts) {
    const artifact = await getActiveArtifact(requestId, artifactType);
    if (artifact) {
      return artifact;
    }
  }

  return null;
}

// Schema de validation pour création de demande
const createRequestSchema = {
  body: {
    type: 'object',
    required: ['site_name'],
    properties: {
      site_name: { type: 'string', minLength: 1 },
      site_type: { type: 'string' },
      objective: { type: 'string' },
      pages: { type: 'array', items: { type: 'string' } },
      features: { type: 'array', items: { type: 'string' } },
      design_preferences: { type: 'string' },
      target_audience: { type: 'string' },
    },
  },
};

// Schema pour callback n8n
const callbackSchema = {
  body: {
    type: 'object',
    required: ['requestId'],
    properties: {
      requestId: { type: 'string' },
      success: { type: 'boolean' },
      bash_script: { type: 'string' },
      summary: { type: 'object' },
      error: { type: 'string' },
    },
  },
};

const validationRequestSchema = {
  body: {
    type: 'object',
    required: ['requestId', 'resume_url'],
    properties: {
      requestId: { type: 'string' },
      resume_url: { type: 'string', minLength: 1 },
      brief_architecte: {},
      project_name: { type: 'string' },
      project_description: { type: 'string' },
      target_artifact: { type: 'string' },
      target_version: { type: 'integer', minimum: 1 },
    },
  },
};

export default async function requestsRoutes(fastify) {

  // GET /requests - Liste toutes les demandes
  fastify.get('/requests', async (request, reply) => {
    const { status, limit = 50, skip = 0 } = request.query;

    const filter = {};
    if (status) filter.status = status;

    const requests = await Request.find(filter)
      .sort({ created_at: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await Request.countDocuments(filter);

    return { requests, total, limit: parseInt(limit), skip: parseInt(skip) };
  });

  // GET /requests/:id - Detail d'une demande
  fastify.get('/requests/:id', async (request, reply) => {
    const { id } = request.params;

    const req = await Request.findOne({ requestId: id }).lean();

    if (!req) {
      return reply.code(404).send({ error: 'Request not found' });
    }

    return req;
  });

  // POST /requests - Créer une nouvelle demande et déclencher n8n
  fastify.post('/requests', { schema: createRequestSchema }, async (request, reply) => {
    const requestId = randomUUID();
    const input = request.body;

    // Créer la demande en DB
    const newRequest = new Request({
      requestId,
      status: 'pending',
      input,
    });
    await newRequest.save();

    // Déclencher le webhook n8n
    try {
      const webhookUrl = config.n8n.webhookUrl;
      const webhookPayload = {
        requestId,
        ...input,
        callback_url: getCallbackUrl(requestId),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      if (response.ok) {
        newRequest.status = 'processing';
        newRequest.started_at = new Date();
        await newRequest.save();
      } else {
        fastify.log.error('n8n webhook failed:', response.status);
      }
    } catch (error) {
      fastify.log.error('n8n webhook error:', error.message);
      // On ne fail pas la création, le webhook peut être retry
    }

    return reply.code(201).send({
      requestId,
      status: newRequest.status,
      message: 'Request created and workflow triggered',
    });
  });

  // POST /requests/:id/callback - Callback de n8n avec le résultat
  fastify.post('/requests/:id/callback', { schema: callbackSchema }, async (request, reply) => {
    const { id } = request.params;
    const { success, bash_script, summary, error, raw_output, n8n_execution_id } = request.body;

    const req = await Request.findOne({ requestId: id });

    if (!req) {
      return reply.code(404).send({ error: 'Request not found' });
    }

    // Mettre à jour avec le résultat
    req.status = success ? 'completed' : 'failed';
    req.completed_at = new Date();
    req.result = {
      success,
      bash_script,
      summary,
      error,
      raw_output,
    };
    if (n8n_execution_id) {
      req.n8n_execution_id = n8n_execution_id;
    }
    if (req.started_at) {
      req.duration_ms = req.completed_at - req.started_at;
    }

    await req.save();

    return { message: 'Result saved', requestId: id, status: req.status };
  });

  // POST /requests/:id/validation-request - n8n demande une validation via le frontend
  fastify.post('/requests/:id/validation-request', { schema: validationRequestSchema }, async (request, reply) => {
    const { id } = request.params;
    const {
      requestId,
      resume_url,
      brief_architecte,
      project_name,
      project_description,
      target_artifact,
      target_version,
    } = request.body;

    if (requestId !== id) {
      return reply.code(400).send({ error: 'requestId mismatch' });
    }

    const req = await Request.findOne({ requestId: id });

    if (!req) {
      return reply.code(404).send({ error: 'Request not found' });
    }

    // Lors d'une revalidation apres reconstruction, il faut sortir explicitement
    // l'etat `validation.status = revising`, sinon le frontend reste bloque sur
    // "Revision en cours" meme si `req.status` est bien revenu a waiting_validation.
    const resolvedTarget =
      target_artifact && target_version
        ? { artifact_type: target_artifact, version: target_version }
        : await getV2ValidationTarget(id, req.validation || {});

    req.status = 'waiting_validation';
    req.validation = {
      ...(req.validation || {}),
      requested_at: new Date(),
      resume_url,
      brief_architecte,
      project_name,
      project_description,
      status: 'waiting_validation',
      target_artifact: resolvedTarget?.artifact_type || req.validation?.target_artifact,
      target_version: resolvedTarget?.version || req.validation?.target_version,
    };

    await req.save();

    return { message: 'Validation request saved', requestId: id, status: req.status };
  });

  // POST /requests/:id/approve - reprise du workflow n8n depuis le frontend
  fastify.post('/requests/:id/approve', async (request, reply) => {
    const { id } = request.params;
    const req = await Request.findOne({ requestId: id });

    if (!req) {
      return reply.code(404).send({ error: 'Request not found' });
    }

    if (!req.validation?.resume_url) {
      return reply.code(409).send({ error: 'No validation URL available for this request' });
    }

    if (req.status !== 'waiting_validation') {
      return reply.code(409).send({ error: `Request is not awaiting validation (${req.status})` });
    }

    try {
      const callbackUrl = getCallbackUrl(id);
      const resumeBase = req.validation.resume_url.replace(/\/$/, '');
      const isV2ValidationLoop =
        resumeBase.endsWith(`/${V2_VALIDATION_WEBHOOK}`) ||
        resumeBase.includes(`/${V2_VALIDATION_WEBHOOK}?`);

      let response;
      let targetArtifact = null;

      if (isV2ValidationLoop) {
        targetArtifact = await getV2ValidationTarget(id, req.validation || {});

        if (!targetArtifact) {
          return reply.code(409).send({
            error: 'No validation target artifact available for this request',
          });
        }

        const n8nBaseUrl = new URL(resumeBase).origin;
        response = await fetch(resumeBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: id,
            artifact_type: targetArtifact.artifact_type,
            artifact_version: targetArtifact.version,
            decision: 'approved',
            comment: '',
            requested_changes: [],
            created_by: 'quick-approve',
            bridge_base_url: config.server.internalBaseUrl,
            n8n_base_url: n8nBaseUrl,
            callback_url: callbackUrl,
          }),
        });
      } else {
        const resumeUrl = resumeBase.endsWith(`/${WAIT_WEBHOOK_SUFFIX}`)
          ? resumeBase
          : `${resumeBase}/${WAIT_WEBHOOK_SUFFIX}`;
        const approvalUrl = new URL(resumeUrl);
        approvalUrl.searchParams.set('approved', 'true');
        approvalUrl.searchParams.set('requestId', id);
        approvalUrl.searchParams.set('callback_url', callbackUrl);

        response = await fetch(approvalUrl, {
          method: 'GET',
        });
      }

      if (!response.ok) {
        const responseText = await response.text();
        fastify.log.error(
          'n8n validation resume failed:',
          response.status,
          responseText,
          resumeBase
        );
        return reply.code(502).send({
          error: 'Failed to resume n8n workflow',
          statusCode: response.status,
        });
      }

      // Sauvegarder la décision dans l'historique
      const ValidationDecision = (await import('../db/models/ValidationDecision.js')).default;

      // Pour les anciens workflows non-V2, récupérer le target si pas déjà fait
      if (!targetArtifact) {
        targetArtifact = await getV2ValidationTarget(id, req.validation || {});
      }

      if (targetArtifact) {
        const validationDecision = new ValidationDecision({
          requestId: id,
          artifact_type: targetArtifact.artifact_type,
          artifact_version: targetArtifact.version,
          decision: 'approved',
          comment: '',
          requested_changes: [],
          created_by: 'quick-approve',
        });
        await validationDecision.save();
      }

      // Mettre à jour le statut à 'approved' (pas 'processing')
      req.status = 'approved';
      req.validation = {
        ...(req.validation || {}),
        status: 'approved',
        approved_at: new Date(),
        last_decision: 'approved',
        last_decision_at: new Date(),
        last_decision_by: 'quick-approve',
      };
      await req.save();

      return { message: 'Validation approved', requestId: id, status: req.status };
    } catch (error) {
      fastify.log.error('n8n validation resume error:', error.message);
      return reply.code(502).send({ error: 'Failed to resume n8n workflow' });
    }
  });

  // DELETE /requests/:id - Supprimer une demande et ses données associées
  fastify.delete('/requests/:id', async (request, reply) => {
    const { id } = request.params;

    // Vérifier que la request existe
    const existing = await Request.findOne({ requestId: id });
    if (!existing) {
      return reply.code(404).send({
        ok: false,
        error: 'Request not found',
        requestId: id,
      });
    }

    try {
      // Suppression en cascade de toutes les données liées
      const [artifactsResult, decisionsResult, executionsResult, requestResult] =
        await Promise.all([
          RequestArtifact.deleteMany({ requestId: id }),
          ValidationDecision.deleteMany({ requestId: id }),
          RequestExecution.deleteMany({ requestId: id }),
          Request.deleteOne({ requestId: id }),
        ]);

      return {
        ok: true,
        requestId: id,
        message: 'Request and related data deleted',
        deleted: {
          request: requestResult.deletedCount,
          artifacts: artifactsResult.deletedCount,
          validation_decisions: decisionsResult.deletedCount,
          executions: executionsResult.deletedCount,
        },
      };
    } catch (error) {
      fastify.log.error('Delete request error:', error.message);
      return reply.code(500).send({
        ok: false,
        error: 'Failed to delete request and related records',
        requestId: id,
      });
    }
  });
}
