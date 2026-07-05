import { FastifyReply, FastifyRequest } from 'fastify';
import auditService from './audit.service.js';

async function getRecentLogs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const limit = (request.query as { limit?: string }).limit ? parseInt((request.query as { limit?: string }).limit!) : 50;
    const logs = await auditService.getLogs(limit);
    return logs;
  } catch (error) {
    reply.code(500);
    return { error: 'Failed to fetch audit logs' };
  }
}

export { getRecentLogs };
