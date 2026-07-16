import { FastifyReply, FastifyRequest } from 'fastify';
import { getDb } from '../../db/index.js';
import moderationService from './moderation.service.js';

async function getSettings(request: FastifyRequest<{ Params: { chatId: string } }>, reply: FastifyReply) {
  try {
    const settings = await moderationService.getOrCreateSettings(request.params.chatId, request.workspace_id);
    const blacklist = await moderationService.getBlacklistWords(request.params.chatId);
    return { settings, blacklist };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function updateSettings(request: FastifyRequest<{ Params: { chatId: string }; Body: any }>, reply: FastifyReply) {
  try {
    await moderationService.updateSettings(request.params.chatId, request.body as any);
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function addBlacklist(request: FastifyRequest<{ Params: { chatId: string }; Body: { word: string } }>, reply: FastifyReply) {
  try {
    await moderationService.addBlacklistWord(request.params.chatId, request.body.word);
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function removeBlacklist(request: FastifyRequest<{ Params: { chatId: string; id: string } }>, reply: FastifyReply) {
  try {
    await moderationService.removeBlacklistWord(Number(request.params.id), request.params.chatId);
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function getLogs(request: FastifyRequest<{ Params: { chatId: string } }>, _reply: FastifyReply) {
  const { limit } = request.query as any;
  return moderationService.getLogs(request.params.chatId, Number(limit) || 30);
}

// === CAPTCHA ===
async function getCaptchaSessions(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const db = getDb();
    let query = (db as any).selectFrom('captcha_sessions').selectAll().where('chat_id', '=', chatId).orderBy('expires_at', 'desc').limit(50);
    if (request.workspace_id) query = query.where('workspace_id', '=', request.workspace_id);
    const sessions = await query.execute();
    return sessions;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function verifyCaptchaManually(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const db = getDb();
    await (db as any).updateTable('captcha_sessions').set({ verified: 1 }).where('id', '=', Number(id)).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// === RBAC - Kullanıcı Rolleri (workspace bazlı) ===
async function getUsers(request: FastifyRequest, reply: FastifyReply) {
  try {
    const db = getDb();
    let query = (db as any).selectFrom('panel_users').selectAll();
    if (request.workspace_id) {
      query = query.where('workspace_id', '=', request.workspace_id);
    }
    const users = await query.execute();
    return users;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function updateUserRole(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const { role } = request.body as { role: string };
    const db = getDb();
    let query = (db as any).updateTable('panel_users').set({ role: role || 'user' }).where('id', '=', Number(id));
    if (request.workspace_id) {
      query = query.where('workspace_id', '=', request.workspace_id);
    }
    await query.execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function createUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { username, password, role } = request.body as { username: string; password: string; role?: string };
    if (!username || !password) {
      reply.code(400);
      return { error: 'Kullanıcı adı ve şifre zorunludur' };
    }
    const bcrypt = await import('bcryptjs');
    const passwordHash = bcrypt.hashSync(password, 10);
    const db = getDb();
    const existing = await (db as any).selectFrom('panel_users').selectAll().where('username', '=', username.trim().toLowerCase()).executeTakeFirst();
    if (existing) {
      reply.code(409);
      return { error: 'Bu kullanıcı adı zaten kayıtlı' };
    }
    await (db as any).insertInto('panel_users').values({
      workspace_id: request.workspace_id || null,
      username: username.trim().toLowerCase(),
      password_hash: passwordHash,
      role: role || 'user',
      created_at: new Date().toISOString(),
    }).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const db = getDb();
    let query = (db as any).deleteFrom('panel_users').where('id', '=', Number(id));
    if (request.workspace_id) {
      query = query.where('workspace_id', '=', request.workspace_id);
    }
    await query.execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// === Global Blacklist ===
async function getGlobalBlacklist(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const db = getDb();
    const list = await (db as any).selectFrom('global_blacklist').selectAll().orderBy('added_at', 'desc').execute();
    return list;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function addGlobalBlacklist(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, reason } = request.body as { userId: string; reason?: string };
    if (!userId) { reply.code(400); return { error: 'Kullanıcı ID zorunludur' }; }
    const db = getDb();
    await (db as any).insertInto('global_blacklist').values({ user_id: String(userId), reason: reason || 'Panelden eklendi', added_at: new Date().toISOString() }).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function removeGlobalBlacklist(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const db = getDb();
    await (db as any).deleteFrom('global_blacklist').where('id', '=', Number(id)).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// === Kullanıcı Profil Kartı ===
async function getUserProfile(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.params as { userId: string };
    const db = getDb();
    const logs = await (db as any).selectFrom('logs').selectAll().where('user_id', '=', String(userId)).orderBy('timestamp', 'desc').limit(50).execute();
    const modLogs = await (db as any).selectFrom('moderation_logs').selectAll().where('user_id', '=', String(userId)).orderBy('timestamp', 'desc').limit(20).execute();
    const blacklisted = await (db as any).selectFrom('global_blacklist').selectAll().where('user_id', '=', String(userId)).executeTakeFirst();

    return {
      userId,
      totalMessages: logs.filter((l: any) => l.event_type === 'message').length,
      totalJoins: logs.filter((l: any) => l.event_type === 'join').length,
      lastSeen: logs[0]?.timestamp || null,
      recentLogs: logs.slice(0, 20),
      moderationHistory: modLogs,
      isGloballyBlacklisted: !!blacklisted,
      blacklistReason: blacklisted?.reason || null,
    };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// === Webhook Test ===
async function testWebhook(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { url } = request.body as { url: string };
    if (!url) { reply.code(400); return { error: 'URL zorunludur' }; }
    const start = Date.now();
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }) });
    const duration = Date.now() - start;
    const text = await response.text();
    return { success: response.ok, statusCode: response.status, duration: `${duration}ms`, response: text.substring(0, 200) };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message, success: false };
  }
}

export {
  addBlacklist, addGlobalBlacklist, createUser, deleteUser, getCaptchaSessions, getGlobalBlacklist, getLogs, getSettings, getUserProfile, getUsers, removeBlacklist, removeGlobalBlacklist, testWebhook, updateSettings, updateUserRole, verifyCaptchaManually
};
