'use client';
import { Alert, Button, Card, Field, Input, PageHeader } from '@eg/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

export default function PasswordPage() {
  const { api, me, refreshMe } = useAdmin();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== again) return setError('The new passwords do not match.');
    setBusy(true);
    setError(null);
    try {
      await api.changePassword(current, next);
      await refreshMe();
      setDone(true);
      setCurrent(''); setNext(''); setAgain('');
      if (me?.mustChangePassword) router.replace('/dashboard');
    } catch (err) {
      setError(adminErrorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Change password" subtitle={me?.mustChangePassword ? 'You must choose a new password before you continue.' : 'Changing it signs you out on your other devices.'} />
      <Card className="max-w-md">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Current password">{(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />}</Field>
          <Field label="New password" hint="At least 12 characters; not your email or a common password.">{(p) => <Input {...p} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={12} />}</Field>
          <Field label="Repeat new password">{(p) => <Input {...p} type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />}</Field>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          {done ? <Alert tone="success">Password changed.</Alert> : null}
          <Button type="submit" loading={busy}>Change password</Button>
        </form>
      </Card>
    </>
  );
}
