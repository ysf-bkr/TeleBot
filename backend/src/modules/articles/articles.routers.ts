import { FastifyInstance } from 'fastify';
import { listArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, shareArticle } from './articles.controller.js';

async function articlesRouters(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', listArticles);
  fastify.get('/slug/:slug', getArticleBySlug);
  fastify.post('/', createArticle);
  fastify.patch('/:id', updateArticle);
  fastify.delete('/:id', deleteArticle);
  fastify.post('/:id/share', shareArticle);
}

export default articlesRouters;
