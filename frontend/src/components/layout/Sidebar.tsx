import { Activity, Ban, BarChart, Calendar, ClipboardList, CreditCard, FileText, Globe, MessageCircle, Search, Settings, Shield, Terminal, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { css } from '../../../styled-system/css';
import { stack } from '../../../styled-system/patterns';

const navGroups = [
  {
    title: 'Ana Yönetim',
    items: [
      { to: '/dashboard', label: 'Gösterge Paneli', icon: Activity },
      { to: '/settings', label: 'Sistem Ayarları', icon: Settings },
    ]
  },
  {
    title: 'Topluluk & Chat',
    items: [
      { to: '/chats', label: 'Telegram Grupları', icon: Users },
      { to: '/moderation', label: 'Gelişmiş Moderasyon', icon: Shield },
      { to: '/scheduler', label: 'Mesaj Planlayıcı', icon: Calendar },
      { to: '/articles', label: 'Sayfalar', icon: FileText },
      { to: '/commands', label: 'Özel Komutlar', icon: Terminal },
    ]
  },
  {
    title: 'Raporlar & Analiz',
    items: [
      { to: '/analytics', label: 'Grup Analitiği', icon: BarChart },
      { to: '/logs', label: 'Canlı Aktivite', icon: MessageCircle },
      { to: '/audit', label: 'Denetim Kayıtları', icon: ClipboardList },
      { to: '/team', label: 'Yönetici Ekibi', icon: Users },
    ]
  },
  {
    title: 'Sistem',
    items: [
      { to: '/global-blacklist', label: 'Global Kara Liste', icon: Ban },
      { to: '/subscriptions', label: 'Abonelikler', icon: CreditCard },
      { to: '/user-profile', label: 'Kullanıcı Profili', icon: Search },
      { to: '/webhook-test', label: 'Webhook Test', icon: Globe },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  return (
    <aside className={css({
      w: { base: 'full', lg: '250px' },
      bg: 'bgSurface',
      borderRightWidth: { base: 'none', lg: '1px' },
      borderRightStyle: { base: 'none', lg: 'solid' },
      borderRightColor: { base: 'none', lg: 'borderMain' },
      display: { base: isOpen ? 'flex' : 'none', lg: 'flex' },
      flexDirection: 'column',
      position: { base: 'absolute', lg: 'static' },
      zIndex: 50,
      h: { base: 'full', lg: 'auto' },
      overflowY: 'auto',
      flexShrink: 0,
      boxShadow: { base: isOpen ? 'xl' : 'none', lg: 'none' }
    })}>

      {/* Nav Menu */}
      <nav className={stack({ p: '3', gap: '5', flex: 1 })}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className={stack({ gap: '1' })}>
            <div className={css({
              px: '3',
              py: '1',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: 'wider',
              color: 'textMuted',
              textTransform: 'uppercase',
              opacity: 0.8
            })}>
              {group.title}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    css({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3',
                      w: 'full',
                      px: '4',
                      py: '2.5',
                      fontSize: '13px',
                      fontWeight: isActive ? '600' : '500',
                      borderRadius: 'lg',
                      bg: isActive ? 'primary' : 'transparent',
                      color: isActive ? 'white' : 'textMain',
                      textDecoration: 'none',
                      boxShadow: isActive ? '0 4px 12px rgba(239, 68, 68, 0.25)' : 'none',
                      transition: 'all 0.2s ease',
                      _hover: {
                        bg: isActive ? 'primaryHover' : 'bgButtonSecondary',
                        transform: isActive ? 'none' : 'translateX(2px)'
                      },
                      cursor: 'pointer'
                    })
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom User Info Widget */}
      <div className={css({
        mt: 'auto',
        p: '3.5',
        borderTop: '1px solid token(colors.borderMain)',
        bg: 'bgCanvas',
        display: 'flex',
        alignItems: 'center',
        gap: '3',
        borderRadius: 'xl',
        m: '3.5'
      })}>
        <div className={css({
          w: '9',
          h: '9',
          borderRadius: 'full',
          bg: 'primary',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'sm',
          fontWeight: 'bold',
          flexShrink: 0
        })}>
          {user?.username?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className={css({ display: 'flex', flexDirection: 'column', overflow: 'hidden' })}>
          <span className={css({
            fontSize: '12px',
            fontWeight: '600',
            color: 'textMain',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          })}>
            {user?.username || 'Yönetici'}
          </span>
          <span className={css({
            fontSize: '9px',
            color: 'success',
            display: 'flex',
            alignItems: 'center',
            gap: '1',
            fontWeight: '600'
          })}>
            <span className={css({ w: '1.5', h: '1.5', borderRadius: 'full', bg: 'success', display: 'inline-block' })} />
            Çevrimiçi
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
