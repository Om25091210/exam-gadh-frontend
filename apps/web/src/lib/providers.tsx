'use client';
import { I18nProvider } from '@eg/i18n';
import { ToastProvider } from '@eg/ui';
import { useState, type ReactNode } from 'react';
import { LanguageGate } from '@/components/language-gate';
import { AuthProvider, LanguageSync, makeQueryClient, QueryClientProvider } from './auth';

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(makeQueryClient);
  return (
    <I18nProvider>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <AuthProvider>
            <LanguageSync />
            <LanguageGate>{children}</LanguageGate>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
