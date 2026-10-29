'use client';
import { Alert, Button, Field, Input } from '@eg/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

export default function LoginPage() {
  const { phase, login, endedReason } = useAdmin();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase === 'authed') router.replace('/dashboard');
  }, [phase, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await login(email.trim(), password);
      router.push(r.mfaEnrolled ? '/login/mfa' : '/login/setup');
    } catch (err) {
      setError(adminErrorText(err));
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="Staff only. You will be asked for a two-factor code next.">
      {endedReason ? <Alert tone="warning">Your session ended. Please sign in again.</Alert> : null}
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Email">{(p) => <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}</Field>
        <Field label="Password">{(p) => <Input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}</Field>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Button type="submit" className="w-full" loading={busy}>Continue</Button>
      </form>
    </AuthCard>
  );
}
