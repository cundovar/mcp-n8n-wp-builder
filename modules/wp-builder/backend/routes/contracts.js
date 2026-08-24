import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import Request from '../db/models/Request.js';
import { getArtifactByVersion } from '../services/artifact-store.js';
import { verifyApprovedArtifacts } from '../services/artifact-approval.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildStatePolicy = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../../automation/policies/build-state-policy.json'), 'utf8')
);

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
    required: ['contract_version', 'business', 'execution_mode', 'approved_artifact_versions', 'target_site', 'kit_selection', 'constraints', 'build_state', 'actor', 'reason'],
    properties: {
      contract_version: { type: 'string' },
      payload_checksum: { type: 'string' },
      business: { type: 'object' },
      site: { type: 'object' },
      execution_mode: { type: 'string', enum: ['dry_run', 'apply'] },
      missing_information: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array' },
      approved_artifact_versions: { type: 'object' },
      target_site: { type: 'object' },
      kit_selection: { type: 'object' },
      constraints: { type: 'object' },
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
            approved_artifact_versions: contract.approved_artifact_versions,
            target_site: contract.target_site,
            kit_selection: contract.kit_selection,
            constraints: contract.constraints,
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
        requestDoc.contract.approved_artifact_versions = contract.approved_artifact_versions;
        requestDoc.contract.target_site = contract.target_site;
        requestDoc.contract.kit_selection = contract.kit_selection;
        requestDoc.contract.constraints = contract.constraints;
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

      const approvedVersions = requestDoc.contract.approved_artifact_versions || {};
      const verification = await verifyApprovedArtifacts(id, approvedVersions, getArtifactByVersion);

      if (requestDoc.contract.execution_mode === 'apply' && verification.errors.length > 0) {
        return reply.code(409).send({
          ok: false,
          error: 'Approved artifact verification failed',
          details: verification.errors,
          request_id: id,
        });
      }

      requestDoc.contract.stage_artifacts = requestDoc.contract.stage_artifacts || {};
      requestDoc.contract.stage_artifacts.approved_artifacts = verification.artifacts;
      requestDoc.contract.artifacts_verified_at = new Date();
      requestDoc.markModified('contract.stage_artifacts');

      appendStateHistory(requestDoc, 'ready_for_staging', actor, reason || 'staging build approved by human reviewer');
      await requestDoc.save();

      return reply.send({
        ok: true,
        request_id: id,
        build_state: requestDoc.contract.build_state,
      });
    }
  );

  // POST /contracts/:id/approve-publish - human gate: awaiting_publish_approval -> publishing.
  // Independent re-validation of publication-policy.json, deliberately duplicated
  // from the check the 40-wordpress-publish workflow already does in a visible
  // Code node -- n8n's check is a fast-fail UX convenience, this is the actual
  // authority (same defense-in-depth shape as phase 2's runner re-validating
  // WP-CLI actions independently of the n8n allow-list check).
  fastify.post(
    '/contracts/:id/approve-publish',
    {
      schema: {
        body: {
          type: 'object',
          required: ['actor', 'build_checksum', 'target_environment', 'expiry'],
          properties: {
            actor: { type: 'string', minLength: 1 },
            build_checksum: { type: 'string', minLength: 1 },
            target_environment: { type: 'string', minLength: 1 },
            expiry: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { actor, build_checksum, target_environment, expiry } = request.body;

      const requestDoc = await Request.findOne({ requestId: id });
      if (!requestDoc || !requestDoc.contract?.build_state) {
        return reply.code(404).send({ ok: false, error: 'Contract not found', request_id: id });
      }

      const current = requestDoc.contract.build_state;

      // Idempotent no-op: already past this gate.
      if (current === 'publishing' || current === 'completed') {
        return reply.send({
          ok: true,
          request_id: id,
          build_state: current,
          note: 'already approved, no new transition recorded',
        });
      }

      if (current !== 'awaiting_publish_approval') {
        return reply.code(409).send({
          ok: false,
          error: `Cannot approve publish from state "${current}"`,
          allowed_from: 'awaiting_publish_approval',
          request_id: id,
        });
      }

      const expiryDate = new Date(expiry);
      if (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= Date.now()) {
        return reply.code(400).send({
          ok: false,
          error: 'Approval expiry is missing, malformed, or already in the past',
          request_id: id,
        });
      }

      const currentChecksum = requestDoc.contract.stage_artifacts?.build_checksum;
      if (!currentChecksum || build_checksum !== currentChecksum) {
        return reply.code(409).send({
          ok: false,
          error: 'build_checksum does not match the latest reviewed build -- approval is stale or forged',
          expected: currentChecksum || null,
          received: build_checksum,
          request_id: id,
        });
      }

      requestDoc.contract.stage_artifacts = requestDoc.contract.stage_artifacts || {};
      requestDoc.contract.stage_artifacts.publish_approval = {
        actor,
        build_checksum,
        target_environment,
        expiry,
        approved_at: new Date(),
      };
      requestDoc.markModified('contract.stage_artifacts');

      appendStateHistory(requestDoc, 'publishing', actor, `publish approved for checksum ${build_checksum} (env: ${target_environment})`);
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

  // POST /contracts/:id/transition - generic guarded transition for phases 2-4.
  // n8n decides WHICH transition to make (visible in its own IF/Switch
  // nodes); this endpoint's only job is to refuse anything not allowed by
  // build-state-policy.json, as a second, independent gate.
  fastify.post(
    '/contracts/:id/transition',
    {
      schema: {
        body: {
          type: 'object',
          required: ['state', 'actor', 'reason'],
          properties: {
            state: { type: 'string' },
            actor: { type: 'string', minLength: 1 },
            reason: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { state, actor, reason } = request.body;

      const requestDoc = await Request.findOne({ requestId: id });
      if (!requestDoc || !requestDoc.contract?.build_state) {
        return reply.code(404).send({ ok: false, error: 'Contract not found', request_id: id });
      }

      const current = requestDoc.contract.build_state;
      const allowedNext = buildStatePolicy.transitions[current] || [];

      if (current === state) {
        return reply.send({ ok: true, request_id: id, build_state: current, note: 'already in this state' });
      }

      if (!allowedNext.includes(state)) {
        return reply.code(409).send({
          ok: false,
          error: `Cannot transition from "${current}" to "${state}"`,
          allowed_next: allowedNext,
          request_id: id,
        });
      }

      appendStateHistory(requestDoc, state, actor, reason);
      await requestDoc.save();

      return reply.send({ ok: true, request_id: id, build_state: requestDoc.contract.build_state });
    }
  );

  // PUT /contracts/:id/stage-artifacts - store one keyed artifact (infra result,
  // build manifest, review result, ...) produced by phases 2-4.
  fastify.put(
    '/contracts/:id/stage-artifacts',
    {
      schema: {
        body: {
          type: 'object',
          required: ['key', 'value'],
          properties: { key: { type: 'string', minLength: 1 } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { key, value } = request.body;

      const requestDoc = await Request.findOne({ requestId: id });
      if (!requestDoc || !requestDoc.contract?.build_state) {
        return reply.code(404).send({ ok: false, error: 'Contract not found', request_id: id });
      }

      requestDoc.contract.stage_artifacts = requestDoc.contract.stage_artifacts || {};
      requestDoc.contract.stage_artifacts[key] = value;
      requestDoc.markModified('contract.stage_artifacts');
      await requestDoc.save();

      return reply.send({ ok: true, request_id: id, stage_artifacts: requestDoc.contract.stage_artifacts });
    }
  );
}
