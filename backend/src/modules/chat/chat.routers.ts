import { FastifyInstance } from 'fastify';
import {
  getChat, listChats,
  sendTestMessage,
  syncChatInfo,
  toggleChat, updateChat,
  updateChatPhoto,
  updateChatProfile,
  userAction
} from './chat.controller.js';
import {
  applyChatTemplate,
  broadcastMessage,
  createAutoReply,
  createChatTemplate,
  deleteAutoReply,
  deleteChatTemplate,
  exportChatSettings,
  getAutoReplies,
  getChatAdmins,
  getChatMembers,
  getChatMessages,
  getChatReports,
  getChatTemplates,
  getDeletedMessages, getEditedMessages,
  importChatSettings, leaveChat,
  removeChatAdmin,
  setChatAdmin
} from './chat.features.js';

async function chatRouters(fastify: FastifyInstance): Promise<void> {
  // Mevcut endpoint'ler
  fastify.get('/', listChats);
  fastify.get('/:chatId', getChat);
  fastify.patch('/:chatId/toggle', toggleChat);
  fastify.patch('/:chatId', updateChat);
  fastify.post('/:chatId/user-action', userAction);
  fastify.post('/:chatId/sync', syncChatInfo);
  fastify.patch('/:chatId/profile', updateChatProfile);
  fastify.patch('/:chatId/photo', updateChatPhoto);
  fastify.post('/:chatId/test-message', sendTestMessage);

  // 1. Grup Chat Geçmişi
  fastify.get('/:chatId/messages', getChatMessages);

  // 2. Kullanıcı Listesi
  fastify.get('/:chatId/members', getChatMembers);

  // 3. Yöneticiler
  fastify.get('/:chatId/admins', getChatAdmins);
  fastify.post('/:chatId/admins', setChatAdmin);
  fastify.delete('/:chatId/admins/:userId', removeChatAdmin);

  // 4. Otomatik Yanıtlayıcı
  fastify.get('/:chatId/auto-replies', getAutoReplies);
  fastify.post('/:chatId/auto-replies', createAutoReply);
  fastify.delete('/:chatId/auto-replies/:replyId', deleteAutoReply);

  // 5. Silinen/Düzenlenen Mesajlar
  fastify.get('/:chatId/deleted-messages', getDeletedMessages);
  fastify.get('/:chatId/edited-messages', getEditedMessages);

  // 6. Grup Şablonları
  fastify.get('/templates', getChatTemplates);
  fastify.post('/templates', createChatTemplate);
  fastify.post('/:chatId/templates/:templateId/apply', applyChatTemplate);
  fastify.delete('/templates/:templateId', deleteChatTemplate);

  // 7. Yedekleme / Export / Import
  fastify.get('/:chatId/export', exportChatSettings);
  fastify.post('/:chatId/import', importChatSettings);

  // 8. Gruptan Ayrılma
  fastify.post('/:chatId/leave', leaveChat);

  // 9. Toplu Mesaj
  fastify.post('/broadcast', broadcastMessage);

  // 10. Raporlar
  fastify.get('/:chatId/reports', getChatReports);
}

export default chatRouters;
