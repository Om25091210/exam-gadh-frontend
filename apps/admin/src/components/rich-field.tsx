'use client';
import { Field, Textarea, cn } from '@eg/ui';
import { useRef } from 'react';
import { wrapMarker } from '@/lib/question-form';

const BUTTONS: Array<{ marker: 'b' | 'i' | 'sub' | 'sup'; label: string; title: string; cls: string }> = [
  { marker: 'b', label: 'B', title: 'Bold', cls: 'font-bold' },
  { marker: 'i', label: 'I', title: 'Italic', cls: 'italic' },
  { marker: 'sub', label: 'x₂', title: 'Subscript', cls: '' },
  { marker: 'sup', label: 'x²', title: 'Superscript', cls: '' },
];

/** A text box with Bold / Italic / Sub / Sup buttons. The text is stored with [b] [i] [sub] [sup] markers, never HTML. */
export function RichField({ label, value, onChange, rows = 2, hint, error, lang, required }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string; error?: string | null; lang?: 'hi' | 'en'; required?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (marker: 'b' | 'i' | 'sub' | 'sup') => {
    const el = ref.current;
    if (!el) return;
    const r = wrapMarker(value, el.selectionStart, el.selectionEnd, marker);
    onChange(r.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.start, r.end);
    });
  };
  return (
    <Field label={required ? `${label} *` : label} hint={hint} error={error}>
      {(p) => (
        <div>
          <div className="mb-1 flex gap-1" role="toolbar" aria-label={`Formatting for ${label}`}>
            {BUTTONS.map((b) => (
              <button key={b.marker} type="button" title={b.title} aria-label={b.title} onClick={() => wrap(b.marker)} className={cn('grid size-8 place-items-center rounded-md border border-line bg-surface text-sm hover:bg-primary-50', b.cls)}>
                {b.label}
              </button>
            ))}
          </div>
          <Textarea {...p} ref={ref} rows={rows} lang={lang} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-0" />
        </div>
      )}
    </Field>
  );
}
