import { FastifyInstance } from 'fastify';
import { getDb } from '../../db/index.js';
import { hasFeature } from '../../middleware/planLimits.js';

async function analyticsRouters(fastify: FastifyInstance): Promise<void> {
  // GET /api/analytics/metrics/:chatId
  fastify.get('/metrics/:chatId', async (request: any, reply: any) => {
    // Plan feature check
    if (request.workspace_id) {
      const hasAnalytics = await hasFeature(request.workspace_id, 'analytics');
      if (!hasAnalytics) {
        reply.code(403);
        return { error: 'Plan Limit Aşıldı', message: 'Analitik özelliği Pro ve Enterprise planlarında mevcuttur.' };
      }
    }

    const { chatId } = request.params;
    const days = Number(request.query.days) || 7;
    const db = getDb();
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    const dateLimitStr = dateLimit.toISOString();

    try {
      const chat = await db.selectFrom('chats')
        .select(['member_count', 'title'])
        .where('chat_id', '=', String(chatId))
        .executeTakeFirst();

      const joins = await db.selectFrom('logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('event_type', '=', 'join')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      const messages = await db.selectFrom('logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('event_type', '=', 'message')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      const totalMods = await db.selectFrom('moderation_logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      const warns = await db.selectFrom('moderation_logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('action', '=', 'warn')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      const mutes = await db.selectFrom('moderation_logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('action', '=', 'mute')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      const bans = await db.selectFrom('moderation_logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('action', '=', 'ban')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      return {
        metrics: {
          grup_adi: chat?.title || 'Bilinmeyen',
          toplam_uye: Number(chat?.member_count || 0),
          yeni_katilimlar: Number(joins?.count || 0),
          toplam_mesajlar: Number(messages?.count || 0),
          toplam_moderasyon_eylemi: Number(totalMods?.count || 0),
          uyarilar: Number(warns?.count || 0),
          susturmalar: Number(mutes?.count || 0),
          yasaklamalar: Number(bans?.count || 0),
        }
      };
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });
}

export default analyticsRouters;
