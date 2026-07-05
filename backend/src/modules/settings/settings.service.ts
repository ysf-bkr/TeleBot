import botService from '../../services/bot.service.js';
import configRepo from './settings.repository.js';

export interface SettingsResponse {
  id: number;
  welcomeMessage: string;
  welcomeEnabled: boolean;
  parseMode: string;
  webhookDomain: string | null;
  token: string | null;
  updatedAt: string;
}

class SettingsService {
  async getSettings(): Promise<SettingsResponse> {
    const config = await configRepo.getConfig();
    return {
      id: config.id,
      welcomeMessage: config.welcome_message,
      welcomeEnabled: !!config.welcome_enabled,
      parseMode: config.parse_mode,
      webhookDomain: config.webhook_domain || null,
      token: config.token ? '********' + config.token.slice(-6) : null,
      updatedAt: config.updated_at,
    };
  }

  async getFullConfig() {
    return configRepo.getConfig();
  }

  async updateSettings({ welcomeMessage, welcomeEnabled, parseMode, webhookDomain }: any) {
    const data: Record<string, unknown> = {};
    if (welcomeMessage !== undefined) data.welcome_message = welcomeMessage;
    if (welcomeEnabled !== undefined) data.welcome_enabled = welcomeEnabled;
    if (parseMode !== undefined) data.parse_mode = parseMode;
    if (webhookDomain !== undefined) data.webhook_domain = webhookDomain || null;
    const updated = await configRepo.updateConfig(data);
    return {
      ...updated,
      welcome_enabled: !!updated.welcome_enabled,
      welcome_message: updated.welcome_message,
      webhook_domain: updated.webhook_domain,
    };
  }

  async setBotToken(token: string) {
    if (!token || token.length < 20) {
      throw new Error('Geçerli bir Telegram Bot Token girin');
    }
    await configRepo.setToken(token);
    return { success: true };
  }

  async getBotInfoFromTelegram() {
    const config = await configRepo.getConfig();
    if (!config.token) {
      throw new Error('Bot token ayarlanmamış');
    }
    let bot = botService.getBotInstance ? botService.getBotInstance() : null;
    if (bot) {
      return await bot.telegram.getMe();
    }
    const { Telegraf } = await import('telegraf');
    const tempBot = new Telegraf(config.token);
    return await tempBot.telegram.getMe();
  }
}

export default new SettingsService();
