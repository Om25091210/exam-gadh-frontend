import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ServiceWorkerRegistration } from '@/components/service-worker';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'ExamGadh — CGPSC & Vyapam prep', template: '%s · ExamGadh' },
  description: 'Mock tests, previous year papers, current affairs and notes for CGPSC and Vyapam exams, in Hindi and English.',
  applicationName: 'ExamGadh',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0e6350' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <body>
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
