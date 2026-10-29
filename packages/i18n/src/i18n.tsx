'use client';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type MessageKey } from './en';
import { hi } from './hi';

export type Lang = 'hi' | 'en';
export const LANGS: Lang[] = ['hi', 'en'];
export const DEFAULT_LANG: Lang = 'hi'; // Chhattisgarh students: Hindi first

const dictionaries: Record<Lang, Record<MessageKey, string>> = { en, hi };

export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  const text = dictionaries[lang][key] ?? en[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : text;
}

/** A value stored in both languages by the backend (`titleEn` / `titleHi`). Falls back to the other language when one is empty. */
export function bi(lang: Lang, en: string | null | undefined, hi: string | null | undefined): string {
  const first = lang === 'hi' ? hi : en;
  const second = lang === 'hi' ? en : hi;
  return (first && first.trim() ? first : second) ?? '';
}

export function isLang(v: unknown): v is Lang {
  return v === 'hi' || v === 'en';
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  /** pick the right language of a bilingual pair */
  b: (en: string | null | undefined, hi: string | null | undefined) => string;
  /** locale-aware formatting (Indian digit grouping) */
  fmt: { number: (n: number, digits?: number) => string; date: (d: string | Date) => string; dateTime: (d: string | Date) => string; time: (d: string | Date) => string };
}

const I18nContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'eg_lang';

export function I18nProvider({ children, initial = DEFAULT_LANG, onChange, persist = true }: { children: ReactNode; initial?: Lang; onChange?: (l: Lang) => void; persist?: boolean }) {
  const [lang, setLangState] = useState<Lang>(initial);

  // the server renders the default; the stored choice is applied on the client
  useEffect(() => {
    if (!persist) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLang(saved) && saved !== lang) setLangState(saved);
    } catch {
      /* storage can be blocked; the default stays */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignore */
        }
      }
      onChange?.(l);
    },
    [onChange, persist],
  );

  const value = useMemo<Ctx>(() => {
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
    const asDate = (d: string | Date) => (typeof d === 'string' ? new Date(d) : d);
    return {
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      b: (e, h) => bi(lang, e, h),
      fmt: {
        number: (n, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits, numberingSystem: 'latn' }).format(n),
        date: (d) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Kolkata', numberingSystem: 'latn' }).format(asDate(d)),
        dateTime: (d) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata', numberingSystem: 'latn' }).format(asDate(d)),
        time: (d) => new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'Asia/Kolkata', numberingSystem: 'latn' }).format(asDate(d)),
      },
    };
  }, [lang, setLang]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): Ctx {
  const c = useContext(I18nContext);
  if (!c) throw new Error('useI18n must be used inside <I18nProvider>');
  return c;
}
