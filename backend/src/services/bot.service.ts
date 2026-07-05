// @ts-nocheck
import { Telegraf } from 'telegraf';
import { renderTemplate } from '../utils/template.js';
import type { BotStatus } from '../types/api.js';
import type { Server as SocketIOServer } from 'socket.io';

// Lazy services populated on first use (avoids top-level await issues)
let chatService: any;
let logService: any;
let moderationService: any;
let globalBlacklistRepo: any;

async function ensureServices() {
  if (!chatService) {
    const chatServiceMod: any = await import('../modules/chat/chat.service.js');
    chatService = chatServiceMod.default || chatServiceMod;
  }
  if (!logService) {
    const logServiceMod: any = await import('../modules/log/log.service.js');
    logService = logServiceMod.default || logServiceMod;
  }
  if (!moderationService) {
    const moderationServiceMod: any = await import('../modules/moderation/moderation.service.js');
    moderationService = moderationServiceMod.default || moderationServiceMod;
  }
  if (!globalBlacklistRepo) {
    const globalBlacklistRepoMod: any = await import('../repositories/globalBlacklist.repository.js');
    globalBlacklistRepo = globalBlacklistRepoMod.default || globalBlacklistRepoMod;
  }
}

// Multi-bot registry for high throughput
const bots = new Map<string, Telegraf>(); // token -> Telegraf instance
let ioInstance: SocketIOServer | null = null;
let botStatus: BotStatus = { connected: false };

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export function getBotInstance(token?: string): Telegraf | null {
  if (token) return bots.get(token) || null;
  // Fallback for single bot calls or scheduler context
  return bots.values().next().value || null;
}

export function getAllBots(): Map<string, Telegraf> {
  return bots;
}

export function getStatus(token?: string): BotStatus {
  const bot = token ? bots.get(token) : bots.values().next().value;
  if (!bot) {
    return { connected: false, lastError: botStatus.lastError || 'Bot başlatılmadı.' };
  }
  return botStatus;
}

