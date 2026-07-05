import { ArrowRight, Calendar, FileText, MessageCircle, MessageSquare, Play, Settings, Shield, Square, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import { css } from '../../../styled-system/css';
import { flex, grid, stack } from '../../../styled-system/patterns';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';

import { BotStatus, Chat, Log, User } from '../../types';

interface DashboardViewProps {
  botStatus: BotStatus;
  chats: Chat[];
  welcomeEnabled: boolean;
  logs: Log[];
  goTo: (path: string) => void;
  user?: User | null;
}

export function DashboardView({ botStatus, chats = [], welcomeEnabled, logs = [], goTo, user }: DashboardViewProps) {
  const activeGroups = chats.filter((c: Chat) => c.is_enabled).length;

  // Calculate total members across all groups
  const totalMembers = chats.reduce((sum, chat: Chat) => sum + (chat.member_count || 0), 0);

  const getChatTitle = (chatId: string | number | null | undefined) => {
    const chat = chats.find(c => String(c.chat_id) === String(chatId));
    return chat ? (chat.title || chat.chat_id) : `Grup: ${chatId}`;
  };

  // Son 7 günlük aktivite verilerini gün bazında grupla
  const activityData = useMemo(() => {
    const days: { [key: string]: number } = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      days[key] = 0;
    }
    logs.forEach((log: Log) => {
      const logDate = new Date(log.timestamp);
      const key = logDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      if (days[key] !== undefined) days[key]++;
    });
    return Object.entries(days).map(([label, value]) => ({ label, value }));
  }, [logs]);

  const maxActivity = Math.max(...activityData.map(d => d.value), 1);

  // Quick action shortcuts
  const shortcuts = [
    { label: 'Sayfa Yaz', desc: 'Zengin içerikli blog/duyuru yazıları', icon: FileText, path: '/articles' },
    { label: 'Zamanlı Paylaşım', desc: 'Mesajları ve sayfaları planla', icon: Calendar, path: '/scheduler' },
    { label: 'Grup Moderasyonu', desc: 'Filtreler ve kuralları yönet', icon: Shield, path: '/moderation' },
    { label: 'Sistem Ayarları', desc: 'Karşılama ve webhook ayarları', icon: Settings, path: '/settings' },
  ];

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '6', color: 'textMain' })}>
      <PageHeader
        title={`Merhaba, ${user?.username || 'Yönetici'} 👋`}
        description="Telegram grupları ve botlarınızın genel durumuna gözatın"
      />

      {/* Primary Stats Grid */}
      <div className={grid({ columns: { base: 1, sm: 2, lg: 4 }, gap: '5' })}>
        {/* Bot Status Card */}
        <Card className={css({ position: 'relative', overflow: 'hidden' })}>
          <div className={flex({ justify: 'space-between', align: 'flex-start' })}>
            <div>
              <div className={css({ fontSize: 'xs', fontWeight: '600', color: 'textMuted', textTransform: 'uppercase', letterSpacing: 'wider' })}>Bot Durumu</div>
              <div className={flex({ align: 'center', gap: '2', mt: '1.5' })}>
                <div className={css({ w: '2.5', h: '2.5', borderRadius: 'full', bg: botStatus.connected ? 'success' : 'danger', animation: botStatus.connected ? 'ping 1.5s infinite' : 'none' })} />
                <span className={css({ fontSize: 'xl', fontWeight: 'bold' })}>
                  {botStatus.connected ? 'Aktif' : 'Çevrimdışı'}
                </span>
              </div>
            </div>
            {botStatus.connected ? (
              <Play className={css({ color: 'success', w: '6', h: '6' })} />
            ) : (
              <Square className={css({ color: 'danger', w: '6', h: '6' })} />
            )}
          </div>
          {botStatus.username ? (
            <a href={`https://t.me/${botStatus.username}`} target="_blank" rel="noopener noreferrer" className={css({ display: 'block', mt: '3', color: 'primary', fontSize: 'sm', fontWeight: '500', _hover: { textDecoration: 'underline' } })}>
              @{botStatus.username}
            </a>
          ) : (
            <div className={css({ mt: '3', color: 'textMuted', fontSize: 'xs' })}>Token yapılandırılmadı</div>
          )}
        </Card>

        {/* Managed Groups Card */}
        <Card>
          <div className={flex({ justify: 'space-between', align: 'flex-start' })}>
            <div>
              <div className={css({ fontSize: 'xs', fontWeight: '600', color: 'textMuted', textTransform: 'uppercase', letterSpacing: 'wider' })}>Yönetilen Gruplar</div>
              <div className={css({ fontSize: '2xl', fontWeight: 'bold', mt: '1.5' })}>{chats.length}</div>
            </div>
            <Users className={css({ color: 'primary', w: '6', h: '6' })} />
          </div>
          <div className={css({ mt: '3' })}>
            <Badge variant="success">{activeGroups} Aktif Grup</Badge>
          </div>
        </Card>

        {/* Total Community Members Card */}
        <Card>
          <div className={flex({ justify: 'space-between', align: 'flex-start' })}>
            <div>
              <div className={css({ fontSize: 'xs', fontWeight: '600', color: 'textMuted', textTransform: 'uppercase', letterSpacing: 'wider' })}>Toplam Üye sayısı</div>
              <div className={css({ fontSize: '2xl', fontWeight: 'bold', mt: '1.5' })}>
                {totalMembers.toLocaleString('tr-TR')}
              </div>
            </div>
            <MessageSquare className={css({ color: 'primary', w: '6', h: '6' })} />
          </div>
          <div className={css({ mt: '3', fontSize: 'xs', color: 'textMuted' })}>Gruplardaki toplam üye hacmi</div>
        </Card>

        {/* Welcome message configuration state */}
        <Card>
          <div className={flex({ justify: 'space-between', align: 'flex-start' })}>
            <div>
              <div className={css({ fontSize: 'xs', fontWeight: '600', color: 'textMuted', textTransform: 'uppercase', letterSpacing: 'wider' })}>Oto Karşılama</div>
              <div className={css({ fontSize: '2xl', fontWeight: 'bold', mt: '1.5' })}>
                {welcomeEnabled ? 'Aktif' : 'Kapalı'}
              </div>
            </div>
            <FileText className={css({ color: welcomeEnabled ? 'success' : 'textMuted', w: '6', h: '6' })} />
          </div>
          <div className={css({ mt: '3' })}>
            <Badge variant={welcomeEnabled ? 'success' : 'neutral'}>
              {welcomeEnabled ? 'Karşılama Açık' : 'Devre Dışı'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Son 7 Gün Aktivite Grafiği */}
      <Card>
        <div className={flex({ align: 'center', gap: '2', mb: '4' })}>
          <TrendingUp size={18} className={css({ color: 'primary' })} />
          <h2 className={css({ fontWeight: '600', fontSize: 'lg' })}>Son 7 Gün Aktivite</h2>
        </div>
        <div className={flex({ gap: '2', align: 'flex-end', h: '32' })}>
          {activityData.map((item, i) => (
            <div key={i} className={css({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1' })}>
              <span className={css({ fontSize: 'xs', fontWeight: '600', color: 'textMuted' })}>{item.value}</span>
              <div
                className={css({
                  w: 'full',
                  borderRadius: 'md',
                  bg: 'primary',
                  transition: 'height 0.3s ease',
                  minH: item.value > 0 ? '4px' : '2px',
                })}
                style={{ height: `${(item.value / maxActivity) * 100}%` }}
              />
              <span className={css({ fontSize: '10px', color: 'textMuted', textAlign: 'center' })}>{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className={grid({ columns: { base: 1, lg: 3 }, gap: '6' })}>
        {/* Quick Actions Shortcuts */}
        <div className={stack({ gap: '5', gridColumn: { lg: 'span 1' } })}>
          <h2 className={css({ fontWeight: '600', fontSize: 'lg' })}>Hızlı Kısayollar</h2>
          {shortcuts.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <div key={idx} onClick={() => goTo && goTo(sc.path)} className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '4', bg: 'bgSurface', borderRadius: 'xl', borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain', cursor: 'pointer', transition: 'all 0.2s ease', _hover: { transform: 'translateY(-2px)', boxShadow: 'md', borderColor: 'primary' } })}>
                <div className={flex({ gap: '3', align: 'center' })}>
                  <div className={css({ p: '2.5', borderRadius: 'lg', bg: 'bgButtonSecondary', color: 'primary' })}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className={css({ fontWeight: '600', fontSize: 'sm' })}>{sc.label}</h3>
                    <p className={css({ fontSize: 'xs', color: 'textMuted' })}>{sc.desc}</p>
                  </div>
                </div>
                <ArrowRight size={16} className={css({ color: 'textMuted' })} />
              </div>
            );
          })}
        </div>

        {/* Real-time Activities Logs */}
        <Card className={css({ gridColumn: { lg: 'span 2' } })}>
          <div className={flex({ justify: 'space-between', align: 'center', mb: '4' })}>
            <h2 className={css({ fontWeight: '600', fontSize: 'lg' })}>Canlı Aktivite Akışı</h2>
            <Badge variant="neutral" className={css({ display: 'flex', gap: '1', alignItems: 'center' })}>
              <div className={css({ w: '1.5', h: '1.5', bg: 'success', borderRadius: 'full', animation: 'ping 1s infinite' })} />
              Canlı
            </Badge>
          </div>
          <div className={stack({ gap: '3.5' })}>
            {logs.length === 0 ? (
              <div className={css({ py: '10', textAlign: 'center', color: 'textMuted' })}>Henüz canlı aktivite kaydı bulunmuyor.</div>
            ) : (
              logs.slice(0, 5).map((log: Log, idx) => (
                <div key={idx} className={flex({ justify: 'space-between', align: 'center', py: '3', px: '4', bg: 'bgCanvas', borderRadius: 'lg', borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain' })}>
                  <div className={flex({ gap: '3', align: 'center' })}>
                    <div className={css({ p: '2', borderRadius: 'full', bg: log.event_type === 'join' ? 'green.100' : 'blue.100', color: log.event_type === 'join' ? 'green.600' : 'blue.600', _dark: { bg: log.event_type === 'join' ? 'green.950/20' : 'blue.950/20', color: log.event_type === 'join' ? 'green.400' : 'blue.400' } })}>
                      <MessageCircle size={16} />
                    </div>
                    <div>
                      <div className={css({ fontWeight: '600', fontSize: 'sm' })}>{log.first_name || log.username || 'Gizli Kullanıcı'}</div>
                      <div className={css({ fontSize: 'xs', color: 'textMuted' })}>{getChatTitle(log.chat_id)} grubuna katıldı</div>
                    </div>
                  </div>
                  <div className={css({ fontSize: 'xs', color: 'textMuted', whiteSpace: 'nowrap' })}>
                    {new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Groups summary list */}
      {chats.length > 0 && (
        <Card>
          <div className={flex({ justify: 'space-between', mb: '4', align: 'center' })}>
            <h2 className={css({ fontWeight: '600', fontSize: 'lg' })}>Gruplar Genel Durumu</h2>
            <button onClick={() => goTo && goTo('/chats')} className={css({ fontSize: 'xs', color: 'primary', fontWeight: '600', _hover: { textDecoration: 'underline' }, border: 'none', bg: 'transparent', cursor: 'pointer' })}>
              Tüm Grupları Yönet
            </button>
          </div>
          <div className={grid({ columns: { base: 1, md: 2, xl: 3 }, gap: '4' })}>
            {chats.slice(0, 9).map((chat: Chat) => (
              <div key={chat.chat_id} className={css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '4', bg: 'bgCanvas', borderRadius: 'xl', borderWidth: '1px', borderStyle: 'solid', borderColor: 'borderMain' })}>
                <div>
                  <div className={css({ fontWeight: '600', fontSize: 'sm', truncate: true, maxW: '160px' })}>{chat.title || chat.chat_id}</div>
                  <div className={css({ fontSize: 'xs', color: 'textMuted', mt: '0.5' })}>{chat.member_count ? `${chat.member_count} Üye` : '0 Üye'}</div>
                </div>
                <Badge variant={chat.is_enabled ? 'success' : 'neutral'}>{chat.is_enabled ? 'Aktif' : 'Pasif'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default DashboardView;
