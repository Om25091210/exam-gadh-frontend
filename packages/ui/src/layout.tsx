'use client';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useI18n } from '@eg/i18n';
import { Button } from './button';
import { cn } from './cn';

export function Card({ children, className, as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' | 'li' }) {
  return <Tag className={cn('rounded-card border border-line bg-surface p-4 shadow-card', className)}>{children}</Tag>;
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

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-sm text-ink-500">{label}</p>
      <p className={cn('text-2xl font-bold', tone === 'good' && 'text-success-600', tone === 'bad' && 'text-danger-600')}>{value}</p>
      {hint ? <p className="text-xs text-ink-500">{hint}</p> : null}
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
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl bg-black/5 p-1">
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
          className={cn('min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold', value === it.id ? 'bg-surface text-primary-700 shadow-card' : 'text-ink-700 hover:bg-black/5')}
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
