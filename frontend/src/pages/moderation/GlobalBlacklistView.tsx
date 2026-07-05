import { Ban, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { globalBlacklistApi } from '../../lib/api';
import type { GlobalBlacklistItem } from '../../types';

export function GlobalBlacklistView() {
  const [items, setItems] = useState<GlobalBlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');

  const fetchItems = async () => {
    try {
      const res = await globalBlacklistApi.list();
      setItems(res.data);
    } catch (e) {
      toast.error('Kara liste yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!userId.trim()) {
      toast.error('Kullanıcı ID zorunludur');
      return;
    }
    try {
      await globalBlacklistApi.add(userId.trim(), reason.trim() || undefined);
      toast.success('Kullanıcı global kara listeye eklendi');
      setUserId('');
      setReason('');
      setShowForm(false);
      fetchItems();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Kullanıcı eklenemedi');
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Bu kullanıcıyı kara listeden çıkarmak istediğinize emin misiniz?')) return;
    try {
      await globalBlacklistApi.remove(id);
      toast.success('Kullanıcı kara listeden çıkarıldı');
      fetchItems();
    } catch (e) {
      toast.error('Kullanıcı çıkarılamadı');
    }
  };

  const filteredItems = items.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.user_id.toLowerCase().includes(q) ||
      item.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className={stack({ gap: '6' })}>
      {/* Header */}
      <div className={hstack({ justify: 'space-between', alignItems: 'center' })}>
        <div>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>
            Global Kara Liste
          </h1>
          <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
            Tüm botlarda ve gruplarda geçerli olacak spammer kullanıcıları yönetin
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={css({
            display: 'flex', alignItems: 'center', gap: '2',
            px: '4', py: '2.5', borderRadius: 'lg',
            bg: 'primary', color: 'white', fontWeight: '600',
            fontSize: '13px', cursor: 'pointer',
            _hover: { bg: 'primaryHover' },
            border: 'none',
          })}
        >
          <Plus size={16} />
          Kullanıcı Ekle
        </button>
      </div>

      {/* Search */}
      <div className={css({ position: 'relative' })}>
        <Search size={16} className={css({
          position: 'absolute', left: '3', top: '50%', transform: 'translateY(-50%)',
          color: 'textMuted',
        })} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Kullanıcı ID veya sebep ile ara..."
          className={css({
            w: 'full', pl: '10', pr: '4', py: '2.5', borderRadius: 'lg',
            border: '1px solid token(colors.borderMain)',
            bg: 'bgSurface', color: 'textMain', fontSize: '14px',
            outline: 'none',
            _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
          })}
        />
      </div>

      {/* Add Form */}
      {showForm && (
        <div className={css({
          bg: 'bgSurface', borderRadius: 'xl', p: '5',
          border: '1px solid token(colors.borderMain)',
          spaceY: '4',
        })}>
          <div>
            <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>
              Kullanıcı ID (Telegram ID)
            </label>
            <input
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="123456789"
              className={css({
                w: 'full', px: '3', py: '2', borderRadius: 'lg',
                border: '1px solid token(colors.borderMain)',
                bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                outline: 'none',
                _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
              })}
            />
          </div>
          <div>
            <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>
              Sebep (opsiyonel)
            </label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Spam, küfür, reklam..."
              className={css({
                w: 'full', px: '3', py: '2', borderRadius: 'lg',
                border: '1px solid token(colors.borderMain)',
                bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                outline: 'none',
                _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
              })}
            />
          </div>
          <div className={hstack({ gap: '3' })}>
            <button
              onClick={handleAdd}
              className={css({
                px: '5', py: '2.5', borderRadius: 'lg',
                bg: 'primary', color: 'white', fontWeight: '600',
                fontSize: '13px', cursor: 'pointer',
                _hover: { bg: 'primaryHover' },
                border: 'none',
              })}
            >
              Kara Listeye Ekle
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={css({
                px: '5', py: '2.5', borderRadius: 'lg',
                bg: 'bgButtonSecondary', color: 'textMain', fontWeight: '500',
                fontSize: '13px', cursor: 'pointer',
                border: '1px solid token(colors.borderMain)',
                _hover: { bg: 'hoverBg' },
              })}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>
          Yükleniyor...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={css({
          textAlign: 'center', py: '16', color: 'textMuted',
          bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)',
        })}>
          <Ban size={40} className={css({ mx: 'auto', mb: '3', opacity: 0.3 })} />
          <p className={css({ fontSize: '16px', fontWeight: '600', mb: '1' })}>
            {search ? 'Eşleşen kayıt bulunamadı' : 'Global kara liste boş'}
          </p>
          <p className={css({ fontSize: '13px' })}>
            {search ? 'Farklı bir arama deneyin' : 'Spammer kullanıcıları buradan tüm botlara karşı engelleyin.'}
          </p>
        </div>
      ) : (
        <div className={stack({ gap: '2' })}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={css({
                display: 'flex', alignItems: 'center', gap: '4',
                bg: 'bgSurface', borderRadius: 'lg', p: '3.5',
                border: '1px solid token(colors.borderMain)',
                transition: 'all 0.2s',
                _hover: { borderColor: '#ef4444' },
              })}
            >
              {/* Avatar */}
              <div className={css({
                w: '9', h: '9', borderRadius: 'lg',
                bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '14px', flexShrink: 0,
              })}>
                #
              </div>

              {/* Info */}
              <div className={css({ flex: 1 })}>
                <div className={css({ display: 'flex', alignItems: 'center', gap: '2' })}>
                  <span className={css({ fontWeight: '600', color: 'textMain', fontSize: '14px', fontFamily: 'monospace' })}>
                    {item.user_id}
                  </span>
                  <span className={css({ fontSize: '11px', color: 'textMuted' })}>
                    {new Date(item.added_at).toLocaleString('tr-TR')}
                  </span>
                </div>
                {item.reason && (
                  <p className={css({ fontSize: '12px', color: 'textMuted', mt: '0.5' })}>
                    Sebep: {item.reason}
                  </p>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemove(item.id)}
                className={css({
                  p: '2', borderRadius: 'lg', cursor: 'pointer',
                  bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                  border: 'none',
                  _hover: { opacity: 0.8 },
                })}
                title="Kara listeden çıkar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
