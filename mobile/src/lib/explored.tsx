import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const KEY = 'eg_explored';
interface Ctx {
  seen: Set<string>;
  mark: (key: string) => void;
}
const Explored = createContext<Ctx | null>(null);

/** Remembers which journey stops the student has opened: the road fills up as they explore (a visible sense of progress). */
export function ExploredProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && setSeen(new Set(JSON.parse(v) as string[])))
      .catch(() => undefined);
  }, []);
  const mark = useCallback((key: string) => {
    setSeen((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev).add(key);
      AsyncStorage.setItem(KEY, JSON.stringify([...next])).catch(() => undefined);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ seen, mark }), [seen, mark]);
  return <Explored.Provider value={value}>{children}</Explored.Provider>;
}
export function useExplored(): Ctx {
  const c = useContext(Explored);
  if (!c) throw new Error('useExplored outside ExploredProvider');
  return c;
}
