import { getDb } from '../db/index.js';
import type { BlacklistWord } from '../types/db.js';

class BlacklistRepository {
  async getWordsForChat(chatId: string | number): Promise<BlacklistWord[]> {
    const db = getDb();
    return db
      .selectFrom('blacklist_words')
      .selectAll()
      .where('chat_id', '=', String(chatId))
      .execute();
  }

  async addWord(chatId: string | number, word: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db
      .insertInto('blacklist_words')
      .values({ chat_id: String(chatId), word: word.toLowerCase().trim(), created_at: now })
      .execute();
  }

  async removeWord(id: number, chatId: string | number): Promise<void> {
    const db = getDb();
    await db
      .deleteFrom('blacklist_words')
      .where('id', '=', id)
      .where('chat_id', '=', String(chatId))
      .execute();
  }

  async getAllWords(chatIds: (string | number)[] = []): Promise<BlacklistWord[]> {
    const db = getDb();
    let query = db.selectFrom('blacklist_words').selectAll();
    if (chatIds.length) {
      query = query.where('chat_id', 'in', chatIds.map(String));
    }
    return query.execute();
  }
}

export default new BlacklistRepository();
