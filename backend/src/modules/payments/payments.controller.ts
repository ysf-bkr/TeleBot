import { FastifyReply, FastifyRequest } from 'fastify';
import paymentsService from './payments.service.js';

async function handleStripeWebhook(request: FastifyRequest, reply: FastifyReply) {
  const event = request.body as any;
  console.log('[PAY] Stripe event', event.type);
  return { received: true };
}

async function handleTelegramStars(request: FastifyRequest, reply: FastifyReply) {
  return { ok: true };
}

async function getSubscriptions(request: FastifyRequest, reply: FastifyReply) {
  try {
    return await paymentsService.listSubscriptions();
  } catch (err: any) {
    reply.code(500);
    return { error: 'Failed to fetch subscriptions' };
  }
}

async function createSubscription(request: FastifyRequest, reply: FastifyReply) {
  try {
    return await paymentsService.createSubscription(request.body as any);
  } catch (err: any) {
    reply.code(500);
    return { error: err.message || 'Failed to create subscription' };
  }
}

async function deleteSubscription(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    await paymentsService.deleteSubscription(parseInt(id));
    return { ok: true };
  } catch (err: any) {
    reply.code(500);
    return { error: 'Failed to delete subscription' };
  }
}

export { createSubscription, deleteSubscription, getSubscriptions, handleStripeWebhook, handleTelegramStars };
