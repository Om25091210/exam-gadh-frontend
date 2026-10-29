import { NextRequest, NextResponse } from 'next/server';

export const API_URL = process.env.API_URL ?? 'http://localhost:4000';
export const REFRESH_COOKIE = 'eg_rt';
const MAX_AGE_SEC = 30 * 24 * 3600; // matches the backend's REFRESH_TTL_DAYS default

/** The browser sends Origin on POSTs; refuse a mismatched one (defence in depth on top of SameSite=Lax). */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin GET-less fetches from older browsers
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}

export async function callBackend(path: string, init: { method?: string; body?: unknown; token?: string; ip?: string | null }): Promise<Response> {
  return fetch(`${API_URL}/v1${path}`, {
    method: init.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...(init.ip ? { 'X-Forwarded-For': init.ip } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
}

export function clientIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
}

export function setRefreshCookie(res: NextResponse, token: string) {
  res.cookies.set(REFRESH_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/session', maxAge: MAX_AGE_SEC });
}

export function clearRefreshCookie(res: NextResponse) {
  res.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/session', maxAge: 0 });
}

export const errorJson = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Passes the backend's error body through unchanged so the client sees the stable `error.code`. */
export async function passError(res: Response): Promise<NextResponse> {
  let body: unknown = { error: { code: `HTTP_${res.status}`, message: res.statusText } };
  try {
    body = await res.json();
  } catch {
    /* keep the generic body */
  }
  return NextResponse.json(body, { status: res.status, headers: { 'Cache-Control': 'no-store' } });
}
