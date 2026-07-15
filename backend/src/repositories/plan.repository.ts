import { getDb } from '../db/index.js';
import type { NewSubscriptionPlan, SubscriptionPlan } from '../types/db.js';

class PlanRepository {
  async getAll(): Promise<SubscriptionPlan[]> {
    const db = getDb();
    return db.selectFrom('subscription_plans')
      .selectAll()
      .where('is_active', '=', 1)
      .orderBy('price_monthly', 'asc')
      .execute() as Promise<SubscriptionPlan[]>;
  }

  async findById(id: number): Promise<SubscriptionPlan | undefined> {
    const db = getDb();
    return db.selectFrom('subscription_plans')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as Promise<SubscriptionPlan | undefined>;
  }

  async findBySlug(slug: string): Promise<SubscriptionPlan | undefined> {
    const db = getDb();
    return db.selectFrom('subscription_plans')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst() as Promise<SubscriptionPlan | undefined>;
  }

  async create(data: NewSubscriptionPlan): Promise<SubscriptionPlan | undefined> {
    const db = getDb();
    await db.insertInto('subscription_plans').values(data as any).execute();
    return this.findBySlug(data.slug);
  }

  async update(id: number, data: Partial<SubscriptionPlan>): Promise<void> {
    const db = getDb();
    await db.updateTable('subscription_plans')
      .set(data)
      .where('id', '=', id)
      .execute();
  }

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.deleteFrom('subscription_plans')
      .where('id', '=', id)
      .execute();
  }

  async getDefaultPlan(): Promise<SubscriptionPlan | undefined> {
    const db = getDb();
    return db.selectFrom('subscription_plans')
      .selectAll()
      .where('slug', '=', 'free')
      .where('is_active', '=', 1)
      .executeTakeFirst() as Promise<SubscriptionPlan | undefined>;
  }
}

export default new PlanRepository();
