'use client';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-offset-2';
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-b from-primary-600 to-primary-700 text-white shadow-[var(--shadow-glow)] hover:from-primary-700 hover:to-primary-800',
  secondary: 'bg-surface text-ink-900 border border-line shadow-sm hover:border-primary-500/40 hover:bg-primary-50',
  ghost: 'text-ink-700 hover:bg-black/5',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
  accent: 'bg-gradient-to-b from-[#f5961f] to-accent-500 text-ink-900 shadow-[0_8px_20px_-6px_rgb(224_122_16/0.55)] hover:brightness-95',
};
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-base', // 44px: a comfortable touch target
  lg: 'min-h-12 px-6 text-base',
};

/** Class names for a button look, so links (`<Link>`) can look like buttons too. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses(variant, size, className)} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});