export async function startBot(token: string): Promise<Telegraf | null> {
  if (!token) return null;

  if (bots.has(token)) {
    try { await bots.get(token)!.stop('SIGINT'); } catch (e) {}
    bots.delete(token);
  }

  try {
    await ensureServices();

    const bot = new Telegraf(token);
    bots.set(token, bot);

    // Get me
    const me = await bot.telegram.getMe();
    botStatus = {
      connected: true,
      username: me.username,
      first_name: me.first_name,
      id: me.id,
      lastError: null,
    };

    if (ioInstance) {
      ioInstance.emit('bot_status', {
        ...botStatus,
        timestamp: new Date().toISOString(),
      });
    }

    // my_chat_member - track when bot is added/removed from groups
    bot.on('my_chat_member', async (ctx) => {
      const chat = ctx.chat;
      const newStatus = ctx.myChatMember.new_chat_member.status;

      if (['member', 'administrator'].includes(newStatus)) {
        const saved = await chatService.saveChatFromBot({
          chatId: chat.id,
          title: (chat as any).title || (chat as any).first_name,
          type: (chat as any).type,
          username: (chat as any).username,
        });

        try {
          const count = await (bot.telegram as any).getChatMemberCount(chat.id);
          await chatService.updateMemberCount(String(chat.id), count);
        } catch (_) {}

        if (ioInstance) {
          ioInstance.emit('chat_updated', { action: 'added', chat: saved || chat });
        }
      } else if (['kicked', 'left'].includes(newStatus)) {
        if (ioInstance) {
          ioInstance.emit('chat_updated', { action: 'removed', chatId: String(chat.id) });
        }
      }
    });

    // new_chat_members - welcome (supports per-group overrides)
    bot.on('new_chat_members', async (ctx) => {
      try {
        const chat = ctx.chat;
        const newMembers = ctx.message.new_chat_members || [];

        const { getDb } = await import('../db/index.js');
        const db = getDb();
        const config = await db.selectFrom('bot_config').selectAll().executeTakeFirst();

        if (!config || !config.welcome_enabled) return;

        const chatRecord = await chatService.getChat(String(chat.id));
        if (chatRecord && (chatRecord as any).is_enabled === 0) return;

        // Global blacklist on join
        for (const u of newMembers) {
          if (await globalBlacklistRepo.isBlacklisted(u.id)) {
            await bot.telegram.kickChatMember(chat.id, u.id).catch(() => {});
            await moderationService.logAction({ chatId: chat.id, userId: u.id, username: u.username, firstName: u.first_name, action: 'ban', reason: 'Global spammer' });
            return;
          }
        }

        // Get effective message (per-group override or global)
        const effectiveMessage = await chatService.getEffectiveWelcomeMessage(
          String(chat.id),
          config.welcome_message
        );

        // Try to update member count
        try {
          const count = await (bot.telegram as any).getChatMemberCount(chat.id);
          await chatService.updateMemberCount(String(chat.id), count);
        } catch (_) {}

        await chatService.updateLastActivity?.(String(chat.id)); // optional

        const moderationSettings = await moderationService.getOrCreateSettings(chat.id).catch(() => null);

        for (const user of newMembers) {
          if (user.is_bot) continue;

          // Check Captcha first if enabled
          let hasCaptcha = false;
          let captchaMsgId: number | undefined;

          if (moderationSettings && moderationSettings.captcha_enabled === 1) {
            hasCaptcha = true;
            try {
              // Mute user
              await ctx.restrictChatMember(user.id, {
                permissions: {
                  can_send_messages: false,
                  can_send_polls: false,
                  can_send_other_messages: false,
                  can_add_web_page_previews: false,
                }
              });

              // Save session
              const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
              const code = String(Math.floor(1000 + Math.random() * 9000));
              await db.insertInto('captcha_sessions')
                .values({
                  chat_id: String(chat.id),
                  user_id: String(user.id),
                  code,
                  expires_at: expiresAt,
                  verified: 0
                })
                .execute();

              // Send button
              const captchaMsg = await ctx.reply(
                `🤖 <b>GÜVENLİK DOĞRULAMASI</b>\n\nHoş geldin <a href="tg://user?id=${user.id}">${user.first_name}</a>!\nGruba mesaj gönderebilmek için lütfen <b>60 saniye</b> içinde aşağıdaki doğrulama butonuna tıklayın.`, 
                {
                  parse_mode: 'HTML',
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: '✅ Ben İnsanım (Doğrula)',
                          callback_data: `captcha:${user.id}`
                        }
                      ]
                    ]
                  }
                }
              );
              captchaMsgId = captchaMsg.message_id;

              // Kick after 60s if not verified
              setTimeout(async () => {
                try {
                  const session = await db.selectFrom('captcha_sessions')
                    .selectAll()
                    .where('chat_id', '=', String(chat.id))
                    .where('user_id', '=', String(user.id))
                    .executeTakeFirst();
                  
                  if (session && session.verified === 0) {
                    await ctx.kickChatMember(user.id).catch(() => {});
                    if (captchaMsgId) {
                      await bot.telegram.deleteMessage(chat.id, captchaMsgId).catch(() => {});
                    }
                    await db.deleteFrom('captcha_sessions')
                      .where('chat_id', '=', String(chat.id))
                      .where('user_id', '=', String(user.id))
                      .execute();
                  }
                } catch (_) {}
              }, 60000);

            } catch (err: any) {
              console.error('[CAPTCHA] Hata oluştu:', err.message);
            }
          }

          const templateData = {
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            username: user.username || '',
            user_id: user.id,
            group_title: (chat as any).title || '',
            group_id: chat.id,
            group_username: (chat as any).username || '',
          };

          let text = renderTemplate(effectiveMessage, templateData);

          const options: any = {};
          if (config.parse_mode && config.parse_mode !== 'None') {
            options.parse_mode = config.parse_mode;
          }

          let sent = false;
          // Send welcome message if captcha is NOT active (or send it anyway as greeting)
          if (!hasCaptcha) {
            try {
              await ctx.reply(text, options);
              sent = true;
            } catch (err: any) {
              console.error('[BOT] Mesaj gönderilemedi:', err.message);
              try {
                await ctx.reply(text.replace(/<[^>]*>/g, ''));
                sent = true;
              } catch (_) {}
            }
          }

          const log = await logService.createActivityLog({
            chatId: chat.id,
            chatTitle: (chat as any).title,
            userId: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            eventType: 'join',
            messageSent: sent,
            messageText: text,
          });

          if (ioInstance) {
            ioInstance.emit('new_activity', {
              ...log,
              timestamp: log.timestamp,
            });
          }
        }
      } catch (err) {
        console.error('[BOT] new_chat_members hatası:', err);
      }
    });

    bot.on('left_chat_member', async (ctx) => {
      try {
        const chat = ctx.chat;
        const user = ctx.message.left_chat_member;
        if (!user || user.is_bot) return;

        // Try to update member count
        try {
          const count = await (bot.telegram as any).getChatMemberCount(chat.id);
          await chatService.updateMemberCount(String(chat.id), count);
        } catch (_) {}

        const log = await logService.createActivityLog({
          chatId: chat.id,
          chatTitle: (chat as any).title || String(chat.id),
          userId: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          eventType: 'leave',
          messageSent: false,
          messageText: 'Gruptan ayrıldı.',
        });

        if (ioInstance) {
          ioInstance.emit('new_activity', {
            ...log,
            timestamp: log.timestamp,
          });
        }
      } catch (err) {
        console.error('[BOT] left_chat_member hatası:', err);
      }
    });

    bot.command('ping', (ctx) => ctx.reply('Pong ✅ Bot aktif'));

    // === MODERATION & COMMUNITY MANAGEMENT ===

    // /rules command - show community rules
    bot.command('rules', async (ctx) => {
      try {
        const settings = await moderationService.getOrCreateSettings(ctx.chat.id);
        const text = settings.rules_text || 'Henüz kural tanımlanmadı.';
        await ctx.reply(`📜 <b>Grup Kuralları</b>\n\n${text}`, { parse_mode: 'HTML' });
      } catch (e) {}
    });



    // Moderation message handler (auto moderation)
    bot.on('text', async (ctx) => {
      try {
        if (!ctx.message || !ctx.from) return;

        const chatId = ctx.chat.id;
        const text = ctx.message.text || '';

        // Log message to activity feed
        try {
          const log = await logService.createActivityLog({
            chatId,
            chatTitle: (ctx.chat as any).title || String(chatId),
            userId: ctx.from.id,
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
            eventType: 'message',
            messageSent: false,
            messageText: text.length > 80 ? text.slice(0, 80) + '...' : text,
          });

          if (ioInstance) {
            ioInstance.emit('new_activity', {
              ...log,
              timestamp: log.timestamp,
            });
          }
        } catch (_) {}

        // Custom Commands check
        if (text.trim().startsWith('/')) {
          const cmdName = text.trim().slice(1).split(' ')[0].split('@')[0].toLowerCase();
          const { getDb } = await import('../db/index.js');
          const db = getDb();
          const cmdRecord = await db.selectFrom('custom_commands')
            .selectAll()
            .where('command', '=', cmdName)
            .where('is_active', '=', 1)
            .executeTakeFirst();
          
          if (cmdRecord) {
            await ctx.reply(cmdRecord.response, { parse_mode: 'HTML' }).catch(() => {});
            return;
          }
        }

        // Skip if message from admin/bot
        const member = await ctx.getChatMember(ctx.from.id).catch(() => null);
        if (member && ['administrator', 'creator'].includes(member.status)) return;

        const check = await moderationService.checkMessage(chatId, text, ctx.from);

        if (check.violated) {
          // Delete message if needed
          if (check.delete) {
            await ctx.deleteMessage().catch(() => {});
          }

          // Apply action
          if (check.action) {
            await moderationService.applyAction(ctx, check.action, check.reason, ctx.from, chatId);
          }

          // Log to panel
          const log = await moderationService.logAction({
            chatId,
            userId: ctx.from.id,
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            action: check.action || 'delete',
            reason: check.reason,
            messageText: text,
          });

          if (ioInstance) {
            ioInstance.emit('moderation_log', log);
          }
        }
      } catch (err) {
        // silent fail for moderation
      }
    });

    bot.action(/^captcha:(\d+)$/, async (ctx: any) => {
      try {
        const userId = ctx.match[1];
        const clickerId = ctx.from?.id;

        if (String(clickerId) !== String(userId)) {
          await ctx.answerCbQuery('⚠️ Bu doğrulama sizin için değil.').catch(() => {});
          return;
        }

        const { getDb } = await import('../db/index.js');
        const db = getDb();

        const session = await db.selectFrom('captcha_sessions')
          .selectAll()
          .where('chat_id', '=', String(ctx.chat?.id))
          .where('user_id', '=', String(userId))
          .executeTakeFirst();

        if (session) {
          // Unrestrict user
          await ctx.restrictChatMember(Number(userId), {
            permissions: {
              can_send_messages: true,
              can_send_polls: true,
              can_send_other_messages: true,
              can_add_web_page_previews: true,
            }
          }).catch(() => {});

          // Update DB
          await db.updateTable('captcha_sessions')
            .set({ verified: 1 })
            .where('id', '=', session.id)
            .execute();

          // Delete captcha message
          await ctx.deleteMessage().catch(() => {});

          await ctx.answerCbQuery('✅ Doğrulama başarılı! Hoş geldiniz.').catch(() => {});
        } else {
          await ctx.answerCbQuery('❌ Doğrulama oturumu bulunamadı.').catch(() => {});
        }
      } catch (err: any) {
        console.error('[CAPTCHA] Callback error:', err.message);
      }
    });

    // Admin commands (simple version - improve with admin check if needed)
    bot.command('warn', async (ctx) => {
      if (!ctx.message.reply_to_message) return ctx.reply('Bir kullanıcıya yanıt vererek /warn kullanın.');
      const target = ctx.message.reply_to_message.from;
      await moderationService.applyAction(ctx, 'warn', 'Yetkili tarafından uyarıldı', target, ctx.chat.id);
    });

    bot.command('kick', async (ctx) => {
      if (!ctx.message.reply_to_message) return ctx.reply('Yanıt vererek /kick kullanın.');
      const target = ctx.message.reply_to_message.from;
      await moderationService.applyAction(ctx, 'kick', 'Yetkili tarafından atıldı', target, ctx.chat.id);
    });

    bot.command('ban', async (ctx) => {
      if (!ctx.message.reply_to_message) return ctx.reply('Yanıt vererek /ban kullanın.');
      const target = ctx.message.reply_to_message.from;
      await moderationService.applyAction(ctx, 'ban', 'Yetkili tarafından yasaklandı', target, ctx.chat.id);
    });

    bot.command('mute', async (ctx) => {
      if (!ctx.message.reply_to_message) return ctx.reply('Yanıt vererek /mute kullanın.');
      const target = ctx.message.reply_to_message.from;
      await moderationService.applyAction(ctx, 'mute', 'Yetkili tarafından susturuldu', target, ctx.chat.id);
    });

    bot.catch((err) => {
      console.error('[BOT] Hata:', err);
      botStatus.lastError = (err as Error).message;
    });

    // === Webhook vs Polling ===
    const { getDb } = await import('../db/index.js');
    const db = getDb();
    const fullConfig = await db.selectFrom('bot_config').selectAll().executeTakeFirst();
    const webhookDomain = fullConfig?.webhook_domain;

    if (webhookDomain && webhookDomain.trim()) {
      const cleanDomain = webhookDomain.trim().replace(/\/+$/, '');
      const webhookUrl = `${cleanDomain}/webhooks/${token}`;

      try {
        await bot.telegram.setWebhook(webhookUrl, {
          allowed_updates: ['message', 'my_chat_member', 'chat_member'],
        });
        console.log(`[BOT] @${me.username} webhook aktif: ${webhookUrl}`);

        botStatus.usingWebhook = true;
        botStatus.webhookUrl = webhookUrl;

        if (ioInstance) {
          ioInstance.emit('bot_status', {
            ...botStatus,
            timestamp: new Date().toISOString(),
          });
        }
        // Do NOT call bot.launch() — webhook route will call handleUpdate
      } catch (webhookErr: any) {
        console.error('[BOT] Webhook ayarlama hatası (domain invalid olabilir):', webhookErr.message);
        botStatus.lastError = `Webhook domain hatası: ${webhookErr.message} — polling kullanılıyor.`;
        botStatus.usingWebhook = false;

        // Fallback to polling
        await bot.launch({
          allowedUpdates: ['message', 'my_chat_member', 'chat_member'],
        });
        console.log(`[BOT] @${me.username} polling'e geri dönüldü (webhook başarısız)`);
      }
    } else {
      // Default polling mode
      await bot.launch({
        allowedUpdates: ['message', 'my_chat_member', 'chat_member'],
      });
      console.log(`[BOT] @${me.username} başlatıldı (polling)`);
    }

    return bot;
  } catch (error: any) {
    botStatus = { connected: false, lastError: error.message };
    if (ioInstance) {
      ioInstance.emit('bot_status', { connected: false, error: error.message, timestamp: new Date().toISOString() });
    }
    console.error('[BOT] Başlatılamadı:', error.message);
    bots.delete(token);
    return null;
  }
}

