import React from 'react';
import { css } from '../../../styled-system/css';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: '12',
      px: '6',
      textAlign: 'center',
      color: 'textMuted',
    })}>
      {icon && <div className={css({ mb: '4', opacity: 0.6 })}>{icon}</div>}
      <div className={css({ fontSize: 'lg', fontWeight: '600', color: 'textMain', mb: '1' })}>
        {title}
      </div>
      {description && (
        <div className={css({ fontSize: 'sm', maxW: '320px', mb: '4' })}>
          {description}
        </div>
      )}
      {(action || (actionLabel && onAction)) && (
        <div className={css({ mt: '2' })}>
          {action || (
            <Button onClick={onAction} size="sm" variant="secondary">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
