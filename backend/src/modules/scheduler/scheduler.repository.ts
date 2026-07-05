import { getDb } from '../../db/index.js';

class SchedulerRepository {
  async create(data: any): Promise<any> {
    const db = getDb();
    const now = new Date().toISOString();
    const result = await db.insertInto('scheduled_posts')
      .values({ ...data, created_at: now })
      .returning('id')
      .executeTakeFirst();
    if (result) {
      return db.selectFrom('scheduled_posts').selectAll().where('id', '=', result.id).executeTakeFirst();
    }
    return null;
  }

  async getAll(): Promise<any[]> {
    const db = getDb();
    return db.selectFrom('scheduled_posts')
      .selectAll()
      .orderBy('scheduled_at', 'desc')
      .execute();
  }

  async updateStatus(id: number, status: string): Promise<void> {
    const db = getDb();
    await db.updateTable('scheduled_posts')
      .set({ status })
      .where('id', '=', id)
      .execute();
  }
}

export default new SchedulerRepository();
