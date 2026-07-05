import { getDb } from '../../db/index.js';

class AuditService {
  async log(
    action: string,
    details: any,
    userId: number | string | null | undefined,
    username: string | null | undefined,
    ip: string | null | undefined
  ): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    
    // Parse userId to number or null
    let uId: number | null = null;
    if (userId) {
      const parsed = Number(userId);
      if (!isNaN(parsed)) uId = parsed;
    }

    try {
      await db.insertInto('audit_logs')
        .values({
          user_id: uId,
          username: username || null,
          action,
          details: typeof details === 'string' ? details : JSON.stringify(details),
          ip: ip || null,
          timestamp: now,
        })
        .execute();
    } catch (err: any) {
      console.error('[AUDIT] Logging failed:', err.message);
    }
  }

  async getLogs(limit = 30): Promise<any[]> {
    const db = getDb();
    return db.selectFrom('audit_logs')
      .selectAll()
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .execute();
  }
}

export default new AuditService();
