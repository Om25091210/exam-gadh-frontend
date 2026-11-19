import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ScreenCapture from 'expo-screen-capture';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { C } from '@/theme';
import { Loading } from '@/ui';

function Gate() {
  const { chosen } = useI18n();
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const first = segments[0] as string | undefined;

  useEffect(() => {
    if (chosen === null || status === 'loading') return;
    if (chosen === false && first !== 'language') router.replace('/language');
    else if (chosen && status === 'anon' && first !== 'login' && first !== 'language') router.replace('/login');
    else if (status === 'authed' && (first === 'login' || first === 'language')) router.replace('/');
  }, [chosen, status, first, router]);

  // no screenshots or screen recording anywhere in the app while signed in
  useEffect(() => {
    const on = status === 'authed';
    (on ? ScreenCapture.preventScreenCaptureAsync() : ScreenCapture.allowScreenCaptureAsync()).catch(() => undefined);
  }, [status]);

  if (chosen === null || status === 'loading') return <Loading />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: C.bg } }} />;
}

export default function Root() {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } } }));
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <I18nProvider>
        <QueryClientProvider client={qc}>
          <AuthProvider>
            <Gate />
          </AuthProvider>
        </QueryClientProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
