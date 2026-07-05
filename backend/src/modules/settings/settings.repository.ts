import { getDb } from '../../db/index.js';

export interface BotConfig {
  id: number;
  token: string | null;
  welcome_message: string;
  welcome_enabled: number;
  parse_mode: string;
  webhook_domain: string | null;
  created_at: string;
  updated_at: string;
}

class ConfigRepository {
  async getConfig(): Promise<BotConfig> {
    const db = getDb();
    const config = await db
      .selectFrom('bot_config')
      .selectAll()
      .limit(1)
      .executeTakeFirst();

    if (!config) {
      const now = new Date().toISOString();
      const defaultMsg = '👋 Hoş geldin {first_name}!\nGrubumuza katıldığın için teşekkürler.\n\n{group_title}';
      await db
        .insertInto('bot_config')
        .values({
          token: null,
          welcome_message: defaultMsg,
          welcome_enabled: 1,
          parse_mode: 'HTML',
          created_at: now,
          updated_at: now,
        })
        .execute();
      return this.getConfig();
    }
    return config as BotConfig;
  }

  async updateConfig(data: Record<string, unknown>): Promise<BotConfig> {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = await this.getConfig();
    const updateData: Record<string, unknown> = {
      ...data,
      updated_at: now,
    };

    if (typeof updateData.welcome_enabled === 'boolean') {
      updateData.welcome_enabled = updateData.welcome_enabled ? 1 : 0;
    }

    await db
      .updateTable('bot_config')
      .set(updateData)
      .where('id', '=', existing.id)
      .execute();
    return this.getConfig();
  }

  async setToken(token: string): Promise<BotConfig> {
    const db = getDb();
    const existing = await this.getConfig();
    const now = new Date().toISOString();
    await db
      .updateTable('bot_config')
      .set({ token, updated_at: now })
      .where('id', '=', existing.id)
      .execute();
    return this.getConfig();
  }
}

export default new ConfigRepository();
