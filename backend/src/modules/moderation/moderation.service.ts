import blacklistRepo from '../../repositories/blacklist.repository.js';
import globalBlacklist from '../../repositories/globalBlacklist.repository.js';
import moderationLogRepo from '../../repositories/moderationLog.repository.js';
import moderationRepo from './moderation.repository.js';

class ModerationService {
  async getOrCreateSettings(chatId: string | number): Promise<any> {
    return moderationRepo.getSettings(chatId);
  }

  async updateSettings(chatId: string | number, data: Record<string, any>): Promise<void> {
    return moderationRepo.updateSettings(chatId, data);
  }

  async getBlacklistWords(_chatId: string | number): Promise<any[]> {
    return blacklistRepo.getWordsForChat('global');
  }

  async addBlacklistWord(_chatId: string | number, word: string): Promise<void> {
    return blacklistRepo.addWord('global', word);
  }

  async removeBlacklistWord(id: number, _chatId: string | number): Promise<void> {
    return blacklistRepo.removeWord(id, 'global');
  }

  async checkWithGemini(text: string): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { violated: false };

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Sen bir Telegram grubu yapay zeka moderatörüsün. Aşağıdaki mesajı analiz et ve kuralları (ağır küfür, nefret söylemi, taciz, dolandırıcılık, yasadışı reklam) ihlal edip etmediğini belirle.
Sonucu tam olarak şu JSON şablonunda döndür (başka hiçbir metin veya markdown backtick ekleme, sadece saf JSON):
{"violated": true, "reason": "ihlal nedeni açıklaması", "action": "delete" | "warn" | "none"}

Analiz edilecek mesaj: "${text.replace(/"/g, '\\"')}"`
            }]
          }]
        })
      });

      const data = await response.json() as any;
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      return result;
    } catch (err) {
      console.error('[AI MODERATION] Gemini API çağrı hatası:', err);
      return { violated: false };
    }
  }

  async checkMessage(chatId: string | number, text = '', user: any): Promise<any> {
    const settings = await this.getOrCreateSettings(chatId);
    if (!settings.enabled) return { violated: false };

    const lowerText = (text || '').toLowerCase();

    if (user && await globalBlacklist.isBlacklisted(user.id)) {
      return { violated: true, reason: 'Global spammer', action: 'ban', delete: true };
    }

    if (settings.auto_delete_bad_words) {
      const badWords = await this.getBlacklistWords(chatId);
      for (const bw of badWords) {
        const pattern = bw.word.startsWith('/') ? new RegExp(bw.word.slice(1), 'i') : bw.word.toLowerCase();
        if (typeof pattern === 'string' ? lowerText.includes(pattern) : pattern.test(text)) {
          return { violated: true, reason: `Yasaklı: ${bw.word}`, action: settings.auto_warn ? 'warn' : 'delete', delete: true };
        }
      }
    }

    if (settings.auto_delete_links && /https?:\/\/|t\.me|telegram\.me/i.test(text)) {
      return { violated: true, reason: 'Link', action: settings.auto_warn ? 'warn' : 'delete', delete: true };
    }

    if (settings.spam_threshold > 0) {
      const caps = (text.match(/[A-ZĞÜŞİÖÇ]/g) || []).length;
      if (caps > settings.spam_threshold * 3 && text.length > 10) {
        return { violated: true, reason: 'Flood/Spam', action: 'warn', delete: true };
      }
    }

    // Yapay Zeka Destekli Moderasyon (Google Gemini API)
    if (settings.ai_moderation_enabled && text.trim().length > 3) {
      const aiResult = await this.checkWithGemini(text);
      if (aiResult && aiResult.violated) {
        return { 
          violated: true, 
          reason: `Yapay Zeka: ${aiResult.reason || 'Kural İhlali'}`, 
          action: aiResult.action === 'none' ? 'delete' : (aiResult.action || 'delete'), 
          delete: true 
        };
      }
    }

    return { violated: false };
  }

  async logAction(data: any): Promise<any> {
    return moderationLogRepo.createLog(data);
  }

  async getLogs(chatId: string | number, limit = 30): Promise<any[]> {
    return moderationLogRepo.getLogs({ chatId, limit });
  }

  async applyAction(ctx: any, action: string, reason: string, user: any, chatId: string | number): Promise<void> {
    const targetUser = user || ctx.from;

    try {
      if (action === 'delete' && ctx.message) {
        await ctx.deleteMessage().catch(() => {});
      }

      if (action === 'warn') {
        await this.logAction({ chatId, userId: targetUser.id, username: targetUser.username, firstName: targetUser.first_name, action: 'warn', reason, messageText: ctx.message?.text });
        await ctx.reply(`⚠️ @${targetUser.username || targetUser.first_name} uyarıldı. Sebep: ${reason}`);
      }

      if (action === 'kick') {
        await ctx.kickChatMember(targetUser.id);
        await this.logAction({ chatId, userId: targetUser.id, username: targetUser.username, firstName: targetUser.first_name, action: 'kick', reason });
        await ctx.reply(`👢 @${targetUser.username || targetUser.first_name} gruptan atıldı.`);
      }

      if (action === 'ban') {
        await ctx.banChatMember(targetUser.id);
        await this.logAction({ chatId, userId: targetUser.id, username: targetUser.username, firstName: targetUser.first_name, action: 'ban', reason });
        await ctx.reply(`🚫 @${targetUser.username || targetUser.first_name} yasaklandı.`);
      }

      if (action === 'mute') {
        const until = Math.floor(Date.now() / 1000) + 3600;
        await ctx.restrictChatMember(targetUser.id, { until_date: until, can_send_messages: false });
        await this.logAction({ chatId, userId: targetUser.id, username: targetUser.username, firstName: targetUser.first_name, action: 'mute', reason });
        await ctx.reply(`🔇 @${targetUser.username || targetUser.first_name} susturuldu (1 saat).`);
      }
    } catch (err: any) {
      console.error('[MOD] Action failed:', err.message);
      await ctx.reply('⚠️ İşlem gerçekleştirilemedi. Bot yönetici yetkisine sahip mi?').catch(() => {});
    }
  }
}

export default new ModerationService();
