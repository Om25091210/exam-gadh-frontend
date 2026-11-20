import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ScreenCapture from 'expo-screen-capture';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding';
import { C } from '@/theme';
import { Loading } from '@/ui';

function Gate() {
  const { chosen } = useI18n();
  const { done } = useOnboarding();
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const first = segments[0] as string | undefined;

  // First launch: language -> three intro pages -> sign in. After that: straight to the app (or sign in).
  useEffect(() => {
    if (chosen === null || done === null || status === 'loading') return;
    if (chosen === false) {
      if (first !== 'language') router.replace('/language');
    } else if (status === 'anon') {
      const want = done ? '/login' : '/onboarding';
      const at = first === 'onboarding' ? '/onboarding' : first === 'login' ? '/login' : null;
      if (at !== want) router.replace(want);
    } else if (status === 'authed' && (first === 'login' || first === 'language' || first === 'onboarding')) router.replace('/');
  }, [chosen, done, status, first, router]);

  // no screenshots or screen recording anywhere in the app while signed in
  useEffect(() => {
    const on = status === 'authed';
    (on ? ScreenCapture.preventScreenCaptureAsync() : ScreenCapture.allowScreenCaptureAsync()).catch(() => undefined);
  }, [status]);

  if (chosen === null || done === null || status === 'loading') return <Loading />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: C.bg } }} />;
}

export default function Root() {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } } }));
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <I18nProvider>
        <OnboardingProvider>
          <QueryClientProvider client={qc}>
            <AuthProvider>
              <Gate />
            </AuthProvider>
          </QueryClientProvider>
        </OnboardingProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
