import { NextRequest, NextResponse } from 'next/server';
import { callBackend, clearRefreshCookie, clientIp, errorJson, sameOrigin } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

/** Ends the backend session (if the access token is still valid) and always clears the cookie. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return errorJson(403, 'BAD_ORIGIN', 'Cross-site request refused');
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    await callBackend('/auth/logout', { token: auth.slice(7), ip: clientIp(req) }).catch(() => undefined);
  }
  const out = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  clearRefreshCookie(out);
  return out;
}
