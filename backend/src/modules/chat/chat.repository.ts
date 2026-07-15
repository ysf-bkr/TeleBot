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
  async getAllChats(workspaceId?: number): Promise<Chat[]> {
    const db = getDb();
    let query = db.selectFrom('chats').selectAll().orderBy('joined_at', 'desc');
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId) as any;
    }
    return query.execute() as Promise<Chat[]>;
  }

  async getChatByChatId(chatId: string | number, workspaceId?: number): Promise<Chat | undefined> {
    const db = getDb();
    let query = db.selectFrom('chats').selectAll().where('chat_id', '=', String(chatId));
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId) as any;
    }
    return query.executeTakeFirst() as Promise<Chat | undefined>;
  }

  async upsertChat(chatData: ChatInput, workspaceId?: number): Promise<Chat | undefined> {
    const db = getDb();
    const existing = await this.getChatByChatId(chatData.chatId, workspaceId);
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
      return this.getChatByChatId(chatData.chatId, workspaceId);
    }
    const now = new Date().toISOString();
    await db.insertInto('chats')
      .values({
        workspace_id: workspaceId || null,
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
    return this.getChatByChatId(chatData.chatId, workspaceId);
  }

  async updateChatEnabled(chatId: string | number, isEnabled: boolean, workspaceId?: number): Promise<void> {
    const db = getDb();
    let query = db.updateTable('chats')
      .set({ is_enabled: isEnabled ? 1 : 0, updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId));
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId) as any;
    }
    await query.execute();
  }

  async updateChatSettings(chatId: string | number, payload: ChatUpdatePayload, workspaceId?: number): Promise<void> {
    const db = getDb();
    let query = db.updateTable('chats')
      .set({ ...payload, updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId));
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId) as any;
    }
    await query.execute();
  }

  async updateMemberCount(chatId: string | number, count: number, workspaceId?: number): Promise<void> {
    const db = getDb();
    let query = db.updateTable('chats')
      .set({ member_count: count, updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId));
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId) as any;
    }
    await query.execute();
  }

  async updateLastActivity(chatId: string | number, workspaceId?: number): Promise<void> {
    const db = getDb();
    let query = db.updateTable('chats')
      .set({ last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId));
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId) as any;
    }
    await query.execute();
  }

  async removeChat(chatId: string | number, workspaceId?: number): Promise<void> {
    const db = getDb();
    let query = db.deleteFrom('chats')
      .where('chat_id', '=', String(chatId));
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId) as any;
    }
    await query.execute();
  }
}

export default new ChatRepository();
