import AsyncStorage from '@react-native-async-storage/async-storage';
import { bi, translate, type Lang, type MessageKey } from '@eg/i18n';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const KEY = 'eg_lang';
interface Ctx {
  lang: Lang;
  /** null while the saved choice is being read; false = the student has never picked a language */
  chosen: boolean | null;
  setLang: (l: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  b: (en: string | null | undefined, hi: string | null | undefined) => string;
  num: (n: number, digits?: number) => string;
  date: (d: string | Date) => string;
}
const I18n = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('hi');
  const [chosen, setChosen] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'hi' || v === 'en') setLangState(v);
        setChosen(v === 'hi' || v === 'en');
      })
      .catch(() => setChosen(true));
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setChosen(true);
    AsyncStorage.setItem(KEY, l).catch(() => undefined);
  }, []);
  const value = useMemo<Ctx>(() => {
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
    const fmtDate = (d: string | Date) => {
      const x = typeof d === 'string' ? new Date(d) : d;
      const months = lang === 'hi' ? ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${x.getDate()} ${months[x.getMonth()]} ${x.getFullYear()}`;
    };
    return {
      lang,
      chosen,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      b: (e, h) => bi(lang, e, h),
      // Intl number formatting is not guaranteed on every Android build: format by hand with Indian grouping
      num: (n, digits = 0) => {
        const [i, f] = Math.abs(n).toFixed(digits).split('.');
        const last3 = i.slice(-3);
        const rest = i.slice(0, -3);
        const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
        void locale;
        return `${n < 0 ? '-' : ''}${grouped}${f ? `.${f}` : ''}`;
      },
      date: fmtDate,
    };
  }, [lang, chosen, setLang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(I18n);
  if (!c) throw new Error('useI18n outside I18nProvider');
  return c;
}
export type { Lang, MessageKey };
