import React from 'react';
import { css, cx } from '../../../styled-system/css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div 
      className={cx(css({ 
        bg: 'bgSurface', 
        borderRadius: 'xl', 
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'borderMain',
        p: '6',
        color: 'textMain',
      }), className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cx(css({ mb: '4', fontWeight: '600', color: 'textMain' }), className)}>
      {children}
    </div>
  );
}

export interface CardContentProps {
  children?: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

export default Card;