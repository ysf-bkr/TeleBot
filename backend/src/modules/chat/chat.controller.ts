import { FastifyReply, FastifyRequest } from 'fastify';
import chatService from './chat.service.js';

async function listChats(request: FastifyRequest, _reply: FastifyReply) {
  return chatService.getAllChats(request.workspace_id);
}

async function getChat(request: FastifyRequest<{ Params: { chatId: string } }>, reply: FastifyReply) {
  const chat = await chatService.getChat(request.params.chatId, request.workspace_id);
  if (!chat) {
    reply.code(404);
    return { error: 'Grup bulunamadı' };
  }
  return chat;
}

async function toggleChat(request: FastifyRequest<{ Params: { chatId: string }; Body: { isEnabled: boolean } }>, reply: FastifyReply) {
  try {
    await chatService.toggleChat(request.params.chatId, request.body.isEnabled, request.workspace_id);
    return { success: true };
  } catch (err: any) {
    reply.code(400);
    return { error: err.message };
  }
}

async function updateChat(request: FastifyRequest<{ Params: { chatId: string }; Body: any }>, reply: FastifyReply) {
  try {
    await chatService.updateChatSettings(request.params.chatId, request.body as any, request.workspace_id);
    return { success: true };
  } catch (err: any) {
    reply.code(400);
    return { error: err.message };
  }
}

async function userAction(request: FastifyRequest<{ Params: { chatId: string }; Body: { userId: string; action: string } }>, reply: FastifyReply) {
  const { chatId } = request.params;
  const { userId, action } = request.body || {};

  if (!userId || !action) {
    reply.code(400);
    return { error: 'Kullanıcı ID ve eylem zorunludur.' };
  }

  try {
    const botServiceMod = await import('../../services/bot.service.js');
    const bot = (botServiceMod.default || botServiceMod).getBotInstance();

    if (!bot) {
      reply.code(400);
      return { error: 'Aktif bot bağlantısı bulunamadı.' };
    }

    const numericUserId = Number(userId);

    if (action === 'ban') {
      await bot.telegram.banChatMember(chatId, numericUserId);
    } else if (action === 'unban') {
      await bot.telegram.unbanChatMember(chatId, numericUserId, { only_if_banned: true });
    } else if (action === 'mute') {
      const until = Math.floor(Date.now() / 1000) + 3600;
      await bot.telegram.restrictChatMember(chatId, numericUserId, {
        until_date: until,
        permissions: { can_send_messages: false }
      });
    } else if (action === 'unmute') {
      await bot.telegram.restrictChatMember(chatId, numericUserId, {
        permissions: {
          can_send_messages: true,
          can_send_polls: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
        }
      });
    } else if (action === 'kick') {
      await bot.telegram.banChatMember(chatId, numericUserId);
      await bot.telegram.unbanChatMember(chatId, numericUserId);
    } else {
      reply.code(400);
      return { error: 'Geçersiz eylem.' };
    }

    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: `Telegram işlemi başarısız oldu: ${err.message}` };
  }
}

async function syncChatInfo(request: FastifyRequest<{ Params: { chatId: string } }>, reply: FastifyReply) {
  try {
    const botServiceMod = await import('../../services/bot.service.js');
    const bot = (botServiceMod.default || botServiceMod).getBotInstance();
    if (!bot) {
      reply.code(400);
      return { error: 'Aktif bot bağlantısı bulunamadı.' };
    }

    const chatId = request.params.chatId;
    const chatInfo: any = await bot.telegram.getChat(chatId);

    await chatService.saveChatFromBot({
      chatId: chatInfo.id,
      title: chatInfo.title || chatInfo.first_name || 'Bilinmeyen',
      type: chatInfo.type,
      username: (chatInfo as any).username || undefined,
    }, request.workspace_id);

    try {
      const { getDb } = await import('../../db/index.js');
      const db = getDb();
      await db.updateTable('chats')
        .set({ updated_at: new Date().toISOString() })
        .where('chat_id', '=', String(chatId))
        .execute();
    } catch (_) {}

    try {
      const count = await bot.telegram.getChatMembersCount(chatId);
      await chatService.updateMemberCount(chatId, count, request.workspace_id);
    } catch (_) {}

    return {
      success: true,
      chatInfo: {
        id: chatInfo.id,
        title: chatInfo.title || chatInfo.first_name || 'Bilinmeyen',
        type: chatInfo.type,
        username: (chatInfo as any).username || null,
        description: (chatInfo as any).description || '',
        invite_link: (chatInfo as any).invite_link || '',
        photo_url: (chatInfo as any).photo?.small_file_id || null,
        member_count: null,
        linked_chat_id: (chatInfo as any).linked_chat_id || null,
      }
    };
  } catch (err: any) {
    reply.code(500);
    return { error: `Grup bilgisi alınamadı: ${err.message}` };
  }
}

async function updateChatProfile(request: FastifyRequest<{ Params: { chatId: string }; Body: { title?: string; description?: string } }>, reply: FastifyReply) {
  try {
    const botServiceMod = await import('../../services/bot.service.js');
    const bot = (botServiceMod.default || botServiceMod).getBotInstance();
    if (!bot) {
      reply.code(400);
      return { error: 'Aktif bot bağlantısı bulunamadı.' };
    }

    const chatId = request.params.chatId;
    const { title, description } = request.body;

    if (title) {
      await bot.telegram.setChatTitle(chatId, title);
    }
    if (description !== undefined) {
      await bot.telegram.setChatDescription(chatId, description || '');
    }

    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: `Grup güncellenemedi: ${err.message}` };
  }
}

async function updateChatPhoto(request: FastifyRequest<{ Params: { chatId: string }; Body: { photoUrl?: string } }>, reply: FastifyReply) {
  try {
    const botServiceMod = await import('../../services/bot.service.js');
    const bot = (botServiceMod.default || botServiceMod).getBotInstance();
    if (!bot) {
      reply.code(400);
      return { error: 'Aktif bot bağlantısı bulunamadı.' };
    }

    const chatId = request.params.chatId;
    const { photoUrl } = request.body;

    if (photoUrl) {
      const response = await fetch(photoUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      await bot.telegram.setChatPhoto(chatId, { source: buffer });
    }

    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: `Fotoğraf güncellenemedi: ${err.message}` };
  }
}

async function sendTestMessage(request: FastifyRequest<{ Params: { chatId: string }; Body: { text: string; parseMode?: string } }>, reply: FastifyReply) {
  try {
    const botServiceMod = await import('../../services/bot.service.js');
    const bot = (botServiceMod.default || botServiceMod).getBotInstance();
    if (!bot) {
      reply.code(400);
      return { error: 'Aktif bot bağlantısı bulunamadı.' };
    }

    const chatId = request.params.chatId;
    const { text, parseMode } = request.body;

    if (!text) {
      reply.code(400);
      return { error: 'Mesaj içeriği zorunludur.' };
    }

    const options: any = {};
    if (parseMode === 'Markdown') options.parse_mode = 'MarkdownV2';
    else if (parseMode === 'HTML') options.parse_mode = 'HTML';

    await bot.telegram.sendMessage(chatId, text, options);
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: `Mesaj gönderilemedi: ${err.message}` };
  }
}

export { getChat, listChats, sendTestMessage, syncChatInfo, toggleChat, updateChat, updateChatPhoto, updateChatProfile, userAction };
