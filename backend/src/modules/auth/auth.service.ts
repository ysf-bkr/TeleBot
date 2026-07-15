import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '../../db/index.js';
import { generateToken } from '../../middleware/auth.js';
import workspaceRepository from '../../repositories/workspace.repository.js';
import botService from '../../services/bot.service.js';
import authRepository from './auth.repository.js';

interface TelegramAuthData {
  hash?: string;
  id: string | number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  auth_date?: string;
  isMock?: boolean;
}

export interface LoginResult {
  token: string;
  user: { id: string | number; username: string; role?: string; workspace_id?: number };
}

class AuthService {
  async getTelegramConfig(): Promise<{ botUsername: string | null }> {
    const allBots = botService.getAllBots();
    let botUsername = process.env.TELEGRAM_BOT_USERNAME || null;
    if (!botUsername && allBots.size > 0) {
      const botInstance = allBots.values().next().value;
      if (botInstance && botInstance.botInfo) {
        botUsername = botInstance.botInfo.username;
      }
    }
    return { botUsername };
  }

  /**
   * Kullanıcının workspace'ini bul veya oluştur
   */
  private async resolveWorkspace(userId: number, username: string): Promise<number | undefined> {
    // Kullanıcının zaten bir workspace'i var mı?
    const existingWorkspaces = await workspaceRepository.findByOwner(userId);
    if (existingWorkspaces.length > 0) {
      return existingWorkspaces[0].id;
    }

    // Yoksa yeni workspace oluştur
    try {
      const slug = `ws-${userId}-${Date.now().toString(36)}`;
      const workspace = await workspaceRepository.create({
        name: `${username}'s Workspace`,
        slug,
        owner_id: userId,
        plan_id: null, // Free plan default
        status: 'trial',
        bot_token: null,
        bot_username: null,
        settings: null,
      });
      return workspace?.id;
    } catch (err) {
      console.error('[AUTH] Workspace oluşturma hatası:', err);
      return undefined;
    }
  }

  async loginWithTelegram(authData: TelegramAuthData): Promise<LoginResult> {
    const { hash, ...data } = authData;
    const isDevMock = process.env.NODE_ENV !== 'production' && authData.isMock;
    if (!isDevMock && !hash) throw new Error('Telegram doğrulama verisi eksik');

    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      const allBots = botService.getAllBots();
      if (allBots.size > 0) botToken = allBots.keys().next().value;
    }

    if (!isDevMock) {
      if (!botToken) throw new Error('Sistemde aktif bot bulunamadı');
      const dataCheckArr: string[] = [];
      Object.keys(data).sort().forEach((key) => {
        if (key !== 'hash') dataCheckArr.push(`${key}=${(data as any)[key]}`);
      });
      const dataCheckString = dataCheckArr.join('\n');
      const secretKey = crypto.createHash('sha256').update(botToken).digest();
      const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      if (hmac !== hash) throw new Error('Telegram imza doğrulaması başarısız');
    }

    const tgUsername = authData.username || authData.first_name || String(authData.id);
    const dbUsername = `tg_${authData.id}`;
    let user = await authRepository.findByUsername(dbUsername);
    if (!user) {
      user = await authRepository.createUser({ username: dbUsername, passwordHash: 'N/A' });
    }

    const adminUsername = process.env.ADMIN_TELEGRAM_USERNAME || '';
    const isSuperAdmin = adminUsername && tgUsername.toLowerCase() === adminUsername.toLowerCase();
    const role = isSuperAdmin ? 'super_admin' : 'admin';

    // Workspace ID'sini bul
    const workspaceId = user ? await this.resolveWorkspace(user.id, tgUsername) : undefined;

    const token = generateToken({
      id: authData.id,
      username: tgUsername,
      role,
      workspace_id: workspaceId,
    });

