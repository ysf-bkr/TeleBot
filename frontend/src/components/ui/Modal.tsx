import React from 'react';
import { css } from '../../../styled-system/css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const maxW = size === 'sm' ? 'sm' :
               size === 'md' ? 'lg' :
               size === 'lg' ? '2xl' :
               size === 'xl' ? '4xl' :
               'full';

  return (
    <div
      className={css({
        position: 'fixed',
        inset: 0,
        bg: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: '4'
      })}
      onClick={onClose}
    >
      <div
        className={css({
          bg: 'bgSurface',
          borderRadius: 'xl',
          w: 'full',
          maxW: maxW,
          maxH: '90dvh',
          overflowY: 'auto',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'borderMain',
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
          color: 'textMain'
        })}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={css({
          px: '6',
          py: '4',
          borderBottom: '1px solid token(colors.borderMain)',
          fontWeight: '600',
          fontSize: 'lg',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        })}>
          {title}
          <button onClick={onClose} className={css({ fontSize: '2xl', lineHeight: '1', color: 'textMuted', cursor: 'pointer', _hover: { color: 'textMain' } })}>×</button>
        </div>

        {/* Content */}
        <div className={css({ p: '6' })}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={css({
            px: '6',
            py: '4',
            borderTop: '1px solid token(colors.borderMain)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '3'
          })}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
