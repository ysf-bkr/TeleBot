import { getDb } from '../../db/index.js';

interface ArticleData {
  title: string;
  slug: string;
  content: string;
}

export interface Article extends ArticleData {
  id: number;
  created_at: string;
  updated_at: string;
}

class ArticlesRepository {
  async create(data: ArticleData): Promise<Article | undefined> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.insertInto('articles').values({
      slug: data.slug,
      title: data.title,
      content: data.content,
      created_at: now,
      updated_at: now,
    }).execute();
    return this.getBySlug(data.slug);
  }

  async getBySlug(slug: string): Promise<Article | undefined> {
    const db = getDb();
    return db.selectFrom('articles')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst() as Promise<Article | undefined>;
  }

  async getAll(): Promise<Article[]> {
    const db = getDb();
    return db.selectFrom('articles')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute() as Promise<Article[]>;
  }

  async deleteById(id: number): Promise<void> {
    const db = getDb();
    await db.deleteFrom('articles')
      .where('id', '=', id)
      .execute();
  }

  async update(id: number, data: Partial<ArticleData>): Promise<Article | undefined> {
    const db = getDb();
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { updated_at: now };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;

    await db.updateTable('articles')
      .set(updateData)
      .where('id', '=', id)
      .execute();
    return db.selectFrom('articles').selectAll().where('id', '=', id).executeTakeFirst() as Promise<Article | undefined>;
  }
}

export default new ArticlesRepository();
