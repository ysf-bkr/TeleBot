import React from 'react';
import { css, cx } from '../../../styled-system/css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeMap = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  return (
    <div
      className={cx(css({
        display: 'inline-block',
        width: sizeMap[size],
        height: sizeMap[size],
        border: '2px solid',
        borderColor: 'borderMain',
        borderTopColor: 'primary',
        borderRadius: 'full',
        animation: 'spin 0.8s linear infinite',
      }), className)}
      role="status"
      aria-label="Yükleniyor"
    />
  );
}

export default Spinner;
