'use client';
import { createStudentApi, createHttp, type StudentApi, type User } from '@eg/api';
import { useI18n } from '@eg/i18n';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { deviceId, deviceName, tabId } from './device';
import { clearEnded, getAccessToken, lastRefreshFailure, markSessionEnded, refreshAccessToken, sessionEndedCode, signInWithGoogle, signOut as doSignOut, subscribe, tokenExpiresAt } from './session-client';

type Status = 'loading' | 'anon' | 'authed';
interface AuthCtx {
  status: Status;
  user: User | null;
  api: StudentApi;
  /** why the student was signed out, if the server ended the session */
  endedCode: string | null;
  signIn: (idToken: string) => Promise<{ endedOtherSession: boolean }>;
  signOut: () => Promise<void>;
  setUser: (u: User) => void;
}
const Ctx = createContext<AuthCtx | null>(null);

function makeApi(): StudentApi {
  return createStudentApi(
    createHttp({
      getAccessToken,
      refresh: refreshAccessToken,
      onSessionEnded: (code) => markSessionEnded(code),
      clientId: typeof window === 'undefined' ? undefined : tabId(),
    }),
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const api = useMemo(makeApi, []);
  const qc = useQueryClient();
  // re-render when the token appears/disappears (another tab signed in/out, the server ended the session)
  const hasToken = useSyncExternalStore(subscribe, () => getAccessToken() !== null, () => false);

  // restore the session from the cookie, then load the profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = getAccessToken() ?? (await refreshAccessToken());
      if (cancelled) return;
      if (!t) {
        // a network failure is not a sign-out: stay on the loading screen's retry instead of dropping the cookie
        setStatus('anon');
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) {
          setUser(me);
          setStatus('authed');
        }
      } catch {
        if (!cancelled) setStatus('anon');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  // the token vanished while signed in: the session ended
  useEffect(() => {
    if (status === 'authed' && !hasToken && sessionEndedCode()) {
      setUser(null);
      setStatus('anon');
      qc.clear();
    }
  }, [hasToken, status, qc]);

  // refresh a little before the access token expires, so requests never race the expiry
  useEffect(() => {
    if (status !== 'authed') return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const exp = tokenExpiresAt();
      const wait = exp ? Math.max(5_000, exp - Date.now() - 90_000) : 60_000;
      timer = setTimeout(async () => {
        await refreshAccessToken();
        schedule();
      }, wait);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [status]);

  const signIn = useCallback(
    async (idToken: string) => {
      const r = await signInWithGoogle(idToken, deviceId(), deviceName());
      clearEnded();
      qc.clear();
      setUser(r.user);
      setStatus('authed');
      return { endedOtherSession: r.endedOtherSession };
    },
    [qc],
  );

  const signOut = useCallback(async () => {
    await doSignOut();
    qc.clear();
    setUser(null);
    setStatus('anon');
  }, [qc]);

  const value = useMemo<AuthCtx>(() => ({ status, user, api, endedCode: status === 'anon' ? sessionEndedCode() : null, signIn, signOut, setUser }), [status, user, api, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside <AuthProvider>');
  return c;
}
export const useApi = () => useAuth().api;
export { lastRefreshFailure };

/** Keeps the saved language in step with the account: adopt it on sign-in, save it when the student changes it. */
export function LanguageSync() {
  const { user, api, setUser, status } = useAuth();
  const { lang, setLang } = useI18n();
  const adopted = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authed' || !user || adopted.current === user.id) return;
    adopted.current = user.id;
    let chosenLocally = false;
    try {
      chosenLocally = localStorage.getItem('eg_lang') !== null;
    } catch {
      /* ignore */
    }
    if (!chosenLocally && user.language !== lang) setLang(user.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user]);

  useEffect(() => {
    if (status !== 'authed' || !user || adopted.current !== user.id || user.language === lang) return;
    api.updateMe({ language: lang }).then(setUser).catch(() => undefined);
  }, [lang, status, user, api, setUser]);
  return null;
}

export function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: (n, e) => n < 2 && (e as { status?: number }).status === 0, refetchOnWindowFocus: false } } });
}
export { QueryClientProvider };
