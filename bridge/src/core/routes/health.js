import { getStats } from '../queue/job-queue.js';

/**
 * Health check route
 */
export default async function healthRoutes(fastify) {
  fastify.get('/health', async () => {
    const queueStats = getStats();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      queue: queueStats,
      engines: ['codex', 'claude'],
    };
  });
}
