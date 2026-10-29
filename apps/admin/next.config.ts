import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/** The admin app talks only to its own origin; `/v1/*` is proxied to the API, so the admin cookie is first-party and no CORS is needed. */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${isDev ? 'ws:' : ''} https://*.amazonaws.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@eg/ui', '@eg/api', '@eg/i18n'],
  async rewrites() {
    return [{ source: '/v1/:path*', destination: `${API_URL}/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
        ],
      },
    ];
  },
};

export default config;
