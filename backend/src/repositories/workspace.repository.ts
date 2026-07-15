import { getDb } from '../db/index.js';
import type { NewWorkspace, Workspace } from '../types/db.js';

class WorkspaceRepository {
  async create(data: NewWorkspace): Promise<Workspace | undefined> {
    const db = getDb();
    await db.insertInto('workspaces').values(data as any).execute();
    return db.selectFrom('workspaces')
      .selectAll()
      .where('slug', '=', data.slug)
      .executeTakeFirst() as Promise<Workspace | undefined>;
  }

  async findById(id: number): Promise<Workspace | undefined> {
    const db = getDb();
    return db.selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as Promise<Workspace | undefined>;
  }

  async findBySlug(slug: string): Promise<Workspace | undefined> {
    const db = getDb();
    return db.selectFrom('workspaces')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst() as Promise<Workspace | undefined>;
  }

  async findByOwner(ownerId: number): Promise<Workspace[]> {
    const db = getDb();
    return db.selectFrom('workspaces')
      .selectAll()
      .where('owner_id', '=', ownerId)
      .orderBy('created_at', 'desc')
      .execute() as Promise<Workspace[]>;
  }

  async getAll(): Promise<Workspace[]> {
    const db = getDb();
    return db.selectFrom('workspaces')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute() as Promise<Workspace[]>;
  }

  async update(id: number, data: Partial<Workspace>): Promise<void> {
    const db = getDb();
    await db.updateTable('workspaces')
      .set({ ...data, updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .execute();
  }

  async delete(id: number): Promise<void> {
    const db = getDb();
    await db.deleteFrom('workspaces').where('id', '=', id).execute();
  }

  async countByOwner(ownerId: number): Promise<number> {
    const db = getDb();
    const result = await db.selectFrom('workspaces')
      .select(db.fn.count<number>('id').as('count'))
      .where('owner_id', '=', ownerId)
      .executeTakeFirst();
    return Number(result?.count || 0);
  }

  async countTotal(): Promise<number> {
    const db = getDb();
    const result = await db.selectFrom('workspaces')
      .select(db.fn.count<number>('id').as('count'))
      .executeTakeFirst();
    return Number(result?.count || 0);
  }
}

export default new WorkspaceRepository();
