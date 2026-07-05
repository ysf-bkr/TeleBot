import { Languages, LogOut, Menu, MessageCircle, Moon, Sun, X } from 'lucide-react';
import { css } from '../../../styled-system/css';
import { flex } from '../../../styled-system/patterns';
import { i18n } from '../../lib/i18n';
import { User } from '../../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
  theme: string;
  onToggleTheme: () => void;
}

export function Header({ user, onLogout, onToggleMenu, isMenuOpen, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className={css({
      bg: 'bgSurface/85',
      backdropFilter: 'blur(12px)',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'borderMain',
      color: 'textMain',
      px: { base: '4', md: '6' },
      h: '16',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50
    })}>
      <div className={flex({ align: 'center', gap: '3' })}>
        <button
          onClick={onToggleMenu}
          className={css({ display: { base: 'block', lg: 'none' }, p: '2', mr: '1', color: 'textMain' })}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <MessageCircle className={css({ color: 'primary', w: '7', h: '7' })} />
        <div>
          <span className={css({ fontWeight: '700', fontSize: 'lg', color: 'primary', letterSpacing: 'tight' })}>TeleBot</span>
          <span className={css({ fontSize: 'xs', color: 'textMuted', ml: '2', display: { base: 'none', md: 'inline' } })}>
            {i18n.t('app.name')}
          </span>
        </div>
      </div>

      <div className={flex({ align: 'center', gap: '2' })}>
        <div className={css({ fontSize: 'sm', color: 'textMuted', display: { base: 'none', md: 'block' } })}>
          {user?.username}
        </div>

        {/* Dil Değiştirme Butonu */}
        <button
          onClick={() => i18n.toggle()}
          className={css({
            p: '2', borderRadius: 'lg',
            bg: 'bgButtonSecondary', color: 'textButtonSecondary',
            _hover: { bg: 'bgButtonSecondaryHover' },
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '11px', fontWeight: '700',
            gap: '1',
          })}
          title={i18n.lang === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
        >
          <Languages size={14} />
          {i18n.lang === 'tr' ? 'EN' : 'TR'}
        </button>

        {/* Tema Değiştirme Butonu */}
        <button
          onClick={onToggleTheme}
          className={css({
            p: '2', borderRadius: 'lg',
            bg: 'bgButtonSecondary', color: 'textButtonSecondary',
            _hover: { bg: 'bgButtonSecondaryHover' },
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          })}
          title={theme === 'dark' ? i18n.t('header.light_mode') : i18n.t('header.dark_mode')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Çıkış Butonu */}
        <button
          onClick={onLogout}
          className={css({
            display: 'flex', alignItems: 'center', gap: '2',
            px: '3', py: '1.5', fontSize: 'sm',
            bg: 'bgButtonSecondary', color: 'textButtonSecondary', borderRadius: 'lg',
            _hover: { bg: 'bgButtonSecondaryHover' },
            cursor: 'pointer',
          })}
        >
          <LogOut size={16} />
          <span className={css({ display: { base: 'none', sm: 'inline' } })}>{i18n.t('header.logout')}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
