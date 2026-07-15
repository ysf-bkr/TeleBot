import { FastifyInstance } from 'fastify';
import { getDb } from '../../db/index.js';
import { hasFeature } from '../../middleware/planLimits.js';
import schedulerService from './scheduler.service.js';

async function schedulerRouters(fastify: FastifyInstance): Promise<void> {
  // GET /api/scheduler
  fastify.get('/', async (request: any, reply: any) => {
    try {
      // Plan feature check
      if (request.workspace_id) {
        const hasScheduler = await hasFeature(request.workspace_id, 'scheduler');
        if (!hasScheduler) {
          reply.code(403);
          return { error: 'Plan Limit Aşıldı', message: 'Zamanlanmış mesaj özelliği Pro ve Enterprise planlarında mevcuttur.' };
        }
      }

      const posts = await schedulerService.getPosts(request.workspace_id);
      const mapped = posts.map((p: any) => ({
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
    // Plan feature check
    if (request.workspace_id) {
      const hasScheduler = await hasFeature(request.workspace_id, 'scheduler');
      if (!hasScheduler) {
        reply.code(403);
        return { error: 'Plan Limit Aşıldı', message: 'Zamanlanmış mesaj özelliği Pro ve Enterprise planlarında mevcuttur.' };
      }
    }

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
      }, request.workspace_id);
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
      let query = db.deleteFrom('scheduled_posts').where('id', '=', Number(id)) as any;
      if (request.workspace_id) {
        query = query.where('workspace_id', '=', request.workspace_id);
      }
      await query.execute();
      return { success: true };
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });
}

export default schedulerRouters;
