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
  workspaceId?: number | null;
}

class LogRepository {
  async getAllLogs(limit = 100, workspaceId?: number): Promise<any[]> {
    const db = getDb();
    let query = db.selectFrom('logs')
      .selectAll()
      .orderBy('timestamp', 'desc')
      .limit(Number(limit));
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId) as any;
    }
    return query.execute();
  }

  async createLog(data: CreateLogInput): Promise<any> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.insertInto('logs')
      .values({
        workspace_id: data.workspaceId || null,
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

  async deleteOldLogs(olderThanDays: number, workspaceId?: number): Promise<void> {
    const db = getDb();
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
    let query = db.deleteFrom('logs').where('timestamp', '<', cutoff) as any;
    if (workspaceId) {
      query = query.where('workspace_id', '=', workspaceId);
    }
    await query.execute();
  }
}

export default new LogRepository();
