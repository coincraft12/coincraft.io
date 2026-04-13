import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { redis } from '../lib/redis';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    const checks: Record<string, string> = {};
    try { await db.execute(sql`SELECT 1`); checks.database = 'ok'; }
    catch { checks.database = 'error'; }
    try { await redis.ping(); checks.redis = 'ok'; }
    catch { checks.redis = 'error'; }
    const allOk = Object.values(checks).every(v => v === 'ok');
    return reply.status(allOk ? 200 : 503).send({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });
  });
}
