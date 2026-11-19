import { ApiError, createHttp, createStudentApi, type LoginResult, type Me, type RefreshResult } from '@eg/api';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { API_URL } from './config';

type Status = 'loading' | 'anon' | 'authed';
interface Ctx {
  status: Status;
  user: Me | null;
  api: ReturnType<typeof createStudentApi>;
  endedCode: string | null;
  signIn: (idToken: string) => Promise<LoginResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
const AuthCtx = createContext<Ctx | null>(null);

// Tokens live only in the OS keystore (refresh token) and in memory (15-minute access token).
const RT = 'eg_refresh';
const DEVICE = 'eg_device';
const safeGet = (k: string) => SecureStore.getItemAsync(k).catch(() => null);
const safeSet = (k: string, v: string) => SecureStore.setItemAsync(k, v).catch(() => undefined);
const safeDel = (k: string) => SecureStore.deleteItemAsync(k).catch(() => undefined);

async function deviceId(): Promise<string> {
  const have = await safeGet(DEVICE);
  if (have) return have;
  const made = `android-${Crypto.randomUUID()}`;
  await safeSet(DEVICE, made);
  return made;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<Me | null>(null);
  const [endedCode, setEnded] = useState<string | null>(null);
  const access = useRef<string | null>(null);
  const device = useRef<string>('');
  const inflight = useRef<Promise<string | null> | null>(null);

  const endSession = useCallback(async (code: string | null) => {
    access.current = null;
    await safeDel(RT);
    setUser(null);
    setEnded(code);
    setStatus('anon');
  }, []);

  /** Trades the stored refresh token for a new pair. One refresh at a time: a refresh token works only once. */
  const refresh = useCallback((): Promise<string | null> => {
    inflight.current ??= (async () => {
      try {
        const rt = await safeGet(RT);
        if (!rt) return null;
        const res = await fetch(`${API_URL}/v1/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) });
        if (res.status === 401) {
          await safeDel(RT);
          return null;
        }
        if (!res.ok) return null; // network or server trouble: keep the token for next time
        const r = (await res.json()) as RefreshResult;
        await safeSet(RT, r.refreshToken);
        access.current = r.accessToken;
        return r.accessToken;
      } catch {
        return null;
      } finally {
        setTimeout(() => (inflight.current = null), 0);
      }
    })();
    return inflight.current;
  }, []);

  const http = useMemo(
    () => createHttp({ baseUrl: API_URL, getAccessToken: () => access.current, refresh, onSessionEnded: (code) => void endSession(code), clientId: undefined }),
    [refresh, endSession],
  );
  const api = useMemo(() => createStudentApi(http), [http]);

  useEffect(() => {
    let alive = true;
    (async () => {
      device.current = await deviceId();
      const token = await refresh();
      if (!alive) return;
      if (!token) return setStatus('anon');
      try {
        const me = await api.me();
        if (alive) {
          setUser(me);
          setStatus('authed');
        }
      } catch (e) {
        if (alive) setStatus(e instanceof ApiError && e.isNetwork ? 'anon' : 'anon');
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, refresh]);

  const signIn = useCallback(
    async (idToken: string) => {
      const id = device.current || (await deviceId());
      const res = await fetch(`${API_URL}/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, deviceId: id, platform: 'android', deviceName: `${Platform.OS} ${Platform.Version}` }),
      });
      if (!res.ok) {
        let code = `HTTP_${res.status}`;
        let message = res.statusText;
        try {
          const j = (await res.json()) as { error?: { code?: string; message?: string } };
          code = j.error?.code ?? code;
          message = j.error?.message ?? message;
        } catch {
          /* not JSON */
        }
        throw new ApiError(res.status, code, message);
      }
      const r = (await res.json()) as LoginResult;
      access.current = r.accessToken;
      await safeSet(RT, r.refreshToken);
      setEnded(null);
      setUser(await api.me());
      setStatus('authed');
      return r;
    },
    [api],
  );

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* offline: still sign out here */
    }
    await endSession(null);
  }, [api, endSession]);

  const refreshUser = useCallback(async () => setUser(await api.me()), [api]);

  const value = useMemo<Ctx>(() => ({ status, user, api, endedCode, signIn, signOut, refreshUser }), [status, user, api, endedCode, signIn, signOut, refreshUser]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
