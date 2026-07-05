import { FastifyReply, FastifyRequest } from 'fastify';
import { getDb } from '../../db/index.js';

// Tip güvenliği bypass - Kysely Database tipi henüz güncellenmedi
const db = () => getDb() as any;

// Yardımcı: Bot instance'ını al
async function getBot() {
  const botServiceMod = await import('../../services/bot.service.js');
  const bot = (botServiceMod.default || botServiceMod).getBotInstance();
  return bot;
}

// 1. Grup Chat Geçmişi (Son 50 mesaj)
export async function getChatMessages(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const limit = Number((request.query as any)?.limit) || 50;
    const d: any = getDb();
    const messages = await d.selectFrom('logs')
      .selectAll()
      .where('chat_id', '=', chatId)
      .where('event_type', '=', 'message')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .execute();
    return messages;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 2. Kullanıcı Listesi
export async function getChatMembers(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const bot = await getBot();
    if (!bot) { reply.code(400); return { error: 'Bot aktif değil' }; }

    let allMembers: any[] = [];
    let offset = 0;
    const limit = 200;

    while (true) {
      const members = await bot.telegram.getChatAdministrators(chatId);
      allMembers = members;
      break;
    }

    // Normal üyeleri al (süpergruplarda kısıtlı)
    try {
      const count = await bot.telegram.getChatMembersCount(chatId);
      return { members: allMembers, total_count: count };
    } catch (_) {
      return { members: allMembers, total_count: allMembers.length };
    }
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 3. Yöneticiler
export async function getChatAdmins(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const bot = await getBot();
    if (!bot) { reply.code(400); return { error: 'Bot aktif değil' }; }

    const admins = await bot.telegram.getChatAdministrators(chatId);
    return admins;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function setChatAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const { userId, isAdmin } = request.body as { userId: string; isAdmin: boolean };
    const bot = await getBot();
    if (!bot) { reply.code(400); return { error: 'Bot aktif değil' }; }

    if (isAdmin) {
      await bot.telegram.promoteChatMember(chatId, Number(userId), {
        can_change_info: true,
        can_delete_messages: true,
        can_invite_users: true,
        can_restrict_members: true,
        can_pin_messages: true,
        can_promote_members: false,
      });
    }
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function removeChatAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId, userId } = request.params as { chatId: string; userId: string };
    const bot = await getBot();
    if (!bot) { reply.code(400); return { error: 'Bot aktif değil' }; }

    await bot.telegram.promoteChatMember(chatId, Number(userId), {
      can_change_info: false,
      can_delete_messages: false,
      can_invite_users: false,
      can_restrict_members: false,
      can_pin_messages: false,
      can_promote_members: false,
    });
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 4. Otomatik Yanıtlayıcı
export async function getAutoReplies(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const db = getDb();
    const replies = await db.selectFrom('auto_replies')
      .selectAll()
      .where('chat_id', '=', chatId)
      .execute();
    return replies;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function createAutoReply(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const { trigger, response, matchType } = request.body as any;
    if (!trigger || !response) { reply.code(400); return { error: 'Tetikleyici ve yanıt zorunludur' }; }

    const db = getDb();
    await db.insertInto('auto_replies').values({
      chat_id: chatId,
      trigger,
      response,
      match_type: matchType || 'contains',
      created_at: new Date().toISOString(),
    }).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function deleteAutoReply(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { replyId } = request.params as { replyId: string };
    const db = getDb();
    await db.deleteFrom('auto_replies').where('id', '=', Number(replyId)).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 5. Silinen/Düzenlenen Mesajlar
export async function getDeletedMessages(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const limit = Number((request.query as any)?.limit) || 30;
    const db = getDb();
    const messages = await db.selectFrom('deleted_messages')
      .selectAll()
      .where('chat_id', '=', chatId)
      .orderBy('deleted_at', 'desc')
      .limit(limit)
      .execute();
    return messages;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function getEditedMessages(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const limit = Number((request.query as any)?.limit) || 30;
    const db = getDb();
    const messages = await db.selectFrom('edited_messages')
      .selectAll()
      .where('chat_id', '=', chatId)
      .orderBy('edited_at', 'desc')
      .limit(limit)
      .execute();
    return messages;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 6. Grup Şablonları
export async function getChatTemplates(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const db = getDb();
    const templates = await db.selectFrom('chat_templates').selectAll().execute();
    return templates;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function createChatTemplate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, settings } = request.body as { name: string; settings: any };
    if (!name) { reply.code(400); return { error: 'Şablon adı zorunludur' }; }

    const db = getDb();
    await db.insertInto('chat_templates').values({
      name,
      settings: JSON.stringify(settings || {}),
      created_at: new Date().toISOString(),
    }).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function applyChatTemplate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId, templateId } = request.params as { chatId: string; templateId: string };
    const db = getDb();
    const template = await db.selectFrom('chat_templates').selectAll().where('id', '=', Number(templateId)).executeTakeFirst();
    if (!template) { reply.code(404); return { error: 'Şablon bulunamadı' }; }

    const settings = JSON.parse(template.settings);

    // Moderation ayarlarını uygula
    if (settings.moderation) {
      const existing = await db.selectFrom('moderation_settings').selectAll().where('chat_id', '=', chatId).executeTakeFirst();
      if (existing) {
        await db.updateTable('moderation_settings').set({ ...settings.moderation, updated_at: new Date().toISOString() }).where('chat_id', '=', chatId).execute();
      } else {
        await db.insertInto('moderation_settings').values({ chat_id: chatId, ...settings.moderation, updated_at: new Date().toISOString() }).execute();
      }
    }

    return { success: true, applied: settings };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function deleteChatTemplate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { templateId } = request.params as { templateId: string };
    const db = getDb();
    await db.deleteFrom('chat_templates').where('id', '=', Number(templateId)).execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 7. Export/Import
export async function exportChatSettings(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const db = getDb();

    const chat = await db.selectFrom('chats').selectAll().where('chat_id', '=', chatId).executeTakeFirst();
    const moderation = await db.selectFrom('moderation_settings').selectAll().where('chat_id', '=', chatId).executeTakeFirst();
    const blacklist = await db.selectFrom('blacklist_words').selectAll().where('chat_id', '=', chatId).execute();
    const autoReplies = await db.selectFrom('auto_replies').selectAll().where('chat_id', '=', chatId).execute();

    return {
      exportDate: new Date().toISOString(),
      chat,
      moderation,
      blacklist: blacklist.map(b => ({ word: b.word })),
      autoReplies: autoReplies.map(a => ({ trigger: a.trigger, response: a.response, match_type: a.match_type })),
    };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export async function importChatSettings(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const data = request.body as any;
    const db = getDb();

    // Moderation ayarlarını içe aktar
    if (data.moderation) {
      const existing = await db.selectFrom('moderation_settings').selectAll().where('chat_id', '=', chatId).executeTakeFirst();
      const modData = { ...data.moderation, updated_at: new Date().toISOString() };
      if (existing) {
        await db.updateTable('moderation_settings').set(modData).where('chat_id', '=', chatId).execute();
      } else {
        await db.insertInto('moderation_settings').values({ chat_id: chatId, ...modData }).execute();
      }
    }

    // Kara listeyi içe aktar
    if (data.blacklist && Array.isArray(data.blacklist)) {
      for (const item of data.blacklist) {
        const existing = await db.selectFrom('blacklist_words').selectAll().where('chat_id', '=', chatId).where('word', '=', item.word).executeTakeFirst();
        if (!existing) {
          await db.insertInto('blacklist_words').values({ chat_id: chatId, word: item.word, created_at: new Date().toISOString() }).execute();
        }
      }
    }

    // Auto-reply'leri içe aktar
    if (data.autoReplies && Array.isArray(data.autoReplies)) {
      for (const item of data.autoReplies) {
        await db.insertInto('auto_replies').values({
          chat_id: chatId,
          trigger: item.trigger,
          response: item.response,
          match_type: item.match_type || 'contains',
          created_at: new Date().toISOString(),
        }).execute();
      }
    }

    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 8. Gruptan Ayrılma
export async function leaveChat(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const bot = await getBot();
    if (!bot) { reply.code(400); return { error: 'Bot aktif değil' }; }

    await bot.telegram.leaveChat(chatId);

    // DB'den sil
    const db = getDb();
    await db.deleteFrom('chats').where('chat_id', '=', chatId).execute();

    return { success: true, message: 'Gruptan ayrıldı ve listeden silindi' };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 9. Toplu Mesaj Gönderimi
export async function broadcastMessage(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { text, parseMode, chatIds } = request.body as { text: string; parseMode?: string; chatIds?: string[] };
    if (!text) { reply.code(400); return { error: 'Mesaj içeriği zorunludur' }; }

    const bot = await getBot();
    if (!bot) { reply.code(400); return { error: 'Bot aktif değil' }; }

    const db = getDb();
    let targetChats: { chat_id: string }[];

    if (chatIds && chatIds.length > 0) {
      targetChats = chatIds.map(id => ({ chat_id: id }));
    } else {
      targetChats = await db.selectFrom('chats').select(['chat_id']).where('is_enabled', '=', 1).execute() as any;
    }

    const options: any = {};
    if (parseMode === 'Markdown') options.parse_mode = 'MarkdownV2';
    else if (parseMode === 'HTML') options.parse_mode = 'HTML';

    const results: { chatId: string; success: boolean; error?: string }[] = [];

    for (const chat of targetChats) {
      try {
        await bot.telegram.sendMessage(chat.chat_id, text, options);
        results.push({ chatId: chat.chat_id, success: true });
      } catch (err: any) {
        results.push({ chatId: chat.chat_id, success: false, error: err.message });
      }
    }

    return { success: true, sent: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

// 10. Raporlar
export async function getChatReports(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { chatId } = request.params as { chatId: string };
    const days = Number((request.query as any)?.days) || 7;
    const db = getDb();
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // En çok mesaj atanlar
    const topUsers = await db.selectFrom('logs')
      .select(['username', 'first_name', db.fn.count('id').as('message_count')])
      .where('chat_id', '=', chatId)
      .where('event_type', '=', 'message')
      .where('timestamp', '>=', since)
      .groupBy('username')
      .orderBy('message_count', 'desc')
      .limit(10)
      .execute();

    // Moderasyon istatistikleri
    const modStats = await db.selectFrom('moderation_logs')
      .select(['action', db.fn.count('id').as('count')])
      .where('chat_id', '=', chatId)
      .where('timestamp', '>=', since)
      .groupBy('action')
      .execute();

    // Günlük mesaj sayıları
    const dailyMessages = await db.selectFrom('logs')
      .select([db.fn.count('id').as('count')])
      .where('chat_id', '=', chatId)
      .where('event_type', '=', 'message')
      .where('timestamp', '>=', since)
      .executeTakeFirst();

    // Katılım/Ayrılma
    const joins = await db.selectFrom('logs')
      .select([db.fn.count('id').as('count')])
      .where('chat_id', '=', chatId)
      .where('event_type', '=', 'join')
      .where('timestamp', '>=', since)
      .executeTakeFirst();

    return {
      period: `${days} gün`,
      totalMessages: Number((dailyMessages as any)?.count || 0),
      totalJoins: Number((joins as any)?.count || 0),
      topUsers,
      moderationActions: modStats,
    };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}
