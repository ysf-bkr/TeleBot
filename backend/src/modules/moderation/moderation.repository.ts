import { getDb } from '../../db/index.js';

class ModerationRepository {
  async getSettings(chatId: string | number, workspaceId?: number): Promise<any> {
    const db = getDb();
    let query = db.selectFrom('moderation_settings')
      .selectAll()
      .where('chat_id', '=', String(chatId)) as any;
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId);
    }
    let settings = await query.executeTakeFirst();

    if (!settings) {
      const now = new Date().toISOString();
      await db.insertInto('moderation_settings')
        .values({
          workspace_id: workspaceId || null,
          chat_id: String(chatId),
          enabled: 1,
          rules_text: null,
          auto_delete_links: 0,
          auto_delete_bad_words: 1,
          auto_warn: 1,
          spam_threshold: 5,
          max_warnings: 3,
          action_after_warnings: 'kick',
          updated_at: now,
        })
        .execute();
      query = db.selectFrom('moderation_settings').selectAll().where('chat_id', '=', String(chatId)) as any;
      if (workspaceId) {
        query = query.where('workspace_id', '=', workspaceId);
      }
      settings = await query.executeTakeFirst();
    }
    return settings;
  }

  async updateSettings(chatId: string | number, data: Record<string, any>, workspaceId?: number): Promise<void> {
    const db = getDb();
    let query = db.updateTable('moderation_settings')
      .set({ ...data, updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId)) as any;
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId);
    }
    await query.execute();
  }

  // Blacklist
  async getBlacklist(chatId: string | number, workspaceId?: number): Promise<any[]> {
    const db = getDb();
    let query = db.selectFrom('blacklist_words').selectAll().where('chat_id', '=', String(chatId)) as any;
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId);
    }
    return query.execute();
  }

  async addBlacklistWord(chatId: string | number, word: string, workspaceId?: number): Promise<void> {
    const db = getDb();
    await db.insertInto('blacklist_words').values({
      workspace_id: workspaceId || null,
      chat_id: String(chatId),
      word,
      created_at: new Date().toISOString(),
    }).execute();
  }

  async removeBlacklistWord(id: number, workspaceId?: number): Promise<void> {
    const db = getDb();
    let query = db.deleteFrom('blacklist_words').where('id', '=', id) as any;
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId);
    }
    await query.execute();
  }

  async getModerationLogs(chatId: string | number, limit = 30, workspaceId?: number): Promise<any[]> {
    const db = getDb();
    let query = db.selectFrom('moderation_logs')
      .selectAll()
      .where('chat_id', '=', String(chatId))
      .orderBy('timestamp', 'desc')
      .limit(limit) as any;
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId);
    }
    return query.execute();
  }
}

export default new ModerationRepository();
