'use client';
import { I18nProvider } from '@eg/i18n';
import { ToastProvider } from '@eg/ui';
import { useState, type ReactNode } from 'react';
import { AdminAuthProvider, makeQueryClient, QueryClientProvider } from './auth';

/** The admin interface is in English; question content is edited in both languages. */
export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(makeQueryClient);
  return (
    <I18nProvider initial="en" persist={false}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <AdminAuthProvider>{children}</AdminAuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
