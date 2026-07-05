import React from 'react';
import { css } from '../../../styled-system/css';
import { flex } from '../../../styled-system/patterns';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({ title, description, actions, icon }: PageHeaderProps) {
  return (
    <div className={css({ mb: '6' })}>
      <div className={flex({ justify: 'space-between', align: 'flex-start', gap: '4', flexWrap: 'wrap' })}>
        <div>
          <h1 className={css({
            fontSize: { base: 'xl', md: '2xl' },
            fontWeight: 'semibold',
            color: 'textMain',
            display: 'flex',
            alignItems: 'center',
            gap: '2',
          })}>
            {icon && <span>{icon}</span>}
            {title}
          </h1>
          {description && (
            <p className={css({ color: 'textMuted', mt: '1', fontSize: 'sm' })}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className={css({ display: 'flex', gap: '2', alignItems: 'center', flexWrap: 'wrap' })}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
