import {
  executeInfrastructureActions,
  validateInfrastructureActions,
  checkStagingHealth,
  captureVisualReview,
} from '../services/infrastructureExecutor.js';
import { listSiteKits, resolveSiteKitCatalogEntry, selectSiteKit } from '../services/siteKitCatalog.js';

const executeSchema = {
  body: {
    type: 'object',
    required: ['request_id', 'actions'],
    properties: {
      request_id: { type: 'string', minLength: 1 },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['action'],
          properties: {
            action: { type: 'string' },
            args: { type: 'object' },
          },
        },
      },
      timeout_ms: { type: 'integer', minimum: 1000 },
      execution_mode: { type: 'string', enum: ['dry_run', 'apply'], default: 'dry_run' },
    },
  },
};

const selectKitSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      execution_mode: { type: 'string', enum: ['dry_run', 'apply'], default: 'dry_run' },
      industries: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      page_types: { type: 'array', items: { type: 'string' }, maxItems: 30 },
      features: { type: 'array', items: { type: 'string' }, maxItems: 30 },
      constraints: {
        type: 'object',
        additionalProperties: false,
        properties: {
          elementor_level: { type: 'string', enum: ['free', 'pro'], default: 'free' },
          woocommerce: { type: 'boolean', default: false },
        },
      },
    },
  },
};

const resolveKitSchema = {
  body: {
    ...selectKitSchema.body,
    required: ['request_id', 'execution_mode'],
    properties: {
      ...selectKitSchema.body.properties,
      request_id: { type: 'string', pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$' },
      kit_id: { type: ['string', 'null'], pattern: '^[a-z0-9][a-z0-9-]{0,99}$' },
    },
  },
};

export default async function infrastructureRoutes(fastify) {
  // POST /infrastructure/execute - runs pre-validated WP-CLI actions on staging (phase 2).
  // Protected by X-Bridge-Token (see EXECUTION_PATHS in server.js) same as /task:
  // this actually mutates the staging site, unlike the read-only /contracts routes.
  fastify.post('/infrastructure/execute', { schema: executeSchema }, async (request, reply) => {
    const { request_id, actions, timeout_ms, execution_mode } = request.body;

    try {
      const result = await executeInfrastructureActions({ requestId: request_id, actions, timeoutMs: timeout_ms, executionMode: execution_mode });
      return reply.send({
        ok: result.exitCode === 0,
        request_id,
        exit_code: result.exitCode,
        results: result.results,
        stderr: result.stderr || undefined,
      });
    } catch (error) {
      return reply.code(500).send({
        ok: false,
        request_id,
        error_type: error.code === 'TIMEOUT' ? 'timeout' : 'execution_error',
        message: error.message,
      });
    }
  });

  fastify.get('/infrastructure/site-kits', async (_request, reply) => {
    return reply.send({ ok: true, kits: listSiteKits() });
  });

  fastify.post('/infrastructure/site-kits/select', { schema: selectKitSchema }, async (request, reply) => {
    const selection = selectSiteKit(request.body);
    if (!selection.selected) {
      return reply.code(422).send({ ok: false, ...selection });
    }
    return reply.send({ ok: true, ...selection });
  });

  fastify.post('/infrastructure/site-kits/resolve', { schema: resolveKitSchema }, async (request, reply) => {
    const requestedKit = request.body.kit_id
      ? listSiteKits().find((kit) => kit.kit_id === request.body.kit_id)
      : selectSiteKit(request.body).selected;
    if (!requestedKit) return reply.code(422).send({ ok: false, error: 'No eligible site kit found' });

    try {
      const catalogResult = await executeInfrastructureActions({
        requestId: `${request.body.request_id}-catalog`,
        executionMode: 'apply',
        actions: [{ action: 'list_starter_templates', args: {} }],
        timeoutMs: 120000,
      });
      const firstResult = Array.isArray(catalogResult.results) ? catalogResult.results[0] : null;
      if (!firstResult?.ok) throw new Error(firstResult?.output || 'Unable to read live Starter Templates catalogue');
      const liveCatalog = JSON.parse(firstResult.output);
      const resolved = resolveSiteKitCatalogEntry(requestedKit, liveCatalog);
      return reply.send({ ok: true, kit: resolved, starter_template_id: resolved.starter_template_id });
    } catch (error) {
      return reply.code(422).send({ ok: false, error: error.message });
    }
  });

  fastify.post('/infrastructure/visual-review', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['request_id', 'base_url', 'pages'],
        properties: {
          request_id: { type: 'string', pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$' },
          base_url: { type: 'string', minLength: 8, maxLength: 500 },
          pages: {
            type: 'array', minItems: 1, maxItems: 30,
            items: {
              type: 'object', additionalProperties: false, required: ['page_key', 'path'],
              properties: {
                page_key: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,99}$' },
                path: { type: 'string', pattern: '^/' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const result = await captureVisualReview({ requestId: request.body.request_id, baseUrl: request.body.base_url, pages: request.body.pages });
    return reply.code(result.exitCode === 0 ? 200 : 422).send({ ok: result.exitCode === 0, manifest: result.manifest, stderr: result.stderr || undefined });
  });

  // POST /infrastructure/validate - same allowlist check the runner does,
  // without touching SSH. Not in EXECUTION_PATHS: it can't mutate anything.
  fastify.post('/infrastructure/validate', { schema: executeSchema }, async (request, reply) => {
    const { request_id, actions, execution_mode } = request.body;

    try {
      const result = await validateInfrastructureActions({ requestId: request_id, actions, executionMode: execution_mode });
      return reply.send({
        ok: result.exitCode === 0,
        request_id,
        results: result.results,
        stderr: result.stderr || undefined,
      });
    } catch (error) {
      return reply.code(500).send({
        ok: false,
        request_id,
        error_type: error.code === 'TIMEOUT' ? 'timeout' : 'execution_error',
        message: error.message,
      });
    }
  });

  // GET /infrastructure/health - read-only staging health check.
  fastify.get('/infrastructure/health', async (request, reply) => {
    try {
      const result = await checkStagingHealth();
      return reply.send({ ok: result.exitCode === 0, health: result.health, stderr: result.stderr || undefined });
    } catch (error) {
      return reply.code(500).send({ ok: false, error_type: 'execution_error', message: error.message });
    }
  });
}
