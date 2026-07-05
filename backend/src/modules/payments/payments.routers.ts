import { FastifyInstance } from 'fastify';
import subscriptionRepository from '../../repositories/subscription.repository.js';

async function paymentsRouters(fastify: FastifyInstance): Promise<void> {
  // GET /api/payments/subscriptions
  fastify.get('/subscriptions', async (request, reply) => {
    try {
      const subs = await subscriptionRepository.getAll();
      return subs;
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // POST /api/payments/subscriptions
  fastify.post('/subscriptions', async (request: any, reply) => {
    const { userId, chatId, plan, expiresAt } = request.body || {};
    if (!userId) {
      reply.code(400);
      return { error: 'Kullanıcı ID gereklidir' };
    }
    try {
      await subscriptionRepository.upsert({
        user_id: String(userId),
        chat_id: chatId ? String(chatId) : null,
        plan: plan || 'monthly',
        expires_at: expiresAt || null,
        status: 'active',
      });
      return { success: true };
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // DELETE /api/payments/subscriptions/:id
  fastify.delete('/subscriptions/:id', async (request: any, reply) => {
    const id = Number(request.params.id);
    if (isNaN(id)) {
      reply.code(400);
      return { error: 'Geçersiz ID' };
    }
    try {
      await subscriptionRepository.deleteById(id);
      return { success: true };
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });

  // POST /api/payments/stripe-webhook
  fastify.post('/stripe-webhook', async (request: any, reply) => {
    const { secret } = request.query || {};
    const configuredSecret = process.env.STRIPE_WEBHOOK_SECRET || 'super-secure-stripe-token-123';
    if (secret !== configuredSecret) {
      reply.code(401);
      return { error: 'Geçersiz webhook tokenı' };
    }
    const event = request.body || {};
    console.log('[PAY] Doğrulanmış Stripe olayı:', event.type);
    try {
      if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
        const session = event.data?.object || {};
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription;
        if (userId) {
          const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
          await subscriptionRepository.upsert({
            user_id: String(userId),
            plan: 'stripe_monthly',
            status: 'active',
            expires_at: expiresAt,
            stripe_id: String(subscriptionId || ''),
          });
          console.log(`[PAY] Kullanıcı ${userId} için Stripe aylık aboneliği tanımlandı.`);
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data?.object || {};
        const subscriptionId = subscription.id;
        const { getDb } = await import('../../db/index.js');
        const db = getDb();
        await db.updateTable('subscriptions')
          .set({ status: 'expired' })
          .where('stripe_id', '=', String(subscriptionId))
          .execute();
        console.log(`[PAY] Stripe ID'si ${subscriptionId} olan abonelik iptal edildi.`);
      }
      return { received: true };
    } catch (err: any) {
      console.error('[PAY] Stripe Webhook işlem hatası:', err.message);
      reply.code(500);
      return { error: err.message };
    }
  });
}

export default paymentsRouters;
