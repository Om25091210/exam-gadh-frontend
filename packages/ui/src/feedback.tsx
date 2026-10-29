'use client';
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '@eg/i18n';
import { Button } from './button';
import { cn } from './cn';

export type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
const toneBox: Record<Tone, string> = {
  info: 'bg-info-50 text-info-700 border-info-700/20',
  success: 'bg-success-50 text-success-600 border-success-600/20',
  warning: 'bg-warning-50 text-warning-700 border-warning-700/20',
  danger: 'bg-danger-50 text-danger-700 border-danger-700/20',
  neutral: 'bg-black/5 text-ink-700 border-line',
};
const toneIcon = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle, neutral: Info };

export function Alert({ tone = 'info', title, children, className, live = true }: { tone?: Tone; title?: string; children?: ReactNode; className?: string; live?: boolean }) {
  const Icon = toneIcon[tone];
  return (
    <div role={live ? (tone === 'danger' ? 'alert' : 'status') : undefined} className={cn('flex gap-3 rounded-xl border p-3 text-sm', toneBox[tone], className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? 'mt-0.5' : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', toneBox[tone], className)}>{children}</span>;
}

export function Spinner({ label, className }: { label?: string; className?: string }) {
  const { t } = useI18n();
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-ink-500', className)}>
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>{label ?? t('common.loading')}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-black/10', className)} />;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line bg-surface px-4 py-10 text-center">
      <p className="text-lg font-semibold text-ink-900">{title}</p>
      {children ? <div className="max-w-md text-ink-500">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card border border-danger-700/20 bg-danger-50 px-4 py-8 text-center">
      <p className="text-lg font-semibold text-danger-700">{t('common.error.title')}</p>
      <p className="max-w-md text-danger-700">{message ?? t('common.error.generic')}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  );
}

export function ProgressBar({ value, max = 100, label, tone = 'primary' }: { value: number; max?: number; label: string; tone?: 'primary' | 'accent' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 w-full overflow-hidden rounded-full bg-black/10">
      <div className={cn('h-full rounded-full', tone === 'primary' ? 'bg-primary-600' : 'bg-accent-500')} style={{ width: `${pct}%` }} />
    </div>
  );
}
