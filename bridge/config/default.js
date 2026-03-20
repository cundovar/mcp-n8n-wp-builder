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
    token: process.env.BRIDGE_TOKEN || 'dev-token-change-me',
    enabled: process.env.BRIDGE_AUTH_ENABLED === 'true', // Désactivé par défaut
  },

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
