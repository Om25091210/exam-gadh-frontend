import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Content-Security-Policy. Inline scripts are allowed because Next.js emits inline bootstrap scripts;
 * a nonce-based policy is a tracked hardening item (docs/SECURITY.md). Everything else is an allow-list.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://accounts.google.com/gsi/client https://checkout.razorpay.com`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://accounts.google.com ${isDev ? 'ws:' : ''} https://*.amazonaws.com https://lumberjack.razorpay.com`,
  "frame-src https://accounts.google.com/gsi/ https://api.razorpay.com https://checkout.razorpay.com",
  "media-src 'self' blob: https:",
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
    // same-origin API: no CORS, and the browser only ever talks to this host
    return [{ source: '/v1/:path*', destination: `${API_URL}/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self), payment=(self "https://checkout.razorpay.com")' },
          // the Google sign-in popup needs window.opener access
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
        ],
      },
    ];
  },
};

export default config;
