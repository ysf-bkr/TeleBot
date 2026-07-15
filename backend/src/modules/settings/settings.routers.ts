import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { getDb } from '../../db/index.js';
import { getStatus, restartBot } from '../../services/bot.service.js';

function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.resolve(process.cwd(), '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }
  const lines = content.split('\n');
  for (const [key, val] of Object.entries(updates)) {
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${key}=`) || lines[i].startsWith(`# ${key}=`) || lines[i].startsWith(`#${key}=`)) {
        lines[i] = `${key}="${val.replace(/"/g, '\\"')}"`;
        found = true;
        break;
      }
    }
    if (!found) {
      lines.push(`${key}="${val.replace(/"/g, '\\"')}"`);
    }
  }
  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
  for (const [key, val] of Object.entries(updates)) {
    process.env[key] = val;
  }
}

function mapConfig(dbRow: any) {
  if (!dbRow) return null;
  return {
    id: dbRow.id,
    welcomeMessage: dbRow.welcome_message,
    welcomeEnabled: dbRow.welcome_enabled === 1,
    parseMode: dbRow.parse_mode,
    webhookDomain: dbRow.webhook_domain,
    token: dbRow.token,
    settings: dbRow.settings ? JSON.parse(dbRow.settings) : null,
  };
}

async function settingsRouters(fastify: FastifyInstance): Promise<void> {
  // GET /api/settings
  fastify.get('/', async (request: any, reply: any) => {
    const db = getDb();
    const wsId = request.workspace_id;

    let config = await db.selectFrom('bot_config')
      .selectAll()
      .where('workspace_id', '=', wsId || 0)
      .executeTakeFirst();

    if (!config) {
      const now = new Date().toISOString();
      await db.insertInto('bot_config')
        .values({
          workspace_id: wsId || null,
          welcome_message: '👋 Hoş geldin {first_name}!\nGrubumuza katıldığın için teşekkürler.\n\n{group_title}',
          welcome_enabled: 1,
          parse_mode: 'HTML',
          webhook_domain: null,
          token: process.env.TELEGRAM_BOT_TOKEN || null,
          created_at: now,
          updated_at: now,
        })
        .execute();
      config = await db.selectFrom('bot_config').selectAll().where('workspace_id', '=', wsId || 0).executeTakeFirst();
    }

    return mapConfig(config);
  });

  // PATCH /api/settings
  fastify.patch('/', async (request: any, reply: any) => {
    const db = getDb();
    const wsId = request.workspace_id;
    const body = request.body || {};

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.welcomeMessage !== undefined) updateData.welcome_message = body.welcomeMessage;
    if (body.welcomeEnabled !== undefined) updateData.welcome_enabled = body.welcomeEnabled ? 1 : 0;
    if (body.parseMode !== undefined) updateData.parse_mode = body.parseMode;
    if (body.webhookDomain !== undefined) updateData.webhook_domain = body.webhookDomain;
    if (body.settings !== undefined) updateData.settings = typeof body.settings === 'object' ? JSON.stringify(body.settings) : body.settings;

    const current = await db.selectFrom('bot_config')
      .select('id')
      .where('workspace_id', '=', wsId || 0)
      .executeTakeFirst();

    if (!current) {
      reply.code(400);
      return { error: 'Yapılandırma bulunamadı, önce GET çağırın.' };
    }

    await db.updateTable('bot_config')
      .set(updateData)
      .where('id', '=', current.id)
      .execute();

    const updated = await db.selectFrom('bot_config').selectAll().where('id', '=', current.id).executeTakeFirst();
    return mapConfig(updated);
  });

  // POST /api/settings/token
  fastify.post('/token', async (request: any, reply: any) => {
    const db = getDb();
    const wsId = request.workspace_id;
    const { token } = request.body || {};
    if (!token) {
      reply.code(400);
      return { error: 'Token gereklidir' };
    }

    const current = await db.selectFrom('bot_config')
      .select('id')
      .where('workspace_id', '=', wsId || 0)
      .executeTakeFirst();

    if (!current) {
      reply.code(400);
      return { error: 'Yapılandırma bulunamadı' };
    }

    await db.updateTable('bot_config')
      .set({ token, updated_at: new Date().toISOString() })
      .where('id', '=', current.id)
      .execute();

    try {
      await restartBot(token);
      return { success: true };
    } catch (err: any) {
      reply.code(500);
      return { error: `Bot başlatılamadı: ${err.message}` };
    }
  });

  // POST /api/settings/restart
  fastify.post('/restart', async (request: any, reply: any) => {
    const db = getDb();
    const wsId = request.workspace_id;
    const current = await db.selectFrom('bot_config')
      .select('token')
      .where('workspace_id', '=', wsId || 0)
      .executeTakeFirst();

    if (!current || !current.token) {
      reply.code(400);
      return { error: 'Aktif bir bot tokenı yok' };
    }

    try {
      await restartBot(current.token);
      return { success: true };
    } catch (err: any) {
      reply.code(500);
      return { error: `Yeniden başlatma başarısız: ${err.message}` };
    }
  });

  // POST /api/settings/profile
  fastify.post('/profile', async (request: any, reply: any) => {
    const { name, description } = request.body || {};
    const db = getDb();
    const wsId = request.workspace_id;
    const current = await db.selectFrom('bot_config')
      .select('token')
      .where('workspace_id', '=', wsId || 0)
      .executeTakeFirst();

    if (!current || !current.token) {
      reply.code(400);
      return { error: 'Aktif bir bot tokenı yok' };
    }

    try {
      const botServiceMod = await import('../../services/bot.service.js');
      const updateBotProfile = (botServiceMod.default || botServiceMod).updateBotProfile;
      await updateBotProfile(current.token, name, description);
      return { success: true };
    } catch (err: any) {
      reply.code(500);
      return { error: `Telegram güncelleme hatası: ${err.message}` };
    }
  });

  // POST /api/settings/broadcast
  fastify.post('/broadcast', async (request: any, reply: any) => {
    const { text } = request.body || {};
    if (!text) {
      reply.code(400);
      return { error: 'Mesaj metni zorunludur.' };
    }

    try {
      const db = getDb();
      const wsId = request.workspace_id;
      const activeChats = await db.selectFrom('chats')
        .select(['chat_id', 'title'])
        .where('is_enabled', '=', 1)
        .where('workspace_id', '=', wsId || 0)
        .execute();

      const botServiceMod = await import('../../services/bot.service.js');
      const bot = (botServiceMod.default || botServiceMod).getBotInstance();

      if (!bot) {
        reply.code(400);
        return { error: 'Aktif bot bağlantısı bulunamadı.' };
      }

      let successCount = 0;
      let failCount = 0;

      await Promise.all(
        activeChats.map(async (chat) => {
          try {
            await bot.telegram.sendMessage(chat.chat_id, text, { parse_mode: 'HTML' });
            successCount++;
          } catch (_) {
            failCount++;
          }
        })
      );

      return { success: true, successCount, failCount };
    } catch (err: any) {
      reply.code(500);
      return { error: `Duyuru gönderilemedi: ${err.message}` };
    }
  });

  // GET /api/settings/bot-info
  fastify.get('/bot-info', async (request: any, reply: any) => {
    const db = getDb();
    const wsId = request.workspace_id;
    const current = await db.selectFrom('bot_config')
      .select('token')
      .where('workspace_id', '=', wsId || 0)
      .executeTakeFirst();

    if (!current || !current.token) {
      return { connected: false, lastError: 'Token tanımlanmamış' };
    }
    const status = getStatus(current.token);
    return status;
  });
}

export default settingsRouters;
