'use client';
import { Alert, Button, Field, Input } from '@eg/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

export default function MfaPage() {
  const { api, pre, phase, completeSignIn } = useAdmin();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase === 'authed') router.replace('/dashboard');
    else if (phase === 'anon' && !pre) router.replace('/login');
  }, [phase, pre, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.mfa(useRecovery ? { recoveryCode: code.trim() } : { code: code.replace(/\s/g, '') });
      const me = await completeSignIn(r.csrfToken);
      router.replace(me.mustChangePassword ? '/account/password' : '/dashboard');
    } catch (err) {
      setError(adminErrorText(err));
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Two-factor code" subtitle={useRecovery ? 'Enter one of your recovery codes. Each works once.' : 'Open your authenticator app and enter the 6-digit code.'}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label={useRecovery ? 'Recovery code' : 'Code'}>
          {(p) => <Input {...p} inputMode={useRecovery ? 'text' : 'numeric'} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus maxLength={useRecovery ? 40 : 7} />}
        </Field>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button type="submit" className="w-full" loading={busy}>Sign in</Button>
        <button type="button" className="text-sm text-primary-700 underline" onClick={() => { setUseRecovery((u) => !u); setCode(''); setError(null); }}>
          {useRecovery ? 'Use my authenticator app' : 'Use a recovery code instead'}
        </button>
      </form>
    </AuthCard>
  );
}
