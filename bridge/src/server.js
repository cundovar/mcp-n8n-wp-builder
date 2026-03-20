import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import config from '../config/default.js';
import { connectDB } from './db/connection.js';
import healthRoutes from './routes/health.js';
import taskRoutes from './routes/task.js';
import artifactsRoutes from './routes/artifacts.js';
import requestsRoutes from './routes/requests.js';
import validationsRoutes from './routes/validations.js';
import executionsRoutes from './routes/executions.js';

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// Authentication hook
fastify.addHook('onRequest', async (request, reply) => {
  // Skip auth for health check
  if (request.url === '/health') {
    return;
  }

  if (!config.auth.enabled) {
    return;
  }

  const token = request.headers['x-bridge-token'];
  if (token !== config.auth.token) {
    reply.code(401).send({
      ok: false,
      error_type: 'unauthorized',
      message: 'Invalid or missing X-Bridge-Token header',
    });
  }
});

// Enable CORS for frontend
fastify.register(cors, {
  origin: true, // Allow all origins in dev
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

// Register routes
fastify.register(healthRoutes);
fastify.register(taskRoutes);
fastify.register(artifactsRoutes);
fastify.register(requestsRoutes);
fastify.register(validationsRoutes);
fastify.register(executionsRoutes);

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  if (error.validation) {
    return reply.code(400).send({
      ok: false,
      error_type: 'validation_error',
      message: 'Invalid request',
      details: error.validation,
    });
  }

  return reply.code(500).send({
    ok: false,
    error_type: 'internal_error',
    message: error.message,
  });
});

// Start server
const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    await fastify.listen({
      host: config.server.host,
      port: config.server.port,
    });

    console.log(`
╔════════════════════════════════════════════════╗
║        Codex/Claude Bridge Server              ║
╠════════════════════════════════════════════════╣
║  Listening: http://${config.server.host}:${config.server.port}       ║
║  Auth:      ${config.auth.enabled ? 'enabled' : 'disabled'}                            ║
║  Max jobs:  ${config.limits.maxConcurrentJobs}                                 ║
║  MongoDB:   connected                          ║
╚════════════════════════════════════════════════╝
    `);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
