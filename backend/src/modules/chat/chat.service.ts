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
  async getAllChats(): Promise<Chat[]> {
    const chats = await chatRepository.getAllChats();
    try {
      const botServiceMod = await import('../../services/bot.service.js');
      const bot = botServiceMod.default.getBotInstance();
      if (bot) {
        await Promise.all(
          chats.map(async (chat) => {
            try {
              const count = await bot.telegram.getChatMembersCount(chat.chat_id);
              await chatRepository.updateMemberCount(chat.chat_id, count);
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

  async getChat(chatId: string | number): Promise<Chat | undefined> {
    return chatRepository.getChatByChatId(chatId);
  }

  async toggleChat(chatId: string | number, isEnabled: boolean): Promise<void> {
    const chat = await chatRepository.getChatByChatId(chatId);
    if (!chat) {
      throw new Error('Grup bulunamadı. Bot önce gruba eklenmeli.');
    }
    return chatRepository.updateChatEnabled(chatId, isEnabled);
  }

  async updateChatSettings(chatId: string | number, payload: any): Promise<void> {
    const chat = await chatRepository.getChatByChatId(chatId);
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
    return chatRepository.updateChatSettings(chatId, dbPayload);
  }

  async saveChatFromBot(chatData: ChatData): Promise<Chat | undefined> {
    return chatRepository.upsertChat(chatData);
  }

  async updateMemberCount(chatId: string | number, count: number): Promise<void> {
    return chatRepository.updateMemberCount(chatId, count);
  }

  async updateLastActivity(chatId: string | number): Promise<void> {
    return chatRepository.updateLastActivity(chatId);
  }

  async removeChat(chatId: string | number): Promise<void> {
    return chatRepository.removeChat(chatId);
  }

  async getEffectiveWelcomeMessage(chatId: string | number, globalMessage: string): Promise<string> {
    const chat = await chatRepository.getChatByChatId(chatId);
    if (chat && chat.welcome_message) {
      return chat.welcome_message;
    }
    return globalMessage;
  }
}

export default new ChatService();
