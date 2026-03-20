import config from '../../config/default.js';
import Request from '../db/models/Request.js';
import ValidationDecision from '../db/models/ValidationDecision.js';
import {
  createValidationDecision,
  listValidationDecisions,
} from '../services/validation-decision-service.js';

const createDecisionSchema = {
  body: {
    type: 'object',
    required: ['artifact_type', 'artifact_version', 'decision', 'created_by'],
    properties: {
      artifact_type: {
        type: 'string',
        minLength: 1,
      },
      artifact_version: {
        type: 'integer',
        minimum: 1,
      },
      decision: {
        type: 'string',
        enum: ['approved', 'changes_requested', 'rejected'],
      },
      comment: {
        type: 'string',
        default: '',
      },
      requested_changes: {
        type: 'array',
        items: { type: 'string' },
        default: [],
      },
      created_by: {
        type: 'string',
        minLength: 1,
      },
    },
  },
};

export default async function validationsRoutes(fastify) {
  // POST /requests/:id/validation-decisions - Créer une décision de validation
  fastify.post(
    '/requests/:id/validation-decisions',
    { schema: createDecisionSchema },
    async (request, reply) => {
      const { id } = request.params;
      const {
        artifact_type,
        artifact_version,
        decision,
        comment,
        requested_changes,
        created_by,
      } = request.body;

      try {
        const requestDoc = await Request.findOne({ requestId: id }).lean();
        if (!requestDoc) {
          return reply.code(404).send({
            ok: false,
            error: `Request not found: ${id}`,
            error_code: 'REQUEST_NOT_FOUND',
          });
        }

        const resumeUrl = requestDoc.validation?.resume_url;
        const isV2ValidationLoop =
          typeof resumeUrl === 'string' &&
          (resumeUrl.endsWith('/wp-builder-v2-validation-loop') ||
            resumeUrl.includes('/wp-builder-v2-validation-loop?'));
        const workflowDecisionInProgress = Boolean(
          requestDoc.validation?.workflow_decision_in_progress
        );

        if (isV2ValidationLoop && !workflowDecisionInProgress) {
          const n8nBaseUrl = new URL(resumeUrl).origin;
          await Request.findOneAndUpdate(
            { requestId: id },
            { 'validation.workflow_decision_in_progress': true }
          );

          try {
            const response = await fetch(resumeUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestId: id,
                artifact_type,
                artifact_version,
                decision,
                comment,
                requested_changes,
                created_by,
                bridge_base_url: config.server.internalBaseUrl,
                n8n_base_url: n8nBaseUrl,
              }),
            });

            const responseText = await response.text();
            let responseData = {};
            try {
              responseData = responseText ? JSON.parse(responseText) : {};
            } catch {
              responseData = { raw: responseText };
            }

            if (!response.ok) {
              return reply.code(502).send({
                ok: false,
                error: 'Failed to trigger n8n validation loop',
                statusCode: response.status,
                details: responseData,
              });
            }

            // En V2, n8n orchestre la suite du workflow, mais le bridge doit
            // quand meme persister la decision pour l'historique et pour que
            // le frontend sorte des etats "en cours"/"revising".
            const validationDecision = new ValidationDecision({
              requestId: id,
              artifact_type,
              artifact_version,
              decision,
              comment,
              requested_changes,
              created_by,
            });
            await validationDecision.save();

            // `changes_requested` est deja gere par le rebuild cible:
            // la route `/revise` met la demande en `revising`, puis
            // `/validation-request` la remet en `waiting_validation`.
            if (decision === 'approved' || decision === 'rejected') {
              const requestStatus = decision === 'approved' ? 'approved' : 'failed';
              const validationStatus = decision === 'approved' ? 'approved' : 'rejected';

              await Request.findOneAndUpdate(
                { requestId: id },
                {
                  status: requestStatus,
                  'validation.status': validationStatus,
                  'validation.target_artifact': artifact_type,
                  'validation.target_version': artifact_version,
                  'validation.last_decision': decision,
                  'validation.last_decision_at': new Date(),
                  'validation.last_decision_by': created_by,
                  ...(decision === 'approved'
                    ? { 'validation.approved_at': new Date() }
                    : {}),
                }
              );
            } else {
              await Request.findOneAndUpdate(
                { requestId: id },
                {
                  'validation.last_decision': decision,
                  'validation.last_decision_at': new Date(),
                  'validation.last_decision_by': created_by,
                }
              );
            }

            return {
              ok: true,
              request_id: id,
              triggered_via: 'n8n_validation_loop',
              ...responseData,
            };
          } finally {
            await Request.findOneAndUpdate(
              { requestId: id },
              { 'validation.workflow_decision_in_progress': false }
            );
          }
        }

        const result = await createValidationDecision({
          requestId: id,
          artifact_type,
          artifact_version,
          decision,
          comment,
          requested_changes,
          created_by,
        });

        return {
          ok: true,
          request_id: id,
          ...result,
        };
      } catch (error) {
        if (error.code === 'REQUEST_NOT_FOUND') {
          return reply.code(404).send({
            ok: false,
            error: error.message,
            error_code: error.code,
          });
        }

        if (error.code === 'ARTIFACT_NOT_FOUND') {
          return reply.code(404).send({
            ok: false,
            error: error.message,
            error_code: error.code,
          });
        }

        throw error;
      }
    }
  );

  // GET /requests/:id/validation-decisions - Liste des décisions de validation
  fastify.get('/requests/:id/validation-decisions', async (request) => {
    const { id } = request.params;
    const { artifact_type } = request.query || {};

    const decisions = await listValidationDecisions(id, { artifact_type });

    return {
      ok: true,
      request_id: id,
      count: decisions.length,
      decisions,
    };
  });

  // GET /requests/:id/validation-context - Contexte de validation pour le frontend
  fastify.get('/requests/:id/validation-context', async (request, reply) => {
    const { id } = request.params;

    const requestDoc = await Request.findOne({ requestId: id }).lean();
    if (!requestDoc) {
      return reply.code(404).send({
        ok: false,
        error: `Request not found: ${id}`,
        error_code: 'REQUEST_NOT_FOUND',
      });
    }

    const decisions = await listValidationDecisions(id);
    const validation = requestDoc.validation || {};
    const lastDecision = decisions[0] || null;

    // Calculer le display_state
    let displayState = 'default';
    if (validation.status === 'revising') {
      displayState = 'revising';
    } else if (validation.status === 'rejected') {
      displayState = 'rejected';
    } else if (requestDoc.status === 'waiting_validation') {
      // Chercher si une décision changes_requested a été faite avant cette validation
      const changesRequestedDecisions = decisions.filter(
        (d) => d.decision === 'changes_requested'
      );
      if (changesRequestedDecisions.length > 0) {
        // Si la version ciblée actuelle est supérieure à la version de la dernière décision
        const lastChangesRequested = changesRequestedDecisions[0];
        if (
          validation.target_version &&
          lastChangesRequested.artifact_version &&
          validation.target_version > lastChangesRequested.artifact_version
        ) {
          displayState = 'post_revision_validation';
        } else if (lastDecision?.decision === 'changes_requested') {
          displayState = 'post_revision_validation';
        } else {
          displayState = 'initial_validation';
        }
      } else {
        displayState = 'initial_validation';
      }
    } else if (validation.status === 'approved') {
      displayState = 'approved';
    }

    // Trouver la version précédente si post_revision
    let previousTarget = null;
    if (displayState === 'post_revision_validation' && lastDecision) {
      previousTarget = {
        artifact_type: lastDecision.artifact_type,
        version: lastDecision.artifact_version,
      };
    }

    // Construire la réponse
    return {
      ok: true,
      request_id: id,
      display_state: displayState,
      current_target: validation.target_artifact
        ? {
            artifact_type: validation.target_artifact,
            version: validation.target_version || 1,
          }
        : null,
      last_decision: lastDecision
        ? {
            decision: lastDecision.decision,
            comment: lastDecision.comment || '',
            requested_changes: lastDecision.requested_changes || [],
            created_by: lastDecision.created_by,
            created_at: lastDecision.created_at || lastDecision.createdAt,
          }
        : null,
      previous_target: previousTarget,
      validation_status: validation.status || null,
      revision_reason: validation.revision_reason || null,
      revision_requested_at: validation.revision_requested_at || null,
      revision_requested_by: validation.revision_requested_by || null,
      total_decisions: decisions.length,
      changes_requested_count: decisions.filter(
        (d) => d.decision === 'changes_requested'
      ).length,
    };
  });
}
