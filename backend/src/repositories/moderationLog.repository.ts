import { getDb } from '../db/index.js';
import type { ModerationLog } from '../types/db.js';

interface CreateLogData {
  chatId: string | number;
  userId?: string | number | null;
  username?: string | null;
  firstName?: string | null;
  action: string;
  reason?: string | null;
  messageText?: string | null;
}

interface GetLogsOptions {
  chatId?: string | number;
  limit?: number;
}

class ModerationLogRepository {
  async createLog(data: CreateLogData): Promise<ModerationLog | undefined> {
    const db = getDb();
    const now = new Date().toISOString();

    const result = await db
      .insertInto('moderation_logs')
      .values({
        chat_id: String(data.chatId),
        user_id: data.userId ? String(data.userId) : null,
        username: data.username || null,
        first_name: data.firstName || null,
        action: data.action,
        reason: data.reason || null,
        message_text: data.messageText ? String(data.messageText).substring(0, 300) : null,
        timestamp: now,
      })
      .returning(['id'])
      .executeTakeFirst();

    if (!result) return undefined;
    return this.getById(result.id);
  }

  async getById(id: number): Promise<ModerationLog | undefined> {
    const db = getDb();
    return db.selectFrom('moderation_logs').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async getLogs({ chatId, limit = 50 }: GetLogsOptions = {}): Promise<ModerationLog[]> {
    const db = getDb();
    let query = db.selectFrom('moderation_logs').selectAll();

    if (chatId) {
      query = query.where('chat_id', '=', String(chatId));
    }

    return query.orderBy('timestamp', 'desc').limit(Number(limit)).execute();
  }
}

export default new ModerationLogRepository();
