import { FastifyInstance } from 'fastify';
import { getDb } from '../../db/index.js';

export default async function commandsRouters(fastify: FastifyInstance) {
  // GET /api/commands
  fastify.get('/', async (request, reply) => {
    const db = getDb();
    return db.selectFrom('custom_commands').selectAll().execute();
  });

  // POST /api/commands
  fastify.post('/', async (request: any, reply) => {
    const { command, response } = request.body || {};
    if (!command || !response) {
      reply.code(400);
      return { error: 'Komut ve yanıt alanları zorunludur.' };
    }

    const cleanCmd = command.trim().replace(/^\//, '').toLowerCase();
    const db = getDb();

    // Check if duplicate
    const existing = await db.selectFrom('custom_commands').selectAll().where('command', '=', cleanCmd).executeTakeFirst();
    if (existing) {
      reply.code(400);
      return { error: 'Bu komut zaten mevcut.' };
    }

    await db.insertInto('custom_commands')
      .values({
        command: cleanCmd,
        response: response.trim(),
        created_at: new Date().toISOString()
      })
      .execute();

    return { success: true };
  });

  // DELETE /api/commands/:id
  fastify.delete('/:id', async (request: any, reply) => {
    const { id } = request.params;
    const db = getDb();
    await db.deleteFrom('custom_commands').where('id', '=', Number(id)).execute();
    return { success: true };
  });

  // PATCH /api/commands/:id/toggle
  fastify.patch('/:id/toggle', async (request: any, reply) => {
    const { id } = request.params;
    const { isActive } = request.body || {};
    const db = getDb();
    
    await db.updateTable('custom_commands')
      .set({ is_active: isActive ? 1 : 0 })
      .where('id', '=', Number(id))
      .execute();
      
    return { success: true };
  });
}
