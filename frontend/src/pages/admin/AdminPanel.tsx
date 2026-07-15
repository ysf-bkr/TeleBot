import { Building2, CreditCard, Globe, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { adminApi, plansApi } from '../../lib/api';
import type { AdminStats, SubscriptionPlan, Workspace } from '../../types';

export function AdminPanel() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPlanSlug, setNewPlanSlug] = useState('free');

  const fetchData = async () => {
    try {
      const [wsRes, plansRes, statsRes] = await Promise.all([
        adminApi.listWorkspaces(),
        plansApi.list(),
        adminApi.getStats(),
      ]);
      setWorkspaces(wsRes.data);
      setPlans(plansRes.data);
      setStats(statsRes.data);
    } catch (e: any) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      toast.error('İsim ve slug zorunludur');
      return;
    }
    try {
      await adminApi.createWorkspace({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
        planSlug: newPlanSlug,
      });
      toast.success('Workspace oluşturuldu');
      setShowCreateForm(false);
      setNewName('');
      setNewSlug('');
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Oluşturulamadı');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu workspace\'i silmek istediğinize emin misiniz?')) return;
    try {
      await adminApi.deleteWorkspace(id);
      toast.success('Workspace silindi');
      fetchData();
    } catch (e) {
      toast.error('Silinemedi');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'trial': return '#f59e0b';
      case 'suspended': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'trial': return 'Deneme';
      case 'suspended': return 'Askıda';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className={stack({ gap: '6' })}>
      {/* Header */}
      <div className={hstack({ justify: 'space-between', alignItems: 'center' })}>
        <div>
          <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>
            Super Admin Panel
          </h1>
          <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
            Tüm workspace'leri ve platformu yönetin
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={css({
            display: 'flex', alignItems: 'center', gap: '2',
            px: '4', py: '2.5', borderRadius: 'lg',
            bg: 'primary', color: 'white', fontWeight: '600',
            fontSize: '13px', cursor: 'pointer',
            _hover: { bg: 'primaryHover' },
            border: 'none',
          })}
        >
          <Building2 size={16} />
          Yeni Workspace
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: 'repeat(3, 1fr)' }, gap: '4' })}>
          <div className={css({
            bg: 'bgSurface', borderRadius: 'xl', p: '5',
            border: '1px solid token(colors.borderMain)',
          })}>
            <div className={hstack({ gap: '3', mb: '2' })}>
              <Globe size={20} className={css({ color: 'primary' })} />
              <span className={css({ fontSize: '12px', fontWeight: '600', color: 'textMuted' })}>Toplam Workspace</span>
            </div>
            <span className={css({ fontSize: '28px', fontWeight: '800', color: 'textMain' })}>{stats.workspaces}</span>
          </div>
          <div className={css({
            bg: 'bgSurface', borderRadius: 'xl', p: '5',
            border: '1px solid token(colors.borderMain)',
          })}>
            <div className={hstack({ gap: '3', mb: '2' })}>
              <CreditCard size={20} className={css({ color: '#f59e0b' })} />
              <span className={css({ fontSize: '12px', fontWeight: '600', color: 'textMuted' })}>Planlar</span>
            </div>
            <span className={css({ fontSize: '28px', fontWeight: '800', color: 'textMain' })}>{stats.plans}</span>
          </div>
          <div className={css({
            bg: 'bgSurface', borderRadius: 'xl', p: '5',
            border: '1px solid token(colors.borderMain)',
          })}>
            <div className={hstack({ gap: '3', mb: '2' })}>
              <Users size={20} className={css({ color: '#3b82f6' })} />
              <span className={css({ fontSize: '12px', fontWeight: '600', color: 'textMuted' })}>Toplam Kullanıcı</span>
            </div>
            <span className={css({ fontSize: '28px', fontWeight: '800', color: 'textMain' })}>{stats.users}</span>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className={css({
          bg: 'bgSurface', borderRadius: 'xl', p: '5',
          border: '1px solid token(colors.borderMain)',
          spaceY: '4',
        })}>
          <div>
            <label className={css({ display: 'block', fontSize: '12px', fontWeight: '600', color: 'textMuted', mb: '1' })}>
              Workspace Adı
            </label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="My Company"
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
              Slug (benzersiz)
            </label>
            <input
              value={newSlug}
              onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-company"
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
              value={newPlanSlug}
              onChange={e => setNewPlanSlug(e.target.value)}
              className={css({
                w: 'full', px: '3', py: '2', borderRadius: 'lg',
                border: '1px solid token(colors.borderMain)',
                bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                outline: 'none',
                _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
              })}
            >
              {plans.map(plan => (
                <option key={plan.id} value={plan.slug}>{plan.name}</option>
              ))}
            </select>
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
              Oluştur
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
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

      {/* Workspaces List */}
      <div className={stack({ gap: '3' })}>
        <h2 className={css({ fontSize: 'lg', fontWeight: '700', color: 'textMain' })}>
          Tüm Workspace'ler ({workspaces.length})
        </h2>
        {workspaces.map(ws => (
          <div
            key={ws.id}
            className={css({
              display: 'flex', alignItems: 'center', gap: '4',
              bg: 'bgSurface', borderRadius: 'xl', p: '4',
              border: '1px solid token(colors.borderMain)',
              transition: 'all 0.2s',
              _hover: { borderColor: 'primary' },
            })}
          >
            <div className={css({
              w: '10', h: '10', borderRadius: 'lg',
              bg: 'rgba(239, 68, 68, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            })}>
              <Building2 size={20} className={css({ color: 'primary' })} />
            </div>
            <div className={css({ flex: 1 })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '1' })}>
                <span className={css({ fontWeight: '600', color: 'textMain', fontSize: '14px' })}>
                  {ws.name}
                </span>
                <span className={css({
                  px: '2', py: '0.5', borderRadius: 'full',
                  fontSize: '10px', fontWeight: '600',
                  bg: `rgba(${getStatusColor(ws.status) === '#22c55e' ? '34, 197, 94' : getStatusColor(ws.status) === '#f59e0b' ? '245, 158, 11' : '239, 68, 68'}, 0.1)`,
                  color: getStatusColor(ws.status),
                })}>
                  {getStatusText(ws.status)}
                </span>
              </div>
              <div className={css({ display: 'flex', gap: '4', fontSize: '12px', color: 'textMuted' })}>
                <span>Slug: {ws.slug}</span>
                <span>Bot: {ws.bot_username ? `@${ws.bot_username}` : 'Yok'}</span>
                <span>Oluşturma: {new Date(ws.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(ws.id)}
              className={css({
                p: '2', borderRadius: 'lg', cursor: 'pointer',
                bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                border: 'none',
                _hover: { opacity: 0.8 },
              })}
              title="Sil"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
