import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import Request from '../db/models/Request.js';

// automation/ lives at the repo root, two levels above modules/wp-builder/.
// Kept as the single canonical copy (plan phase 1) instead of duplicating
// schema content inline here.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTOMATION_ROOT = path.resolve(__dirname, '../../../../automation');

function loadSchema(relPath) {
  return JSON.parse(readFileSync(path.join(AUTOMATION_ROOT, relPath), 'utf8'));
}

const siteBuildRequestSchema = loadSchema('contracts/site-build-request.schema.json');
const buildStatePolicy = loadSchema('policies/build-state-policy.json');

const SEVERITY_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };
const FORCE_DRY_RUN_MIN_SEVERITY = SEVERITY_ORDER[buildStatePolicy.force_dry_run_when.unmitigated_risk_severity_at_least];

function hasUnmitigatedHighRisk(risks = []) {
  return risks.some((r) => !r.mitigated && SEVERITY_ORDER[r.severity] >= FORCE_DRY_RUN_MIN_SEVERITY);
}

function appendStateHistory(requestDoc, state, actor, reason) {
  requestDoc.contract.state_history.push({ state, actor, at: new Date(), reason });
  requestDoc.contract.build_state = state;
}

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
  // POST /contracts/site-build - intake for the hybrid orchestration (plan phase 1)
  fastify.post(
    '/contracts/site-build',
    { schema: { body: siteBuildRequestSchema } },
    async (request, reply) => {
      const contract = request.body;
      const checksum = createHash('sha256').update(JSON.stringify(contract)).digest('hex');

      const missingInformation = [];
      if (!contract.business.coordinates?.phone && !contract.business.coordinates?.email) {
        missingInformation.push('business.coordinates.phone or business.coordinates.email');
      }

      const risks = contract.risks || [];
      const forceDryRun = missingInformation.length > 0 || hasUnmitigatedHighRisk(risks);
      const executionMode = forceDryRun ? 'dry_run' : contract.execution_mode || 'dry_run';
      const nextState = missingInformation.length > 0 ? 'needs_input' : 'awaiting_staging_approval';

      let requestDoc = await Request.findOne({ requestId: contract.request_id });

      if (!requestDoc) {
        requestDoc = new Request({
          requestId: contract.request_id,
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
            payload_checksum: checksum,
            business: contract.business,
            site: contract.site,
            execution_mode: executionMode,
            stage_artifacts: contract.stage_artifacts || {},
            missing_information: missingInformation,
            risks,
            state_history: [],
          },
        });
      } else {
        // Resubmission (e.g. needs_input -> received): update the contract in place,
        // never create a second record for the same request_id.
        requestDoc.contract.payload_checksum = checksum;
        requestDoc.contract.business = contract.business;
        requestDoc.contract.site = contract.site;
        requestDoc.contract.execution_mode = executionMode;
        requestDoc.contract.missing_information = missingInformation;
        requestDoc.contract.risks = risks;
      }

      appendStateHistory(
        requestDoc,
        nextState,
        'intake-workflow',
        missingInformation.length > 0 ? 'missing critical information' : 'contract complete, awaiting human staging approval'
      );

      await requestDoc.save();

      return reply.code(201).send({
        ok: true,
        request_id: contract.request_id,
        build_state: requestDoc.contract.build_state,
        execution_mode: requestDoc.contract.execution_mode,
        missing_information: requestDoc.contract.missing_information,
        payload_checksum: checksum,
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
