import { FastifyInstance } from 'fastify';
import {
  addBlacklist,
  addGlobalBlacklist,
  createUser,
  deleteUser,
  getCaptchaSessions,
  getGlobalBlacklist,
  getLogs,
  getUserProfile,
  getUsers,
  removeBlacklist,
  removeGlobalBlacklist,
  updateSettings,
  updateUserRole,
  verifyCaptchaManually
} from './moderation.controller.js';
import moderationService from './moderation.service.js';

async function moderationRouters(fastify: FastifyInstance): Promise<void> {
  // Mevcut endpoint'ler
  fastify.get('/:chatId/settings', async (request: any, reply: any) => {
    try {
      const settings = await moderationService.getOrCreateSettings(request.params.chatId);
      return settings;
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });
  fastify.patch('/:chatId/settings', updateSettings);
  fastify.get('/:chatId/blacklist', async (request: any, reply: any) => {
    try {
      const blacklist = await moderationService.getBlacklistWords(request.params.chatId);
      return blacklist;
    } catch (err: any) {
      reply.code(500);
      return { error: err.message };
    }
  });
  fastify.post('/:chatId/blacklist', addBlacklist);
  fastify.delete('/:chatId/blacklist/:id', removeBlacklist);
  fastify.get('/:chatId/logs', getLogs);

  // CAPTCHA Yönetimi
  fastify.get('/:chatId/captcha', getCaptchaSessions);
  fastify.post('/captcha/:id/verify', verifyCaptchaManually);

  // Global Blacklist
  fastify.get('/global-blacklist', getGlobalBlacklist);
  fastify.post('/global-blacklist', addGlobalBlacklist);
  fastify.delete('/global-blacklist/:id', removeGlobalBlacklist);

  // Kullanıcı Profili
  fastify.get('/user/:userId/profile', getUserProfile);

  // RBAC Kullanıcı Yönetimi
  fastify.get('/users', getUsers);
  fastify.post('/users', createUser);
  fastify.patch('/users/:id/role', updateUserRole);
  fastify.delete('/users/:id', deleteUser);
}

export default moderationRouters;
