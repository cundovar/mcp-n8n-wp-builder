import {
  executeInfrastructureActions,
  validateInfrastructureActions,
  checkStagingHealth,
} from '../services/infrastructureExecutor.js';

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
    },
  },
};

export default async function infrastructureRoutes(fastify) {
  // POST /infrastructure/execute - runs pre-validated WP-CLI actions on staging (phase 2).
  // Protected by X-Bridge-Token (see EXECUTION_PATHS in server.js) same as /task:
  // this actually mutates the staging site, unlike the read-only /contracts routes.
  fastify.post('/infrastructure/execute', { schema: executeSchema }, async (request, reply) => {
    const { request_id, actions, timeout_ms } = request.body;

    try {
      const result = await executeInfrastructureActions({ requestId: request_id, actions, timeoutMs: timeout_ms });
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

  // POST /infrastructure/validate - same allowlist check the runner does,
  // without touching SSH. Not in EXECUTION_PATHS: it can't mutate anything.
  fastify.post('/infrastructure/validate', { schema: executeSchema }, async (request, reply) => {
    const { request_id, actions } = request.body;

    try {
      const result = await validateInfrastructureActions({ requestId: request_id, actions });
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
