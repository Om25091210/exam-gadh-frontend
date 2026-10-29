'use client';
import { useI18n, type Lang } from '@eg/i18n';
import { cn } from './cn';

const OPTIONS: Array<{ lang: Lang; short: string; label: string }> = [
  { lang: 'hi', short: 'हिं', label: 'हिन्दी' },
  { lang: 'en', short: 'EN', label: 'English' },
];

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t('common.language')} className={cn('inline-flex rounded-xl bg-black/5 p-1', className)}>
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
