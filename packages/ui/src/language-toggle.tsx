'use client';
import { useI18n, type Lang } from '@eg/i18n';
import { cn } from './cn';

const OPTIONS: Array<{ lang: Lang; short: string; label: string }> = [
  { lang: 'hi', short: 'हिं', label: 'हिन्दी' },
  { lang: 'en', short: 'EN', label: 'English' },
];

/**
 * Hindi / English switch. By default it changes the app language; pass `value` and `onChange` to control something else
 * (the exam hall uses it for the language of the questions, which is separate from the interface language).
 */
export function LanguageToggle({ className, value, onChange, label }: { className?: string; value?: Lang; onChange?: (l: Lang) => void; label?: string }) {
  const i18n = useI18n();
  const lang = value ?? i18n.lang;
  const setLang = onChange ?? i18n.setLang;
  const t = i18n.t;
  return (
    <div role="group" aria-label={label ?? t('common.language')} className={cn('inline-flex rounded-xl bg-black/5 p-1', className)}>
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          lang={o.lang}
          aria-pressed={lang === o.lang}
          aria-label={o.label}
          onClick={() => setLang(o.lang)}
          className={cn('min-h-9 min-w-11 rounded-lg px-3 text-sm font-semibold', lang === o.lang ? 'bg-surface text-primary-700 shadow-card' : 'text-ink-700')}
        >
          {o.short}
        </button>
      ))}
    </div>
  );
}
