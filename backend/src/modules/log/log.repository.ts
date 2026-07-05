import { getDb } from '../../db/index.js';

interface CreateLogInput {
  chatId: string | number;
  chatTitle?: string | null;
  userId?: string | number | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  eventType: string;
  messageSent?: boolean;
  messageText?: string | null;
}

class LogRepository {
  async getAllLogs(limit = 100): Promise<any[]> {
    const db = getDb();
    return db.selectFrom('logs')
      .selectAll()
      .orderBy('timestamp', 'desc')
      .limit(Number(limit))
      .execute();
  }

  async createLog(data: CreateLogInput): Promise<any> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.insertInto('logs')
      .values({
        chat_id: String(data.chatId),
        chat_title: data.chatTitle || null,
        user_id: data.userId ? String(data.userId) : null,
        username: data.username || null,
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        event_type: data.eventType,
        message_sent: data.messageSent ? 1 : 0,
        message_text: data.messageText?.substring(0, 500) || null,
        timestamp: now,
      })
      .returning('id')
      .executeTakeFirst();

    if (result) {
      const log = await db.selectFrom('logs').selectAll().where('id', '=', result.id).executeTakeFirst();
      return log;
    }
    return null;
  }

  async deleteOldLogs(olderThanDays: number): Promise<void> {
    const db = getDb();
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
    await db.deleteFrom('logs').where('timestamp', '<', cutoff).execute();
  }
}

export default new LogRepository();
