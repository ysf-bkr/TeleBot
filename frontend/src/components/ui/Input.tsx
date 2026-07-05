import React from 'react';
import { css, cx } from '../../../styled-system/css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cx(css({
        w: 'full',
        px: '4',
        py: '2.5',
        bg: 'bgSurface',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'borderMain',
        color: 'textMain',
        borderRadius: 'lg',
        fontSize: 'sm',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        _hover: { borderColor: 'token(colors.gray.300)', _dark: { borderColor: 'token(colors.gray.700)' } },
        _focus: { borderColor: 'primary', boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.18)', outline: 'none' },
        _disabled: { bg: 'bgCanvas', cursor: 'not-allowed', opacity: 0.7 },
      }), className)}
      {...props}
    />
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cx(css({
        w: 'full',
        px: '4',
        py: '3',
        bg: 'bgSurface',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'borderMain',
        color: 'textMain',
        borderRadius: 'lg',
        fontSize: 'sm',
        fontFamily: 'inherit',
        minH: '120px',
        resize: 'vertical',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        _hover: { borderColor: 'token(colors.gray.300)', _dark: { borderColor: 'token(colors.gray.700)' } },
        _focus: { borderColor: 'primary', boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.18)', outline: 'none' },
        _disabled: { bg: 'bgCanvas', cursor: 'not-allowed', opacity: 0.7 },
      }), className)}
      {...props}
    />
  );
}

export default Input;