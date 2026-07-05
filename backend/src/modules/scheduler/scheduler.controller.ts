import { FastifyReply, FastifyRequest } from 'fastify';
import schedulerService from './scheduler.service.js';

async function getPosts(request: FastifyRequest, reply: FastifyReply) {
  try {
    const posts = await schedulerService.getPosts();
    return posts;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function createPost(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId, content, scheduledAt, parseMode, autoDeleteAfter, buttons } = request.body as any;
    const created = await schedulerService.createPost({
      chatId,
      content,
      scheduledAt,
      parseMode,
      autoDeleteAfter,
      buttons,
    });
    if ((request as any).io) {
      (request as any).io.emit('scheduler_updated', created);
    }
    return created;
  } catch (err: any) {
    reply.code(400);
    return { error: err.message };
  }
}

async function deletePost(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const db = (await import('../../db/index.js')).getDb();
    await db.deleteFrom('scheduled_posts').where('id', '=', Number(id)).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function updatePost(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status?: string };
    const db = (await import('../../db/index.js')).getDb();
    await db.updateTable('scheduled_posts')
      .set({ status: status || 'cancelled' })
      .where('id', '=', Number(id))
      .execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export { createPost, deletePost, getPosts, updatePost };
