'use client';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useI18n } from '@eg/i18n';
import { Button } from './button';
import { cn } from './cn';

export function Card({ children, className, as: Tag = 'div', interactive }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' | 'li'; interactive?: boolean }) {
  return <Tag className={cn('animate-fade-up rounded-card border border-line/80 bg-surface p-4 shadow-card', interactive && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]', className)}>{children}</Tag>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-ink-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn('mb-6', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold text-ink-900">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone, icon }: { label: string; value: ReactNode; hint?: string; tone?: 'good' | 'bad'; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line/80 bg-surface p-3 shadow-card">
      {icon ? <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">{icon}</span> : null}
      <div className="min-w-0">
        <p className="text-sm text-ink-500">{label}</p>
        <p className={cn('text-2xl font-bold tracking-tight', tone === 'good' && 'text-success-600', tone === 'bad' && 'text-danger-600')}>{value}</p>
        {hint ? <p className="text-xs text-ink-500">{hint}</p> : null}
      </div>
    </div>
  );
}

/** Circular progress (e.g. a daily goal or accuracy). The number is text, so it never relies on the ring alone. */
export function ProgressRing({ value, max = 100, size = 72, label, children, tone = 'primary' }: { value: number; max?: number; size?: number; label: string; children?: ReactNode; tone?: 'primary' | 'accent' | 'light' }) {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const stroke = tone === 'light' ? '#ffffff' : tone === 'accent' ? 'var(--color-accent-500)' : 'var(--color-primary-600)';
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone === 'light' ? 'rgb(255 255 255 / 0.25)' : 'rgb(0 0 0 / 0.08)'} strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="absolute text-sm font-bold">{children}</span>
    </div>
  );
}

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}
/** Accessible tab buttons that switch a view (the caller renders the panel). Arrow keys move between tabs. */
export function Tabs({ items, value, onChange, label }: { items: TabItem[]; value: string; onChange: (id: string) => void; label: string }) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = items[(i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
    onChange(next.id);
    (e.currentTarget.parentElement?.querySelector(`[data-tab="${next.id}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-2xl bg-black/5 p-1">
      {items.map((it, i) => (
        <button
          key={it.id}
          role="tab"
          data-tab={it.id}
          type="button"
          aria-selected={value === it.id}
          tabIndex={value === it.id ? 0 : -1}
          onKeyDown={(e) => onKey(e, i)}
          onClick={() => onChange(it.id)}
          className={cn('min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition-all', value === it.id ? 'bg-surface text-primary-700 shadow-card' : 'text-ink-700 hover:bg-black/5')}
        >
          {it.label}
          {it.count != null ? <span className="ml-1 text-ink-500">({it.count})</span> : null}
        </button>
      ))}
    </div>
  );
}

/** A modal built on the native <dialog>: focus is trapped, Escape closes it, and the page behind is inert. */
export function Modal({ open, onClose, title, children, footer, dismissible = true }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; dismissible?: boolean }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 text-ink-900 shadow-xl backdrop:bg-black/50"
    >
      {open ? (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-line p-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {dismissible ? (
              <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid size-9 place-items-center rounded-lg hover:bg-black/5">
                <X className="size-5" aria-hidden />
              </button>
            ) : null}
          </div>
          <div className="overflow-y-auto p-4">{children}</div>
          {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const { t, fmt } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-2" aria-label="pagination">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t('common.previous')}
      </Button>
      <span className="text-sm text-ink-500">
        {fmt.number(page)} / {fmt.number(pages)}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {t('common.next')}
      </Button>
    </nav>
  );
}
