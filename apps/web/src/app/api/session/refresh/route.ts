import { NextRequest, NextResponse } from 'next/server';
import { callBackend, clearRefreshCookie, clientIp, errorJson, passError, REFRESH_COOKIE, sameOrigin, setRefreshCookie } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

/** Trades the httpOnly refresh cookie for a new access token (and rotates the refresh token). */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return errorJson(403, 'BAD_ORIGIN', 'Cross-site request refused');
  const token = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!token) return errorJson(401, 'NO_SESSION', 'Not signed in');
  let res: Response;
  try {
    res = await callBackend('/auth/refresh', { body: { refreshToken: token }, ip: clientIp(req) });
  } catch {
    return errorJson(502, 'API_UNREACHABLE', 'The server is not reachable'); // keep the cookie: the network may just be down
  }
  if (!res.ok) {
    const out = await passError(res);
    if (res.status === 401) clearRefreshCookie(out);
    return out;
  }
  const { refreshToken, ...rest } = (await res.json()) as { refreshToken: string } & Record<string, unknown>;
  const out = NextResponse.json(rest, { headers: { 'Cache-Control': 'no-store' } });
  setRefreshCookie(out, refreshToken);
  return out;
}
