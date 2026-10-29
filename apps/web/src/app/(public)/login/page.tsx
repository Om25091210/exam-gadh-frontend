'use client';
import { useI18n } from '@eg/i18n';
import { Alert, LanguageToggle, Spinner } from '@eg/ui';
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="self-end">
        <LanguageToggle />
      </div>
      <Image src="/logo.png" alt="ExamGadh" width={160} height={160} priority className="mix-blend-multiply" />
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t('auth.title')}</h1>
        <p className="mt-2 text-ink-500">{t('auth.subtitle')}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        {endedCode === 'SESSION_REPLACED' ? <Alert tone="warning">{t('auth.sessionEnded')}</Alert> : null}
        {endedCode === 'ACCOUNT_SUSPENDED' ? <Alert tone="danger">{t('auth.suspended')}</Alert> : null}
        {info ? <Alert tone="info">{t(info)}</Alert> : null}
        {error ? <Alert tone="danger">{t(error)}</Alert> : null}
        {!configured ? <Alert tone="warning">{t('auth.notConfigured')}</Alert> : busy ? <Spinner className="justify-center" /> : <GoogleButton onCredential={onCredential} onLoadError={() => setError('auth.failed')} />}
      </div>
      <p className="text-center text-sm text-ink-500">{t('auth.single')}</p>
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
