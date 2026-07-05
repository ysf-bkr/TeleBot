import React, { useState, useEffect } from 'react';
import { css } from '../../../styled-system/css';
import { stack, flex, grid } from '../../../styled-system/patterns';
import { FileText, Plus, Trash2, Link, Edit, Check, Share2 } from 'lucide-react';
import { articles as articlesApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';
import { Article } from '../../types';

function renderMarkdown(md: string) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Code block: ```code```
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(239,68,68,0.05);padding:10px;border-radius:6px;font-family:monospace;overflow-x:auto;border:1px solid token(colors.borderMain);margin:8px 0">$1</pre>');
  // Inline code: `code`
  html = html.replace(/`(.*?)`/g, '<code style="background:rgba(239,68,68,0.05);padding:2px 4px;border-radius:4px;font-family:monospace">$1</code>');
  // Link: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:var(--colors-primary);text-decoration:underline">$1</a>');
  // Newlines
  html = html.replace(/\n/g, '<br />');
  return html;
}

export function ArticlesView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ title: '', slug: '', content: '' });
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Sharing states
  const [chats, setChats] = useState<any[]>([]);
  const [sharingArticle, setSharingArticle] = useState<Article | null>(null);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [shareMode, setShareMode] = useState<'now' | 'schedule'>('now');
  const [scheduleTime, setScheduleTime] = useState('');
  const [sharingSubmitting, setSharingSubmitting] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await articlesApi.list();
      setArticles(res.data);
    } catch (err) {
      toast.error('Sayfalar yüklenemedi');
    }
    setLoading(false);
  };

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setChats(data.filter(c => c.is_enabled === 1));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchArticles();
    fetchChats();
  }, []);

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingArticle || !selectedChatId) return;

    setSharingSubmitting(true);
    try {
      if (shareMode === 'now') {
        const res = await fetch(`/api/articles/${sharingArticle.id}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ chatId: selectedChatId })
        });
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
        } else {
          toast.success('Yazı grupta paylaşıldı!');
          setSharingArticle(null);
        }
      } else {
        if (!scheduleTime) {
          toast.error('Lütfen zamanlama tarihini girin');
          setSharingSubmitting(false);
          return;
        }

        const link = getArticleUrl(sharingArticle.slug);
        const content = `📝 <b>${sharingArticle.title}</b>\n\n${link}`;

        const res = await fetch('/api/scheduler', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            chatId: selectedChatId,
            content,
            scheduledAt: new Date(scheduleTime).toISOString(),
            parseMode: 'HTML'
          })
        });
        const data = await res.json();
        if (data.error) {
          toast.error(data.error);
        } else {
          toast.success('Yazı zamanlama planına eklendi!');
          setSharingArticle(null);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Paylaşım başarısız');
    } finally {
      setSharingSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return toast.error('Başlık ve içerik gereklidir');

    try {
      if (isEditing && currentId !== null) {
        await articlesApi.update(currentId, form);
        toast.success('Yazı başarıyla güncellendi');
      } else {
        await articlesApi.create(form);
        toast.success('Yazı başarıyla yayınlandı');
      }
      setForm({ title: '', slug: '', content: '' });
      setIsEditing(false);
      setCurrentId(null);
      fetchArticles();
    } catch (err) {
      toast.error('Yazı kaydedilemedi');
    }
  };

  const handleEdit = (article: Article) => {
    setForm({
      title: article.title,
      slug: article.slug,
      content: article.content,
    });
    setIsEditing(true);
    setCurrentId(article.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;
    try {
      await articlesApi.delete(id);
      toast.success('Yazı silindi');
      if (currentId === id) {
        setForm({ title: '', slug: '', content: '' });
        setIsEditing(false);
        setCurrentId(null);
      }
      fetchArticles();
    } catch (err) {
      toast.error('Yazı silinemedi');
    }
  };

  const getArticleUrl = (slug: string) => {
    // Generate public URL (resolves to backend host)
    const host = window.location.port === '5173' ? 'http://127.0.0.1:3000' : window.location.origin;
    return `${host}/p/${slug}`;
  };

  const handleCopyLink = (slug: string, id: number) => {
    const url = getArticleUrl(slug);
    navigator.clipboard.writeText(url);
    toast.success('Paylaşım linki kopyalandı!');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '6', color: 'textMain' })}>
      <PageHeader
        title="Sayfalar"
        description="Telegram gruplarında paylaşmak için kendi adresinizde zengin içerikli sayfalar oluşturun"
        icon={<FileText />}
      />

      <div className={grid({ columns: { base: 1, lg: 3 }, gap: '6' })}>
        {/* Left Column: Saved Pages List */}
        <Card className={css({ gridColumn: { lg: 'span 1' }, display: 'flex', flexDirection: 'column', gap: '4' })}>
          <div className={flex({ justify: 'space-between', align: 'center', borderBottom: '1px solid token(colors.borderMain)', pb: '3' })}>
            <h2 className={css({ fontWeight: '600', fontSize: 'md' })}>Kayıtlı Sayfalar ({articles.length})</h2>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => {
                setForm({ title: '', slug: '', content: '' });
                setIsEditing(false);
                setCurrentId(null);
              }}
              title="Yeni Sayfa Yaz"
            >
              <Plus size={14} className={css({ mr: '1' })} /> Yeni
            </Button>
          </div>

          <div className={stack({ gap: '3', overflowY: 'auto', maxH: '650px', p: '0.5' })}>
            {articles.length === 0 ? (
              <div className={css({ py: '8', textAlign: 'center', color: 'textMuted', fontSize: 'sm' })}>
                Kayıtlı sayfa bulunamadı.
              </div>
            ) : (
              articles.map(article => (
                <div 
                  key={article.id} 
                  onClick={() => handleEdit(article)}
                  className={css({ 
                    p: '3.5', 
                    borderRadius: 'xl', 
                    borderWidth: '1px', 
                    borderStyle: 'solid', 
                    borderColor: currentId === article.id ? 'primary' : 'borderMain', 
                    bg: currentId === article.id ? 'bgCanvas' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: currentId === article.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    _hover: { bg: 'bgCanvas', borderColor: 'primary' },
                    position: 'relative'
                  })}
                >
                  <div className={css({ fontWeight: '600', fontSize: 'sm', mb: '1', color: 'textMain', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>
                    {article.title}
                  </div>
                  <div className={css({ fontSize: 'xs', color: 'textMuted', mb: '3' })}>/p/{article.slug}</div>
                  
                  <div className={flex({ justify: 'space-between', align: 'center' })}>
                    <span className={css({ fontSize: '10px', color: 'textMuted' })}>
                      {new Date(article.created_at).toLocaleDateString('tr-TR')}
                    </span>
                    
                    <div className={flex({ gap: '1' })} onClick={e => e.stopPropagation()}>
                      <button 
                        type="button"
                        onClick={() => {
                          setSharingArticle(article);
                          setSelectedChatId('');
                          setShareMode('now');
                          setScheduleTime('');
                        }}
                        className={css({ p: '1.5', borderRadius: 'md', bg: 'bgButtonSecondary', color: 'primary', _hover: { bg: 'bgButtonSecondaryHover' }, cursor: 'pointer', border: 'none' })}
                        title="Grupta Paylaş"
                      >
                        <Share2 size={13} />
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleCopyLink(article.slug, article.id)}
                        className={css({ p: '1.5', borderRadius: 'md', bg: 'bgButtonSecondary', color: 'textButtonSecondary', _hover: { bg: 'bgButtonSecondaryHover' }, cursor: 'pointer', border: 'none' })}
                        title="Linki Kopyala"
                      >
                        {copiedId === article.id ? <Check size={13} className={css({ color: 'success' })} /> : <Link size={13} />}
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => handleDelete(article.id)}
                        className={css({ p: '1.5', borderRadius: 'md', bg: 'bgButtonSecondary', color: 'danger', _hover: { bg: 'red.50' }, _dark: { _hover: { bg: 'red.950/20' } }, cursor: 'pointer', border: 'none' })}
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Editor Form */}
        <Card className={css({ gridColumn: { lg: 'span 2' } })}>
          <h2 className={css({ fontWeight: '600', mb: '4', fontSize: 'lg' })}>
            {isEditing ? 'Sayfayı Düzenle' : 'Yeni Sayfa Oluştur'}
          </h2>
          <form onSubmit={handleSubmit} className={stack({ gap: '4' })}>
            <div>
              <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Sayfa Başlığı</label>
              <Input 
                placeholder="Yazı başlığı..." 
                value={form.title} 
                onChange={e => setForm({ ...form, title: e.target.value })} 
                required 
              />
            </div>

            <div>
              <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>Özel Adres / Slug (İsteğe Bağlı)</label>
              <Input 
                placeholder="örn: vip-kurallar" 
                value={form.slug} 
                onChange={e => setForm({ ...form, slug: e.target.value })} 
                disabled={isEditing}
              />
              <span className={css({ fontSize: 'xs', color: 'textMuted' })}>Boş bırakırsanız başlığa göre otomatik üretilir.</span>
            </div>

            <div>
              <label className={css({ fontSize: 'sm', fontWeight: '500', display: 'block', mb: '1' })}>İçerik (Markdown Formatında)</label>
              <Textarea 
                placeholder="Yazı içeriği..." 
                value={form.content} 
                onChange={e => setForm({ ...form, content: e.target.value })} 
                required 
                className={css({ minH: '250px' })}
              />
              <span className={css({ fontSize: 'xs', color: 'textMuted' })}>Markdown etiketleri (**kalın**, *italik*, [link](url), `kod`) desteklenir.</span>
            </div>

            {form.content && (
              <div className={css({ p: '4', bg: 'bgCanvas', borderRadius: 'lg', borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain', fontSize: 'sm' })}>
                <div className={css({ fontWeight: 'bold', mb: '2', color: 'textMain', borderBottom: '1px solid token(colors.borderMain)', pb: '1' })}>Ön İzleme</div>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }} className={css({ color: 'textMain', lineHeight: 'relaxed' })} />
              </div>
            )}

            <div className={flex({ gap: '2', mt: '2' })}>
              <Button type="submit" className={css({ flex: 1 })}>
                {isEditing ? 'Güncelle ve Kaydet' : 'Yayınla'}
              </Button>
              {(isEditing || form.title || form.content) && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => {
                    setForm({ title: '', slug: '', content: '' });
                    setIsEditing(false);
                    setCurrentId(null);
                  }}
                >
                  Temizle / İptal
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      {/* Share Modal */}
      <Modal
        isOpen={!!sharingArticle}
        onClose={() => setSharingArticle(null)}
        title="Sayfayı Telegram Grubunda Paylaş"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSharingArticle(null)}>İptal</Button>
            <Button onClick={handleShareSubmit} disabled={sharingSubmitting}>
              {sharingSubmitting ? 'İşlem yapılıyor...' : shareMode === 'now' ? 'Hemen Paylaş' : 'Zamanlamayı Kaydet'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleShareSubmit} className={stack({ gap: '4' })}>
          <div className={css({ fontSize: 'sm', bg: 'bgCanvas', p: '3', borderRadius: 'lg', borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain', mb: '2' })}>
            Paylaşılacak Yazı: <strong>{sharingArticle?.title}</strong>
          </div>

          <div>
            <label className={css({ display: 'block', fontSize: 'xs', fontWeight: 'bold', mb: '1.5', color: 'textMain' })}>Paylaşılacak Aktif Grup</label>
            <select
              value={selectedChatId}
              onChange={e => setSelectedChatId(e.target.value)}
              className={css({ w: 'full', bg: 'bgCanvas', border: '1px solid token(colors.borderMain)', borderRadius: 'lg', p: '2.5', fontSize: 'sm', color: 'textMain', outline: 'none' })}
              required
            >
              <option value="">Seçiniz...</option>
              {chats.map(c => (
                <option key={c.chat_id} value={c.chat_id}>{c.title || c.chat_id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={css({ display: 'block', fontSize: 'xs', fontWeight: 'bold', mb: '1.5', color: 'textMain' })}>Paylaşım Zamanı</label>
            <div className={flex({ gap: '4', mb: '2' })}>
              <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', cursor: 'pointer' })}>
                <input 
                  type="radio" 
                  name="shareMode" 
                  checked={shareMode === 'now'} 
                  onChange={() => setShareMode('now')} 
                  className={css({ accentColor: 'token(colors.primary)' })}
                />
                Hemen Paylaş
              </label>
              <label className={flex({ align: 'center', gap: '2', fontSize: 'sm', cursor: 'pointer' })}>
                <input 
                  type="radio" 
                  name="shareMode" 
                  checked={shareMode === 'schedule'} 
                  onChange={() => setShareMode('schedule')} 
                  className={css({ accentColor: 'token(colors.primary)' })}
                />
                Zamanla (İleri Tarihli)
              </label>
            </div>

            {shareMode === 'schedule' && (
              <Input
                type="datetime-local"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                required
              />
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ArticlesView;
