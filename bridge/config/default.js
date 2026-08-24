// Token de dev volontairement inutilisable en prod : le serveur refuse de
// démarrer avec cette valeur quand l'auth est active (voir src/server.js).
export const DEFAULT_DEV_TOKEN = 'dev-token-change-me';

export default {
  server: {
    host: process.env.BRIDGE_HOST || '0.0.0.0', // 0.0.0.0 pour accès Docker
    port: parseInt(process.env.BRIDGE_PORT || '3000', 10),
    publicBaseUrl: process.env.BRIDGE_PUBLIC_BASE_URL || `http://localhost:${parseInt(process.env.BRIDGE_PORT || '3000', 10)}`,
    internalBaseUrl:
      process.env.BRIDGE_INTERNAL_BASE_URL ||
      process.env.BRIDGE_PUBLIC_BASE_URL ||
      `http://localhost:${parseInt(process.env.BRIDGE_PORT || '3000', 10)}`,
  },

  auth: {
    token: process.env.BRIDGE_TOKEN || DEFAULT_DEV_TOKEN,
    // Activée sauf opt-out explicite : un .env de prod incomplet ne doit pas
    // laisser l'exécution de codex/claude ouverte sans token.
    enabled: process.env.BRIDGE_AUTH_ENABLED !== 'false',
  },

  // Racine unique sous laquelle les tâches IA ont le droit de s'exécuter.
  // Tout cwd reçu par l'API y est confiné (voir src/core/services/executor.js).
  workspaceRoot: process.env.WORKSPACE_ROOT || process.cwd(),

  engines: {
    codex: {
      command: process.env.CODEX_CMD || 'codex',
      defaultTimeout: 120000,
    },
    claude: {
      command: process.env.CLAUDE_CMD || 'claude',
      defaultTimeout: 120000,
    },
  },

  limits: {
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),
    maxInputSize: parseInt(process.env.MAX_INPUT_SIZE || '100000', 10),
    maxOutputSize: parseInt(process.env.MAX_OUTPUT_SIZE || '500000', 10),
  },

  timeouts: {
    default: 120000,
    max: 600000,
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wp-builder',
  },

  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/wp-site-builder',
  },
};
