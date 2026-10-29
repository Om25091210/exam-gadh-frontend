'use client';
import { createAdminApi, createHttp, type AdminApi, type AdminMe } from '@eg/api';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Phase = 'loading' | 'anon' | 'authed';
interface Pre {
  mfaEnrolled: boolean;
  mustChangePassword: boolean;
}
interface Ctx {
  phase: Phase;
  me: AdminMe | null;
  /** set between "password accepted" and "2FA done" */
  pre: Pre | null;
  api: AdminApi;
  can: (permission: string) => boolean;
  /** why the session ended, for a message on the login page */
  endedReason: string | null;
  login: (email: string, password: string) => Promise<Pre>;
  /** after 2FA / 2FA enrolment succeeded: load the profile and enter the app */
  completeSignIn: (csrfToken: string) => Promise<AdminMe>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  setCsrf: (t: string) => void;
}
const AuthCtx = createContext<Ctx | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [me, setMe] = useState<AdminMe | null>(null);
  const [pre, setPre] = useState<Pre | null>(null);
  const [endedReason, setEnded] = useState<string | null>(null);
  const csrf = useRef<string | null>(null);
  const qc = useQueryClient();

  const api = useMemo(
    () =>
      createAdminApi(
        createHttp({
          getCsrfToken: () => csrf.current,
          credentials: 'same-origin',
          onSessionEnded: (code) => {
            csrf.current = null;
            setMe(null);
            setPre(null);
            setEnded(code);
            setPhase('anon');
          },
        }),
      ),
    [],
  );

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((m) => {
        if (!alive) return;
        csrf.current = m.csrfToken;
        setMe(m);
        setPhase('authed');
      })
      .catch(() => alive && setPhase((p) => (p === 'loading' ? 'anon' : p)));
    return () => {
      alive = false;
    };
  }, [api]);

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await api.login(email, password);
      csrf.current = r.csrfToken;
      const p = { mfaEnrolled: r.mfaEnrolled, mustChangePassword: r.mustChangePassword };
      setPre(p);
      setEnded(null);
      return p;
    },
    [api],
  );

  const completeSignIn = useCallback(
    async (csrfToken: string) => {
      csrf.current = csrfToken;
      const m = await api.me();
      csrf.current = m.csrfToken;
      setMe(m);
      setPre(null);
      setPhase('authed');
      return m;
    },
    [api],
  );

  const refreshMe = useCallback(async () => {
    const m = await api.me();
    csrf.current = m.csrfToken;
    setMe(m);
  }, [api]);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    csrf.current = null;
    qc.clear();
    setMe(null);
    setPre(null);
    setPhase('anon');
  }, [api, qc]);

  const value = useMemo<Ctx>(
    () => ({ phase, me, pre, api, can: (p) => !!me?.permissions.includes(p), endedReason, login, completeSignIn, refreshMe, logout, setCsrf: (t) => (csrf.current = t) }),
    [phase, me, pre, api, endedReason, login, completeSignIn, refreshMe, logout],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAdmin() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAdmin must be used inside <AdminAuthProvider>');
  return c;
}
export const useAdminApi = () => useAdmin().api;

export function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: false, refetchOnWindowFocus: false } } });
}
export { QueryClientProvider };
