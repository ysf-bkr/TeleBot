import { Calendar, Clock, FileText, Plus, RefreshCw, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { flex, grid, stack } from '../../../styled-system/patterns';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { articles as articlesApi, scheduler as schedulerApi } from '../../lib/api';

import { Article, Chat, ScheduledPost } from '../../types';

function renderMarkdown(md: string) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(239,68,68,0.05);padding:10px;border-radius:6px;font-family:monospace;overflow-x:auto;border:1px solid token(colors.borderMain);margin:8px 0">$1</pre>');
  html = html.replace(/`(.*?)`/g, '<code style="background:rgba(239,68,68,0.05);padding:2px 4px;border-radius:4px;font-family:monospace">$1</code>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:var(--colors-primary);text-decoration:underline">$1</a>');
  html = html.replace(/\n/g, '<br />');
  return html;
}

function getPreviewHTML(content: string, parseMode: string) {
  if (!content) return '';
  if (parseMode === 'HTML') {
    return content;
  }
  if (parseMode === 'Markdown') {
    return renderMarkdown(content);
  }
  return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />');
}

export function SchedulerView({ chats = [] }: { chats: Chat[] }) {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const [form, setForm] = useState<any>({
    chatId: '',
    content: '',
    parseMode: 'HTML',
    scheduledAt: '',
    autoDeleteAfter: '',
    buttons: '',
    repeatInterval: ''
  });

  const activeChats = chats.filter(c => c.is_enabled);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        schedulerApi.list(),
        articlesApi.list()
      ]);
      setPosts(pRes.data);
      setArticles(aRes.data);
    } catch (e) {
      toast.error('Veriler yüklenemedi');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.chatId || !form.content || !form.scheduledAt) {
      return toast.error('Lütfen tüm zorunlu alanları doldurun');
    }

    let parsedButtons = null;
    if (form.buttons.trim()) {
      try {
        parsedButtons = JSON.parse(form.buttons);
      } catch (err) {
        return toast.error('Buton JSON formatı geçersiz! Örn: [[{"text": "Buton", "url": "https://..."}]]');
      }
    }

    try {
      const payload = {
        chatId: String(form.chatId),
        content: form.content,
        parseMode: form.parseMode,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        autoDeleteAfter: form.autoDeleteAfter ? parseInt(form.autoDeleteAfter) : null,
        buttons: parsedButtons ? JSON.stringify(parsedButtons) : null,
        repeatInterval: form.repeatInterval || null
      };

      await schedulerApi.create(payload);
      toast.success('Gönderi zamanlandı!');
      setForm({
        chatId: '',
        content: '',
        parseMode: 'HTML',
        scheduledAt: '',
        autoDeleteAfter: '',
        buttons: '',
        repeatInterval: ''
      });
      setSelectedPostId(null);
      fetchData();
    } catch (err) {
      toast.error('Gönderi zamanlanamadı');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu planlanmış gönderiyi iptal etmek istediğinize emin misiniz?')) return;
    try {
      await fetch(`/api/scheduler/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Gönderi iptal edildi');
      if (selectedPostId === id) {
        setForm({
          chatId: '',
          content: '',
          parseMode: 'HTML',
          scheduledAt: '',
          autoDeleteAfter: '',
          buttons: '',
          repeatInterval: ''
        });
        setSelectedPostId(null);
      }
      fetchData();
    } catch (_) {
      toast.error('İşlem başarısız');
    }
  };

  const insertArticleLink = (slug: string) => {
    const host = window.location.port === '5173' ? 'http://127.0.0.1:3000' : window.location.origin;
    const url = `${host}/p/${slug}`;
    setForm((prev: any) => ({
      ...prev,
      content: prev.content + (prev.content ? ' ' : '') + url
    }));
    toast.info('Sayfa linki gönderi içeriğine eklendi!');
  };

  const getChatTitle = (chatId: string | number) => {
    const chat = chats.find(c => String(c.chat_id) === String(chatId));
    return chat ? chat.title : `Grup: ${chatId}`;
  };

  const handleSelectPost = (post: ScheduledPost) => {
    // Format date for datetime-local input
    let formattedDate = '';
    if (post.scheduled_at) {
      const d = new Date(post.scheduled_at);
      const pad = (n: number) => String(n).padStart(2, '0');
      formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    setForm({
      chatId: String(post.chat_id),
      content: post.content,
      parseMode: post.parse_mode || 'HTML',
      scheduledAt: formattedDate,
      autoDeleteAfter: post.auto_delete_after ? String(post.auto_delete_after) : '',
      buttons: post.buttons ? post.buttons : ''
    });
    setSelectedPostId(post.id);
  };

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '6', color: 'textMain' })}>
      <PageHeader
        title="Mesaj Planlayıcı"
        description="Telegram gruplarına otomatik zamanlı paylaşımlar gönderin ve otomatik sildirin"
        icon={<Calendar />}
        actions={
          <Button size="sm" variant="secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} className={css({ animation: loading ? 'spin 1s linear infinite' : 'none' })} />
          </Button>
        }
      />

      <div className={grid({ columns: { base: 1, lg: 3 }, gap: '6' })}>
        {/* Left Column: Planned Posts List */}
        <Card className={css({ gridColumn: { lg: 'span 1' }, display: 'flex', flexDirection: 'column', gap: '4' })}>
          <div className={flex({ justify: 'space-between', align: 'center', borderBottom: '1px solid token(colors.borderMain)', pb: '3' })}>
            <h2 className={css({ fontWeight: '600', fontSize: 'md' })}>Planlanmış Paylaşımlar ({posts.length})</h2>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setForm({
                  chatId: '', content: '', parseMode: 'HTML',
                  scheduledAt: '', autoDeleteAfter: '', buttons: '', repeatInterval: ''
                });
                setSelectedPostId(null);
              }}
              title="Yeni Plan Yaz"
            >
              <Plus size={14} className={css({ mr: '1' })} /> Yeni
            </Button>
          </div>

          <div className={stack({ gap: '3', overflowY: 'auto', maxH: '650px', p: '0.5' })}>
            {posts.length === 0 ? (
              <div className={css({ py: '8', textAlign: 'center', color: 'textMuted', fontSize: 'sm' })}>
                Planlanmış gönderi bulunmadı.
              </div>
            ) : (
              posts.map(post => {
                const badgeMap: Record<string, "success" | "danger" | "warning" | "neutral"> = {
                  sent: 'success',
                  pending: 'warning',
                  failed: 'danger',
                  deleted: 'neutral'
                };
                const statusLabel: Record<string, string> = {
                  sent: 'Gönderildi',
                  pending: 'Bekliyor',
                  failed: 'Başarısız',
                  deleted: 'Silindi'
                };
                return (
                  <div
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className={css({
                      p: '3.5',
                      borderRadius: 'xl',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: selectedPostId === post.id ? 'primary' : 'borderMain',
                      bg: selectedPostId === post.id ? 'bgCanvas' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedPostId === post.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                      _hover: { bg: 'bgCanvas', borderColor: 'primary' },
                      position: 'relative'
                    })}
                  >
                    <div className={flex({ justify: 'space-between', align: 'center', mb: '1.5' })}>
                      <span className={css({ fontWeight: '600', fontSize: 'sm', color: 'textMain', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxW: '120px' })}>
                        {getChatTitle(post.chat_id)}
                      </span>
                      <Badge variant={badgeMap[post.status] || 'neutral'}>
                        {statusLabel[post.status] || post.status}
                      </Badge>
                    </div>

                    <div className={css({ fontSize: 'xs', color: 'textMuted', mb: '3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>
                      {post.content}
                    </div>

                    <div className={flex({ justify: 'space-between', align: 'center' })}>
                      <span className={css({ fontSize: '10px', color: 'textMuted' })}>
                        {new Date(post.scheduled_at).toLocaleString('tr-TR')}
                      </span>

                      <div className={flex({ gap: '1' })} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          className={css({ p: '1.5', borderRadius: 'md', bg: 'bgButtonSecondary', color: 'danger', _hover: { bg: 'red.50' }, _dark: { _hover: { bg: 'red.950/20' } }, cursor: 'pointer', border: 'none' })}
                          title="Planı Sil / İptal Et"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Editor Form */}
        <Card className={css({ gridColumn: { lg: 'span 2' } })}>
          <h2 className={css({ fontWeight: '600', mb: '4', fontSize: 'lg' })}>
            {selectedPostId ? 'Gönderi Planını İncele / Çoğalt' : 'Yeni Gönderi Planla'}
          </h2>
          <form onSubmit={handleCreate} className={stack({ gap: '4' })}>
            <div>
              <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Gönderilecek Grup</label>
              <select
                value={form.chatId}
                onChange={e => setForm({ ...form, chatId: e.target.value })}
                required
                className={css({
                  width: 'full', px: '3', py: '2.5', bg: 'bgSurface',
                  borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain',
                  borderRadius: 'lg', color: 'textMain', fontSize: 'sm',
                  outline: 'none', cursor: 'pointer',
                  _focus: { borderColor: 'primary' }
                })}
              >
                <option value="">Grup seçiniz...</option>
                {activeChats.map(c => (
                  <option key={c.chat_id} value={c.chat_id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Quick Articles Link Injector */}
            {articles.length > 0 && (
              <div>
                <label className={css({ fontSize: 'xs', fontWeight: '600', color: 'textMuted', display: 'block', mb: '1.5' })}>
                  📄 Sayfalardan Link Ekle
                </label>
                <div className={flex({ gap: '1.5', flexWrap: 'wrap' })}>
                  {articles.slice(0, 4).map(art => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => insertArticleLink(art.slug)}
                      className={css({
                        px: '2.5', py: '1', borderRadius: 'md', fontSize: 'xs',
                        bg: 'bgButtonSecondary', color: 'textButtonSecondary',
                        _hover: { bg: 'bgButtonSecondaryHover' }, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '1', border: 'none'
                      })}
                    >
                      <FileText size={12} /> {art.title.slice(0, 15)}...
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Mesaj İçeriği</label>
              <Textarea
                placeholder="Mesajınızı yazın..."
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                required
                className={css({ minH: '120px' })}
              />
            </div>

            <div className={grid({ columns: 2, gap: '3' })}>
              <div>
                <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Parse Mode</label>
                <select
                  value={form.parseMode}
                  onChange={e => setForm({ ...form, parseMode: e.target.value })}
                  className={css({
                    width: 'full', px: '3', py: '2.5', bg: 'bgSurface',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain',
                    borderRadius: 'lg', color: 'textMain', fontSize: 'sm',
                    outline: 'none', cursor: 'pointer',
                    _focus: { borderColor: 'primary' }
                  })}
                >
                  <option value="None">Düz Metin</option>
                  <option value="HTML">HTML</option>
                  <option value="Markdown">Markdown</option>
                </select>
              </div>

              <div>
                <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Oto Silme (Saniye)</label>
                <Input
                  type="number"
                  placeholder="Boş = Silinmez"
                  value={form.autoDeleteAfter}
                  onChange={e => setForm({ ...form, autoDeleteAfter: e.target.value })}
                />
              </div>
            </div>

            <div className={grid({ columns: 2, gap: '3' })}>
              <div>
                <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Gönderim Zamanı</label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Tekrarlama</label>
                <select
                  value={form.repeatInterval}
                  onChange={e => setForm({ ...form, repeatInterval: e.target.value })}
                  className={css({
                    width: 'full', px: '3', py: '2.5', bg: 'bgSurface',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain',
                    borderRadius: 'lg', color: 'textMain', fontSize: 'sm',
                    outline: 'none', cursor: 'pointer',
                    _focus: { borderColor: 'primary' }
                  })}
                >
                  <option value="">Tekrarlama (Bir kere)</option>
                  <option value="daily">Her Gün</option>
                  <option value="weekly">Her Hafta</option>
                  <option value="monthly">Her Ay</option>
                </select>
              </div>
            </div>

            <div>
              <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Butonlar (Inline Keyboard JSON)</label>
              <Textarea
                placeholder='örn: [[{"text": "Siteye Git", "url": "https://..."}]]'
                value={form.buttons}
                onChange={e => setForm({ ...form, buttons: e.target.value })}
                className={css({ minH: '60px', fontFamily: 'monospace', fontSize: 'xs' })}
              />
            </div>

            {form.content && (
              <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain', fontSize: 'sm' })}>
                <div className={css({ fontWeight: 'bold', mb: '2', color: 'textMain', borderBottom: '1px solid token(colors.borderMain)', pb: '1' })}>Ön İzleme ({form.parseMode === 'None' ? 'Düz Metin' : form.parseMode})</div>
                <div dangerouslySetInnerHTML={{ __html: getPreviewHTML(form.content, form.parseMode) }} className={css({ color: 'textMain', lineHeight: 'relaxed' })} />
              </div>
            )}

            <div className={flex({ gap: '2', mt: '2' })}>
              <Button type="submit" className={css({ flex: 1 })}>
                <Clock size={16} /> {selectedPostId ? 'Yeni Plan Olarak Kaydet / Çoğalt' : 'Planı Kaydet'}
              </Button>
              {(selectedPostId || form.content || form.scheduledAt) && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setForm({
                      chatId: '', content: '', parseMode: 'HTML',
                      scheduledAt: '', autoDeleteAfter: '', buttons: '', repeatInterval: ''
                    });
                    setSelectedPostId(null);
                  }}
                >
                  Temizle / İptal
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default SchedulerView;
