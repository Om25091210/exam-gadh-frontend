import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const KEY = 'eg_onboarded';
interface Ctx {
  /** null while the saved flag is being read */
  done: boolean | null;
  finish: () => void;
}
const Onboarding = createContext<Ctx | null>(null);

/** Remembers that the three intro pages have been seen: they are shown once, before the first sign-in. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setDone(v === '1'))
      .catch(() => setDone(true));
  }, []);
  const finish = useCallback(() => {
    setDone(true);
    AsyncStorage.setItem(KEY, '1').catch(() => undefined);
  }, []);
  const value = useMemo(() => ({ done, finish }), [done, finish]);
  return <Onboarding.Provider value={value}>{children}</Onboarding.Provider>;
}

export function useOnboarding(): Ctx {
  const c = useContext(Onboarding);
  if (!c) throw new Error('useOnboarding outside OnboardingProvider');
  return c;
}
