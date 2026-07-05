import React from 'react';
import { button } from '../../../styled-system/recipes';
import { css } from '../../../styled-system/css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className,
  ...props 
}: ButtonProps) {
  const classNames = `${button({ variant, size })} ${className || ''}`.trim();
  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
}

export default Button;