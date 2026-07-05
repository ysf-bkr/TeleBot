import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getBotInstance } from '../services/bot.service.js';

interface WebhookParams {
  botToken: string;
}

/**
 * Fastify Webhook Handler - High Throughput Multi-Bot
 */
async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Params: WebhookParams }>('/:botToken', async (request: FastifyRequest<{ Params: WebhookParams }>, reply: FastifyReply) => {
    const { botToken } = request.params;
    const update = request.body as any;

    try {
      const bot = getBotInstance(botToken);

      if (bot) {
        // Pass update directly to Telegraf (no polling)
        await bot.handleUpdate(update);
      } else {
        fastify.log.warn(`No bot instance for token: ${botToken.slice(0, 10)}...`);
      }

      reply.code(200).send({ ok: true });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ ok: false });
    }
  });
}

export default webhookRoutes;
