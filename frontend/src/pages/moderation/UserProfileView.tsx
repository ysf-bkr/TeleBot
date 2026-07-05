import { AlertTriangle, Ban, Calendar, MessageSquare, Search, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { css } from '../../../styled-system/css';
import { hstack, stack } from '../../../styled-system/patterns';
import { userProfileApi } from '../../lib/api';
import type { UserProfile } from '../../types';

export function UserProfileView() {
  const [userId, setUserId] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!userId.trim()) {
      toast.error('Kullanıcı ID giriniz');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await userProfileApi.get(userId.trim());
      setProfile(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Kullanıcı profili alınamadı');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={stack({ gap: '6' })}>
      {/* Header */}
      <div>
        <h1 className={css({ fontSize: '2xl', fontWeight: 'bold', color: 'textMain' })}>
          Kullanıcı Profil Kartı
        </h1>
        <p className={css({ fontSize: 'sm', color: 'textMuted', mt: '1' })}>
          Telegram kullanıcılarının tüm aktivitelerini ve moderasyon geçmişini görüntüleyin
        </p>
      </div>

      {/* Search */}
      <div className={css({
        bg: 'bgSurface', borderRadius: 'xl', p: '5',
        border: '1px solid token(colors.borderMain)',
      })}>
        <div className={hstack({ gap: '3' })}>
          <div className={css({ position: 'relative', flex: 1 })}>
            <User size={16} className={css({
              position: 'absolute', left: '3', top: '50%', transform: 'translateY(-50%)',
              color: 'textMuted',
            })} />
            <input
              value={userId}
              onChange={e => setUserId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Telegram Kullanıcı ID'si girin (örn: 123456789)"
              className={css({
                w: 'full', pl: '10', pr: '4', py: '2.5', borderRadius: 'lg',
                border: '1px solid token(colors.borderMain)',
                bg: 'bgCanvas', color: 'textMain', fontSize: '14px',
                outline: 'none',
                _focus: { borderColor: 'primary', ring: '2px solid token(colors.primary)' },
              })}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className={css({
              display: 'flex', alignItems: 'center', gap: '2',
              px: '5', py: '2.5', borderRadius: 'lg',
              bg: 'primary', color: 'white', fontWeight: '600',
              fontSize: '13px', cursor: 'pointer',
              _hover: { bg: 'primaryHover' },
              _disabled: { opacity: 0.5, cursor: 'not-allowed' },
              border: 'none',
            })}
          >
            <Search size={16} />
            {loading ? 'Aranıyor...' : 'Ara'}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && !loading && !profile && (
        <div className={css({
          textAlign: 'center', py: '16', color: 'textMuted',
          bg: 'bgSurface', borderRadius: 'xl', border: '1px solid token(colors.borderMain)',
        })}>
          <User size={40} className={css({ mx: 'auto', mb: '3', opacity: 0.3 })} />
          <p className={css({ fontSize: '16px', fontWeight: '600' })}>Kullanıcı bulunamadı</p>
          <p className={css({ fontSize: '13px', mt: '1' })}>Geçerli bir Telegram kullanıcı ID'si girdiğinizden emin olun.</p>
        </div>
      )}

      {profile && (
        <>
          {/* Stats Cards */}
          <div className={css({ display: 'grid', gridTemplateColumns: { base: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: '4' })}>
            <div className={css({
              bg: 'bgSurface', borderRadius: 'xl', p: '4',
              border: '1px solid token(colors.borderMain)',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
                <MessageSquare size={14} className={css({ color: '#3b82f6' })} />
                <span className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>Toplam Mesaj</span>
              </div>
              <span className={css({ fontSize: '24px', fontWeight: 'bold', color: 'textMain' })}>
                {profile.totalMessages}
              </span>
            </div>

            <div className={css({
              bg: 'bgSurface', borderRadius: 'xl', p: '4',
              border: '1px solid token(colors.borderMain)',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
                <User size={14} className={css({ color: '#22c55e' })} />
                <span className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>Katılma</span>
              </div>
              <span className={css({ fontSize: '24px', fontWeight: 'bold', color: 'textMain' })}>
                {profile.totalJoins}
              </span>
            </div>

            <div className={css({
              bg: 'bgSurface', borderRadius: 'xl', p: '4',
              border: '1px solid token(colors.borderMain)',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
                <AlertTriangle size={14} className={css({ color: '#f59e0b' })} />
                <span className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>Moderasyon</span>
              </div>
              <span className={css({ fontSize: '24px', fontWeight: 'bold', color: 'textMain' })}>
                {profile.moderationHistory.length}
              </span>
            </div>

            <div className={css({
              bg: 'bgSurface', borderRadius: 'xl', p: '4',
              border: '1px solid token(colors.borderMain)',
            })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '2', mb: '2' })}>
                <Ban size={14} className={css({ color: profile.isGloballyBlacklisted ? '#ef4444' : '#9ca3af' })} />
                <span className={css({ fontSize: '11px', color: 'textMuted', fontWeight: '600' })}>Kara Liste</span>
              </div>
              <span className={css({
                fontSize: '14px', fontWeight: 'bold',
                color: profile.isGloballyBlacklisted ? '#ef4444' : '#22c55e',
              })}>
                {profile.isGloballyBlacklisted ? 'Engelli' : 'Temiz'}
              </span>
            </div>
          </div>

          {/* Blacklist Info */}
          {profile.isGloballyBlacklisted && profile.blacklistReason && (
            <div className={css({
              bg: 'rgba(239, 68, 68, 0.05)', borderRadius: 'xl', p: '4',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex', alignItems: 'center', gap: '3',
            })}>
              <Ban size={18} className={css({ color: '#ef4444', flexShrink: 0 })} />
              <div>
                <span className={css({ fontSize: '13px', fontWeight: '600', color: '#ef4444' })}>
                  Global Kara Listede
                </span>
                <p className={css({ fontSize: '12px', color: 'textMuted', mt: '0.5' })}>
                  Sebep: {profile.blacklistReason}
                </p>
              </div>
            </div>
          )}

          {/* Last Seen */}
          {profile.lastSeen && (
            <div className={css({
              display: 'flex', alignItems: 'center', gap: '2',
              fontSize: '12px', color: 'textMuted',
            })}>
              <Calendar size={14} />
              Son görülme: {new Date(profile.lastSeen).toLocaleString('tr-TR')}
            </div>
          )}

          {/* Moderation History */}
          {profile.moderationHistory.length > 0 && (
            <div>
              <h2 className={css({ fontSize: '16px', fontWeight: '600', color: 'textMain', mb: '3' })}>
                Moderasyon Geçmişi
              </h2>
              <div className={stack({ gap: '2' })}>
                {profile.moderationHistory.map((log, idx) => (
                  <div
                    key={idx}
                    className={css({
                      display: 'flex', alignItems: 'center', gap: '3',
                      bg: 'bgSurface', borderRadius: 'lg', p: '3',
                      border: '1px solid token(colors.borderMain)',
                    })}
                  >
                    <div className={css({
                      px: '2', py: '0.5', borderRadius: 'md',
                      fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                      bg: log.action === 'ban' || log.action === 'kick'
                        ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: log.action === 'ban' || log.action === 'kick' ? '#ef4444' : '#f59e0b',
                    })}>
                      {log.action}
                    </div>
                    <div className={css({ flex: 1 })}>
                      <p className={css({ fontSize: '12px', color: 'textMuted' })}>
                        {log.reason || 'Sebep belirtilmemiş'}
                      </p>
                    </div>
                    <span className={css({ fontSize: '10px', color: 'textMuted' })}>
                      {new Date(log.timestamp).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {profile.recentLogs.length > 0 && (
            <div>
              <h2 className={css({ fontSize: '16px', fontWeight: '600', color: 'textMain', mb: '3' })}>
                Son Aktiviteler
              </h2>
              <div className={stack({ gap: '2' })}>
                {profile.recentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={css({
                      display: 'flex', alignItems: 'center', gap: '3',
                      bg: 'bgSurface', borderRadius: 'lg', p: '3',
                      border: '1px solid token(colors.borderMain)',
                    })}
                  >
                    <div className={css({
                      w: '7', h: '7', borderRadius: 'lg',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bg: log.event_type === 'message'
                        ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: log.event_type === 'message' ? '#3b82f6' : '#22c55e',
                      fontSize: '10px', fontWeight: '700',
                    })}>
                      {log.event_type === 'message' ? 'M' : 'G'}
                    </div>
                    <div className={css({ flex: 1 })}>
                      <div className={css({ fontSize: '12px', color: 'textMuted' })}>
                        {log.chat_title && <span className={css({ fontWeight: '600', color: 'textMain' })}>{log.chat_title}</span>}
                        {log.message_text && <span> - {log.message_text}</span>}
                      </div>
                    </div>
                    <span className={css({ fontSize: '10px', color: 'textMuted' })}>
                      {new Date(log.timestamp).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
