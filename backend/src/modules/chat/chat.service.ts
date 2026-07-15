import type { Chat } from '../../types/db.js';
import chatRepository from './chat.repository.js';

interface ChatData {
  chatId: string | number;
  title?: string;
  type?: string;
  username?: string;
}

interface ChatUpdatePayload {
  welcome_message?: string | null;
  [key: string]: unknown;
}

class ChatService {
  async getAllChats(workspaceId?: number): Promise<Chat[]> {
    const chats = await chatRepository.getAllChats(workspaceId);
    try {
      const botServiceMod = await import('../../services/bot.service.js');
      const bot = botServiceMod.default.getBotInstance();
      if (bot) {
        await Promise.all(
          chats.map(async (chat) => {
            try {
              const count = await bot.telegram.getChatMembersCount(chat.chat_id);
              await chatRepository.updateMemberCount(chat.chat_id, count, workspaceId);
              chat.member_count = count;
            } catch (_) {
              // Bot might be kicked or chat deleted, keep count as is
            }
          })
        );
      }
    } catch (_) {
      // Ignored if bot service is not ready
    }
    return chats;
  }

  async getChat(chatId: string | number, workspaceId?: number): Promise<Chat | undefined> {
    return chatRepository.getChatByChatId(chatId, workspaceId);
  }

  async toggleChat(chatId: string | number, isEnabled: boolean, workspaceId?: number): Promise<void> {
    const chat = await chatRepository.getChatByChatId(chatId, workspaceId);
    if (!chat) {
      throw new Error('Grup bulunamadı. Bot önce gruba eklenmeli.');
    }
    return chatRepository.updateChatEnabled(chatId, isEnabled, workspaceId);
  }

  async updateChatSettings(chatId: string | number, payload: any, workspaceId?: number): Promise<void> {
    const chat = await chatRepository.getChatByChatId(chatId, workspaceId);
    if (!chat) {
      throw new Error('Grup bulunamadı.');
    }
    const dbPayload: any = {};
    if (payload.welcomeMessage !== undefined) {
      dbPayload.welcome_message = payload.welcomeMessage;
    }
    if (payload.welcome_message !== undefined) {
      dbPayload.welcome_message = payload.welcome_message;
    }
    return chatRepository.updateChatSettings(chatId, dbPayload, workspaceId);
  }

  async saveChatFromBot(chatData: ChatData, workspaceId?: number): Promise<Chat | undefined> {
    return chatRepository.upsertChat(chatData, workspaceId);
  }

  async updateMemberCount(chatId: string | number, count: number, workspaceId?: number): Promise<void> {
    return chatRepository.updateMemberCount(chatId, count, workspaceId);
  }

  async updateLastActivity(chatId: string | number, workspaceId?: number): Promise<void> {
    return chatRepository.updateLastActivity(chatId, workspaceId);
  }

  async removeChat(chatId: string | number, workspaceId?: number): Promise<void> {
    return chatRepository.removeChat(chatId, workspaceId);
  }

  async getEffectiveWelcomeMessage(chatId: string | number, globalMessage: string, workspaceId?: number): Promise<string> {
    const chat = await chatRepository.getChatByChatId(chatId, workspaceId);
    if (chat && chat.welcome_message) {
      return chat.welcome_message;
    }
    return globalMessage;
  }
}

export default new ChatService();