    return {
      token,
      user: { id: authData.id, username: tgUsername, role, workspace_id: workspaceId },
    };
  }

  async registerWithEmail(email: string, password: string): Promise<LoginResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) throw new Error('E-posta ve şifre zorunludur');
    const existing = await authRepository.findByUsername(cleanEmail);
    if (existing) throw new Error('Bu e-posta adresi zaten kayıtlı');
    const passwordHash = bcrypt.hashSync(password, 10);
    const createdUser = await authRepository.createUser({ username: cleanEmail, passwordHash });
    if (!createdUser) throw new Error('Kullanıcı oluşturulurken bir hata oluştu');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const isSuperAdmin = cleanEmail.toLowerCase() === adminEmail.toLowerCase();
    const role = isSuperAdmin ? 'super_admin' : 'admin';

    // Workspace oluştur
    const workspaceId = await this.resolveWorkspace(createdUser.id, cleanEmail);

    const token = generateToken({
      id: createdUser.id,
      username: cleanEmail,
      role,
      workspace_id: workspaceId,
    });
    return {
      token,
      user: { id: createdUser.id, username: cleanEmail, role, workspace_id: workspaceId },
    };
  }

  async loginWithEmail(email: string, password: string): Promise<LoginResult> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await authRepository.findByUsername(cleanEmail);
    if (!user || user.password_hash === 'N/A') throw new Error('E-posta adresi veya şifre hatalı');
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) throw new Error('E-posta adresi veya şifre hatalı');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const isSuperAdmin = cleanEmail.toLowerCase() === adminEmail.toLowerCase();
    const role = isSuperAdmin ? 'super_admin' : 'admin';

    // Workspace ID'sini bul
    const workspaceId = await this.resolveWorkspace(user.id, cleanEmail);

    const token = generateToken({
      id: user.id,
      username: cleanEmail,
      role,
      workspace_id: workspaceId,
    });
    return {
      token,
      user: { id: user.id, username: cleanEmail, role, workspace_id: workspaceId },
    };
  }

  async forgotPassword(email: string): Promise<{ success: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await authRepository.findByUsername(cleanEmail);
    if (!user) {
      return { success: true };
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const db: any = getDb();
    try {
      const pragmaQuery: any = { sql: "PRAGMA table_info('panel_users')", parameters: [] };
      const tableInfo = await db.executeQuery(pragmaQuery);
      const hasResetToken = tableInfo.rows.some((r: any) => r.name === 'reset_token');
      if (!hasResetToken) {
        await db.executeQuery({ sql: "ALTER TABLE panel_users ADD COLUMN reset_token TEXT", parameters: [] });
        await db.executeQuery({ sql: "ALTER TABLE panel_users ADD COLUMN reset_token_expires TEXT", parameters: [] });
      }
      await db.updateTable('panel_users')
        .set({ reset_token: resetToken, reset_token_expires: new Date(Date.now() + 3600000).toISOString() })
        .where('id', '=', user.id)
        .execute();
    } catch (_) {}
    console.log(`[AUTH] Password reset requested for ${cleanEmail}. Token: ${resetToken}`);
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<LoginResult> {
    if (!token || !newPassword) throw new Error('Token ve yeni şifre zorunludur');
    const db: any = getDb();
    const user = await db.selectFrom('panel_users')
      .selectAll()
      .where('reset_token', '=', token)
      .where('reset_token_expires', '>', new Date().toISOString())
      .executeTakeFirst();
    if (!user) throw new Error('Geçersiz veya süresi dolmuş token');
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.updateTable('panel_users')
      .set({ password_hash: passwordHash, reset_token: null, reset_token_expires: null })
      .where('id', '=', user.id)
      .execute();

    const workspaceId = await this.resolveWorkspace(user.id, user.username);
    const token2 = generateToken({
      id: user.id,
      username: user.username,
      role: user.role || 'admin',
      workspace_id: workspaceId,
    });
    return {
      token: token2,
      user: { id: user.id, username: user.username, role: user.role || 'admin', workspace_id: workspaceId },
    };
  }
}

export default new AuthService();
