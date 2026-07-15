import { FastifyReply, FastifyRequest } from 'fastify';
import logService from './log.service.js';

async function listLogs(request: FastifyRequest, _reply: FastifyReply) {
  const { limit, olderThanDays } = request.query as any;
  return logService.getAllLogs(Number(limit) || 40, request.workspace_id);
}

async function cleanupLogs(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { olderThanDays } = request.body as any;
    await logService.cleanupOldLogs(Number(olderThanDays) || 30, request.workspace_id);
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export { cleanupLogs, listLogs };
