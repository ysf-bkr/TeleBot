import { Copy, FileText, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { chatsApi } from '../../lib/api';

export function TemplatesView() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedChatId, setSelectedChatId] = useState('');

  const fetchTemplates = async () => {
    try {
      const res = await chatsApi.templates();
      setTemplates(res.data);
    } catch (e) {
      toast.error('Şablonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Şablon adı zorunludur'); return; }
    try {
      await chatsApi.createTemplate({ name: name.trim(), settings: {} });
      toast.success('Şablon oluşturuldu');
      setName('');
      setShowForm(false);
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Şablon oluşturulamadı');
    }
  };

  const handleApply = async (templateId: number) => {
    if (!selectedChatId) { toast.error('Lütfen bir grup seçin'); return; }
    try {
      await chatsApi.applyTemplate(selectedChatId, templateId);
      toast.success('Şablon gruba uygulandı');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Şablon uygulanamadı');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return;
    try {
      await chatsApi.deleteTemplate(id);
      toast.success('Şablon silindi');
      fetchTemplates();
    } catch (e) { toast.error('Silinemedi'); }
  };

  return (
    <div className={stack({ gap: '6' })}>
      <div className={hstack({ justify: 'space-between', alignItems: 'center' })}>
        <div>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>Grup Şablonları</h1>
          <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
            Grup ayarlarını şablon olarak kaydedin ve diğer gruplara uygulayın
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={css({ display: 'flex', alignItems: 'center', gap: '2', px: '4', py: '2.5', borderRadius: 'lg', bg: 'primary', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', _hover: { bg: 'primaryHover' }, border: 'none' })}>
          <Plus size={16} /> Yeni Şablon
        </button>
      </div>

      {showForm && (
        <div className={css({ bg: 'bgSurface', borderRadius: 'xl', p: '5', border: '1px solid token(colors.borderMain)', spaceY: '4' })}>
          <div>
            <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>Şablon Adı</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Varsayılan Moderasyon" className={css({ w: 'full', px: '3', py: '2', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', bg: 'bgCanvas', color: 'textMain', fontSize: '14px', outline: 'none', _focus: { borderColor: 'primary' } })} />
          </div>
          <div className={hstack({ gap: '3' })}>
            <button onClick={handleCreate} className={css({ px: '5', py: '2.5', borderRadius: 'lg', bg: 'primary', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', _hover: { bg: 'primaryHover' }, border: 'none' })}>Şablonu Oluştur</button>
            <button onClick={() => setShowForm(false)} className={css({ px: '5', py: '2.5', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'textMain', fontWeight: '500', fontSize: '13px', cursor: 'pointer', border: '1px solid token(colors.borderMain)', _hover: { bg: 'hoverBg' } })}>İptal</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>Yükleniyor...</div>
      ) : templates.length === 0 ? (
        <div className={css({ textAlign: 'center', py: '16', color: 'textMuted', bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)' })}>
          <FileText size={40} className={css({ mx: 'auto', mb: '3', opacity: 0.3 })} />
          <p className={css({ fontSize: '16px', fontWeight: '600', mb: '1' })}>Henüz şablon yok</p>
          <p className={css({ fontSize: '13px' })}>Grup ayarlarınızı şablon olarak kaydedip başka gruplara hızlıca uygulayın.</p>
        </div>
      ) : (
        <div className={stack({ gap: '3' })}>
          {templates.map(t => (
            <div key={t.id} className={css({ display: 'flex', alignItems: 'center', gap: '4', bg: 'bgSurface', borderRadius: 'xl', p: '4', border: '1px solid token(colors.borderMain)', _hover: { borderColor: 'primary' } })}>
              <div className={css({ flex: 1 })}>
                <div className={css({ fontWeight: '600', color: 'textMain', fontSize: '14px', mb: '1' })}>{t.name}</div>
                <div className={css({ fontSize: '12px', color: 'textMuted' })}>Oluşturma: {new Date(t.created_at).toLocaleDateString('tr-TR')}</div>
              </div>
              <div className={hstack({ gap: '2' })}>
                <input value={selectedChatId} onChange={e => setSelectedChatId(e.target.value)} placeholder="Grup ID" className={css({ w: '120px', px: '2', py: '1.5', borderRadius: 'lg', border: '1px solid token(colors.borderMain)', bg: 'bgCanvas', color: 'textMain', fontSize: '12px', outline: 'none' })} />
                <button onClick={() => handleApply(t.id)} className={css({ p: '2', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', _hover: { opacity: 0.8 } })} title="Gruba Uygula"><Copy size={16} /></button>
                <button onClick={() => handleDelete(t.id)} className={css({ p: '2', borderRadius: 'lg', cursor: 'pointer', border: 'none', bg: 'rgba(239,68,68,0.1)', color: '#ef4444', _hover: { opacity: 0.8 } })} title="Sil"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
