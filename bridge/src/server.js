import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import config, { DEFAULT_DEV_TOKEN } from '../config/default.js';
import { connectDB } from './db/connection.js';
import { connectDB as connectWpBuilderDB } from '../../modules/wp-builder/backend/db/connection.js';
import healthRoutes from './core/routes/health.js';
import taskRoutes from './core/routes/task.js';
import infrastructureRoutes from './core/routes/infrastructure.js';
// WP-Builder routes (module produit)
import artifactsRoutes from '../../modules/wp-builder/backend/routes/artifacts.js';
import requestsRoutes from '../../modules/wp-builder/backend/routes/requests.js';
import validationsRoutes from '../../modules/wp-builder/backend/routes/validations.js';
import executionsRoutes from '../../modules/wp-builder/backend/routes/executions.js';
import contractsRoutes from '../../modules/wp-builder/backend/routes/contracts.js';

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
// Scopé aux seuls endpoints d'exécution IA (task/codex/claude) : ce sont eux
// qui spawn codex/claude en écriture et doivent rester protégés par token.
// Les routes produit (/requests, /artifacts, ...) sont exposées publiquement
// au frontend et protégées autrement : filtrage par chemin côté Traefik
// (/task, /codex, /claude n'ont volontairement aucun routeur public défini
// dans /srv/config/mcp-n8n-wp-builder/docker-compose.yml).
const EXECUTION_PATHS = ['/task', '/codex', '/claude'];

function isExecutionRoute(url) {
  const path = url.split('?')[0];
  return EXECUTION_PATHS.includes(path) || path.startsWith('/infrastructure/');
}

fastify.addHook('onRequest', async (request, reply) => {
  if (!isExecutionRoute(request.url)) {
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
fastify.register(infrastructureRoutes);
fastify.register(artifactsRoutes);
fastify.register(requestsRoutes);
fastify.register(validationsRoutes);
fastify.register(executionsRoutes);
fastify.register(contractsRoutes);

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
    // Refuse de démarrer avec le token de dev versionné : sans ce garde-fou,
    // l'auth serait active mais le secret connu de quiconque lit le repo.
    if (config.auth.enabled && config.auth.token === DEFAULT_DEV_TOKEN) {
      console.error(
        'FATAL: BRIDGE_TOKEN is unset or still the default dev token. ' +
        'Set a strong BRIDGE_TOKEN, or set BRIDGE_AUTH_ENABLED=false for local dev.'
      );
      process.exit(1);
    }

    // Connect to MongoDB — deux appels nécessaires : bridge/ et
    // modules/wp-builder/ ont chacun leur propre instance mongoose (deux
    // node_modules séparés), voir modules/wp-builder/backend/db/connection.js.
    await connectDB();
    await connectWpBuilderDB(config.mongodb.uri);

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
