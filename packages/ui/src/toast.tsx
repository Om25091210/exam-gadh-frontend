'use client';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, type Tone } from './feedback';

interface ToastItem {
  id: number;
  tone: Tone;
  text: string;
}
const ToastContext = createContext<{ show: (text: string, tone?: Tone) => void } | null>(null);

/** Polite, non-blocking messages. They disappear after 5 seconds and are announced to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const show = useCallback((text: string, tone: Tone = 'info') => {
    const id = next.current++;
    setItems((x) => [...x.slice(-2), { id, tone, text }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 5000);
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 mx-auto flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-2 md:bottom-6">
        {items.map((i) => (
          <div key={i.id} className="pointer-events-auto shadow-lg">
            <Alert tone={i.tone} live={false}>
              {i.text}
            </Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastContext);
  if (!c) throw new Error('useToast must be used inside <ToastProvider>');
  return c;
}
