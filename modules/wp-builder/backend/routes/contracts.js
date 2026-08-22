import Request from '../db/models/Request.js';

// Decision-making (schema validation, missing-information detection, risk
// evaluation, dry_run forcing, next-state choice) lives in the n8n workflow
// (00-site-build-intake) as visible Code/IF nodes -- deliberately, so the
// logic is inspectable per-execution in n8n rather than hidden in this file.
// This route is intentionally a thin, trusted persistence layer: it stores
// whatever state n8n already decided and appends the audit trail entry.

function appendStateHistory(requestDoc, state, actor, reason) {
  requestDoc.contract.state_history.push({ state, actor, at: new Date(), reason });
  requestDoc.contract.build_state = state;
}

const putContractSchema = {
  body: {
    type: 'object',
    required: ['contract_version', 'business', 'execution_mode', 'build_state', 'actor', 'reason'],
    properties: {
      contract_version: { type: 'string' },
      payload_checksum: { type: 'string' },
      business: { type: 'object' },
      site: { type: 'object' },
      execution_mode: { type: 'string', enum: ['dry_run', 'apply'] },
      missing_information: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array' },
      build_state: {
        type: 'string',
        enum: ['needs_input', 'awaiting_staging_approval'],
        description: 'Only intake-time states are accepted here; later states move through their own gated endpoints.',
      },
      actor: { type: 'string', minLength: 1 },
      reason: { type: 'string' },
    },
  },
};

const approveStagingSchema = {
  body: {
    type: 'object',
    required: ['actor'],
    properties: {
      actor: { type: 'string', minLength: 1 },
      reason: { type: 'string' },
    },
  },
};

export default async function contractsRoutes(fastify) {
  // PUT /contracts/:id - store a contract + build_state already decided by the n8n intake workflow.
  fastify.put(
    '/contracts/:id',
    { schema: putContractSchema },
    async (request, reply) => {
      const { id } = request.params;
      const contract = request.body;

      let requestDoc = await Request.findOne({ requestId: id });

      if (!requestDoc) {
        requestDoc = new Request({
          requestId: id,
          input: {
            site_name: contract.business.name,
            site_type: contract.business.type,
            objective: contract.site?.objective,
            pages: contract.site?.pages,
            features: contract.site?.features,
            design_preferences: contract.site?.design_preferences,
            target_audience: contract.site?.target_audience,
          },
          contract: {
            contract_version: contract.contract_version,
            payload_checksum: contract.payload_checksum,
            business: contract.business,
            site: contract.site,
            execution_mode: contract.execution_mode,
            stage_artifacts: {},
            missing_information: contract.missing_information || [],
            risks: contract.risks || [],
            state_history: [],
          },
        });
      } else {
        // Resubmission (e.g. needs_input -> received): update in place, never
        // create a second record for the same request_id.
        requestDoc.contract.payload_checksum = contract.payload_checksum;
        requestDoc.contract.business = contract.business;
        requestDoc.contract.site = contract.site;
        requestDoc.contract.execution_mode = contract.execution_mode;
        requestDoc.contract.missing_information = contract.missing_information || [];
        requestDoc.contract.risks = contract.risks || [];
      }

      appendStateHistory(requestDoc, contract.build_state, contract.actor, contract.reason);
      await requestDoc.save();

      return reply.code(201).send({
        ok: true,
        request_id: id,
        build_state: requestDoc.contract.build_state,
        execution_mode: requestDoc.contract.execution_mode,
        missing_information: requestDoc.contract.missing_information,
        payload_checksum: requestDoc.contract.payload_checksum,
      });
    }
  );

  // POST /contracts/:id/approve-staging - human gate: awaiting_staging_approval -> ready_for_staging
  fastify.post(
    '/contracts/:id/approve-staging',
    { schema: approveStagingSchema },
    async (request, reply) => {
      const { id } = request.params;
      const { actor, reason } = request.body;

      const requestDoc = await Request.findOne({ requestId: id });
      if (!requestDoc || !requestDoc.contract?.build_state) {
        return reply.code(404).send({ ok: false, error: 'Contract not found', request_id: id });
      }

      const current = requestDoc.contract.build_state;

      // Idempotent no-op: already past this gate.
      if (current === 'ready_for_staging' || current === 'building') {
        return reply.send({
          ok: true,
          request_id: id,
          build_state: current,
          note: 'already approved, no new transition recorded',
        });
      }

      if (current !== 'awaiting_staging_approval') {
        return reply.code(409).send({
          ok: false,
          error: `Cannot approve staging from state "${current}"`,
          allowed_from: 'awaiting_staging_approval',
          request_id: id,
        });
      }

      appendStateHistory(requestDoc, 'ready_for_staging', actor, reason || 'staging build approved by human reviewer');
      await requestDoc.save();

      return reply.send({
        ok: true,
        request_id: id,
        build_state: requestDoc.contract.build_state,
      });
    }
  );

  // GET /contracts/:id - read current contract + state history
  fastify.get('/contracts/:id', async (request, reply) => {
    const { id } = request.params;
    const requestDoc = await Request.findOne({ requestId: id }).lean();
    if (!requestDoc || !requestDoc.contract?.build_state) {
      return reply.code(404).send({ ok: false, error: 'Contract not found', request_id: id });
    }
    return { ok: true, request_id: id, contract: requestDoc.contract };
  });
}
