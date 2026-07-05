import React from 'react';
import { badge } from '../../../styled-system/recipes';
import { css } from '../../../styled-system/css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'active' | 'inactive';
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ children, variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span className={`${badge({ variant })} ${className || ''}`.trim()} {...props}>
      {children}
    </span>
  );
}

export default Badge;