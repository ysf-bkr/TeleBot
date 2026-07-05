import { getDb } from '../db/index.js';

class CaptchaRepository {
  async createSession(chatId: string | number, userId: string | number, code: string, expiresAt: string): Promise<void> {
    const db = getDb();
    await db.insertInto('captcha_sessions').values({
      chat_id: String(chatId),
      user_id: String(userId),
      code,
      expires_at: expiresAt,
      verified: 0,
    }).execute();
  }

  async verify(chatId: string | number, userId: string | number, code: string): Promise<boolean> {
    const db = getDb();
    const session = await db.selectFrom('captcha_sessions')
      .selectAll()
      .where('chat_id', '=', String(chatId))
      .where('user_id', '=', String(userId))
      .where('code', '=', code)
      .where('verified', '=', 0)
      .where('expires_at', '>', new Date().toISOString())
      .executeTakeFirst();

    if (session) {
      await db.updateTable('captcha_sessions')
        .set({ verified: 1 })
        .where('id', '=', session.id)
        .execute();
      return true;
    }
    return false;
  }
}

export default new CaptchaRepository();
