'use client';
import { useEffect, useRef, useState } from 'react';

interface GoogleId {
  initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void;
  renderButton: (el: HTMLElement, o: { theme?: string; size?: string; text?: string; shape?: string; width?: number; logo_alignment?: string }) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SRC = 'https://accounts.google.com/gsi/client';
let loading: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('gsi'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

/** Google's own sign-in button. It returns an ID token, which the server verifies; we never see a password. */
export function GoogleButton({ onCredential, onLoadError }: { onCredential: (idToken: string) => void; onLoadError: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !box.current || !window.google) return;
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => cb.current(r.credential), auto_select: false, cancel_on_tap_outside: true });
        window.google.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 300 });
        setReady(true);
      })
      .catch(() => !cancelled && onLoadError());
    return () => {
      cancelled = true;
    };
  }, [onLoadError]);

  return <div ref={box} className="flex min-h-11 justify-center" aria-busy={!ready} />;
}
