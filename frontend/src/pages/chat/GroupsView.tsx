import {
  BarChart,
  Download, FileText, Image,
  MessageCircle,
  MessageSquare,
  RefreshCw, Save, Send, Settings, Share2, Shield, Trash2,
  Upload, UserCheck, UserPlus, UserX, X
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { flex, grid, stack } from '../../../styled-system/patterns';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Spinner } from '../../components/ui/Spinner';

import { BotStatus, Chat } from '../../types';

const token = () => localStorage.getItem('token');
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` };
const api = (url: string, opts?: any) => fetch(url, { headers, ...opts }).then(r => r.json());

// Markdown renderer
function renderMarkdown(md: string) {
  if (!md) return '';
  let html = md.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(239,68,68,0.05);padding:10px;border-radius:6px;font-family:monospace;overflow-x:auto;border:1px solid token(colors.borderMain);margin:8px 0">$1</pre>');
  html = html.replace(/`(.*?)`/g, '<code style="background:rgba(239,68,68,0.05);padding:2px 4px;border-radius:4px;font-family:monospace">$1</code>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:var(--colors-primary);text-decoration:underline">$1</a>');
  html = html.replace(/\n/g, '<br />');
  return html;
}

interface GroupsViewProps {
  chats: Chat[];
  onRefresh: () => void;
  onToggle: (chatId: string, isEnabled: boolean) => void;
  onUpdateChat: (chatId: string, payload: any) => void;
  botStatus: BotStatus;
}

export function GroupsView({ chats, onRefresh, onToggle, onUpdateChat, botStatus }: GroupsViewProps) {
  const navigate = useNavigate();
  // Modal states
  const [editingChat, setEditingChat] = useState<Chat | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [manageChat, setManageChat] = useState<Chat | null>(null);
  const [manageTab, setManageTab] = useState('info');

  // Grup yönetim state'leri
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testParseMode, setTestParseMode] = useState('HTML');
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  // Yönetici state'leri
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState('');

  // Otomatik Yanıtlayıcı
  const [autoReplies, setAutoReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [newReply, setNewReply] = useState({ trigger: '', response: '', matchType: 'contains' });

  // Silinen/Düzenlenen mesajlar
  const [deletedMsgs, setDeletedMsgs] = useState<any[]>([]);
  const [editedMsgs, setEditedMsgs] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Toplu Mesaj
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastParseMode, setBroadcastParseMode] = useState('HTML');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);

  // Raporlar
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Şablonlar
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateSettings, setTemplateSettings] = useState('{\n  "moderation": {\n    "enabled": 1,\n    "auto_delete_bad_words": 1\n  }\n}');

  // Kullanıcı yönetimi
  const [actionChatId, setActionChatId] = useState('');
  const [actionUserId, setActionUserId] = useState('');
  const [actionType, setActionType] = useState('ban');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Grup silme onay
  const [confirmLeave, setConfirmLeave] = useState('');

  const openEditor = (chat: Chat) => {
    setEditingChat(chat);
    setEditMessage(chat.welcome_message || '');
  };

  const saveEdit = () => {
    if (editingChat) {
      onUpdateChat(editingChat.chat_id, { welcomeMessage: editMessage });
    }
    setEditingChat(null);
    toast.success('Hoş geldin mesajı güncellendi');
  };

  const clearOverride = (chatId: string) => {
    onUpdateChat(chatId, { welcomeMessage: '' });
    toast.success('Global mesaja dönüldü');
  };

  // ===== GRUP YÖNETİM MODALI =====
  const openManage = (chat: Chat) => {
    setManageChat(chat);
    setNewTitle(chat.title || '');
    setNewDescription('');
    setPhotoUrl('');
    setTestMessage('');
    setTestParseMode('HTML');
    setManageTab('info');
    setAdmins([]);
    setAutoReplies([]);
    setDeletedMsgs([]);
    setEditedMsgs([]);
    setReportData(null);
    setBroadcastResult(null);
    setConfirmLeave('');
  };

  const handleUpdateProfile = async () => {
    if (!manageChat) return;
    const data = await api(`/api/chats/${manageChat.chat_id}/profile`, {
      method: 'PATCH', body: JSON.stringify({ title: newTitle, description: newDescription })
    });
    if (data.error) return toast.error(`Güncellenemedi: ${data.error}`);
    toast.success('Grup adı/açıklaması güncellendi!');
    onRefresh();
  };

  const handleUpdatePhoto = async () => {
    if (!manageChat || !photoUrl) return;
    const data = await api(`/api/chats/${manageChat.chat_id}/photo`, {
      method: 'PATCH', body: JSON.stringify({ photoUrl })
    });
    if (data.error) return toast.error(`Fotoğraf güncellenemedi: ${data.error}`);
    toast.success('Grup fotoğrafı güncellendi!');
    setPhotoUrl('');
  };

  const handleSync = async () => {
    if (!manageChat) return;
    setSyncing(true);
    const data = await api(`/api/chats/${manageChat.chat_id}/sync`, { method: 'POST' });
    if (data.error) {
      toast.error(`Senkronizasyon hatası: ${data.error}`);
    } else {
      toast.success('Grup bilgileri Telegram ile senkronize edildi!');
      onRefresh();
      if (data.chatInfo) setNewTitle(data.chatInfo.title || '');
    }
    setSyncing(false);
  };

  const handleSendTest = async () => {
    if (!manageChat || !testMessage) return;
    setSending(true);
    const data = await api(`/api/chats/${manageChat.chat_id}/test-message`, {
      method: 'POST', body: JSON.stringify({ text: testMessage, parseMode: testParseMode })
    });
    if (data.error) return toast.error(`Mesaj gönderilemedi: ${data.error}`);
    toast.success('Test mesajı gruba gönderildi!');
    setTestMessage('');
    setSending(false);
  };

  // ===== YÖNETİCİLER =====
  const fetchAdmins = useCallback(async () => {
    if (!manageChat) return;
    setLoadingAdmins(true);
    const data = await api(`/api/chats/${manageChat.chat_id}/admins`);
    if (Array.isArray(data)) setAdmins(data);
    setLoadingAdmins(false);
  }, [manageChat]);

  const handlePromoteAdmin = async () => {
    if (!manageChat || !promoteUserId) return;
    const data = await api(`/api/chats/${manageChat.chat_id}/admins`, {
      method: 'POST', body: JSON.stringify({ userId: promoteUserId, isAdmin: true })
    });
    if (data.error) return toast.error(`Yönetici atanamadı: ${data.error}`);
    toast.success('Kullanıcı yönetici yapıldı!');
    setPromoteUserId('');
    fetchAdmins();
  };

  const handleDemoteAdmin = async (userId: string) => {
    if (!manageChat) return;
    const data = await api(`/api/chats/${manageChat.chat_id}/admins/${userId}`, { method: 'DELETE' });
    if (data.error) return toast.error(`Yöneticilik kaldırılamadı: ${data.error}`);
    toast.success('Yöneticilik kaldırıldı');
    fetchAdmins();
  };

  // ===== OTOMATİK YANITLAYICI =====
  const fetchAutoReplies = useCallback(async () => {
    if (!manageChat) return;
    setLoadingReplies(true);
    const data = await api(`/api/chats/${manageChat.chat_id}/auto-replies`);
    if (Array.isArray(data)) setAutoReplies(data);
    setLoadingReplies(false);
  }, [manageChat]);

  const handleAddReply = async () => {
    if (!manageChat || !newReply.trigger || !newReply.response) return;
    const data = await api(`/api/chats/${manageChat.chat_id}/auto-replies`, {
      method: 'POST', body: JSON.stringify(newReply)
    });
    if (data.error) return toast.error(`Eklenemedi: ${data.error}`);
    toast.success('Otomatik yanıt eklendi!');
    setNewReply({ trigger: '', response: '', matchType: 'contains' });
    fetchAutoReplies();
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!manageChat) return;
    const data = await api(`/api/chats/${manageChat.chat_id}/auto-replies/${replyId}`, { method: 'DELETE' });
    if (data.error) return toast.error(`Silinemedi: ${data.error}`);
    toast.success('Otomatik yanıt silindi');
    fetchAutoReplies();
  };

  // ===== SİLİNEN/DÜZENLENEN MESAJLAR =====
  const fetchDeletedEdited = useCallback(async () => {
    if (!manageChat) return;
    setLoadingMsgs(true);
    const [d, e] = await Promise.all([
      api(`/api/chats/${manageChat.chat_id}/deleted-messages`),
      api(`/api/chats/${manageChat.chat_id}/edited-messages`)
    ]);
    if (Array.isArray(d)) setDeletedMsgs(d);
    if (Array.isArray(e)) setEditedMsgs(e);
    setLoadingMsgs(false);
  }, [manageChat]);

  // ===== RAPORLAR =====
  const fetchReport = useCallback(async () => {
    if (!manageChat) return;
    setLoadingReport(true);
    const data = await api(`/api/chats/${manageChat.chat_id}/reports?days=7`);
    if (data && !data.error) setReportData(data);
    setLoadingReport(false);
  }, [manageChat]);

  // ===== ŞABLONLAR =====
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    const data = await api('/api/chats/templates');
    if (Array.isArray(data)) setTemplates(data);
    setLoadingTemplates(false);
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplateName) return;
    let parsed;
    try { parsed = JSON.parse(templateSettings); } catch { return toast.error('Geçersiz JSON formatı'); }
    const data = await api('/api/chats/templates', {
      method: 'POST', body: JSON.stringify({ name: newTemplateName, settings: parsed })
    });
    if (data.error) return toast.error(`Şablon oluşturulamadı: ${data.error}`);
    toast.success('Şablon oluşturuldu!');
    setNewTemplateName('');
    setTemplateSettings('{\n  "moderation": {\n    "enabled": 1,\n    "auto_delete_bad_words": 1\n  }\n}');
    fetchTemplates();
  };

  const handleApplyTemplate = async (templateId: number) => {
    if (!manageChat) return;
    const data = await api(`/api/chats/${manageChat.chat_id}/templates/${templateId}/apply`, { method: 'POST' });
    if (data.error) return toast.error(`Uygulanamadı: ${data.error}`);
    toast.success('Şablon gruba uygulandı!');
    onRefresh();
  };

  const handleDeleteTemplate = async (templateId: number) => {
    const data = await api(`/api/chats/templates/${templateId}`, { method: 'DELETE' });
    if (data.error) return toast.error(`Silinemedi: ${data.error}`);
    toast.success('Şablon silindi');
    fetchTemplates();
  };

  // ===== EXPORT / IMPORT =====
  const handleExport = async () => {
    if (!manageChat) return;
    const data = await api(`/api/chats/${manageChat.chat_id}/export`);
    if (data.error) return toast.error(`Export başarısız: ${data.error}`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `grup-${manageChat.chat_id}-export.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Grup ayarları dışa aktarıldı!');
  };

  const handleImport = async () => {
    if (!manageChat) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      let json;
      try { json = JSON.parse(text); } catch { return toast.error('Geçersiz JSON dosyası'); }
      const data = await api(`/api/chats/${manageChat.chat_id}/import`, {
        method: 'POST', body: JSON.stringify(json)
      });
      if (data.error) return toast.error(`İçe aktarma başarısız: ${data.error}`);
      toast.success('Grup ayarları içe aktarıldı!');
      onRefresh();
    };
    input.click();
  };

  // ===== GRUPTAN AYRIL =====
  const handleLeaveChat = async () => {
    if (!manageChat || confirmLeave !== 'SİL') return;
    const data = await api(`/api/chats/${manageChat.chat_id}/leave`, { method: 'POST' });
    if (data.error) return toast.error(`Ayrılamadı: ${data.error}`);
    toast.success(data.message || 'Gruptan ayrıldı');
    setManageChat(null);
    onRefresh();
  };

  // ===== TOPLU MESAJ =====
  const handleBroadcast = async () => {
    if (!broadcastText) return;
    setBroadcastSending(true);
    const data = await api('/api/chats/broadcast', {
      method: 'POST', body: JSON.stringify({ text: broadcastText, parseMode: broadcastParseMode })
    });
    if (data.error) return toast.error(`Gönderilemedi: ${data.error}`);
    setBroadcastResult(data);
    toast.success(`Mesaj ${data.sent} gruba gönderildi, ${data.failed} başarısız`);
    setBroadcastSending(false);
  };

  // ===== KULLANICI İŞLEMLERİ =====
  const handleUserAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionChatId || !actionUserId) return;
    setActionSubmitting(true);
    const data = await api(`/api/chats/${actionChatId}/user-action`, {
      method: 'POST', body: JSON.stringify({ userId: actionUserId, action: actionType })
    });
    if (data.error) return toast.error(`Hata: ${data.error}`);
    toast.success('İşlem başarıyla uygulandı!');
    setActionUserId('');
    setActionSubmitting(false);
  };

  // Tab değişince veri yükle
  const onTabChange = (tab: string) => {
    setManageTab(tab);
    if (tab === 'admins') fetchAdmins();
    if (tab === 'auto-replies') fetchAutoReplies();
    if (tab === 'messages') fetchDeletedEdited();
    if (tab === 'reports') fetchReport();
    if (tab === 'templates') fetchTemplates();
  };

  return (
    <div className={stack({ gap: '5' })}>
      <PageHeader
        title="Gruplar"
        description={`${chats.length} grup yönetiliyor`}
        actions={
          <div className={flex({ gap: '2' })}>
            {botStatus?.username && (
              <a href={`https://t.me/${botStatus.username}?startgroup=true`} target="_blank" rel="noopener noreferrer"
                className={css({ display: 'inline-flex', alignItems: 'center', gap: '2', px: '4', py: '2', borderRadius: 'lg', bg: 'primary', color: 'white', fontSize: 'sm', fontWeight: '500', textDecoration: 'none', _hover: { bg: 'primaryHover' } })}>
                ➕ Botu Yeni Gruba Ekle
              </a>
            )}
            <Button onClick={onRefresh} variant="secondary" size="sm"><RefreshCw size={16} /> Yenile</Button>
          </div>
        }
      />

      <Card className={css({ p: 0, overflow: 'hidden' })}>
        {chats.length === 0 ? (
          <div className={stack({ p: '10', align: 'center', gap: '4' })}>
            <div className={css({ color: 'textMuted', textAlign: 'center' })}>
              Henüz kayıtlı grup yok. Botu grubunuza ekleyip yönetici yaptıktan sonra bu panelde otomatik görünecektir.
            </div>
          </div>
        ) : (
          <div className={css({ overflowX: 'auto' })}>
            <table className={css({ w: 'full', fontSize: 'sm', minWidth: '900px' })}>
              <thead className={css({ bg: 'bgCanvas' })}>
                <tr>
                  <th className={css({ textAlign: 'left', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>Grup</th>
                  <th className={css({ textAlign: 'left', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>Üye</th>
                  <th className={css({ textAlign: 'left', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>Durum</th>
                  <th className={css({ textAlign: 'left', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>Hoş Geldin</th>
                  <th className={css({ textAlign: 'right', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat: Chat) => (
                  <tr key={chat.chat_id} className={css({ borderBottom: '1px solid token(colors.borderMain)', _hover: { bg: 'bgCanvas' } })}>
                    <td className={css({ p: '4' })}>
                      <div className={css({ fontWeight: '500' })}>{chat.title || 'İsimsiz Grup'}</div>
                      <div className={css({ fontSize: 'xs', color: 'textMuted' })}>ID: {chat.chat_id}</div>
                    </td>
                    <td className={css({ p: '4', color: 'textMuted' })}>{chat.member_count || '-'}</td>
                    <td className={css({ p: '4' })}>
                      <button onClick={() => onToggle(chat.chat_id, !!chat.is_enabled)}>
                        <Badge variant={chat.is_enabled ? 'success' : 'neutral'}>{chat.is_enabled ? 'Aktif' : 'Pasif'}</Badge>
                      </button>
                    </td>
                    <td className={css({ p: '4' })}>
                      <Badge variant={chat.welcome_message ? 'warning' : 'neutral'}>{chat.welcome_message ? 'Özel' : 'Global'}</Badge>
                    </td>
                    <td className={css({ p: '4', textAlign: 'right' })}>
                      <div className={flex({ gap: '1.5', justifyContent: 'flex-end' })}>
                        <Button size="sm" variant="ghost" onClick={() => openEditor(chat)} title="Hoş geldin mesajı"><MessageSquare size={14} /> Mesaj</Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/chats/${chat.chat_id}`)} title="Grup yönetimi"><Settings size={14} /> Yönet</Button>
                        {chat.welcome_message && <Button size="sm" variant="ghost" onClick={() => clearOverride(chat.chat_id)} title="Global'e dön"><X size={14} /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Hızlı Kullanıcı Yönetimi */}
      <Card className={css({ p: '6' })}>
        <div className={css({ fontSize: 'lg', fontWeight: 'bold', mb: '2', color: 'textMain' })}>👤 Panelden Hızlı Kullanıcı Yönetimi</div>
        <div className={css({ fontSize: 'xs', color: 'textMuted', mb: '4' })}>Telegram ID'sini girerek doğrudan panelden ban/kick/mute/unmute/unban yapın.</div>
        <form onSubmit={handleUserAction} className={grid({ columns: { base: 1, md: 4 }, gap: '4', alignItems: 'end' })}>
          <div>
            <label className={css({ display: 'block', fontSize: 'xs', fontWeight: 'bold', mb: '1.5', color: 'textMain' })}>Grup</label>
            <select value={actionChatId} onChange={e => setActionChatId(e.target.value)}
              className={css({ w: 'full', bg: 'bgCanvas', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', p: '2.5', fontSize: 'sm', color: 'textMain', outline: 'none' })} required>
              <option value="">Seçiniz...</option>
              {chats.map(c => <option key={c.chat_id} value={c.chat_id}>{c.title || c.chat_id}</option>)}
            </select>
          </div>
          <div>
            <label className={css({ display: 'block', fontSize: 'xs', fontWeight: 'bold', mb: '1.5', color: 'textMain' })}>Kullanıcı ID</label>
            <input type="text" placeholder="12345678" value={actionUserId} onChange={e => setActionUserId(e.target.value)}
              className={css({ w: 'full', bg: 'bgCanvas', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', p: '2.5', fontSize: 'sm', color: 'textMain', outline: 'none' })} required />
          </div>
          <div>
            <label className={css({ display: 'block', fontSize: 'xs', fontWeight: 'bold', mb: '1.5', color: 'textMain' })}>Eylem</label>
            <select value={actionType} onChange={e => setActionType(e.target.value)}
              className={css({ w: 'full', bg: 'bgCanvas', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', p: '2.5', fontSize: 'sm', color: 'textMain', outline: 'none' })}>
              <option value="ban">🚫 Yasakla</option><option value="kick">👢 At</option>
              <option value="mute">🔇 Sustur</option><option value="unmute">🔊 Susturmayı Kaldır</option>
              <option value="unban">✅ Yasağı Kaldır</option>
            </select>
          </div>
          <Button type="submit" disabled={actionSubmitting}>{actionSubmitting ? 'Uygulanıyor...' : 'Eylemi Uygula'}</Button>
        </form>
      </Card>

      {/* Toplu Mesaj Gönderimi */}
      <Card className={css({ p: '6' })}>
        <div className={css({ fontSize: 'lg', fontWeight: 'bold', mb: '2', display: 'flex', alignItems: 'center', gap: '2' })}>
          <Send size={18} /> Toplu Mesaj Gönderimi
        </div>
        <div className={css({ fontSize: 'xs', color: 'textMuted', mb: '4' })}>Tüm aktif gruplara tek seferde mesaj gönderin.</div>
        <div className={stack({ gap: '3' })}>
          <div className={flex({ gap: '2' })}>
            <select value={broadcastParseMode} onChange={e => setBroadcastParseMode(e.target.value)}
              className={css({ px: '3', py: '2', bg: 'bgSurface', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', fontSize: 'sm', color: 'textMain', outline: 'none' })}>
              <option value="None">Düz Metin</option><option value="HTML">HTML</option><option value="Markdown">Markdown</option>
            </select>
          </div>
          <Textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)} rows={3} placeholder="Tüm gruplara gönderilecek mesaj..." />
          {broadcastText && (
            <div className={css({ p: '3', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', fontSize: 'sm' })}>
              <div className={css({ fontWeight: 'bold', mb: '1', color: 'textMuted', fontSize: 'xs' })}>ÖN İZLEME</div>
              <div dangerouslySetInnerHTML={{ __html: broadcastParseMode === 'Markdown' ? renderMarkdown(broadcastText) : broadcastText.replace(/\n/g, '<br />') }} />
            </div>
          )}
          <div className={flex({ gap: '2', align: 'center' })}>
            <Button onClick={handleBroadcast} disabled={broadcastSending || !broadcastText}>
              <Send size={14} /> {broadcastSending ? 'Gönderiliyor...' : 'Tüm Gruplara Gönder'}
            </Button>
            {broadcastResult && (
              <div className={css({ fontSize: 'sm', color: 'textMuted' })}>
                ✅ {broadcastResult.sent} gönderildi, ❌ {broadcastResult.failed} başarısız
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ===== HOŞ GELDİN MESAJI MODAL ===== */}
      <Modal isOpen={!!editingChat} onClose={() => setEditingChat(null)}
        title={`Hoş Geldin Mesajı: ${editingChat?.title || editingChat?.chat_id}`}
        footer={<><Button variant="secondary" onClick={() => setEditingChat(null)}>İptal</Button><Button onClick={saveEdit}>Kaydet</Button></>}>
        <div className={stack({ gap: '3' })}>
          <div className={css({ fontSize: 'sm', color: 'textMuted' })}>Markdown formatı desteklenir: **kalın**, *italik*, `kod`, [link](url)</div>
          <Textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={6}
            placeholder="**Hoş geldin** {first_name}!\n\n`{group_title}`" />
          {editMessage && <div className={css({ p: '3', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', fontSize: 'sm' })}>
            <div className={css({ fontWeight: 'bold', mb: '1', color: 'textMuted', fontSize: 'xs' })}>ÖN İZLEME</div>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(editMessage) }} />
          </div>}
          <div className={css({ fontSize: 'xs', color: 'textMuted' })}>Değişkenler: {'{first_name}'}, {'{last_name}'}, {'{username}'}, {'{group_title}'}, {'{member_count}'}</div>
        </div>
      </Modal>

      {/* ===== GRUP YÖNETİM MODALI (TÜM ÖZELLİKLER) ===== */}
      <Modal isOpen={!!manageChat} onClose={() => setManageChat(null)}
        title={`🔧 ${manageChat?.title || manageChat?.chat_id}`} size="xl"
        footer={<Button variant="secondary" onClick={() => setManageChat(null)}>Kapat</Button>}>
        {manageChat && (
          <div className={stack({ gap: '4' })}>
            {/* Tab Bar */}
            <div className={flex({ gap: '1', borderBottom: '1px solid token(colors.borderMain)', pb: '2', overflowX: 'auto' })}>
              {[
                { id: 'info', label: 'Bilgi', icon: UserCheck },
                { id: 'admins', label: 'Yöneticiler', icon: Shield },
                { id: 'auto-replies', label: 'Otomatik Yanıt', icon: MessageCircle },
                { id: 'messages', label: 'Mesaj Geçmişi', icon: FileText },
                { id: 'reports', label: 'Raporlar', icon: BarChart },
                { id: 'templates', label: 'Şablonlar', icon: Save },
                { id: 'broadcast', label: 'Toplu Mesaj', icon: Send },
                { id: 'test', label: 'Test', icon: MessageSquare },
                { id: 'danger', label: 'Tehlikeli', icon: Trash2 },
              ].map(tab => (
                <button key={tab.id} onClick={() => onTabChange(tab.id)}
                  className={css({
                    display: 'flex', alignItems: 'center', gap: '1', px: '3', py: '1.5', borderRadius: 'lg', fontSize: '12px', fontWeight: manageTab === tab.id ? '600' : '500',
                    bg: manageTab === tab.id ? 'primary' : 'transparent', color: manageTab === tab.id ? 'white' : 'textMain', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
                    _hover: { bg: manageTab === tab.id ? 'primaryHover' : 'bgButtonSecondary' }
                  })}>
                  <tab.icon size={13} /> {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: Bilgi */}
            {manageTab === 'info' && (
              <div className={stack({ gap: '4' })}>
                <div className={grid({ columns: 2, gap: '3' })}>
                  <div><span className={css({ fontSize: 'xs', color: 'textMuted' })}>Grup ID</span><div className={css({ fontSize: 'sm', fontWeight: '500' })}>{manageChat.chat_id}</div></div>
                  <div><span className={css({ fontSize: 'xs', color: 'textMuted' })}>Tür</span><div className={css({ fontSize: 'sm', fontWeight: '500' })}>{manageChat.type || 'Bilinmiyor'}</div></div>
                  <div><span className={css({ fontSize: 'xs', color: 'textMuted' })}>Üye</span><div className={css({ fontSize: 'sm', fontWeight: '500' })}>{manageChat.member_count || '-'}</div></div>
                  <div><span className={css({ fontSize: 'xs', color: 'textMuted' })}>Durum</span><Badge variant={manageChat.is_enabled ? 'success' : 'neutral'}>{manageChat.is_enabled ? 'Aktif' : 'Pasif'}</Badge></div>
                </div>
                <Button size="sm" variant="secondary" onClick={handleSync} disabled={syncing}>
                  <RefreshCw size={14} className={css({ animation: syncing ? 'spin 1s linear infinite' : 'none' })} />
                  {syncing ? 'Senkronize Ediliyor...' : 'Telegram ile Senkronize Et'}
                </Button>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)' })}>
                  <div className={css({ fontWeight: 'bold', mb: '3', display: 'flex', alignItems: 'center', gap: '2' })}><Settings size={16} /> Grup Adı & Açıklama</div>
                  <div className={stack({ gap: '3' })}>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Grup adı" />
                    <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={2} placeholder="Grup açıklaması" />
                    <Button size="sm" onClick={handleUpdateProfile}><Save size={14} /> Güncelle</Button>
                  </div>
                </div>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)' })}>
                  <div className={css({ fontWeight: 'bold', mb: '3', display: 'flex', alignItems: 'center', gap: '2' })}><Image size={16} /> Grup Fotoğrafı</div>
                  <div className={flex({ gap: '2' })}>
                    <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="Fotoğraf URL'si" />
                    <Button size="sm" onClick={handleUpdatePhoto} disabled={!photoUrl}><Image size={14} /> Güncelle</Button>
                  </div>
                </div>
                <div className={flex({ gap: '2' })}>
                  <Button size="sm" variant="secondary" onClick={handleExport}><Download size={14} /> Ayarları Dışa Aktar</Button>
                  <Button size="sm" variant="secondary" onClick={handleImport}><Upload size={14} /> İçe Aktar</Button>
                </div>
              </div>
            )}

            {/* TAB: Yöneticiler */}
            {manageTab === 'admins' && (
              <div className={stack({ gap: '3' })}>
                <div className={flex({ gap: '2', align: 'center' })}>
                  <Input value={promoteUserId} onChange={e => setPromoteUserId(e.target.value)} placeholder="Kullanıcı ID (Telegram)" />
                  <Button size="sm" onClick={handlePromoteAdmin} disabled={!promoteUserId}><UserPlus size={14} /> Yönetici Yap</Button>
                </div>
                <div className={css({ maxH: '400px', overflowY: 'auto' })}>
                  {loadingAdmins ? <Spinner /> : admins.length === 0 ? (
                    <div className={css({ color: 'textMuted', fontSize: 'sm', py: '4' })}>Yönetici listesi alınamadı. Bot'un yönetici yetkisi var mı?</div>
                  ) : admins.map((admin: any, idx: number) => (
                    <div key={idx} className={flex({ justify: 'space-between', align: 'center', py: '2', px: '3', borderRadius: 'md', _hover: { bg: 'bgButtonSecondary' } })}>
                      <div>
                        <span className={css({ fontWeight: '500', fontSize: 'sm' })}>{admin.user.first_name || admin.user.username || admin.user.id}</span>
                        <Badge variant="neutral" className={css({ ml: '2' })}>{admin.status || 'admin'}</Badge>
                        <div className={css({ fontSize: 'xs', color: 'textMuted' })}>ID: {admin.user.id}</div>
                      </div>
                      {admin.status !== 'creator' && (
                        <Button size="sm" variant="ghost" onClick={() => handleDemoteAdmin(String(admin.user.id))}><UserX size={14} /> Yetkisini Al</Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Otomatik Yanıtlayıcı */}
            {manageTab === 'auto-replies' && (
              <div className={stack({ gap: '3' })}>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)' })}>
                  <div className={css({ fontWeight: 'bold', mb: '2', fontSize: 'sm' })}>Yeni Otomatik Yanıt</div>
                  <div className={stack({ gap: '2' })}>
                    <div className={flex({ gap: '2' })}>
                      <Input value={newReply.trigger} onChange={e => setNewReply({ ...newReply, trigger: e.target.value })} placeholder="Tetikleyici kelime (örn: merhaba)" />
                      <select value={newReply.matchType} onChange={e => setNewReply({ ...newReply, matchType: e.target.value })}
                        className={css({ px: '2', py: '2', bg: 'bgSurface', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', fontSize: 'sm', color: 'textMain', outline: 'none' })}>
                        <option value="contains">İçeriyor</option><option value="exact">Birebir</option><option value="regex">Regex</option>
                      </select>
                    </div>
                    <Textarea value={newReply.response} onChange={e => setNewReply({ ...newReply, response: e.target.value })} rows={2} placeholder="Yanıt mesajı (Markdown)" />
                    <Button size="sm" onClick={handleAddReply} disabled={!newReply.trigger || !newReply.response}><Save size={14} /> Ekle</Button>
                  </div>
                </div>
                <div className={css({ maxH: '300px', overflowY: 'auto' })}>
                  {loadingReplies ? <Spinner /> : autoReplies.length === 0 ? (
                    <div className={css({ color: 'textMuted', fontSize: 'sm', py: '4' })}>Henüz otomatik yanıt eklenmemiş.</div>
                  ) : autoReplies.map((r: any) => (
                    <div key={r.id} className={flex({ justify: 'space-between', align: 'center', py: '2', px: '3', borderRadius: 'md', mb: '1', _hover: { bg: 'bgButtonSecondary' } })}>
                      <div>
                        <span className={css({ fontWeight: '500', fontSize: 'sm' })}>{r.trigger}</span>
                        <Badge variant="neutral" className={css({ ml: '2' })}>{r.match_type}</Badge>
                        <div className={css({ fontSize: 'xs', color: 'textMuted' })}>{r.response?.substring(0, 60)}...</div>
                      </div>
                      <button onClick={() => handleDeleteReply(r.id)} className={css({ color: 'danger', p: '1', borderRadius: 'md', cursor: 'pointer', _hover: { bg: 'rgba(220,38,38,0.1)' } })}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Mesaj Geçmişi */}
            {manageTab === 'messages' && (
              <div className={stack({ gap: '3' })}>
                {loadingMsgs ? <Spinner /> : (
                  <>
                    <div>
                      <div className={css({ fontWeight: 'bold', mb: '2', fontSize: 'sm', display: 'flex', alignItems: 'center', gap: '2' })}><Trash2 size={14} /> Silinen Mesajlar ({deletedMsgs.length})</div>
                      {deletedMsgs.length === 0 ? <div className={css({ color: 'textMuted', fontSize: 'sm' })}>Kayıt yok.</div> : (
                        <div className={css({ maxH: '200px', overflowY: 'auto' })}>
                          {deletedMsgs.map((m: any, i: number) => (
                            <div key={i} className={css({ py: '1.5', px: '2', fontSize: 'sm', borderBottom: '1px solid token(colors.borderMain)' })}>
                              <span className={css({ fontWeight: '500' })}>{m.username || m.user_id}:</span> {m.message_text?.substring(0, 80)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className={css({ fontWeight: 'bold', mb: '2', fontSize: 'sm', display: 'flex', alignItems: 'center', gap: '2' })}><FileText size={14} /> Düzenlenen Mesajlar ({editedMsgs.length})</div>
                      {editedMsgs.length === 0 ? <div className={css({ color: 'textMuted', fontSize: 'sm' })}>Kayıt yok.</div> : (
                        <div className={css({ maxH: '200px', overflowY: 'auto' })}>
                          {editedMsgs.map((m: any, i: number) => (
                            <div key={i} className={css({ py: '1.5', px: '2', fontSize: 'sm', borderBottom: '1px solid token(colors.borderMain)' })}>
                              <span className={css({ fontWeight: '500' })}>{m.username || m.user_id}:</span>
                              <div className={css({ color: 'textMuted', fontSize: 'xs' })}>Eski: {m.old_text?.substring(0, 50)}</div>
                              <div className={css({ color: 'textMuted', fontSize: 'xs' })}>Yeni: {m.new_text?.substring(0, 50)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB: Raporlar */}
            {manageTab === 'reports' && (
              <div className={stack({ gap: '3' })}>
                {loadingReport ? <Spinner /> : !reportData ? (
                  <div className={css({ color: 'textMuted', fontSize: 'sm' })}>Rapor yüklenemedi.</div>
                ) : (
                  <>
                    <div className={grid({ columns: 2, gap: '3' })}>
                      <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', textAlign: 'center' })}>
                        <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'primary' })}>{reportData.totalMessages}</div>
                        <div className={css({ fontSize: 'xs', color: 'textMuted' })}>Toplam Mesaj (7 gün)</div>
                      </div>
                      <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', textAlign: 'center' })}>
                        <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'success' })}>{reportData.totalJoins}</div>
                        <div className={css({ fontSize: 'xs', color: 'textMuted' })}>Katılım (7 gün)</div>
                      </div>
                    </div>
                    {reportData.topUsers?.length > 0 && (
                      <div>
                        <div className={css({ fontWeight: 'bold', mb: '2', fontSize: 'sm' })}>🏆 En Aktif Kullanıcılar</div>
                        {reportData.topUsers.map((u: any, i: number) => (
                          <div key={i} className={flex({ justify: 'space-between', py: '1.5', px: '2', fontSize: 'sm', borderBottom: '1px solid token(colors.borderMain)' })}>
                            <span>{i + 1}. {u.first_name || u.username || 'Bilinmeyen'}</span>
                            <span className={css({ fontWeight: '600', color: 'primary' })}>{u.message_count} mesaj</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {reportData.moderationActions?.length > 0 && (
                      <div>
                        <div className={css({ fontWeight: 'bold', mb: '2', fontSize: 'sm' })}>🛡️ Moderasyon İstatistikleri</div>
                        {reportData.moderationActions.map((m: any, i: number) => (
                          <div key={i} className={flex({ justify: 'space-between', py: '1', px: '2', fontSize: 'sm' })}>
                            <span>{m.action}</span><span className={css({ fontWeight: '600' })}>{m.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB: Şablonlar */}
            {manageTab === 'templates' && (
              <div className={stack({ gap: '3' })}>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)' })}>
                  <div className={css({ fontWeight: 'bold', mb: '2', fontSize: 'sm' })}>Yeni Şablon Oluştur</div>
                  <div className={stack({ gap: '2' })}>
                    <Input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="Şablon adı (örn: Standart Moderasyon)" />
                    <Textarea value={templateSettings} onChange={e => setTemplateSettings(e.target.value)} rows={4} className={css({ fontFamily: 'monospace', fontSize: 'xs' })} />
                    <Button size="sm" onClick={handleCreateTemplate} disabled={!newTemplateName}><Save size={14} /> Şablonu Kaydet</Button>
                  </div>
                </div>
                <div>
                  {loadingTemplates ? <Spinner /> : templates.length === 0 ? (
                    <div className={css({ color: 'textMuted', fontSize: 'sm', py: '4' })}>Henüz şablon yok.</div>
                  ) : templates.map((t: any) => (
                    <div key={t.id} className={flex({ justify: 'space-between', align: 'center', py: '2', px: '3', borderRadius: 'md', mb: '1', _hover: { bg: 'bgButtonSecondary' } })}>
                      <div>
                        <span className={css({ fontWeight: '500', fontSize: 'sm' })}>{t.name}</span>
                      </div>
                      <div className={flex({ gap: '1' })}>
                        <Button size="sm" variant="ghost" onClick={() => handleApplyTemplate(t.id)}><Share2 size={14} /> Gruba Uygula</Button>
                        <button onClick={() => handleDeleteTemplate(t.id)} className={css({ color: 'danger', p: '1', borderRadius: 'md', cursor: 'pointer', _hover: { bg: 'rgba(220,38,38,0.1)' } })}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Toplu Mesaj */}
            {manageTab === 'broadcast' && (
              <div className={stack({ gap: '3' })}>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', border: '1px solid token(colors.borderMain)' })}>
                  <div className={css({ fontWeight: 'bold', mb: '2', fontSize: 'sm', display: 'flex', alignItems: 'center', gap: '2' })}>
                    <Send size={14} /> Tüm Gruplara Mesaj Gönder
                  </div>
                  <div className={stack({ gap: '2' })}>
                    <div className={flex({ gap: '2' })}>
                      <select value={broadcastParseMode} onChange={e => setBroadcastParseMode(e.target.value)}
                        className={css({ px: '3', py: '2', bg: 'bgSurface', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', fontSize: 'sm', color: 'textMain', outline: 'none' })}>
                        <option value="None">Düz Metin</option><option value="HTML">HTML</option><option value="Markdown">Markdown</option>
                      </select>
                    </div>
                    <Textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)} rows={3} placeholder="Tüm gruplara gönderilecek mesaj..." />
                    <Button onClick={handleBroadcast} disabled={broadcastSending || !broadcastText}>
                      <Send size={14} /> {broadcastSending ? 'Gönderiliyor...' : 'Tüm Gruplara Gönder'}
                    </Button>
                    {broadcastResult && (
                      <div className={css({ fontSize: 'sm', color: 'textMuted' })}>
                        ✅ {broadcastResult.sent} gönderildi, ❌ {broadcastResult.failed} başarısız
                        {broadcastResult.failed > 0 && (
                          <div className={css({ mt: '2', maxH: '150px', overflowY: 'auto', fontSize: 'xs' })}>
                            {broadcastResult.results?.filter((r: any) => !r.success).map((r: any, i: number) => (
                              <div key={i} className={css({ color: 'danger' })}>Grup {r.chatId}: {r.error}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Test Mesajı */}
            {manageTab === 'test' && (
              <div className={stack({ gap: '3' })}>
                <div className={flex({ gap: '2' })}>
                  <select value={testParseMode} onChange={e => setTestParseMode(e.target.value)}
                    className={css({ px: '3', py: '2', bg: 'bgSurface', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', fontSize: 'sm', color: 'textMain', outline: 'none' })}>
                    <option value="None">Düz Metin</option><option value="HTML">HTML</option><option value="Markdown">Markdown</option>
                  </select>
                </div>
                <Textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} rows={4}
                  placeholder="**Merhaba!** Bu bir test mesajıdır.\n\n`Markdown` ve [link](https://example.com) desteklenir." />
                {testMessage && (
                  <div className={css({ p: '3', bg: 'bgSurface', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', fontSize: 'sm' })}>
                    <div className={css({ fontWeight: 'bold', mb: '1', color: 'textMuted', fontSize: 'xs' })}>ÖN İZLEME ({testParseMode})</div>
                    <div dangerouslySetInnerHTML={{ __html: testParseMode === 'Markdown' ? renderMarkdown(testMessage) : testParseMode === 'HTML' ? testMessage : testMessage.replace(/\n/g, '<br />') }} />
                  </div>
                )}
                <Button onClick={handleSendTest} disabled={sending || !testMessage}>
                  <Send size={14} /> {sending ? 'Gönderiliyor...' : 'Test Mesajını Gruba Gönder'}
                </Button>
              </div>
            )}

            {/* TAB: Tehlikeli İşlemler */}
            {manageTab === 'danger' && (
              <div className={stack({ gap: '4' })}>
                <div className={css({ p: '4', bg: 'red.50', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', _dark: { bg: 'red.950/20' } })}>
                  <div className={css({ fontWeight: 'bold', mb: '2', color: 'danger', display: 'flex', alignItems: 'center', gap: '2' })}>
                    <Trash2 size={16} /> Gruptan Ayrıl
                  </div>
                  <div className={css({ fontSize: 'sm', color: 'textMuted', mb: '3' })}>
                    Bu işlem botu gruptan çıkarır ve tüm ayarları siler. Geri alınamaz.
                  </div>
                  <div className={flex({ gap: '2', align: 'center' })}>
                    <Input value={confirmLeave} onChange={e => setConfirmLeave(e.target.value)}
                      placeholder='Onaylamak için "SİL" yazın' />
                    <Button onClick={handleLeaveChat} disabled={confirmLeave !== 'SİL'} variant="danger">
                      <Trash2 size={14} /> Gruptan Ayrıl ve Sil
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
