import { FastifyReply, FastifyRequest } from 'fastify';
import botService from '../../services/bot.service.js';
import settingsService from './settings.service.js';

async function getSettings(request: FastifyRequest, reply: FastifyReply) {
  try {
    const settings = await settingsService.getSettings();
    return settings;
  } catch (e) {
    reply.code(500);
    return { error: 'Failed to load settings' };
  }
}

async function updateSettings(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { welcomeMessage, welcomeEnabled, parseMode, webhookDomain } = request.body as any;
    const updated = await settingsService.updateSettings({
      welcomeMessage,
      welcomeEnabled,
      parseMode,
      webhookDomain,
    });
    if ((request as any).io) (request as any).io.emit('settings_updated', updated);
    return updated;
  } catch (e) {
    reply.code(500);
    return { error: 'Failed to update settings' };
  }
}

async function setToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { token } = request.body as any;
    await settingsService.setBotToken(token);
    try {
      await botService.startBot(token);
      if ((request as any).io) {
        (request as any).io.emit('bot_status', { connected: true, restarting: true });
      }
    } catch (restartErr: any) {
      console.error('Bot restart after token update failed:', restartErr.message);
    }
    return { success: true, message: 'Token updated. Bot restarted.' };
  } catch (e: any) {
    reply.code(400);
    return { error: e.message };
  }
}

async function getBotInfo(request: FastifyRequest, reply: FastifyReply) {
  try {
    const info = await settingsService.getBotInfoFromTelegram();
    return info;
  } catch (e: any) {
    reply.code(400);
    return { error: e.message || 'Failed to fetch bot info' };
  }
}

export { getBotInfo, getSettings, setToken, updateSettings };
