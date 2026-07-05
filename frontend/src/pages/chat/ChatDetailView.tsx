import { Ban, ChevronLeft, Download, EyeOff, FileText, MessageSquare, PenTool, RefreshCw, Send, Shield, Trash2, Upload, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { chatsApi } from '../../lib/api';
import type { Chat } from '../../types';

type TabType = 'overview' | 'messages' | 'members' | 'admins' | 'autoReplies' | 'deleted' | 'edited' | 'exportImport' | 'reports';

export default function ChatDetailView() {
  const { chatId } = useParams<{ chatId: string }>();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('overview');

  // Data states
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [autoReplies, setAutoReplies] = useState<any[]>([]);
  const [deletedMsgs, setDeletedMsgs] = useState<any[]>([]);
  const [editedMsgs, setEditedMsgs] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Form states
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<any>(null);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    if (chatId) fetchChat();
  }, [chatId]);

  const fetchChat = async () => {
    try {
      const res = await chatsApi.get(chatId!);
      setChat(res.data);
    } catch (e) {
      toast.error('Grup bilgisi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (t: TabType) => {
    if (!chatId) return;
    setLoadingData(true);
    try {
      switch (t) {
        case 'messages': {
          const res = await chatsApi.messages(chatId);
          setMessages(res.data);
          break;
        }
        case 'members': {
          const res = await chatsApi.members(chatId);
          setMembers(res.data.members || []);
          break;
        }
        case 'admins': {
          const res = await chatsApi.admins(chatId);
          setAdmins(res.data);
          break;
        }
        case 'autoReplies': {
          const res = await chatsApi.autoReplies(chatId);
          setAutoReplies(res.data);
          break;
        }
        case 'deleted': {
          const res = await chatsApi.deletedMessages(chatId);
          setDeletedMsgs(res.data);
          break;
        }
        case 'edited': {
          const res = await chatsApi.editedMessages(chatId);
          setEditedMsgs(res.data);
          break;
        }
        case 'reports': {
          const res = await chatsApi.reports(chatId);
          setReport(res.data);
          break;
        }
      }
    } catch (e: any) {
      toast.error('Veri yüklenemedi');
    }
    setLoadingData(false);
  };

  const handleTabChange = (t: TabType) => {
    setTab(t);
    fetchTabData(t);
  };

  const handleAddAutoReply = async () => {
    if (!newTrigger.trim() || !newResponse.trim()) { toast.error('Tetikleyici ve yanıt zorunludur'); return; }
    try {
      await chatsApi.createAutoReply(chatId!, { trigger: newTrigger.trim(), response: newResponse.trim() });
      toast.success('Otomatik yanıt eklendi');
      setNewTrigger(''); setNewResponse('');
      fetchTabData('autoReplies');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Yanıt eklenemedi');
    }
  };

  const handleDeleteAutoReply = async (id: number) => {
    if (!confirm('Bu otomatik yanıtı silmek istediğinize emin misiniz?')) return;
    try {
      await chatsApi.deleteAutoReply(chatId!, id);
      toast.success('Otomatik yanıt silindi');
      fetchTabData('autoReplies');
    } catch (e) { toast.error('Silinemedi'); }
  };

  const handleExport = async () => {
    try {
      const res = await chatsApi.exportSettings(chatId!);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `chat-${chatId}-settings.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Ayarlar dışa aktarıldı');
    } catch (e) { toast.error('Dışa aktarılamadı'); }
  };

  const handleImport = async () => {
    if (!importData.trim()) { toast.error('JSON verisi girin'); return; }
    try {
      const data = JSON.parse(importData);
      await chatsApi.importSettings(chatId!, data);
      toast.success('Ayarlar içe aktarıldı');
      setImportData('');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Geçersiz JSON veya içe aktarma hatası');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) { toast.error('Mesaj içeriği girin'); return; }
    try {
      const res = await chatsApi.broadcast({ text: broadcastText.trim() });
      setBroadcastResult(res.data);
      toast.success(`Mesaj ${res.data.sent} gruba gönderildi`);
    } catch (e: any) { toast.error(e.response?.data?.error || 'Gönderilemedi'); }
  };

  const handleLeave = async () => {
    if (!confirm('Bu gruptan ayrılmak istediğinize emin misiniz? Bot gruptan çıkarılacak ve liste silinecek.')) return;
    try {
      await chatsApi.leave(chatId!);
      toast.success('Gruptan ayrıldı');
      window.history.back();
    } catch (e) { toast.error('Ayrılamadı'); }
  };

  if (loading) return <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>Yükleniyor...</div>;
  if (!chat) return <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>Grup bulunamadı</div>;

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Genel', icon: FileText },
    { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
    { id: 'members', label: 'Üyeler', icon: Users },
    { id: 'admins', label: 'Yöneticiler', icon: Shield },
    { id: 'autoReplies', label: 'Otomatik Yanıt', icon: PenTool },
    { id: 'deleted', label: 'Silinenler', icon: EyeOff },
    { id: 'edited', label: 'Düzenlenenler', icon: PenTool },
    { id: 'exportImport', label: 'Yedekleme', icon: Download },
    { id: 'reports', label: 'Raporlar', icon: FileText },
  ];

  return (
    <div className={stack({ gap: '5' })}>
      {/* Header */}
      <div className={hstack({ justify: 'space-between', alignItems: 'center' })}>
        <div className={hstack({ gap: '3' })}>
          <button onClick={() => window.history.back()} className={css({ p: '2', borderRadius: 'lg', cursor: 'pointer', _hover: { bg: 'hoverBg' }, border: 'none', bg: 'none', color: 'textMain' })}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className={css({ fontSize: 'xl', fontWeight: 'bold', color: 'textMain' })}>{chat.title || chat.chat_id}</h1>
            <p className={css({ fontSize: 'sm', color: 'textMuted' })}>ID: {chat.chat_id} · {chat.type} · {chat.member_count || '?'} üye</p>
          </div>
        </div>
        <button onClick={handleLeave} className={css({ display: 'flex', alignItems: 'center', gap: '1', px: '3', py: '2', borderRadius: 'lg', bg: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', _hover: { opacity: 0.8 } })}>
          <Ban size={14} /> Gruptan Ayrıl
        </button>
      </div>

      {/* Tabs */}
      <div className={css({ display: 'flex', gap: '1', borderBottom: '1px solid token(colors.borderMain)', pb: '2', overflowX: 'auto' })}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={css({
              display: 'flex', alignItems: 'center', gap: '1', px: '3', py: '1.5', borderRadius: 'lg', fontSize: '12px',
              fontWeight: tab === t.id ? '600' : '500', bg: tab === t.id ? 'primary' : 'transparent',
              color: tab === t.id ? 'white' : 'textMain', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
              _hover: { bg: tab === t.id ? 'primaryHover' : 'bgButtonSecondary' }
            })}><t.icon size={13} /> {t.label}</button>
        ))}
      </div>

      {/* TAB: Overview */}
      {tab === 'overview' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', p: '5', border: '1px solid token(colors.borderMain)' })}>
          <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: '4', mb: '5' })}>
            <div><span className={css({ fontSize: '11px', color: 'textMuted', display: 'block' })}>Durum</span><span className={css({ fontWeight: '600', color: chat.is_enabled ? '#22c55e' : '#ef4444' })}>{chat.is_enabled ? 'Aktif' : 'Pasif'}</span></div>
            <div><span className={css({ fontSize: '11px', color: 'textMuted', display: 'block' })}>Tür</span><span className={css({ fontWeight: '600' })}>{chat.type}</span></div>
            <div><span className={css({ fontSize: '11px', color: 'textMuted', display: 'block' })}>Üye Sayısı</span><span className={css({ fontWeight: '600' })}>{chat.member_count || '?'}</span></div>
          </div>
          <div className={hstack({ gap: '3' })}>
            <button onClick={() => handleTabChange('messages')} className={css({ px: '4', py: '2', borderRadius: 'lg', bg: 'primary', color: 'white', fontWeight: '600', fontSize: '12px', cursor: 'pointer', border: 'none', _hover: { bg: 'primaryHover' } })}><MessageSquare size={14} /> Mesaj Geçmişi</button>
            <button onClick={() => handleTabChange('exportImport')} className={css({ px: '4', py: '2', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'textMain', fontWeight: '500', fontSize: '12px', cursor: 'pointer', border: '1px solid token(colors.borderMain)', _hover: { bg: 'hoverBg' } })}><Download size={14} /> Yedekle</button>
            <button onClick={() => handleTabChange('reports')} className={css({ px: '4', py: '2', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'textMain', fontWeight: '500', fontSize: '12px', cursor: 'pointer', border: '1px solid token(colors.borderMain)', _hover: { bg: 'hoverBg' } })}><FileText size={14} /> Raporlar</button>
          </div>
        </div>
      )}

      {/* TAB: Messages */}
      {tab === 'messages' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)', overflow: 'hidden' })}>
          <div className={hstack({ justify: 'space-between', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>
            <span className={css({ fontWeight: '600', fontSize: '14px' })}>Son Mesajlar</span>
            <button onClick={() => fetchTabData('messages')} className={css({ p: '1.5', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'none', color: 'textMuted', _hover: { bg: 'hoverBg' } })}><RefreshCw size={14} /></button>
          </div>
          {loadingData ? <div className={css({ textAlign: 'center', py: '8', color: 'textMuted', fontSize: 'sm' })}>Yükleniyor...</div> : messages.length === 0 ? (
            <div className={css({ textAlign: 'center', py: '12', color: 'textMuted', fontSize: 'sm' })}>Henüz mesaj kaydı yok</div>
          ) : (
            <div className={css({ maxH: '500px', overflowY: 'auto' })}>
              {messages.map((msg, i) => (
                <div key={i} className={css({ p: '3', borderBottom: '1px solid token(colors.borderMain)', _hover: { bg: 'hoverBg' }, fontSize: '13px' })}>
                  <div className={hstack({ gap: '2', mb: '1' })}>
                    <span className={css({ fontWeight: '600', color: 'textMain' })}>{msg.first_name || msg.username || 'Anonim'}</span>
                    <span className={css({ fontSize: '11px', color: 'textMuted' })}>{new Date(msg.timestamp).toLocaleString('tr-TR')}</span>
                  </div>
                  <p className={css({ color: 'textMuted' })}>{msg.message_text || '(içerik yok)'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Members */}
      {tab === 'members' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)', overflow: 'hidden' })}>
          <div className={hstack({ justify: 'space-between', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>
            <span className={css({ fontWeight: '600', fontSize: '14px' })}>Yöneticiler ({members.length})</span>
            <button onClick={() => fetchTabData('members')} className={css({ p: '1.5', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'none', color: 'textMuted', _hover: { bg: 'hoverBg' } })}><RefreshCw size={14} /></button>
          </div>
          {loadingData ? <div className={css({ textAlign: 'center', py: '8', color: 'textMuted' })}>Yükleniyor...</div> : members.map((m, i) => (
            <div key={i} className={css({ display: 'flex', alignItems: 'center', gap: '3', p: '3', borderBottom: '1px solid token(colors.borderMain)', _hover: { bg: 'hoverBg' } })}>
              <div className={css({ w: '8', h: '8', borderRadius: 'full', bg: m.status === 'creator' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', color: m.status === 'creator' ? '#f59e0b' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' })}>{m.user?.first_name?.[0] || '?'}</div>
              <div className={css({ flex: 1 })}>
                <span className={css({ fontWeight: '600', fontSize: '13px' })}>{m.user?.first_name || m.user?.username || 'Bilinmeyen'}</span>
                <span className={css({ ml: '2', px: '1.5', py: '0.5', borderRadius: 'full', fontSize: '10px', fontWeight: '600', bg: m.status === 'creator' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', color: m.status === 'creator' ? '#f59e0b' : '#3b82f6' })}>{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Admins */}
      {tab === 'admins' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)', overflow: 'hidden' })}>
          <div className={hstack({ justify: 'space-between', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>
            <span className={css({ fontWeight: '600', fontSize: '14px' })}>Yönetici Yönetimi</span>
            <button onClick={() => fetchTabData('admins')} className={css({ p: '1.5', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'none', color: 'textMuted', _hover: { bg: 'hoverBg' } })}><RefreshCw size={14} /></button>
          </div>
          {loadingData ? <div className={css({ textAlign: 'center', py: '8', color: 'textMuted' })}>Yükleniyor...</div> : admins.length === 0 ? (
            <div className={css({ textAlign: 'center', py: '8', color: 'textMuted' })}>Yönetici bulunamadı</div>
          ) : admins.map((a, i) => (
            <div key={i} className={css({ display: 'flex', alignItems: 'center', gap: '3', p: '3', borderBottom: '1px solid token(colors.borderMain)' })}>
              <div className={css({ flex: 1, fontSize: '13px' })}>
                <span className={css({ fontWeight: '600' })}>{a.user?.first_name || a.user?.username}</span>
                <span className={css({ ml: '2', fontSize: '11px', color: 'textMuted' })}>@{a.user?.username}</span>
              </div>
              <span className={css({ fontSize: '11px', color: 'textMuted' })}>{a.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Auto Replies */}
      {tab === 'autoReplies' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)', overflow: 'hidden' })}>
          <div className={css({ p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>
            <div className={css({ fontWeight: '600', fontSize: '14px', mb: '3' })}>Otomatik Yanıtlayıcı</div>
            <div className={hstack({ gap: '2' })}>
              <input value={newTrigger} onChange={e => setNewTrigger(e.target.value)} placeholder="Tetikleyici kelime" className={css({ flex: 1, px: '3', py: '2', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', bg: 'bgCanvas', color: 'textMain', fontSize: '13px', outline: 'none' })} />
              <input value={newResponse} onChange={e => setNewResponse(e.target.value)} placeholder="Yanıt mesajı" className={css({ flex: 2, px: '3', py: '2', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', bg: 'bgCanvas', color: 'textMain', fontSize: '13px', outline: 'none' })} />
              <button onClick={handleAddAutoReply} className={css({ px: '3', py: '2', borderRadius: 'lg', bg: 'primary', color: 'white', fontWeight: '600', fontSize: '12px', cursor: 'pointer', border: 'none', _hover: { bg: 'primaryHover' } })}><UserPlus size={14} /> Ekle</button>
            </div>
          </div>
          {loadingData ? <div className={css({ textAlign: 'center', py: '8', color: 'textMuted' })}>Yükleniyor...</div> : autoReplies.length === 0 ? (
            <div className={css({ textAlign: 'center', py: '8', color: 'textMuted', fontSize: 'sm' })}>Henüz otomatik yanıt yok</div>
          ) : autoReplies.map((r, i) => (
            <div key={i} className={css({ display: 'flex', alignItems: 'center', gap: '3', p: '3', borderBottom: '1px solid token(colors.borderMain)', _hover: { bg: 'hoverBg' } })}>
              <div className={css({ flex: 1 })}>
                <span className={css({ px: '2', py: '0.5', borderRadius: 'md', bg: 'rgba(239,68,68,0.1)', color: 'primary', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' })}>{r.trigger}</span>
                <span className={css({ ml: '2', fontSize: '13px', color: 'textMuted' })}>→ {r.response}</span>
              </div>
              <button onClick={() => handleDeleteAutoReply(r.id)} className={css({ p: '1.5', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'rgba(239,68,68,0.1)', color: '#ef4444', _hover: { opacity: 0.8 } })}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Deleted Messages */}
      {tab === 'deleted' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)', overflow: 'hidden' })}>
          <div className={hstack({ justify: 'space-between', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>
            <span className={css({ fontWeight: '600', fontSize: '14px' })}>Silinen Mesajlar</span>
            <button onClick={() => fetchTabData('deleted')} className={css({ p: '1.5', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'none', color: 'textMuted', _hover: { bg: 'hoverBg' } })}><RefreshCw size={14} /></button>
          </div>
          {loadingData ? <div className={css({ textAlign: 'center', py: '8', color: 'textMuted' })}>Yükleniyor...</div> : deletedMsgs.length === 0 ? (
            <div className={css({ textAlign: 'center', py: '12', color: 'textMuted', fontSize: 'sm' })}>Silinen mesaj kaydı yok</div>
          ) : deletedMsgs.map((m, i) => (
            <div key={i} className={css({ p: '3', borderBottom: '1px solid token(colors.borderMain)', _hover: { bg: 'hoverBg' } })}>
              <div className={hstack({ gap: '2', mb: '1' })}>
                <span className={css({ fontWeight: '600', fontSize: '12px' })}>{m.username || 'Anonim'}</span>
                <span className={css({ fontSize: '11px', color: 'textMuted' })}>{new Date(m.deleted_at).toLocaleString('tr-TR')}</span>
              </div>
              <p className={css({ fontSize: '12px', color: 'textMuted' })}>{m.message_text || '(içerik yok)'}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Edited Messages */}
      {tab === 'edited' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)', overflow: 'hidden' })}>
          <div className={hstack({ justify: 'space-between', p: '4', borderBottom: '1px solid token(colors.borderMain)' })}>
            <span className={css({ fontWeight: '600', fontSize: '14px' })}>Düzenlenen Mesajlar</span>
            <button onClick={() => fetchTabData('edited')} className={css({ p: '1.5', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'none', color: 'textMuted', _hover: { bg: 'hoverBg' } })}><RefreshCw size={14} /></button>
          </div>
          {loadingData ? <div className={css({ textAlign: 'center', py: '8', color: 'textMuted' })}>Yükleniyor...</div> : editedMsgs.length === 0 ? (
            <div className={css({ textAlign: 'center', py: '12', color: 'textMuted', fontSize: 'sm' })}>Düzenlenen mesaj kaydı yok</div>
          ) : editedMsgs.map((m, i) => (
            <div key={i} className={css({ p: '3', borderBottom: '1px solid token(colors.borderMain)', _hover: { bg: 'hoverBg' } })}>
              <div className={hstack({ gap: '2', mb: '1' })}>
                <span className={css({ fontWeight: '600', fontSize: '12px' })}>{m.username || 'Anonim'}</span>
                <span className={css({ fontSize: '11px', color: 'textMuted' })}>{new Date(m.edited_at).toLocaleString('tr-TR')}</span>
              </div>
              <div className={css({ fontSize: '12px' })}>
                <span className={css({ color: '#ef4444', textDecoration: 'line-through' })}>{m.old_text}</span>
                <span className={css({ color: '#22c55e', ml: '2' })}>→ {m.new_text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Export/Import */}
      {tab === 'exportImport' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', p: '5', border: '1px solid token(colors.borderMain)' })}>
          <div className={css({ fontWeight: '600', fontSize: '14px', mb: '4' })}>Yedekleme & Geri Yükleme</div>
          <div className={stack({ gap: '4' })}>
            <button onClick={handleExport} className={css({ display: 'flex', alignItems: 'center', gap: '2', px: '4', py: '2.5', borderRadius: 'lg', bg: 'primary', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', border: 'none', _hover: { bg: 'primaryHover' }, w: 'fit' })}>
              <Download size={16} /> Ayarları Dışa Aktar (JSON)
            </button>
            <div className={css({ borderTop: '1px solid token(colors.borderMain)', pt: '4' })}>
              <div className={css({ fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '2' })}>İçe Aktar (JSON)</div>
              <textarea value={importData} onChange={e => setImportData(e.target.value)} rows={5} placeholder='Dışa aktarılan JSON verisini buraya yapıştırın...' className={css({ w: 'full', px: '3', py: '2', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', bg: 'bgCanvas', color: 'textMain', fontSize: '13px', outline: 'none', fontFamily: 'monospace', resize: 'vertical' })} />
              <button onClick={handleImport} className={css({ mt: '2', display: 'flex', alignItems: 'center', gap: '2', px: '4', py: '2', borderRadius: 'lg', bg: 'primary', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', border: 'none', _hover: { bg: 'primaryHover' } })}>
                <Upload size={16} /> İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Reports */}
      {tab === 'reports' && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', p: '5', border: '1px solid token(colors.borderMain)' })}>
          <div className={hstack({ justify: 'space-between', mb: '4' })}>
            <span className={css({ fontWeight: '600', fontSize: '14px' })}>Grup Raporları</span>
            <button onClick={() => fetchTabData('reports')} className={css({ p: '1.5', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'none', color: 'textMuted', _hover: { bg: 'hoverBg' } })}><RefreshCw size={14} /></button>
          </div>
          {loadingData ? <div className={css({ textAlign: 'center', py: '8', color: 'textMuted' })}>Yükleniyor...</div> : !report ? (
            <div className={css({ textAlign: 'center', py: '8', color: 'textMuted' })}>Rapor bulunamadı</div>
          ) : (
            <div className={stack({ gap: '4' })}>
              <div className={css({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3' })}>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', textAlign: 'center', border: '1px solid token(colors.borderMain)' })}>
                  <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: '#3b82f6' })}>{report.totalMessages}</div>
                  <div className={css({ fontSize: '11px', color: 'textMuted' })}>Mesaj ({report.period})</div>
                </div>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', textAlign: 'center', border: '1px solid token(colors.borderMain)' })}>
                  <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: '#22c55e' })}>{report.totalJoins}</div>
                  <div className={css({ fontSize: '11px', color: 'textMuted' })}>Katılım</div>
                </div>
                <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', textAlign: 'center', border: '1px solid token(colors.borderMain)' })}>
                  <div className={css({ fontSize: '2xl', fontWeight: 'bold', color: '#f59e0b' })}>{report.moderationActions?.reduce((a: number, m: any) => a + Number(m.count), 0) || 0}</div>
                  <div className={css({ fontSize: '11px', color: 'textMuted' })}>Moderasyon</div>
                </div>
              </div>

              {/* Top Users */}
              {report.topUsers?.length > 0 && (
                <div>
                  <div className={css({ fontWeight: '600', fontSize: '13px', mb: '2' })}>En Aktif Kullanıcılar</div>
                  <div className={stack({ gap: '1' })}>
                    {report.topUsers.map((u: any, i: number) => (
                      <div key={i} className={css({ display: 'flex', alignItems: 'center', gap: '3', p: '2', borderRadius: 'md', _hover: { bg: 'hoverBg' } })}>
                        <span className={css({ w: '6', h: '6', borderRadius: 'full', bg: 'rgba(239,68,68,0.1)', color: 'primary', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' })}>#{i + 1}</span>
                        <span className={css({ flex: 1, fontSize: '13px', fontWeight: '500' })}>{u.first_name || u.username || 'Anonim'}</span>
                        <span className={css({ fontSize: '12px', color: 'textMuted', fontWeight: '600' })}>{u.message_count} mesaj</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Broadcast */}
              <div className={css({ borderTop: '1px solid token(colors.borderMain)', pt: '4' })}>
                <div className={css({ fontWeight: '600', fontSize: '13px', mb: '2' })}>Toplu Mesaj Gönderimi</div>
                <textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)} rows={3} placeholder="Tüm gruplara gönderilecek mesaj..." className={css({ w: 'full', px: '3', py: '2', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', bg: 'bgCanvas', color: 'textMain', fontSize: '13px', outline: 'none', resize: 'vertical', mb: '2' })} />
                <button onClick={handleBroadcast} className={css({ display: 'flex', alignItems: 'center', gap: '2', px: '4', py: '2', borderRadius: 'lg', bg: 'primary', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', border: 'none', _hover: { bg: 'primaryHover' } })}>
                  <Send size={14} /> Tüm Gruplara Gönder
                </button>
                {broadcastResult && (
                  <div className={css({ mt: '3', p: '3', borderRadius: 'lg', bg: 'bgCanvas', border: '1px solid token(colors.borderMain)', fontSize: '13px' })}>
                    <span className={css({ color: '#22c55e', fontWeight: '600' })}>✓ {broadcastResult.sent}</span> başarılı, <span className={css({ color: '#ef4444', fontWeight: '600' })}>✗ {broadcastResult.failed}</span> başarısız
                  </div>
                )}
              </div>

              {/* Moderation Stats */}
              {report.moderationActions?.length > 0 && (
                <div>
                  <div className={css({ fontWeight: '600', fontSize: '13px', mb: '2' })}>Moderasyon İstatistikleri</div>
                  <div className={css({ display: 'flex', gap: '2', flexWrap: 'wrap' })}>
                    {report.moderationActions.map((m: any, i: number) => (
                      <span key={i} className={css({ px: '3', py: '1.5', borderRadius: 'lg', bg: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '12px' })}>
                        {m.action}: <strong>{m.count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
