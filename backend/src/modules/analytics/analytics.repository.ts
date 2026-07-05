import { getDb } from '../../db/index.js';

interface EventUser {
  id?: string | number;
  username?: string;
}

class EventRepository {
  async logEvent(chatId: string | number, eventType: string, user: EventUser = {}): Promise<void> {
    const db = getDb();
    await db.insertInto('chat_events').values({
      chat_id: String(chatId),
      event_type: eventType,
      user_id: user.id ? String(user.id) : null,
      username: user.username || null,
      timestamp: new Date().toISOString(),
    }).execute();
  }

  async getMetrics(chatId: string | number, days = 7): Promise<{ event_type: string; count: number }[]> {
    const db = getDb();
    const since = new Date(Date.now() - days * 86400000).toISOString();
    return db.selectFrom('chat_events')
      .select(['event_type', db.fn.count<number>('id').as('count')])
      .where('chat_id', '=', String(chatId))
      .where('timestamp', '>=', since)
      .groupBy('event_type')
      .execute() as any;
  }
}

export default new EventRepository();
