import type { LoginResult, RefreshResult, User } from '@eg/api';

/**
 * Browser side of the session. The refresh token lives in an httpOnly cookie (see app/api/session/*);
 * this module only holds the short-lived access token, in memory.
 *
 * Several tabs share one session. A refresh token can be used once, so two tabs refreshing at the same moment would
 * look like token theft and sign the student out. A Web Lock makes tabs refresh one at a time, and a BroadcastChannel
 * hands the new access token to the other tabs so they do not refresh again.
 */
interface Token {
  value: string;
  expiresAt: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let token: Token | null = null;
let endedCode: string | null = null;
let inflight: Promise<string | null> | null = null;

const SAFETY_MS = 60_000;
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('eg-session') : null;

function emit() {
  listeners.forEach((l) => l());
}
export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function setToken(t: Token | null, broadcast: boolean) {
  token = t;
  if (broadcast && channel) channel.postMessage(t ? { type: 'token', ...t } : { type: 'cleared' });
  emit();
}

channel?.addEventListener('message', (e: MessageEvent) => {
  const m = e.data as { type: string; value?: string; expiresAt?: number; code?: string };
  if (m.type === 'token' && m.value && m.expiresAt) setToken({ value: m.value, expiresAt: m.expiresAt }, false);
  if (m.type === 'cleared') setToken(null, false);
});

export const getAccessToken = () => (token && token.expiresAt > Date.now() ? token.value : null);
export const tokenExpiresAt = () => token?.expiresAt ?? null;
export const sessionEndedCode = () => endedCode;
export const clearEnded = () => {
  endedCode = null;
};

const fromResult = (r: { accessToken: string; expiresIn: number }): Token => ({ value: r.accessToken, expiresAt: Date.now() + r.expiresIn * 1000 });

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  return locks ? locks.request('eg-refresh', fn) : fn();
}

export type RefreshOutcome = { ok: true; token: string } | { ok: false; code: string; network: boolean };
let lastFailure: { code: string; network: boolean } | null = null;
export const lastRefreshFailure = () => lastFailure;

/** One refresh at a time, per tab (single flight) and across tabs (lock). Returns null when the session is over. */
export function refreshAccessToken(): Promise<string | null> {
  inflight ??= withLock(async () => {
    // another tab may have refreshed while we waited for the lock
    if (token && token.expiresAt - Date.now() > SAFETY_MS) return token.value;
    let res: Response;
    try {
      res = await fetch('/api/session/refresh', { method: 'POST', cache: 'no-store' });
    } catch {
      lastFailure = { code: 'NETWORK', network: true };
      return null;
    }
    if (res.ok) {
      const body = (await res.json()) as RefreshResult;
      lastFailure = null;
      setToken(fromResult(body), true);
      return body.accessToken;
    }
    const code = (await res.json().catch(() => null))?.error?.code ?? `HTTP_${res.status}`;
    lastFailure = { code, network: res.status >= 500 };
    if (res.status === 401) setToken(null, true);
    return null;
  }).finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function signInWithGoogle(idToken: string, deviceId: string, deviceName?: string): Promise<LoginResult> {
  const res = await fetch('/api/session/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, deviceId, deviceName }), cache: 'no-store' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(body?.error?.message ?? 'Sign-in failed'), { code: body?.error?.code ?? `HTTP_${res.status}`, status: res.status });
  endedCode = null;
  setToken(fromResult(body), true);
  return body as LoginResult;
}

export async function signOut(): Promise<void> {
  const t = getAccessToken();
  setToken(null, true);
  await fetch('/api/session/logout', { method: 'POST', headers: t ? { Authorization: `Bearer ${t}` } : {}, cache: 'no-store' }).catch(() => undefined);
}

/** The server ended this session (another device signed in, suspended…). */
export function markSessionEnded(code: string) {
  endedCode = code;
  setToken(null, true);
}

export type { User };
