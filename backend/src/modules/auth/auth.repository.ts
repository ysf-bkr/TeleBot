import { getDb } from '../../db/index.js';
import type { PanelUser } from '../../types/db.js';

class AuthRepository {
  async findByUsername(username: string): Promise<PanelUser | undefined> {
    const db = getDb();
    return db
      .selectFrom('panel_users')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();
  }

  async createUser({ username, passwordHash }: { username: string; passwordHash: string }): Promise<PanelUser | undefined> {
    const db = getDb();
    const now = new Date().toISOString();

    await db
      .insertInto('panel_users')
      .values({
        username,
        password_hash: passwordHash,
        created_at: now,
      })
      .execute();

    return this.findByUsername(username);
  }

  async countUsers(): Promise<number> {
    const db = getDb();
    const result = await db
      .selectFrom('panel_users')
      .select(db.fn.count<number>('id').as('count'))
      .executeTakeFirst();
    return Number(result?.count || 0);
  }
}

export default new AuthRepository();
