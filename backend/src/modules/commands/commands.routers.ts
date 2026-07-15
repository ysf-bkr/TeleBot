import { FastifyInstance } from 'fastify';
import { getDb } from '../../db/index.js';
import { hasFeature } from '../../middleware/planLimits.js';

export default async function commandsRouters(fastify: FastifyInstance) {
  // GET /api/commands
  fastify.get('/', async (request: any, reply) => {
    if (request.workspace_id) {
      const hasCmd = await hasFeature(request.workspace_id, 'custom_commands');
      if (!hasCmd) {
        reply.code(403);
        return { error: 'Plan Limit Aşıldı', message: 'Özel komutlar Pro ve Enterprise planlarında mevcuttur.' };
      }
    }
    const db = getDb();
    let query = db.selectFrom('custom_commands').selectAll() as any;
    if (request.workspace_id) query = query.where('workspace_id', '=', request.workspace_id);
    return query.execute();
  });

  // POST /api/commands
  fastify.post('/', async (request: any, reply) => {
    if (request.workspace_id) {
      const hasCmd = await hasFeature(request.workspace_id, 'custom_commands');
      if (!hasCmd) {
        reply.code(403);
        return { error: 'Plan Limit Aşıldı', message: 'Özel komutlar Pro ve Enterprise planlarında mevcuttur.' };
      }
    }
    const { command, response } = request.body || {};
    if (!command || !response) {
      reply.code(400);
      return { error: 'Komut ve yanıt alanları zorunludur.' };
    }
    const cleanCmd = command.trim().replace(/^\//, '').toLowerCase();
    const db = getDb();
    const existing = await db.selectFrom('custom_commands').selectAll().where('command', '=', cleanCmd).executeTakeFirst();
    if (existing) {
      reply.code(400);
      return { error: 'Bu komut zaten mevcut.' };
    }
    await db.insertInto('custom_commands').values({
      workspace_id: request.workspace_id || null,
      command: cleanCmd,
      response: response.trim(),
      created_at: new Date().toISOString()
    }).execute();
    return { success: true };
  });

  // DELETE /api/commands/:id
  fastify.delete('/:id', async (request: any, reply) => {
    const { id } = request.params;
    const db = getDb();
    let query = db.deleteFrom('custom_commands').where('id', '=', Number(id)) as any;
    if (request.workspace_id) query = query.where('workspace_id', '=', request.workspace_id);
    await query.execute();
    return { success: true };
  });

  // PATCH /api/commands/:id/toggle
  fastify.patch('/:id/toggle', async (request: any, reply) => {
    const { id } = request.params;
    const { isActive } = request.body || {};
    const db = getDb();
    let query = db.updateTable('custom_commands').set({ is_active: isActive ? 1 : 0 }).where('id', '=', Number(id)) as any;
    if (request.workspace_id) query = query.where('workspace_id', '=', request.workspace_id);
    await query.execute();
    return { success: true };
  });
}
