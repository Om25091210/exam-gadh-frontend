'use client';
import { useI18n } from '@eg/i18n';
import { Alert, HeroIllustration, LanguageToggle, Spinner } from '@eg/ui';
import { BarChart3, ClipboardCheck, MessageCircleQuestion } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { GOOGLE_CLIENT_ID, GoogleButton } from '@/components/google-button';
import { useAuth } from '@/lib/auth';
import { safeNext } from '@/lib/safe-next';
import type { MessageKey } from '@eg/i18n';

const ERROR_KEY: Record<string, MessageKey> = { ACCOUNT_SUSPENDED: 'auth.suspended', ACCOUNT_DELETED: 'auth.deleted' };

function LoginInner() {
  const { t } = useI18n();
  const { status, signIn, endedCode } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<MessageKey | null>(null);
  const next = safeNext(params.get('next'));

  useEffect(() => {
    if (status === 'authed') router.replace(next);
  }, [status, next, router]);

  const onCredential = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setError(null);
      try {
        const r = await signIn(idToken);
        if (r.endedOtherSession) setInfo('auth.endedOther');
      } catch (e) {
        setError(ERROR_KEY[(e as { code?: string }).code ?? ''] ?? 'auth.failed');
        setBusy(false);
      }
    },
    [signIn],
  );

  const configured = GOOGLE_CLIENT_ID.length > 0;
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-5xl items-center gap-8 px-4 py-8 md:grid-cols-2">
      <section className="order-2 hidden md:order-1 md:block">
        <div className="bg-hero relative overflow-hidden rounded-[2rem] p-8 text-white shadow-[var(--shadow-lift)]">
          <HeroIllustration className="mx-auto max-w-sm" />
          <ul className="mt-4 space-y-3">
            {([['auth.feat.tests', ClipboardCheck], ['auth.feat.analytics', BarChart3], ['auth.feat.doubts', MessageCircleQuestion]] as const).map(([k, Icon]) => (
              <li key={k} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <Icon className="size-5 shrink-0 text-accent-100" aria-hidden />
                <span className="font-medium">{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="order-1 mx-auto flex w-full max-w-md flex-col items-center gap-6 md:order-2">
        <div className="self-end">
          <LanguageToggle />
        </div>
        <Image src="/logo.png" alt="ExamGadh" width={140} height={140} priority className="mix-blend-multiply" />
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('auth.title')}</h1>
          <p className="mt-2 text-ink-500">{t('auth.subtitle')}</p>
        </div>
        <div className="flex w-full flex-col gap-3 rounded-[1.5rem] border border-line/80 bg-surface p-5 shadow-card">
          {endedCode === 'SESSION_REPLACED' ? <Alert tone="warning">{t('auth.sessionEnded')}</Alert> : null}
          {endedCode === 'ACCOUNT_SUSPENDED' ? <Alert tone="danger">{t('auth.suspended')}</Alert> : null}
          {info ? <Alert tone="info">{t(info)}</Alert> : null}
          {error ? <Alert tone="danger">{t(error)}</Alert> : null}
          {!configured ? <Alert tone="warning">{t('auth.notConfigured')}</Alert> : busy ? <Spinner className="justify-center" /> : <GoogleButton onCredential={onCredential} onLoadError={() => setError('auth.failed')} />}
        </div>
        <p className="text-center text-sm text-ink-500">{t('auth.single')}</p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
