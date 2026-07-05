import { FastifyReply, FastifyRequest } from 'fastify';
import { getDb } from '../../db/index.js';

async function listArticles(request: FastifyRequest, reply: FastifyReply) {
  const db = getDb();
  try {
    const list = await db.selectFrom('articles')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
    return list;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function getArticleBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
  const db = getDb();
  try {
    const article = await db.selectFrom('articles')
      .selectAll()
      .where('slug', '=', request.params.slug)
      .executeTakeFirst();
      
    if (!article) {
      reply.code(404);
      return { error: 'Yazı bulunamadı' };
    }
    return article;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function createArticle(request: FastifyRequest<{ Body: { title: string; slug?: string; content: string } }>, reply: FastifyReply) {
  const db = getDb();
  const { title, slug, content } = request.body;
  if (!title || !content) {
    reply.code(400);
    return { error: 'Başlık ve içerik gereklidir' };
  }

  // Generate slug if not provided
  let finalSlug = slug?.trim();
  if (!finalSlug) {
    finalSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  
  // Ensure slug is unique by appending timestamp if needed
  const existing = await db.selectFrom('articles').select('id').where('slug', '=', finalSlug).executeTakeFirst();
  if (existing) {
    finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
  }

  const now = new Date().toISOString();
  try {
    await db.insertInto('articles')
      .values({
        title,
        slug: finalSlug,
        content,
        created_at: now,
        updated_at: now,
      })
      .execute();
      
    const created = await db.selectFrom('articles').selectAll().where('slug', '=', finalSlug).executeTakeFirst();
    return created;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function updateArticle(request: FastifyRequest<{ Params: { id: string }; Body: { title?: string; slug?: string; content?: string } }>, reply: FastifyReply) {
  const db = getDb();
  const id = Number(request.params.id);
  if (isNaN(id)) {
    reply.code(400);
    return { error: 'Geçersiz ID' };
  }

  const { title, slug, content } = request.body;
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };
  
  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug.trim();
  if (content !== undefined) updateData.content = content;

  try {
    await db.updateTable('articles')
      .set(updateData)
      .where('id', '=', id)
      .execute();
      
    const updated = await db.selectFrom('articles').selectAll().where('id', '=', id).executeTakeFirst();
    return updated;
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function deleteArticle(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const db = getDb();
  const id = Number(request.params.id);
  if (isNaN(id)) {
    reply.code(400);
    return { error: 'Geçersiz ID' };
  }

  try {
    await db.deleteFrom('articles')
      .where('id', '=', id)
      .execute();
    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

async function renderArticle(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
  const db = getDb();
  try {
    const article = await db.selectFrom('articles')
      .selectAll()
      .where('slug', '=', request.params.slug)
      .executeTakeFirst();
      
    if (!article) {
      reply.code(404);
      reply.type('text/html');
      return `<h1>Sayfa Bulunamadı</h1><p>Aradığınız makale mevcut değil.</p>`;
    }

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 680px;
      margin: 0 auto;
      padding: 2rem 1rem;
      background-color: #fafafa;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #111;
    }
    .date {
      color: #888;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .content {
      font-size: 1.15rem;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  <div class="date">${new Date(article.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  <div class="content">${article.content}</div>
</body>
</html>`;

    reply.type('text/html');
    return html;
  } catch (err: any) {
    reply.code(500);
    reply.type('text/html');
    return `<h1>Sunucu Hatası</h1><p>${err.message}</p>`;
  }
}

async function shareArticle(request: FastifyRequest<{ Params: { id: string }; Body: { chatId: string } }>, reply: FastifyReply) {
  const db = getDb();
  const id = Number(request.params.id);
  const { chatId } = request.body || {};

  if (!chatId) {
    reply.code(400);
    return { error: 'Grup ID zorunludur' };
  }

  try {
    const article = await db.selectFrom('articles')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!article) {
      reply.code(404);
      return { error: 'Yazı bulunamadı' };
    }

    const botServiceMod = await import('../../services/bot.service.js');
    const bot = (botServiceMod.default || botServiceMod).getBotInstance();

    if (!bot) {
      reply.code(400);
      return { error: 'Aktif bot bağlantısı bulunamadı.' };
    }

    // Generate link
    const host = process.env.PUBLIC_URL || 'http://localhost:3000';
    const link = `${host}/p/${article.slug}`;

    const text = `📝 <b>${article.title}</b>\n\n${link}`;
    await bot.telegram.sendMessage(chatId, text, { parse_mode: 'HTML' });

    return { success: true };
  } catch (err: any) {
    reply.code(500);
    return { error: err.message };
  }
}

export { listArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, renderArticle, shareArticle };
export default { renderArticle };
