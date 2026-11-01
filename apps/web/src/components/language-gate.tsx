'use client';
import { useI18n, type Lang } from '@eg/i18n';
import { HeroIllustration } from '@eg/ui';
import Image from 'next/image';
import type { ReactNode } from 'react';

const OPTIONS: Array<{ lang: Lang; big: string; small: string }> = [
  { lang: 'hi', big: 'हिंदी', small: 'Hindi' },
  { lang: 'en', big: 'English', small: 'अंग्रेज़ी' },
];

/** First visit: ask for a language before anything else. The choice is remembered and can be changed from the top bar. */
export function LanguageGate({ children }: { children: ReactNode }) {
  const { chosen, setLang } = useI18n();
  if (chosen === null) return <div className="min-h-dvh" aria-hidden />;
  if (chosen) return <>{children}</>;
  return (
    <main className="bg-hero grid min-h-dvh place-items-center px-4 py-10 text-white">
      <div className="w-full max-w-md text-center">
        <Image src="/logo.png" alt="ExamGadh" width={96} height={96} priority className="mx-auto rounded-3xl bg-white p-2" />
        <HeroIllustration className="mx-auto mt-2 max-w-60" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          अपनी भाषा चुनें
          <span className="mt-1 block text-xl font-semibold text-primary-100">Choose your language</span>
        </h1>
        <div className="mt-6 grid gap-3">
          {OPTIONS.map((o) => (
            <button key={o.lang} type="button" lang={o.lang} onClick={() => setLang(o.lang)} className="group flex min-h-20 items-center justify-between rounded-3xl bg-white px-6 py-4 text-left text-ink-900 shadow-[var(--shadow-lift)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
              <span>
                <span className="block text-2xl font-bold text-primary-800">{o.big}</span>
                <span className="text-sm text-ink-500">{o.small}</span>
              </span>
              <span aria-hidden className="grid size-10 place-items-center rounded-full bg-primary-100 text-xl text-primary-700 transition-transform group-hover:translate-x-1">→</span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-sm text-primary-100">आप इसे कभी भी बदल सकते हैं · You can change it any time</p>
      </div>
    </main>
  );
}
