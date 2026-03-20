import Request from '../db/models/Request.js';
import RequestExecution from '../db/models/RequestExecution.js';

const createExecutionSchema = {
  body: {
    type: 'object',
    required: ['execution_id', 'mode'],
    properties: {
      execution_id: {
        type: 'string',
        minLength: 1,
      },
      mode: {
        type: 'string',
        enum: ['dry_run', 'apply'],
      },
      status: {
        type: 'string',
        enum: [
          'pending',
          'running',
          'completed',
          'failed',
          'failed_partial',
          'compensating',
          'compensated',
          'cancelled',
          'manual_intervention_required',
        ],
        default: 'pending',
      },
      plan_version: {
        type: 'integer',
        minimum: 1,
      },
      steps: {
        type: 'array',
        default: [],
      },
      triggered_by: {
        type: 'string',
      },
      n8n_execution_id: {
        type: 'string',
      },
    },
  },
};

export default async function executionsRoutes(fastify) {
  fastify.post(
    '/requests/:id/executions',
    { schema: createExecutionSchema },
    async (request, reply) => {
      const { id } = request.params;
      const {
        execution_id,
        mode,
        status = 'pending',
        plan_version,
        steps = [],
        triggered_by,
        n8n_execution_id,
      } = request.body;

      const requestDoc = await Request.findOne({ requestId: id }).lean();
      if (!requestDoc) {
        return reply.code(404).send({
          ok: false,
          error: 'Request not found',
          request_id: id,
        });
      }

      const existing = await RequestExecution.findOne({
        requestId: id,
        execution_id,
      }).lean();

      if (existing) {
        return reply.code(409).send({
          ok: false,
          error: 'Execution already exists',
          request_id: id,
          execution_id,
        });
      }

      const now = new Date();
      const normalizedSteps = steps.map((step) => ({
        ...step,
        status: step.status || 'pending',
      }));

      const execution = await RequestExecution.create({
        requestId: id,
        execution_id,
        mode,
        status,
        plan_version,
        steps: normalizedSteps,
        triggered_by,
        n8n_execution_id,
        progress: {
          total_steps: normalizedSteps.length,
          completed_steps: normalizedSteps.filter((step) => step.status === 'completed').length,
          failed_steps: normalizedSteps.filter((step) => step.status === 'failed').length,
          current_step: normalizedSteps.find((step) => step.status === 'running')?.step_key,
        },
        started_at: status === 'running' ? now : undefined,
        completed_at: ['completed', 'failed', 'failed_partial', 'cancelled', 'compensated'].includes(status)
          ? now
          : undefined,
      });

      return reply.code(201).send({
        ok: true,
        request_id: id,
        execution: execution.toObject(),
      });
    }
  );

  fastify.get('/requests/:id/executions', async (request, reply) => {
    const { id } = request.params;
    const { status } = request.query || {};

    const requestDoc = await Request.findOne({ requestId: id }).lean();
    if (!requestDoc) {
      return reply.code(404).send({
        ok: false,
        error: 'Request not found',
        request_id: id,
      });
    }

    const query = { requestId: id };
    if (status) {
      query.status = status;
    }

    const executions = await RequestExecution.find(query)
      .sort({ created_at: -1 })
      .lean();

    return {
      ok: true,
      request_id: id,
      count: executions.length,
      executions,
    };
  });

  fastify.get('/requests/:id/executions/:executionId', async (request, reply) => {
    const { id, executionId } = request.params;

    const execution = await RequestExecution.findOne({
      requestId: id,
      execution_id: executionId,
    }).lean();

    if (!execution) {
      return reply.code(404).send({
        ok: false,
        error: 'Execution not found',
        request_id: id,
        execution_id: executionId,
      });
    }

    return {
      ok: true,
      request_id: id,
      execution,
    };
  });
}
