import { FastifyInstance } from 'fastify';
import schedulerService from './scheduler.service.js';
import { getDb } from '../../db/index.js';

async function schedulerRouters(fastify: FastifyInstance): Promise<void> {
  // GET /api/scheduler
  fastify.get('/', async (request: any, reply: any) => {
    try {
      const posts = await schedulerService.getPosts();
      
      const mapped = posts.map(p => ({
        id: p.id,
        chat_id: p.chat_id,
        chatId: p.chat_id,
        content: p.content,
        parseMode: p.parse_mode,
        buttons: p.buttons,
        scheduledAt: p.scheduled_at,
        autoDeleteAfter: p.auto_delete_after,
        status: p.status,
        messageId: p.message_id,
        created_at: p.created_at,
      }));
      
      return mapped;
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // POST /api/scheduler
  fastify.post('/', async (request: any, reply: any) => {
    const { chatId, content, scheduledAt, parseMode, autoDeleteAfter, buttons } = request.body || {};
    if (!chatId || !content || !scheduledAt) {
      reply.code(400);
      return { error: 'Grup ID, içerik ve zamanlama tarihi zorunludur' };
    }

    try {
      await schedulerService.createPost({
        chatId,
        content,
        scheduledAt,
        parseMode,
        autoDeleteAfter: autoDeleteAfter ? Number(autoDeleteAfter) : null,
        buttons,
      });
      return { success: true };
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // DELETE /api/scheduler/:id
  fastify.delete('/:id', async (request: any, reply: any) => {
    const { id } = request.params;
    const db = getDb();
    try {
      await db.deleteFrom('scheduled_posts')
        .where('id', '=', Number(id))
        .execute();
      return { success: true };
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });
}

export default schedulerRouters;
