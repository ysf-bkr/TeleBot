import {
  AlertTriangle,
  Ban,
  Camera,
  FileText,
  Globe,
  Key,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
  Webhook
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { flex, grid, stack } from '../../../styled-system/patterns';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Spinner } from '../../components/ui/Spinner';
import { moderation as moderationApi } from '../../lib/api';

import { BlacklistWord, Chat, ModerationLog } from '../../types';

const token = () => localStorage.getItem('token');
const api = (url: string, opts?: any) => fetch(url, {
  ...opts,
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }
}).then(r => r.json());

export function ModerationView({ chats, onRefreshChats }: { chats: Chat[]; onRefreshChats: () => void }) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [blacklist, setBlacklist] = useState<BlacklistWord[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('settings');

  // CAPTCHA
  const [captchaSessions, setCaptchaSessions] = useState<any[]>([]);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  // Global Blacklist
  const [globalBlacklist, setGlobalBlacklist] = useState<any[]>([]);
  const [loadingGlobalBL, setLoadingGlobalBL] = useState(false);
  const [newGlobalUserId, setNewGlobalUserId] = useState('');
  const [newGlobalReason, setNewGlobalReason] = useState('');

  // Kullanıcı Profili
  const [searchUserId, setSearchUserId] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Webhook Test
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // RBAC
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const activeChats = chats.filter(c => c.is_enabled);

  const fetchModerationData = async (chatId: string) => {
    if (!chatId) return;
    setLoading(true);
    try {
      const [s, b, l] = await Promise.all([
        moderationApi.getSettings(chatId),
        moderationApi.getBlacklist(chatId),
        moderationApi.getLogs(chatId, 20),
      ]);
      setSettings(s.data);
      setBlacklist(b.data);
      setLogs(l.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeChats.length > 0 && !selectedChatId) {
      setSelectedChatId(activeChats[0].chat_id);
    }
  }, [chats]);

  useEffect(() => {
    if (selectedChatId) {
      fetchModerationData(selectedChatId);
    }
  }, [selectedChatId]);

  // CAPTCHA
  const fetchCaptcha = async () => {
    if (!selectedChatId) return;
    setLoadingCaptcha(true);
    const data = await api(`/api/moderation/${selectedChatId}/captcha`);
    if (Array.isArray(data)) setCaptchaSessions(data);
    setLoadingCaptcha(false);
  };

  const handleVerifyCaptcha = async (id: number) => {
    const data = await api(`/api/moderation/captcha/${id}/verify`, { method: 'POST' });
    if (data.error) return toast.error(`Doğrulama başarısız: ${data.error}`);
    toast.success('CAPTCHA manuel olarak doğrulandı');
    fetchCaptcha();
  };

  // Global Blacklist
  const fetchGlobalBL = async () => {
    setLoadingGlobalBL(true);
    const data = await api('/api/moderation/global-blacklist');
    if (Array.isArray(data)) setGlobalBlacklist(data);
    setLoadingGlobalBL(false);
  };

  const handleAddGlobal = async () => {
    if (!newGlobalUserId) return;
    const data = await api('/api/moderation/global-blacklist', {
      method: 'POST', body: JSON.stringify({ userId: newGlobalUserId, reason: newGlobalReason })
    });
    if (data.error) return toast.error(`Eklenemedi: ${data.error}`);
    toast.success('Global kara listeye eklendi!');
    setNewGlobalUserId('');
    setNewGlobalReason('');
    fetchGlobalBL();
  };

  const handleRemoveGlobal = async (id: number) => {
    const data = await api(`/api/moderation/global-blacklist/${id}`, { method: 'DELETE' });
    if (data.error) return toast.error(`Silinemedi: ${data.error}`);
    toast.success('Global kara listeden kaldırıldı');
    fetchGlobalBL();
  };

  // Kullanıcı Profili
  const handleSearchUser = async () => {
    if (!searchUserId) return;
    setLoadingProfile(true);
    const data = await api(`/api/moderation/user/${searchUserId}/profile`);
    if (data.error) return toast.error(`Kullanıcı bulunamadı: ${data.error}`);
    setUserProfile(data);
    setLoadingProfile(false);
  };

  // Webhook Test
  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setTestingWebhook(true);
    const data = await api('/api/chats/test-webhook', {
      method: 'POST', body: JSON.stringify({ url: webhookUrl })
    });
    setWebhookResult(data);
    if (data.success) toast.success(`Webhook çalışıyor! (${data.duration})`);
    else toast.error(`Webhook hatası: ${data.statusCode || data.error}`);
    setTestingWebhook(false);
  };

  // RBAC
  const fetchUsers = async () => {
    setLoadingUsers(true);
    const data = await api('/api/moderation/users');
    if (Array.isArray(data)) setUsers(data);
    setLoadingUsers(false);
  };

  const handleUpdateRole = async (id: number, role: string) => {
    const data = await api(`/api/moderation/users/${id}/role`, {
      method: 'PATCH', body: JSON.stringify({ role })
    });
    if (data.error) return toast.error(`Rol güncellenemedi: ${data.error}`);
    toast.success('Kullanıcı rolü güncellendi!');
    fetchUsers();
  };

  const saveSettings = async () => {
    if (!selectedChatId || !settings) return;
    try {
      await moderationApi.updateSettings(selectedChatId, settings);
      toast.success('Moderasyon ayarları kaydedildi');
      fetchModerationData(selectedChatId);
    } catch (e) {
      toast.error('Ayarlar kaydedilemedi');
    }
  };

  const addWord = async () => {
    if (!newWord.trim() || !selectedChatId) return;
    try {
      await moderationApi.addBlacklist(selectedChatId, newWord.trim());
      setNewWord('');
      fetchModerationData(selectedChatId);
      toast.success('Kelime kara listeye eklendi');
    } catch (e) {
      toast.error('Kelime eklenemedi');
    }
  };

  const removeWord = async (id: number) => {
    if (!selectedChatId) return;
    if (!confirm('Yasaklı kelimeyi silmek istediğinize emin misiniz?')) return;
    try {
      await moderationApi.removeBlacklist(selectedChatId, id);
      fetchModerationData(selectedChatId);
      toast.success('Kelime kara listeden kaldırıldı');
    } catch (e) {
      toast.error('Kelime kaldırılamadı');
    }
  };

  const onTabChange = (newTab: string) => {
    setTab(newTab);
    if (newTab === 'captcha') fetchCaptcha();
    if (newTab === 'global-bl') fetchGlobalBL();
    if (newTab === 'users') fetchUsers();
  };

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '6', color: 'textMain' })}>
      <PageHeader title="Gelişmiş Moderasyon" description="Otomatik filtreler, kara liste, CAPTCHA, kullanıcı yönetimi" icon={<Shield size={26} />} />

      {/* Tab Bar */}
      <div className={flex({ gap: '1', borderBottom: '1px solid token(colors.borderMain)', pb: '2', overflowX: 'auto' })}>
        {[
          { id: 'settings', label: 'Ayarlar', icon: Shield },
          { id: 'captcha', label: 'CAPTCHA', icon: Camera },
          { id: 'global-bl', label: 'Global Kara Liste', icon: Globe },
          { id: 'user-profile', label: 'Kullanıcı Profili', icon: Search },
          { id: 'webhook', label: 'Webhook Test', icon: Webhook },
          { id: 'users', label: 'Kullanıcı Rolleri', icon: Users },
        ].map(t => (
          <button key={t.id} onClick={() => onTabChange(t.id)}
            className={css({
              display: 'flex', alignItems: 'center', gap: '1', px: '3', py: '1.5', borderRadius: 'lg', fontSize: '12px',
              fontWeight: tab === t.id ? '600' : '500', bg: tab === t.id ? 'primary' : 'transparent',
              color: tab === t.id ? 'white' : 'textMain', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
              _hover: { bg: tab === t.id ? 'primaryHover' : 'bgButtonSecondary' }
            })}><t.icon size={13} /> {t.label}</button>
        ))}
      </div>

      {/* TAB: Settings */}
      {tab === 'settings' && <>
        <div className={flex({ gap: '2', align: 'center', flexWrap: 'wrap' })}>
          <span className={css({ fontSize: 'sm', color: 'textMuted' })}>Grup:</span>
          {activeChats.length === 0 && <span className={css({ color: 'textMuted', fontSize: 'sm' })}>Önce aktif bir grup ekleyin.</span>}
          {activeChats.map(chat => {
            const isActive = selectedChatId === chat.chat_id;
            return (
              <button key={chat.chat_id} onClick={() => setSelectedChatId(chat.chat_id)}
                className={css({
                  px: '3.5', py: '1.5', borderRadius: 'lg', fontSize: 'sm', fontWeight: isActive ? '600' : '500',
                  borderWidth: '1px', borderStyle: 'solid', borderColor: isActive ? 'primary' : 'borderMain',
                  bg: isActive ? 'primary' : 'bgSurface', color: isActive ? 'white' : 'textMain',
                  transition: 'all 0.1s', _hover: { borderColor: 'primary' }
                })}>{chat.title || chat.chat_id}</button>
            );
          })}
          <Button size="sm" variant="ghost" onClick={onRefreshChats}><RefreshCw size={16} /></Button>
        </div>

        {!selectedChatId && <div className={css({ color: 'textMuted' })}>Lütfen bir grup seçin.</div>}

        {selectedChatId && settings && (
          <div className={grid({ columns: { base: 1, lg: 2 }, gap: '6' })}>
            {/* Settings */}
            <Card>
              <div className={flex({ align: 'center', gap: '2', mb: '4' })}>
                <div className={css({ p: '1.5', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'primary' })}><Shield size={18} /></div>
                <div className={css({ fontWeight: '600' })}>Moderasyon Ayarları</div>
              </div>
              <div className={stack({ gap: '4' })}>
                <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', cursor: 'pointer' })}>
                  <input type="checkbox" checked={!!settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked ? 1 : 0 })}
                    className={css({ accentColor: 'token(colors.primary)', w: '4', h: '4', cursor: 'pointer' })} /> Moderasyon aktif
                </label>
                <div>
                  <div className={css({ fontSize: 'sm', mb: '1.5', display: 'flex', alignItems: 'center', gap: '1' })}>
                    <FileText size={14} /> Topluluk Kuralları
                  </div>
                  <Textarea value={settings.rules_text || ''} onChange={e => setSettings({ ...settings, rules_text: e.target.value })}
                    placeholder="Grup kurallarını buraya yazın..." />
                </div>
                <div className={grid({ columns: { base: 1, sm: 2 }, gap: '3' })}>
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', cursor: 'pointer' })}>
                    <input type="checkbox" checked={!!settings.auto_delete_bad_words} onChange={e => setSettings({ ...settings, auto_delete_bad_words: e.target.checked ? 1 : 0 })}
                      className={css({ accentColor: 'token(colors.primary)', w: '4', h: '4', cursor: 'pointer' })} /> Yasaklı kelimeleri sil
                  </label>
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', cursor: 'pointer' })}>
                    <input type="checkbox" checked={!!settings.auto_delete_links} onChange={e => setSettings({ ...settings, auto_delete_links: e.target.checked ? 1 : 0 })}
                      className={css({ accentColor: 'token(colors.primary)', w: '4', h: '4', cursor: 'pointer' })} /> Linkleri sil
                  </label>
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', cursor: 'pointer' })}>
                    <input type="checkbox" checked={!!settings.captcha_enabled} onChange={e => setSettings({ ...settings, captcha_enabled: e.target.checked ? 1 : 0 })}
                      className={css({ accentColor: 'token(colors.primary)', w: '4', h: '4', cursor: 'pointer' })} /> 🤖 CAPTCHA Koruması
                  </label>
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', cursor: 'pointer' })}>
                    <input type="checkbox" checked={!!settings.ai_moderation_enabled} onChange={e => setSettings({ ...settings, ai_moderation_enabled: e.target.checked ? 1 : 0 })}
                      className={css({ accentColor: 'token(colors.primary)', w: '4', h: '4', cursor: 'pointer' })} /> ✨ Gemini AI Moderasyonu
                  </label>
                </div>
                <div className={grid({ columns: { base: 1, sm: 2 }, gap: '3' })}>
                  <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', cursor: 'pointer' })}>
                    <input type="checkbox" checked={!!settings.auto_warn} onChange={e => setSettings({ ...settings, auto_warn: e.target.checked ? 1 : 0 })}
                      className={css({ accentColor: 'token(colors.primary)', w: '4', h: '4', cursor: 'pointer' })} /> Otomatik uyarı
                  </label>
                  <div>
                    <div className={css({ fontSize: 'sm', mb: '1' })}>Maks. Uyarı</div>
                    <Input type="number" min="1" max="10" value={settings.max_warnings || 3}
                      onChange={e => setSettings({ ...settings, max_warnings: parseInt(e.target.value) || 3 })} />
                  </div>
                </div>
                <div className={grid({ columns: { base: 1, sm: 2 }, gap: '3' })}>
                  <div>
                    <div className={css({ fontSize: 'sm', mb: '1.5', display: 'flex', alignItems: 'center', gap: '1' })}>
                      <AlertTriangle size={14} /> Uyarı sonrası işlem
                    </div>
                    <select value={settings.action_after_warnings || 'kick'} onChange={e => setSettings({ ...settings, action_after_warnings: e.target.value })}
                      className={css({ border: '1px solid', borderColor: 'borderMain', bg: 'bgSurface', px: '3', py: '2.5', borderRadius: 'lg', w: 'full', fontSize: 'sm', color: 'textMain', outline: 'none', cursor: 'pointer', _focus: { borderColor: 'primary' } })}>
                      <option value="warn">Sadece uyarı</option><option value="kick">Gruptan at</option>
                      <option value="ban">Kalıcı yasakla</option><option value="mute">Sustur (1 saat)</option>
                    </select>
                  </div>
                  <div>
                    <div className={css({ fontSize: 'sm', mb: '1.5' })}>Spam Eşiği</div>
                    <Input type="number" min="0" value={settings.spam_threshold ?? 5}
                      onChange={e => setSettings({ ...settings, spam_threshold: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className={flex({ justify: 'flex-end', mt: '1' })}>
                  <Button onClick={saveSettings}>Ayarları Kaydet</Button>
                </div>
              </div>
            </Card>

            {/* Blacklist */}
            <Card>
              <div className={flex({ align: 'center', gap: '2', mb: '4' })}>
                <div className={css({ p: '1.5', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'primary' })}><Ban size={18} /></div>
                <div className={css({ fontWeight: '600' })}>Kara Liste</div>
              </div>
              <div className={flex({ gap: '2', mb: '4' })}>
                <Input placeholder="Yeni kelime / regex" value={newWord} onChange={e => setNewWord(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addWord()} />
                <Button onClick={addWord}><Plus size={18} /></Button>
              </div>
              <div className={css({ maxH: '300px', overflowY: 'auto' })}>
                {blacklist.length === 0 ? (
                  <div className={css({ color: 'textMuted', fontSize: 'sm', py: '4', textAlign: 'center' })}>Henüz yasaklı kelime yok.</div>
                ) : blacklist.map((word, idx) => (
                  <div key={word.id} className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '2.5', px: '3', borderRadius: 'md', mb: '1', bg: idx % 2 === 0 ? 'bgCanvas' : 'transparent', _hover: { bg: 'bgButtonSecondary' } })}>
                    <div className={css({ fontFamily: 'monospace', fontSize: 'sm' })}>{word.word}</div>
                    <button onClick={() => removeWord(word.id)} className={css({ color: 'danger', p: '1', borderRadius: 'md', _hover: { bg: 'rgba(220, 38, 38, 0.1)' } })} title="Sil"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Logs */}
            <Card className={css({ gridColumn: { lg: '1 / -1' } })}>
              <div className={flex({ justify: 'space-between', mb: '3' })}>
                <div className={css({ fontWeight: '600' })}>Son İhlaller ve İşlemler</div>
                <Button size="sm" variant="ghost" onClick={() => fetchModerationData(selectedChatId)}><RefreshCw size={16} /></Button>
              </div>
              {logs.length === 0 ? <div className={css({ color: 'textMuted' })}>Henüz kayıt yok.</div> : (
                <div className={css({ fontSize: 'sm' })}>
                  {logs.map((log, idx) => {
                    const badgeMap: Record<string, "success" | "danger" | "warning" | "neutral"> = { warn: 'warning', kick: 'danger', ban: 'danger', mute: 'neutral', delete: 'neutral' };
                    return (
                      <div key={idx} className={flex({ py: '3', gap: '3', justify: 'space-between', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: 'borderMain' })}>
                        <div>
                          <span className={css({ fontWeight: '500' })}>{log.first_name || log.username}</span>
                          <Badge variant={badgeMap[log.action] || 'neutral'} className={css({ ml: '2' })}>{log.action?.toUpperCase()}</Badge>
                          <span className={css({ color: 'textMuted', ml: '2' })}>{log.reason}</span>
                        </div>
                        <div className={css({ fontSize: 'xs', color: 'textMuted', whiteSpace: 'nowrap' })}>
                          {new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </>}

      {/* TAB: CAPTCHA */}
      {tab === 'captcha' && <Card className={css({ p: '6' })}>
        <div className={css({ fontWeight: 'bold', mb: '4', display: 'flex', alignItems: 'center', gap: '2' })}>
          <Camera size={18} /> CAPTCHA Oturumları
        </div>
        <div className={flex({ gap: '2', mb: '4' })}>
          <select value={selectedChatId || ''} onChange={e => setSelectedChatId(e.target.value)}
            className={css({ w: 'full', bg: 'bgCanvas', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', p: '2.5', fontSize: 'sm', color: 'textMain', outline: 'none' })}>
            <option value="">Grup seçin...</option>
            {chats.map(c => <option key={c.chat_id} value={c.chat_id}>{c.title || c.chat_id}</option>)}
          </select>
          <Button size="sm" onClick={fetchCaptcha}><RefreshCw size={14} /> Yükle</Button>
        </div>
        {loadingCaptcha ? <Spinner /> : captchaSessions.length === 0 ? (
          <div className={css({ color: 'textMuted', fontSize: 'sm', py: '4' })}>CAPTCHA oturumu bulunamadı.</div>
        ) : captchaSessions.map((s: any) => (
          <div key={s.id} className={flex({ justify: 'space-between', align: 'center', py: '2', px: '3', borderRadius: 'md', mb: '1', _hover: { bg: 'bgButtonSecondary' } })}>
            <div>
              <span className={css({ fontWeight: '500', fontSize: 'sm' })}>Kullanıcı: {s.user_id}</span>
              <Badge variant={s.verified ? 'success' : 'warning'} className={css({ ml: '2' })}>{s.verified ? 'Doğrulandı' : 'Bekliyor'}</Badge>
              <div className={css({ fontSize: 'xs', color: 'textMuted' })}>Kod: {s.code} · Bitiş: {new Date(s.expires_at).toLocaleString('tr-TR')}</div>
            </div>
            {!s.verified && (
              <Button size="sm" variant="ghost" onClick={() => handleVerifyCaptcha(s.id)}><UserCheck size={14} /> Manuel Doğrula</Button>
            )}
          </div>
        ))}
      </Card>}

      {/* TAB: Global Blacklist */}
      {tab === 'global-bl' && <Card className={css({ p: '6' })}>
        <div className={css({ fontWeight: 'bold', mb: '4', display: 'flex', alignItems: 'center', gap: '2' })}>
          <Globe size={18} /> Global Kara Liste (Tüm Gruplar)
        </div>
        <div className={flex({ gap: '2', mb: '4' })}>
          <Input value={newGlobalUserId} onChange={e => setNewGlobalUserId(e.target.value)} placeholder="Kullanıcı ID" />
          <Input value={newGlobalReason} onChange={e => setNewGlobalReason(e.target.value)} placeholder="Sebep (opsiyonel)" />
          <Button size="sm" onClick={handleAddGlobal} disabled={!newGlobalUserId}><Plus size={14} /> Ekle</Button>
        </div>
        {loadingGlobalBL ? <Spinner /> : globalBlacklist.length === 0 ? (
          <div className={css({ color: 'textMuted', fontSize: 'sm', py: '4' })}>Global kara liste boş.</div>
        ) : globalBlacklist.map((item: any) => (
          <div key={item.id} className={flex({ justify: 'space-between', align: 'center', py: '2', px: '3', borderRadius: 'md', mb: '1', _hover: { bg: 'bgButtonSecondary' } })}>
            <div>
              <span className={css({ fontWeight: '500', fontSize: 'sm' })}>Kullanıcı: {item.user_id}</span>
              {item.reason && <span className={css({ color: 'textMuted', ml: '2', fontSize: 'sm' })}>· {item.reason}</span>}
              <div className={css({ fontSize: 'xs', color: 'textMuted' })}>{new Date(item.added_at).toLocaleString('tr-TR')}</div>
            </div>
            <button onClick={() => handleRemoveGlobal(item.id)} className={css({ color: 'danger', p: '1', borderRadius: 'md', cursor: 'pointer', _hover: { bg: 'rgba(220,38,38,0.1)' } })}><UserX size={14} /> Kaldır</button>
          </div>
        ))}
      </Card>}

      {/* TAB: Kullanıcı Profili */}
      {tab === 'user-profile' && <Card className={css({ p: '6' })}>
        <div className={css({ fontWeight: 'bold', mb: '4', display: 'flex', alignItems: 'center', gap: '2' })}>
          <Search size={18} /> Kullanıcı Profili Sorgulama
        </div>
        <div className={flex({ gap: '2', mb: '4' })}>
          <Input value={searchUserId} onChange={e => setSearchUserId(e.target.value)} placeholder="Telegram Kullanıcı ID" />
          <Button onClick={handleSearchUser} disabled={!searchUserId || loadingProfile}>
            <Search size={14} /> {loadingProfile ? 'Aranıyor...' : 'Sorgula'}
          </Button>
        </div>
        {userProfile && (
          <div className={stack({ gap: '3' })}>
            <div className={grid({ columns: 3, gap: '3' })}>
              <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', textAlign: 'center' })}>
                <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'primary' })}>{userProfile.totalMessages}</div>
                <div className={css({ fontSize: 'xs', color: 'textMuted' })}>Toplam Mesaj</div>
              </div>
              <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', textAlign: 'center' })}>
                <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'success' })}>{userProfile.totalJoins}</div>
                <div className={css({ fontSize: 'xs', color: 'textMuted' })}>Katılım</div>
              </div>
              <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', textAlign: 'center' })}>
                <div className={css({ fontSize: 'xs', color: userProfile.isGloballyBlacklisted ? 'danger' : 'success', fontWeight: 'bold' })}>
                  {userProfile.isGloballyBlacklisted ? '🔴 KARA LİSTEDE' : '🟢 TEMİZ'}
                </div>
                <div className={css({ fontSize: 'xs', color: 'textMuted' })}>Global Durum</div>
              </div>
            </div>
            {userProfile.lastSeen && <div className={css({ fontSize: 'sm', color: 'textMuted' })}>Son görülme: {new Date(userProfile.lastSeen).toLocaleString('tr-TR')}</div>}
            {userProfile.isGloballyBlacklisted && <div className={css({ p: '3', bg: 'red.50', borderRadius: 'lg', color: 'danger', fontSize: 'sm', _dark: { bg: 'red.950/20' } })}>
              Kara liste sebebi: {userProfile.blacklistReason || 'Belirtilmemiş'}
            </div>}
            {userProfile.moderationHistory?.length > 0 && <>
              <div className={css({ fontWeight: 'bold', fontSize: 'sm', mt: '2' })}>🛡️ Moderasyon Geçmişi</div>
              {userProfile.moderationHistory.map((m: any, i: number) => (
                <div key={i} className={flex({ justify: 'space-between', py: '1.5', px: '2', fontSize: 'sm', borderBottom: '1px solid token(colors.borderMain)' })}>
                  <span><Badge variant="neutral">{m.action}</Badge> {m.reason}</span>
                  <span className={css({ color: 'textMuted', fontSize: 'xs' })}>{new Date(m.timestamp).toLocaleDateString('tr-TR')}</span>
                </div>
              ))}
            </>}
            {userProfile.recentLogs?.length > 0 && <>
              <div className={css({ fontWeight: 'bold', fontSize: 'sm', mt: '2' })}>📋 Son Aktiviteler</div>
              <div className={css({ maxH: '200px', overflowY: 'auto' })}>
                {userProfile.recentLogs.map((l: any, i: number) => (
                  <div key={i} className={css({ py: '1', px: '2', fontSize: 'sm', borderBottom: '1px solid token(colors.borderMain)' })}>
                    <Badge variant="neutral" className={css({ mr: '2' })}>{l.event_type}</Badge>
                    {l.chat_title && <span className={css({ color: 'textMuted' })}>{l.chat_title}: </span>}
                    {l.message_text?.substring(0, 60)}
                  </div>
                ))}
              </div>
            </>}
          </div>
        )}
      </Card>}

      {/* TAB: Webhook Test */}
      {tab === 'webhook' && <Card className={css({ p: '6' })}>
        <div className={css({ fontWeight: 'bold', mb: '4', display: 'flex', alignItems: 'center', gap: '2' })}>
          <Webhook size={18} /> Webhook Test Aracı
        </div>
        <div className={flex({ gap: '2', mb: '4' })}>
          <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="Webhook URL'si (https://...)" />
          <Button onClick={handleTestWebhook} disabled={!webhookUrl || testingWebhook}>
            {testingWebhook ? 'Test Ediliyor...' : 'Test Et'}
          </Button>
        </div>
        {webhookResult && (
          <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)' })}>
            <div className={flex({ gap: '4', mb: '2' })}>
              <Badge variant={webhookResult.success ? 'success' : 'danger'}>
                {webhookResult.success ? '✅ Başarılı' : '❌ Başarısız'}
              </Badge>
              <span className={css({ fontSize: 'sm', color: 'textMuted' })}>Durum: {webhookResult.statusCode || 'N/A'}</span>
              <span className={css({ fontSize: 'sm', color: 'textMuted' })}>Süre: {webhookResult.duration || 'N/A'}</span>
            </div>
            {webhookResult.response && (
              <div className={css({ fontSize: 'xs', color: 'textMuted', fontFamily: 'monospace', bg: 'bgSurface', p: '2', borderRadius: 'md', maxH: '150px', overflowY: 'auto' })}>
                {webhookResult.response}
              </div>
            )}
          </div>
        )}
      </Card>}

      {/* TAB: Kullanıcı Rolleri (RBAC) */}
      {tab === 'users' && <Card className={css({ p: '6' })}>
        <div className={css({ fontWeight: 'bold', mb: '4', display: 'flex', alignItems: 'center', gap: '2' })}>
          <Key size={18} /> Panel Kullanıcı Rolleri
        </div>
        <Button size="sm" variant="secondary" onClick={fetchUsers} className={css({ mb: '4' })}><RefreshCw size={14} /> Kullanıcıları Yükle</Button>
        {loadingUsers ? <Spinner /> : users.length === 0 ? (
          <div className={css({ color: 'textMuted', fontSize: 'sm' })}>Henüz kullanıcı yok.</div>
        ) : users.map((u: any) => (
          <div key={u.id} className={flex({ justify: 'space-between', align: 'center', py: '2', px: '3', borderRadius: 'md', mb: '1', _hover: { bg: 'bgButtonSecondary' } })}>
            <div>
              <span className={css({ fontWeight: '500', fontSize: 'sm' })}>{u.username}</span>
              <Badge variant={u.role === 'admin' ? 'success' : 'neutral'} className={css({ ml: '2' })}>{u.role || 'user'}</Badge>
              <div className={css({ fontSize: 'xs', color: 'textMuted' })}>ID: {u.id} · Kayıt: {new Date(u.created_at).toLocaleDateString('tr-TR')}</div>
            </div>
            <select value={u.role || 'user'} onChange={e => handleUpdateRole(u.id, e.target.value)}
              className={css({ px: '2', py: '1.5', bg: 'bgSurface', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', fontSize: 'sm', color: 'textMain', outline: 'none', cursor: 'pointer' })}>
              <option value="user">Kullanıcı</option>
              <option value="moderator">Moderatör</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </Card>}
    </div>
  );
}
