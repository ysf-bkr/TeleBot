import { getDb } from '../db/index.js';

class GlobalBlacklistRepository {
  async isBlacklisted(userId: string | number): Promise<boolean> {
    const db = getDb();
    const res = await db.selectFrom('global_blacklist')
      .select('id')
      .where('user_id', '=', String(userId))
      .executeTakeFirst();
    return !!res;
  }

  async add(userId: string | number, reason?: string | null): Promise<void> {
    const db = getDb();
    await db.insertInto('global_blacklist')
      .values({ user_id: String(userId), reason: reason || null, added_at: new Date().toISOString() })
      .onConflict((oc) => oc.column('user_id').doNothing())
      .execute();
  }
}

export default new GlobalBlacklistRepository();
