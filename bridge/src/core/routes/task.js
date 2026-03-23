import config from '../../../config/default.js';
import { enqueue } from '../queue/job-queue.js';
import { buildError } from '../utils/response.js';

// JSON Schema for request validation
const taskSchema = {
  body: {
    type: 'object',
    required: ['engine', 'prompt'],
    properties: {
      engine: {
        type: 'string',
        enum: ['codex', 'claude'],
      },
      prompt: {
        type: 'string',
        minLength: 1,
        maxLength: config.limits.maxInputSize,
      },
      cwd: {
        type: 'string',
      },
      timeout_ms: {
        type: 'integer',
        minimum: 1000,
        maximum: config.timeouts.max,
      },
      expect_json: {
        // Accept both boolean and string ("true"/"false") for flexibility
        type: ['boolean', 'string'],
        default: false,
      },
      context: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
          stage: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
  },
};

/**
 * Task execution routes
 */
export default async function taskRoutes(fastify) {
  // Generic task endpoint
  fastify.post('/task', { schema: taskSchema }, async (request, reply) => {
    const { engine, prompt, cwd, timeout_ms, expect_json, context } = request.body;

    // Convert string "true"/"false" to boolean
    const expectJson = expect_json === true || expect_json === 'true' || expect_json === '1';

    try {
      const result = await enqueue({
        engine,
        prompt,
        cwd,
        timeoutMs: timeout_ms,
        expectJson,
        context: context || {},
      });

      const statusCode = result.ok ? 200 : 422;
      return reply.code(statusCode).send(result);

    } catch (error) {
      fastify.log.error(error, 'Task execution failed');
      return reply.code(500).send(
        buildError({
          engine,
          errorType: 'internal_error',
          message: error.message,
          meta: context || {},
        })
      );
    }
  });

  // Shorthand for codex
  fastify.post('/codex', { schema: taskSchema }, async (request, reply) => {
    request.body.engine = 'codex';
    return fastify.inject({
      method: 'POST',
      url: '/task',
      payload: request.body,
      headers: request.headers,
    }).then(res => {
      reply.code(res.statusCode).send(JSON.parse(res.payload));
    });
  });

  // Shorthand for claude
  fastify.post('/claude', { schema: taskSchema }, async (request, reply) => {
    request.body.engine = 'claude';
    return fastify.inject({
      method: 'POST',
      url: '/task',
      payload: request.body,
      headers: request.headers,
    }).then(res => {
      reply.code(res.statusCode).send(JSON.parse(res.payload));
    });
  });
}
