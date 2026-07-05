import { getDb } from '../../db/index.js';

class ModerationRepository {
  async getSettings(chatId: string | number): Promise<any> {
    const db = getDb();
    let settings = await db.selectFrom('moderation_settings')
      .selectAll()
      .where('chat_id', '=', String(chatId))
      .executeTakeFirst();

    if (!settings) {
      const now = new Date().toISOString();
      await db.insertInto('moderation_settings')
        .values({
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
      settings = await db.selectFrom('moderation_settings')
        .selectAll()
        .where('chat_id', '=', String(chatId))
        .executeTakeFirst();
    }
    return settings;
  }

  async updateSettings(chatId: string | number, data: Record<string, any>): Promise<void> {
    const db = getDb();
    await db.updateTable('moderation_settings')
      .set({ ...data, updated_at: new Date().toISOString() })
      .where('chat_id', '=', String(chatId))
      .execute();
  }
}

export default new ModerationRepository();
