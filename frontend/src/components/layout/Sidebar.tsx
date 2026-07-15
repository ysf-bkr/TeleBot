import { Activity, Ban, BarChart, Building2, Calendar, ClipboardList, CreditCard, FileText, Globe, MessageCircle, Search, Settings, Shield, Terminal, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { css } from '../../../styled-system/css';
import { stack } from '../../../styled-system/patterns';
import { i18n } from '../../lib/i18n';

const navGroups = [
  {
    titleKey: 'nav.main_mgmt',
    items: [
      { to: '/dashboard', labelKey: 'nav.dashboard', icon: Activity },
      { to: '/workspace', labelKey: 'nav.workspace', icon: Building2 },
      { to: '/settings', labelKey: 'nav.settings', icon: Settings },
    ]
  },
  {
    titleKey: 'nav.community_chat',
    items: [
      { to: '/chats', labelKey: 'nav.chats', icon: Users },
      { to: '/moderation', labelKey: 'nav.moderation', icon: Shield },
      { to: '/scheduler', labelKey: 'nav.scheduler', icon: Calendar },
      { to: '/articles', labelKey: 'nav.articles', icon: FileText },
      { to: '/commands', labelKey: 'nav.commands', icon: Terminal },
    ]
  },
  {
    titleKey: 'nav.reports_analysis',
    items: [
      { to: '/analytics', labelKey: 'nav.analytics', icon: BarChart },
      { to: '/logs', labelKey: 'nav.logs', icon: MessageCircle },
      { to: '/audit', labelKey: 'nav.audit', icon: ClipboardList },
      { to: '/team', labelKey: 'nav.team', icon: Users },
    ]
  },
  {
    titleKey: 'nav.system',
    items: [
      { to: '/global-blacklist', labelKey: 'nav.global_blacklist', icon: Ban },
      { to: '/subscriptions', labelKey: 'nav.subscriptions', icon: CreditCard },
      { to: '/user-profile', labelKey: 'nav.user_profile', icon: Search },
      { to: '/webhook-test', labelKey: 'nav.webhook_test', icon: Globe },
    ]
  },
  {
    titleKey: 'nav.administration',
    items: [
      { to: '/admin', labelKey: 'nav.admin_panel', icon: Shield },
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
        {navGroups
          .filter(group => {
            // Admin panel sadece super_admin için göster
            if (group.titleKey === 'nav.administration') {
              return user?.role === 'super_admin';
            }
            return true;
          })
          .map((group, gIdx) => (
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
              {i18n.t(group.titleKey)}
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
                  {i18n.t(item.labelKey)}
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
            {user?.username || i18n.t('sidebar.admin')}
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
            {i18n.t('sidebar.online')}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
