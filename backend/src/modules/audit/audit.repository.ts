import { getDb } from '../../db/index.js';

interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  timestamp: string;
}

class AuditRepository {
  async log(action: string, details: unknown, userId: number | string | null = null, username: string | null = null, ip: string | null = null): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.insertInto('audit_logs').values({
      user_id: userId ? Number(userId) : null,
      username,
      action,
      details: JSON.stringify(details),
      ip,
      timestamp: now,
    }).execute();
  }

  async getRecent(limit = 50): Promise<AuditLog[]> {
    const db = getDb();
    return db.selectFrom('audit_logs')
      .selectAll()
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .execute() as Promise<AuditLog[]>;
  }
}

export default new AuditRepository();
