import { describe, expect, it, vi } from 'vitest';
import { ApiError, buildUrl, createHttp } from './client';

const json = (status: number, body: unknown) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const errBody = (code: string, message = 'x') => ({ error: { code, message } });

describe('buildUrl', () => {
  it('adds the /v1 prefix and skips empty query values', () => {
    expect(buildUrl('', '/tests', { page: 2, kind: undefined, q: '', access: 'free' })).toBe('/v1/tests?page=2&access=free');
    expect(buildUrl('https://api.x', '/me')).toBe('https://api.x/v1/me');
  });
});

describe('createHttp', () => {
  it('sends the bearer token, client id and JSON body', async () => {
    const f = vi.fn().mockResolvedValue(json(200, { ok: true }));
    const http = createHttp({ getAccessToken: () => 'tok', clientId: 'tab-1', fetchImpl: f });
    await http.post('/x', { a: 1 });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('/v1/x');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok', 'X-Client-Id': 'tab-1', 'Content-Type': 'application/json' });
    expect(init.body).toBe('{"a":1}');
  });

  it('turns an error body into ApiError with the stable code', async () => {
    const http = createHttp({ fetchImpl: vi.fn().mockResolvedValue(json(403, errBody('PAYMENT_REQUIRED', 'Plan needed'))) });
    await expect(http.get('/tests/1')).rejects.toMatchObject({ status: 403, code: 'PAYMENT_REQUIRED', message: 'Plan needed' });
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    const f = vi.fn().mockResolvedValueOnce(json(401, errBody('UNAUTHENTICATED'))).mockResolvedValueOnce(json(200, { n: 1 }));
    const refresh = vi.fn().mockResolvedValue('new');
    const http = createHttp({ getAccessToken: () => 'old', refresh, fetchImpl: f });
    expect(await http.get('/me')).toEqual({ n: 1 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[1][1].headers.Authorization).toBe('Bearer new');
  });

  it('signs out without refreshing when the session was replaced by another device', async () => {
    const onSessionEnded = vi.fn();
    const refresh = vi.fn();
    const http = createHttp({ refresh, onSessionEnded, fetchImpl: vi.fn().mockResolvedValue(json(401, errBody('SESSION_REPLACED'))) });
    await expect(http.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(refresh).not.toHaveBeenCalled();
    expect(onSessionEnded).toHaveBeenCalledWith('SESSION_REPLACED');
  });

  it('signs out when refreshing fails', async () => {
    const onSessionEnded = vi.fn();
    const http = createHttp({ refresh: async () => null, onSessionEnded, fetchImpl: vi.fn().mockResolvedValue(json(401, errBody('UNAUTHENTICATED'))) });
    await expect(http.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(onSessionEnded).toHaveBeenCalledWith('UNAUTHENTICATED');
  });

  it('reports a network failure as status 0 and 204 as undefined', async () => {
    await expect(createHttp({ fetchImpl: vi.fn().mockRejectedValue(new TypeError('failed')) }).get('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
    expect(await createHttp({ fetchImpl: vi.fn().mockResolvedValue(json(204, null)) }).delete('/x')).toBeUndefined();
  });

  it('adds the CSRF header to writes only', async () => {
    const f = vi.fn().mockImplementation(async () => json(200, {}));
    const http = createHttp({ getCsrfToken: () => 'csrf', fetchImpl: f });
    await http.get('/a');
    await http.post('/b');
    expect(f.mock.calls[0][1].headers['X-CSRF-Token']).toBeUndefined();
    expect(f.mock.calls[1][1].headers['X-CSRF-Token']).toBe('csrf');
  });
});
