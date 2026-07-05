import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { subscriptionsApi } from '../../lib/api';
import type { Subscription } from '../../types';

export function SubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchSubscriptions = async () => {
    try {
      const res = await subscriptionsApi.list();
      setSubscriptions(res.data);
    } catch (e) {
      toast.error('Abonelikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscriptions(); }, []);

  const handleCreate = async () => {
    if (!userId.trim()) {
      toast.error('Kullanıcı ID zorunludur');
      return;
    }
    try {
      await subscriptionsApi.create({
        userId: userId.trim(),
        plan,
        expiresAt: expiresAt || undefined,
      });
      toast.success('Abonelik oluşturuldu');
      setUserId('');
      setPlan('monthly');
      setExpiresAt('');
      setShowForm(false);
      fetchSubscriptions();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Abonelik oluşturulamadı');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu aboneliği iptal etmek istediğinize emin misiniz?')) return;
    try {
      await subscriptionsApi.delete(id);
      toast.success('Abonelik iptal edildi');
      fetchSubscriptions();
    } catch (e) {
      toast.error('Abonelik iptal edilemedi');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'expired': return '#ef4444';
      case 'cancelled': return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'expired': return 'Süresi Doldu';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  return (
    <div className={stack({ gap: '6' })}>
      {/* Header */}
      <div className={hstack({ justify: 'space-between', alignItems: 'center' })}>
        <div>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>
            Abonelik Yönetimi
          </h1>
          <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
            Kullanıcı aboneliklerini görüntüleyin ve yönetin
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
          Yeni Abonelik
        </button>
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
              Kullanıcı ID
            </label>
            <input
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="Telegram kullanıcı ID'si"
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
              Plan
            </label>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value)}
              className={css({
                w: 'full', px: '3', py: '2', borderRadius: 'lg',
                border: '1px solid token(colors.borderMain)',
                bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                outline: 'none',
                _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
              })}
            >
              <option value="monthly">Aylık</option>
              <option value="yearly">Yıllık</option>
              <option value="lifetime">Ömür Boyu</option>
              <option value="stripe_monthly">Stripe Aylık</option>
            </select>
          </div>
          <div>
            <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>
              Bitiş Tarihi (opsiyonel)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
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
              onClick={handleCreate}
              className={css({
                px: '5', py: '2.5', borderRadius: 'lg',
                bg: 'primary', color: 'white', fontWeight: '600',
                fontSize: '13px', cursor: 'pointer',
                _hover: { bg: 'primaryHover' },
                border: 'none',
              })}
            >
              Aboneliği Oluştur
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

      {/* Subscriptions List */}
      {loading ? (
        <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>
          Yükleniyor...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className={css({
          textAlign: 'center', py: '16', color: 'textMuted',
          bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)',
        })}>
          <CreditCard size={40} className={css({ mx: 'auto', mb: '3', opacity: 0.3 })} />
          <p className={css({ fontSize: '16px', fontWeight: '600', mb: '1' })}>Henüz abonelik bulunmuyor</p>
          <p className={css({ fontSize: '13px' })}>Kullanıcılar için abonelik oluşturarak premium özellikleri yönetin.</p>
        </div>
      ) : (
        <div className={stack({ gap: '3' })}>
          {subscriptions.map(sub => (
            <div
              key={sub.id}
              className={css({
                display: 'flex', alignItems: 'center', gap: '4',
                bg: 'bgSurface', borderRadius: 'xl', p: '4',
                border: '1px solid token(colors.borderMain)',
                transition: 'all 0.2s',
                _hover: { borderColor: 'primary' },
              })}
            >
              {/* Info */}
              <div className={css({ flex: 1 })}>
                <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '1' })}>
                  <span className={css({ fontWeight: '600', color: 'textMain', fontSize: '14px' })}>
                    Kullanıcı: {sub.user_id}
                  </span>
                  <span className={css({
                    px: '2', py: '0.5', borderRadius: 'full',
                    fontSize: '10px', fontWeight: '600',
                    bg: `rgba(${getStatusColor(sub.status) === '#22c55e' ? '34, 197, 94' : getStatusColor(sub.status) === '#ef4444' ? '239, 68, 68' : '245, 158, 11'}, 0.1)`,
                    color: getStatusColor(sub.status),
                  })}>
                    {getStatusText(sub.status)}
                  </span>
                </div>
                <div className={css({ display: 'flex', gap: '4', fontSize: '12px', color: 'textMuted' })}>
                  <span>Plan: {sub.plan || 'Belirtilmemiş'}</span>
                  {sub.expires_at && <span>Bitiş: {new Date(sub.expires_at).toLocaleDateString('tr-TR')}</span>}
                  <span>Oluşturma: {new Date(sub.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                {sub.stripe_id && (
                  <div className={css({ fontSize: '11px', color: 'textMuted', mt: '1' })}>
                    Stripe ID: {sub.stripe_id}
                  </div>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={() => handleDelete(sub.id)}
                className={css({
                  p: '2', borderRadius: 'lg', cursor: 'pointer',
                  bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                  border: 'none',
                  _hover: { opacity: 0.8 },
                })}
                title="Aboneliği İptal Et"
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
