import { NextRequest, NextResponse } from 'next/server';
import { callBackend, clientIp, errorJson, passError, sameOrigin, setRefreshCookie } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

/** Google ID token -> backend session. The refresh token goes into an httpOnly cookie; JavaScript only gets the short-lived access token. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return errorJson(403, 'BAD_ORIGIN', 'Cross-site request refused');
  const b = (await req.json().catch(() => null)) as { idToken?: unknown; deviceId?: unknown; deviceName?: unknown } | null;
  if (!b || typeof b.idToken !== 'string' || typeof b.deviceId !== 'string') return errorJson(400, 'VALIDATION_FAILED', 'idToken and deviceId are required');
  let res: Response;
  try {
    res = await callBackend('/auth/google', { body: { idToken: b.idToken, deviceId: b.deviceId, platform: 'web', deviceName: typeof b.deviceName === 'string' ? b.deviceName.slice(0, 120) : undefined }, ip: clientIp(req) });
  } catch {
    return errorJson(502, 'API_UNREACHABLE', 'The server is not reachable');
  }
  if (!res.ok) return passError(res);
  const { refreshToken, ...rest } = (await res.json()) as { refreshToken: string } & Record<string, unknown>;
  const out = NextResponse.json(rest, { headers: { 'Cache-Control': 'no-store' } });
  setRefreshCookie(out, refreshToken);
  return out;
}
