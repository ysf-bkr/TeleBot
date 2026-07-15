import { getDb } from '../../db/index.js';
import { getBotInstance } from '../../services/bot.service.js';

class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastPruneTime = 0;

  startRunner(io: any, intervalMs = 30000): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(async () => {
      await this.sendPendingPosts();
      await this.deleteExpiredPosts();
      await this.pruneOldLogs();
    }, intervalMs);
    console.log(`[SCHEDULER] Service runner started with interval ${intervalMs}ms`);
  }

  stopRunner(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[SCHEDULER] Service runner stopped');
    }
  }

  async createPost(data: {
    chatId: string;
    content: string;
    scheduledAt: string;
    parseMode?: string | null;
    autoDeleteAfter?: number | null;
    buttons?: string | null;
    repeatInterval?: string | null;
  }, workspaceId?: number): Promise<any> {
    const db = getDb();
    const now = new Date().toISOString();
    const insertData: any = {
      workspace_id: workspaceId || null,
      chat_id: String(data.chatId),
      content: data.content,
      scheduled_at: data.scheduledAt,
      parse_mode: data.parseMode || 'HTML',
      buttons: data.buttons || null,
      auto_delete_after: data.autoDeleteAfter || null,
      repeat_interval: data.repeatInterval || null,
      status: 'pending',
      message_id: null,
      created_at: now,
    };
    return db.insertInto('scheduled_posts').values(insertData).execute();
  }

  private getNextRepeatDate(scheduledAt: string, interval: string): Date {
    const date = new Date(scheduledAt);
    switch (interval) {
      case 'daily': date.setDate(date.getDate() + 1); break;
      case 'weekly': date.setDate(date.getDate() + 7); break;
      case 'monthly': date.setMonth(date.getMonth() + 1); break;
    }
    return date;
  }

  async getPosts(workspaceId?: number): Promise<any[]> {
    const db = getDb();
    let query = db.selectFrom('scheduled_posts').selectAll() as any;
    if (workspaceId) query = query.where('workspace_id', '=', workspaceId);
    return query.orderBy('scheduled_at', 'desc').execute();
  }

  private async sendPendingPosts(): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    try {
      const pending = await db.selectFrom('scheduled_posts')
        .selectAll()
        .where('status', '=', 'pending')
        .where('scheduled_at', '<=', now)
        .execute();
      for (const post of pending) {
        const bot = getBotInstance();
        if (!bot) { console.warn(`[SCHEDULER] No bot instance`); continue; }
        try {
          const options: any = { parse_mode: (post.parse_mode as any) || 'HTML' };
          if (post.buttons) {
            try { const keyboard = JSON.parse(post.buttons); options.reply_markup = keyboard; } catch (_) {}
          }
          const sentMsg = await bot.telegram.sendMessage(post.chat_id, post.content, options);
          await db.updateTable('scheduled_posts').set({ status: 'sent', sent_at: now, message_id: String(sentMsg.message_id) }).where('id', '=', post.id).execute();
          console.log(`[SCHEDULER] Sent post ID ${post.id} to chat ${post.chat_id}`);
          if (post.repeat_interval) {
            const nextDate = this.getNextRepeatDate(post.scheduled_at, post.repeat_interval).toISOString();
            const existingNext = await db.selectFrom('scheduled_posts').selectAll().where('chat_id', '=', post.chat_id).where('content', '=', post.content).where('scheduled_at', '=', nextDate).where('status', '=', 'pending').executeTakeFirst();
            if (!existingNext) {
              await db.insertInto('scheduled_posts').values({ workspace_id: post.workspace_id, chat_id: post.chat_id, content: post.content, parse_mode: post.parse_mode, buttons: post.buttons, auto_delete_after: post.auto_delete_after, repeat_interval: post.repeat_interval, scheduled_at: nextDate, status: 'pending', message_id: null, created_at: now }).execute();
            }
          }
        } catch (err: any) {
          console.error(`[SCHEDULER] Failed to send post ID ${post.id}:`, err.message);
          await db.updateTable('scheduled_posts').set({ status: 'failed' }).where('id', '=', post.id).execute();
        }
      }
    } catch (e: any) { console.error('[SCHEDULER] Runner error:', e.message); }
  }

  private async deleteExpiredPosts(): Promise<void> {
    const db = getDb();
    const nowTime = Date.now();
    try {
      const sent = await db.selectFrom('scheduled_posts').selectAll().where('status', '=', 'sent').where('auto_delete_after', 'is not', null).where('message_id', 'is not', null).execute();
      for (const post of sent) {
        if (!post.sent_at || !post.auto_delete_after || !post.message_id) continue;
        const deleteAt = new Date(post.sent_at).getTime() + (post.auto_delete_after * 60 * 1000);
        if (nowTime >= deleteAt) {
          const bot = getBotInstance();
          if (bot) { try { await bot.telegram.deleteMessage(post.chat_id, Number(post.message_id)); } catch (_) {} }
          await db.updateTable('scheduled_posts').set({ status: 'deleted' }).where('id', '=', post.id).execute();
        }
      }
    } catch (e: any) { console.error('[SCHEDULER] Delete error:', e.message); }
  }

  private async pruneOldLogs(): Promise<void> {
    const now = Date.now();
    if (now - this.lastPruneTime < 86400000) return;
    this.lastPruneTime = now;
    try {
      const db = getDb();
      await db.deleteFrom('logs').where('timestamp', '<', new Date(Date.now() - 90 * 86400000).toISOString()).execute();
      console.log(`[SCHEDULER] 90+ day old logs cleaned.`);
    } catch (err: any) { console.error('[SCHEDULER] Prune error:', err.message); }
  }
}

export default new SchedulerService();