export async function stopBot(token?: string): Promise<void> {
  if (token) {
    const bot = bots.get(token);
    if (bot) {
      try {
        await bot.stop();
        console.log(`[BOT] Durduruldu for token ${token.slice(0,10)}...`);
      } catch (e) {}
      bots.delete(token);
    }
  } else {
    // Legacy single-stop: stop the first one only (keep behavior close)
    const firstToken = bots.keys().next().value;
    if (firstToken) {
      const bot = bots.get(firstToken);
      if (bot) {
        try { await bot.stop(); console.log('[BOT] Durduruldu (first)'); } catch (e) {}
        bots.delete(firstToken);
      }
    }
  }
  botStatus.connected = bots.size > 0;
}

export async function restartBot(token?: string): Promise<Telegraf | null> {
  if (token) {
    await stopBot(token);
    return startBot(token);
  }
  await stopBot();
  // restart first available if any, or no-op
  const first = bots.keys().next().value;
  return first ? startBot(first) : null;
}

// Single-bot support functions
export async function startAllBots(io: SocketIOServer) {
  setSocketIO(io);
  const { getDb } = await import('../db/index.js');
  const db = getDb();
  try {
    let config = await db.selectFrom('bot_config').selectAll().executeTakeFirst();
    const now = new Date().toISOString();
    
    if (!config) {
      await db.insertInto('bot_config')
        .values({
          welcome_message: '👋 Hoş geldin {first_name}!\nGrubumuza katıldığın için teşekkürler.\n\n{group_title}',
          welcome_enabled: 1,
          parse_mode: 'HTML',
          webhook_domain: null,
          token: process.env.TELEGRAM_BOT_TOKEN || null,
          created_at: now,
          updated_at: now,
        })
        .execute();
      config = await db.selectFrom('bot_config').selectAll().executeTakeFirst();
    }

    if (config && config.token) {
      await startBot(config.token);
    } else {
      console.log('[BOT] No active bot token found to start.');
    }
  } catch (e: any) {
    console.log('[BOT] startAllBots error', e.message);
  }
  console.log(`[BOT] Single bot started: ${bots.size > 0}`);
}

export async function stopAllBots(): Promise<void> {
  for (const [t, b] of bots) {
    try { await b.stop(); } catch (_) {}
  }
  bots.clear();
  botStatus.connected = false;
}

export async function updateBotProfile(token: string, name?: string, description?: string): Promise<void> {
  const bot = bots.get(token);
  if (!bot) throw new Error('Aktif bot bağlantısı bulunamadı.');
  if (name) {
    await bot.telegram.setMyName(name);
  }
  if (description) {
    await bot.telegram.setMyDescription(description);
  }
}

// Default export object for backward compat with require() in mixed files
const botService = {
  startBot,
  stopBot,
  restartBot,
  getBotInstance,
  getStatus,
  setSocketIO,
  startAllBots,
  stopAllBots,
  getAllBots,
  updateBotProfile,
};

export default botService;
