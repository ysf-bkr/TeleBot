import { getDb } from '../../db/index.js';
import type { Chat } from '../../types/db.js';

interface ChatInput {
  chatId: string | number;
  title?: string;
  type?: string;
  username?: string;
}

interface ChatUpdatePayload {
  welcome_message?: string | null;
  member_count?: number;
  last_activity_at?: string;
  [key: string]: unknown;
}

class ChatRepository {
  async getAllChats(): Promise<Chat[]> {
    const db = getDb();
    return db.selectFrom('chats').selectAll().orderBy('joined_at', 'desc').execute();
  }

  async getChatByChatId(chatId: string | number): Promise<Chat | undefined> {
    const db = getDb();
    return db.selectFrom('chats').selectAll().where('chat_id', '=', String(chatId)).executeTakeFirst();
  }

  async upsertChat(chatData: ChatInput): Promise<Chat | undefined> {
    const db = getDb();
    const existing = await this.getChatByChatId(chatData.chatId);
    if (existing) {
      await db.updateTable('chats')
        .set({
          title: chatData.title || existing.title,
          type: chatData.type || existing.type,
          username: chatData.username || existing.username,
          updated_at: new Date().toISOString(),
        })
        .where('chat_id', '=', String(chatData.chatId))
        .execute();
      return this.getChatByChatId(chatData.chatId);
    }
    const now = new Date().toISOString();
    await db.insertInto('chats')
      .values({
        chat_id: String(chatData.chatId),
        title: chatData.title || null,
        type: chatData.type || null,
        username: chatData.username || null,
        is_enabled: 1,
        member_count: 0,
        joined_at: now,
        updated_at: now,
      })
      .execute();
    return this.getChatByChatId(chatData.chatId);
  }

  async updateChatEnabled(chatId: string | number, isEnabled: boolean): Promise<void> {
    const db = getDb();
    await db.updateTable('chats')
      .set({ is_enabled: isEnabled ? 1 : 0, updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId))
      .execute();
  }

  async updateChatSettings(chatId: string | number, payload: ChatUpdatePayload): Promise<void> {
    const db = getDb();
    await db.updateTable('chats')
      .set({ ...payload, updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId))
      .execute();
  }

  async updateMemberCount(chatId: string | number, count: number): Promise<void> {
    const db = getDb();
    await db.updateTable('chats')
      .set({ member_count: count, updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId))
      .execute();
  }

  async updateLastActivity(chatId: string | number): Promise<void> {
    const db = getDb();
    await db.updateTable('chats')
      .set({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId))
      .execute();
  }

  async removeChat(chatId: string | number): Promise<void> {
    const db = getDb();
    await db.deleteFrom('chats')
      .where('chat_id', '=', String(chatId))
      .execute();
  }
}

export default new ChatRepository();
