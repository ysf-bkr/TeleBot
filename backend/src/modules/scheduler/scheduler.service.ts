import { getDb } from '../../db/index.js';
import { getBotInstance } from '../../services/bot.service.js';

class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastPruneTime = 0;

  startRunner(io: any, intervalMs = 30000): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

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
  }): Promise<any> {
    const db = getDb();
    const now = new Date().toISOString();

    const insertData: any = {
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

    const result = await db.insertInto('scheduled_posts')
      .values(insertData)
      .execute();

    return result;
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

  async getPosts(): Promise<any[]> {
    const db = getDb();
    return db.selectFrom('scheduled_posts')
      .selectAll()
      .orderBy('scheduled_at', 'desc')
      .execute();
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
        if (!bot) {
          console.warn(`[SCHEDULER] No bot instance active to send scheduled post ID ${post.id}`);
          continue;
        }

        try {
          const options: any = {
            parse_mode: (post.parse_mode as any) || 'HTML',
          };

          // Parse markup if buttons are present
          if (post.buttons) {
            try {
              const keyboard = JSON.parse(post.buttons);
              options.reply_markup = keyboard;
            } catch (err: any) {
              console.error(`[SCHEDULER] Invalid JSON buttons in post ${post.id}:`, err.message);
            }
          }

          const sentMsg = await bot.telegram.sendMessage(post.chat_id, post.content, options);

          await db.updateTable('scheduled_posts')
            .set({
              status: 'sent',
              sent_at: now,
              message_id: String(sentMsg.message_id),
            })
            .where('id', '=', post.id)
            .execute();

          console.log(`[SCHEDULER] Sent scheduled post ID ${post.id} to chat ${post.chat_id}`);

          // Repeat interval logic - create next occurrence
          if (post.repeat_interval) {
            const nextDate = this.getNextRepeatDate(post.scheduled_at, post.repeat_interval);
            const nextDateStr = nextDate.toISOString();
            const existingNext = await db.selectFrom('scheduled_posts')
              .selectAll()
              .where('chat_id', '=', post.chat_id)
              .where('content', '=', post.content)
              .where('scheduled_at', '=', nextDateStr)
              .where('status', '=', 'pending')
              .executeTakeFirst();

            if (!existingNext) {
              await db.insertInto('scheduled_posts')
                .values({
                  chat_id: post.chat_id,
                  content: post.content,
                  parse_mode: post.parse_mode,
                  buttons: post.buttons,
                  auto_delete_after: post.auto_delete_after,
                  repeat_interval: post.repeat_interval,
                  scheduled_at: nextDateStr,
                  status: 'pending',
                  message_id: null,
                  created_at: now,
                })
                .execute();
              console.log(`[SCHEDULER] Created next recurring post for ID ${post.id} scheduled at ${nextDateStr}`);
            }
          }
        } catch (err: any) {
          console.error(`[SCHEDULER] Failed to send post ID ${post.id}:`, err.message);

          await db.updateTable('scheduled_posts')
            .set({
              status: 'failed',
            })
            .where('id', '=', post.id)
            .execute();
        }
      }
    } catch (e: any) {
      console.error('[SCHEDULER] Runner send error:', e.message);
    }
  }

  private async deleteExpiredPosts(): Promise<void> {
    const db = getDb();
    const nowTime = Date.now();

    try {
      const sent = await db.selectFrom('scheduled_posts')
        .selectAll()
        .where('status', '=', 'sent')
        .where('auto_delete_after', 'is not', null)
        .where('message_id', 'is not', null)
        .execute();

      for (const post of sent) {
        if (!post.sent_at || !post.auto_delete_after || !post.message_id) continue;

        const sentTime = new Date(post.sent_at).getTime();
        const deleteAt = sentTime + (post.auto_delete_after * 60 * 1000); // convert minutes to ms

        if (nowTime >= deleteAt) {
          const bot = getBotInstance();
          if (bot) {
            try {
              await bot.telegram.deleteMessage(post.chat_id, Number(post.message_id));
              console.log(`[SCHEDULER] Deleted expired post ID ${post.id} from chat ${post.chat_id}`);
            } catch (err: any) {
              console.error(`[SCHEDULER] Failed to delete message ${post.message_id} in chat ${post.chat_id}:`, err.message);
            }
          }

          await db.updateTable('scheduled_posts')
            .set({
              status: 'deleted',
            })
            .where('id', '=', post.id)
            .execute();
        }
      }
    } catch (e: any) {
      console.error('[SCHEDULER] Runner delete error:', e.message);
    }
  }

  private async pruneOldLogs(): Promise<void> {
    const now = Date.now();
    if (now - this.lastPruneTime < 86400000) return;

    this.lastPruneTime = now;
    console.log('[SCHEDULER] GDPR/KVKK Uyum temizliği başlatılıyor...');

    try {
      const db = getDb();
      const cutoffDate = new Date(Date.now() - 90 * 86400000).toISOString();

      await db.deleteFrom('logs')
        .where('timestamp', '<', cutoffDate)
        .execute();

      console.log(`[SCHEDULER] GDPR/KVKK: 90 günden eski chat logları başarıyla temizlendi.`);
    } catch (err: any) {
      console.error('[SCHEDULER] GDPR/KVKK temizlik hatası:', err.message);
    }
  }
}

export default new SchedulerService();
