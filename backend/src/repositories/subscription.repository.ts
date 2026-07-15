import { getDb } from '../db/index.js';
import type { Subscription } from '../types/db.js';

interface SubscriptionData {
  user_id: string;
  workspace_id?: number | null;
  chat_id?: string | null;
  plan?: string | null;
  plan_slug?: string | null;
  plan_id?: number | null;
  status?: string;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  stripe_id?: string | null;
  telegram_payment_charge_id?: string | null;
  created_at?: string;
}

class SubscriptionRepository {
  async upsert(sub: SubscriptionData): Promise<Subscription | undefined> {
    const db = getDb();
    const existing = await db.selectFrom('subscriptions')
      .selectAll()
      .where('user_id', '=', sub.user_id)
      .executeTakeFirst();

    if (existing) {
      const { created_at, ...updateData } = sub;
      await db.updateTable('subscriptions').set(updateData).where('user_id', '=', sub.user_id).execute();
      return existing as Subscription;
    }

    const insertData = { ...sub, status: sub.status || 'active', created_at: sub.created_at || new Date().toISOString() };
    await db.insertInto('subscriptions').values(insertData as any).execute();
    return undefined;
  }

  async findActiveByWorkspace(workspaceId: number): Promise<Subscription | null> {
    const db = getDb();
    const sub = await db.selectFrom('subscriptions')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('status', '=', 'active')
      .where('expires_at', '>', new Date().toISOString())
      .executeTakeFirst();
    return (sub as Subscription) || null;
  }

  async findActive(userId: string): Promise<Subscription | undefined> {
    const db = getDb();
    return db.selectFrom('subscriptions')
      .selectAll()
      .where('user_id', '=', userId)
      .where('status', '=', 'active')
      .where('expires_at', '>', new Date().toISOString())
      .executeTakeFirst() as Promise<Subscription | undefined>;
  }

  async expireOld(): Promise<void> {
    const db = getDb();
    await db.updateTable('subscriptions')
      .set({ status: 'expired' })
      .where('expires_at', '<', new Date().toISOString())
      .where('status', '=', 'active')
      .execute();
  }

  async getAll(): Promise<Subscription[]> {
    const db = getDb();
    return db.selectFrom('subscriptions')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute() as Promise<Subscription[]>;
  }

  async getByWorkspace(workspaceId: number): Promise<Subscription[]> {
    const db = getDb();
    return db.selectFrom('subscriptions')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .orderBy('created_at', 'desc')
      .execute() as Promise<Subscription[]>;
  }

  async deleteById(id: number): Promise<void> {
    const db = getDb();
    await db.deleteFrom('subscriptions')
      .where('id', '=', id)
      .execute();
  }
}

export default new SubscriptionRepository();
