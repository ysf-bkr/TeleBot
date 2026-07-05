import { FastifyReply, FastifyRequest } from 'fastify';
import analyticsService from './analytics.service.js';

async function getMetrics(request: FastifyRequest, reply: FastifyReply): Promise<{ metrics: { event_type: string; count: number }[] } | { error: string }> {
  try {
    const { chatId } = request.params as { chatId: string };
    const { days = 7 } = request.query as { days?: number };
    const metrics = await analyticsService.getMetrics(chatId, days);
    return { metrics };
  } catch (e) {
    reply.code(500);
    return { error: 'Failed' };
  }
}

export { getMetrics };
