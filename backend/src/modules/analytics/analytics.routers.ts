import { FastifyInstance } from 'fastify';
import { getDb } from '../../db/index.js';

async function analyticsRouters(fastify: FastifyInstance): Promise<void> {
  // GET /api/analytics/metrics/:chatId
  fastify.get('/metrics/:chatId', async (request: any, reply: any) => {
    const { chatId } = request.params;
    const days = Number(request.query.days) || 7;
    const db = getDb();
    
    // Calculate the start date
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    const dateLimitStr = dateLimit.toISOString();

    try {
      // 1. Get group info
      const chat = await db.selectFrom('chats')
        .select(['member_count', 'title'])
        .where('chat_id', '=', String(chatId))
        .executeTakeFirst();

      // 2. Count new members joined
      const joins = await db.selectFrom('logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('event_type', '=', 'join')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      // 3. Count messages sent (if tracked)
      const messages = await db.selectFrom('logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('event_type', '=', 'message')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      // 4. Count total moderation actions
      const totalMods = await db.selectFrom('moderation_logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      // 5. Count warnings
      const warns = await db.selectFrom('moderation_logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('action', '=', 'warn')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      // 6. Count mutes
      const mutes = await db.selectFrom('moderation_logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('action', '=', 'mute')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      // 7. Count bans
      const bans = await db.selectFrom('moderation_logs')
        .select(db.fn.count('id').as('count'))
        .where('chat_id', '=', String(chatId))
        .where('action', '=', 'ban')
        .where('timestamp', '>=', dateLimitStr)
        .executeTakeFirst();

      const metrics = {
        grup_adi: chat?.title || 'Bilinmeyen',
        toplam_uye: Number(chat?.member_count || 0),
        yeni_katilimlar: Number(joins?.count || 0),
        toplam_mesajlar: Number(messages?.count || 0),
        toplam_moderasyon_eylemi: Number(totalMods?.count || 0),
        uyarilar: Number(warns?.count || 0),
        susturmalar: Number(mutes?.count || 0),
        yasaklamalar: Number(bans?.count || 0),
      };

      return { metrics };
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });
}

export default analyticsRouters;
