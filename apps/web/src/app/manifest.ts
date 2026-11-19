import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ExamGadh — CGPSC & Vyapam prep',
    short_name: 'ExamGadh',
    description: 'Mock tests, previous year papers and current affairs for CGPSC and Vyapam exams, in Hindi and English.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#eef0f8',
    theme_color: '#5a3df0',
    lang: 'hi',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
