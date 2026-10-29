/** Error body the backend always returns: `{ error: { code, message, details? } }`. Clients switch on `code`. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
  /** The server was never reached (offline, DNS, CORS…). */
  get isNetwork() {
    return this.status === 0;
  }
}

/** 401 codes that mean the sign-in is over for good (refreshing will not help). */
export const SESSION_END_CODES = ['SESSION_REPLACED', 'SESSION_REVOKED', 'ACCOUNT_SUSPENDED', 'SESSION_EXPIRED', 'REFRESH_REUSE', 'INVALID_REFRESH'] as const;

export interface HttpOptions {
  /** '' = same origin (the Next.js rewrite proxies /v1 to the API). */
  baseUrl?: string;
  getAccessToken?: () => string | null;
  /** Returns a fresh access token, or null when the session cannot be refreshed. Called at most once per 401. */
  refresh?: () => Promise<string | null>;
  onSessionEnded?: (code: string) => void;
  /** Admin: CSRF token header for writes. */
  getCsrfToken?: () => string | null;
  /** Identifies this browser tab (two tabs of one attempt must differ). */
  clientId?: string;
  credentials?: RequestCredentials;
  fetchImpl?: typeof fetch;
}

export type Query = Record<string, string | number | boolean | null | undefined>;
export interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** do not try to refresh/sign out on 401 (used by the refresh call itself) */
  noAuth?: boolean;
  keepalive?: boolean;
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  const s = qs.toString();
  return `${baseUrl}/v1${path}${s ? `?${s}` : ''}`;
}

export function createHttp(opts: HttpOptions = {}) {
  const doFetch = (...a: Parameters<typeof fetch>) => (opts.fetchImpl ?? fetch)(...a);

  async function once(method: Method, path: string, o: RequestOptions, token: string | null): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json', ...(o.headers ?? {}) };
    if (o.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token && !o.noAuth) headers.Authorization = `Bearer ${token}`;
    if (opts.clientId) headers['X-Client-Id'] = opts.clientId;
    if (method !== 'GET') {
      const csrf = opts.getCsrfToken?.();
      if (csrf) headers['X-CSRF-Token'] = csrf;
    }
    try {
      return await doFetch(buildUrl(opts.baseUrl ?? '', path, o.query), {
        method,
        headers,
        body: o.body === undefined ? undefined : JSON.stringify(o.body),
        signal: o.signal,
        credentials: opts.credentials ?? 'same-origin',
        keepalive: o.keepalive,
      });
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      throw new ApiError(0, 'NETWORK', 'Could not reach the server');
    }
  }

  async function parseError(res: Response): Promise<ApiError> {
    let body: { error?: { code?: string; message?: string; details?: unknown } } | null = null;
    try {
      body = await res.json();
    } catch {
      /* not JSON (proxy error page) */
    }
    return new ApiError(res.status, body?.error?.code ?? `HTTP_${res.status}`, body?.error?.message ?? res.statusText, body?.error?.details);
  }

  async function request<T>(method: Method, path: string, o: RequestOptions = {}): Promise<T> {
    let res = await once(method, path, o, opts.getAccessToken?.() ?? null);
    if (res.status === 401 && !o.noAuth) {
      const err = await parseError(res.clone());
      if ((SESSION_END_CODES as readonly string[]).includes(err.code)) {
        opts.onSessionEnded?.(err.code);
        throw err;
      }
      const fresh = opts.refresh ? await opts.refresh() : null;
      if (!fresh) {
        opts.onSessionEnded?.(err.code);
        throw err;
      }
      res = await once(method, path, o, fresh);
    }
    if (res.status === 204) return undefined as T;
    if (!res.ok) {
      const err = await parseError(res);
      if (res.status === 401 && !o.noAuth) opts.onSessionEnded?.(err.code);
      throw err;
    }
    return (await res.json()) as T;
  }

  return {
    request,
    get: <T>(path: string, query?: Query, o: Omit<RequestOptions, 'query' | 'body'> = {}) => request<T>('GET', path, { ...o, query }),
    post: <T>(path: string, body?: unknown, o: Omit<RequestOptions, 'body'> = {}) => request<T>('POST', path, { ...o, body: body ?? {} }),
    put: <T>(path: string, body?: unknown, o: Omit<RequestOptions, 'body'> = {}) => request<T>('PUT', path, { ...o, body: body ?? {} }),
    patch: <T>(path: string, body?: unknown, o: Omit<RequestOptions, 'body'> = {}) => request<T>('PATCH', path, { ...o, body: body ?? {} }),
    delete: <T>(path: string, body?: unknown, o: Omit<RequestOptions, 'body'> = {}) => request<T>('DELETE', path, { ...o, body }),
  };
}

export type Http = ReturnType<typeof createHttp>;
