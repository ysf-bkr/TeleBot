import { Building2, CreditCard, Globe, MessageCircle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { workspaceApi } from '../../lib/api';
import { i18n } from '../../lib/i18n';
import type { Workspace } from '../../types';

export function WorkspaceView() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [wsRes, statsRes] = await Promise.all([
        workspaceApi.getMyWorkspace(),
        workspaceApi.getStats(),
      ]);
      setWorkspace(wsRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error('Workspace fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>
        Yükleniyor...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className={css({ textAlign: 'center', py: '12', color: 'textMuted' })}>
        Workspace bulunamadı
      </div>
    );
  }

  const planName = workspace.plan?.name || (workspace.subscription?.plan || 'free');
  const planFeatures = workspace.plan?.features ? JSON.parse(workspace.plan.features) : [];

  return (
    <div className={stack({ gap: '6' })}>
      {/* Header */}
      <div>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>
          {i18n.t('workspace.title')}
        </h1>
        <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
          {i18n.t('workspace.subtitle')}
        </p>
      </div>

      {/* Workspace Info Card */}
      <div className={css({
        bg: 'bgSurface', borderRadius: 'xl', p: '5',
        border: '1px solid token(colors.borderMain)',
      })}>
        <div className={hstack({ gap: '4', mb: '4' })}>
          <div className={css({
            w: '12', h: '12', borderRadius: 'xl',
            bg: 'rgba(239, 68, 68, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          })}>
            <Building2 size={24} className={css({ color: 'primary' })} />
          </div>
          <div>
            <h2 className={css({ fontSize: '18px', fontWeight: '700', color: 'textMain' })}>
              {workspace.name}
            </h2>
            <p className={css({ fontSize: '12px', color: 'textMuted' })}>
              Slug: {workspace.slug}
            </p>
          </div>
        </div>

        <div className={css({
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3',
          fontSize: '13px',
        })}>
          <div>
            <span className={css({ color: 'textMuted' })}>{i18n.t('workspace.plan')}: </span>
            <span className={css({ fontWeight: '600', color: 'textMain' })}>
              {planName.charAt(0).toUpperCase() + planName.slice(1)}
            </span>
          </div>
          <div>
            <span className={css({ color: 'textMuted' })}>{i18n.t('workspace.status')}: </span>
            <span className={css({
              fontWeight: '600',
              color: workspace.status === 'active' ? '#22c55e' : workspace.status === 'trial' ? '#f59e0b' : '#ef4444',
            })}>
              {workspace.status === 'active' ? 'Aktif' : workspace.status === 'trial' ? 'Deneme' : 'Askıda'}
            </span>
          </div>
          {workspace.bot_username && (
            <div>
              <span className={css({ color: 'textMuted' })}>{i18n.t('workspace.bot')}: </span>
              <span className={css({ fontWeight: '600', color: 'textMain' })}>@{workspace.bot_username}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: '4' })}>
          <div className={css({
            bg: 'bgSurface', borderRadius: 'xl', p: '4',
            border: '1px solid token(colors.borderMain)',
            textAlign: 'center',
          })}>
            <Globe size={20} className={css({ mx: 'auto', mb: '2', color: 'primary' })} />
            <div className={css({ fontSize: '24px', fontWeight: '800', color: 'textMain' })}>{stats.bots}</div>
            <div className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>{i18n.t('workspace.bots')}</div>
          </div>
          <div className={css({
            bg: 'bgSurface', borderRadius: 'xl', p: '4',
            border: '1px solid token(colors.borderMain)',
            textAlign: 'center',
          })}>
            <MessageCircle size={20} className={css({ mx: 'auto', mb: '2', color: '#3b82f6' })} />
            <div className={css({ fontSize: '24px', fontWeight: '800', color: 'textMain' })}>{stats.chats}</div>
            <div className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>{i18n.t('workspace.chats')}</div>
          </div>
          <div className={css({
            bg: 'bgSurface', borderRadius: 'xl', p: '4',
            border: '1px solid token(colors.borderMain)',
            textAlign: 'center',
          })}>
            <Users size={20} className={css({ mx: 'auto', mb: '2', color: '#22c55e' })} />
            <div className={css({ fontSize: '24px', fontWeight: '800', color: 'textMain' })}>{stats.teamMembers}</div>
            <div className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>{i18n.t('workspace.team')}</div>
          </div>
          <div className={css({
            bg: 'bgSurface', borderRadius: 'xl', p: '4',
            border: '1px solid token(colors.borderMain)',
            textAlign: 'center',
          })}>
            <CreditCard size={20} className={css({ mx: 'auto', mb: '2', color: '#f59e0b' })} />
            <div className={css({ fontSize: '24px', fontWeight: '800', color: 'textMain' })}>{stats.logs}</div>
            <div className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>{i18n.t('workspace.logs')}</div>
          </div>
        </div>
      )}

      {/* Plan Features */}
      {planFeatures.length > 0 && (
        <div className={css({
          bg: 'bgSurface', borderRadius: 'xl', p: '5',
          border: '1px solid token(colors.borderMain)',
        })}>
          <h3 className={css({ fontSize: '14px', fontWeight: '700', color: 'textMain', mb: '3' })}>
            Plan Özellikleri
          </h3>
          <div className={css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2' })}>
            {planFeatures.map((feature: string) => (
              <div key={feature} className={css({
                display: 'flex', alignItems: 'center', gap: '2',
                fontSize: '12px', color: 'textMain',
              })}>
                <span className={css({ color: '#22c55e', fontSize: '14px' })}>✓</span>
                {feature.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
