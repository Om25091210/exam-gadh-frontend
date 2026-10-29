'use client';
import { Alert, Button, Field, Input, Spinner } from '@eg/ui';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

export default function SetupPage() {
  const { api, pre, phase, completeSignIn } = useAdmin();
  const router = useRouter();
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [csrf, setCsrf] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase === 'authed' && !codes) router.replace('/dashboard');
    else if (phase === 'anon' && !pre) router.replace('/login');
  }, [phase, pre, router, codes]);

  useEffect(() => {
    if (!pre || pre.mfaEnrolled || setup) return;
    let alive = true;
    api.totpSetup().then(async (r) => {
      const qr = await QRCode.toDataURL(r.otpauthUri, { margin: 1, width: 220 });
      if (alive) setSetup({ secret: r.secret, qr });
    }).catch((e) => alive && setError(adminErrorText(e)));
    return () => { alive = false; };
  }, [api, pre, setup]);

  const enable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.totpEnable(code.replace(/\s/g, ''));
      setCodes(r.recoveryCodes);
      setCsrf(r.csrfToken);
    } catch (err) {
      setError(adminErrorText(err));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    const me = await completeSignIn(csrf!);
    router.replace(me.mustChangePassword ? '/account/password' : '/dashboard');
  };

  if (codes) {
    return (
      <AuthCard title="Save your recovery codes" subtitle="If you lose your phone, each of these codes lets you sign in once. They are shown only now.">
        <ul className="grid grid-cols-2 gap-2 rounded-xl bg-black/5 p-3 font-mono text-sm">{codes.map((c) => <li key={c}>{c}</li>)}</ul>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="size-5 accent-primary-700" checked={saved} onChange={(e) => setSaved(e.target.checked)} />I have saved these codes somewhere safe</label>
        <Button className="w-full" disabled={!saved} onClick={() => void finish()}>Continue</Button>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Set up two-factor sign-in" subtitle="Scan this with an authenticator app (Google Authenticator, Authy, 1Password…), then enter the 6-digit code.">
      {!setup ? <Spinner /> : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="QR code for your authenticator app" width={220} height={220} className="mx-auto rounded-lg border border-line" />
          <details className="text-sm"><summary className="cursor-pointer text-primary-700 underline">Cannot scan? Enter the key by hand</summary><p className="mt-2 break-all rounded-lg bg-black/5 p-2 font-mono">{setup.secret}</p></details>
          <form className="space-y-4" onSubmit={enable}>
            <Field label="6-digit code">{(p) => <Input {...p} inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={7} />}</Field>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Button type="submit" className="w-full" loading={busy}>Turn on two-factor</Button>
          </form>
        </>
      )}
      {!setup && error ? <Alert tone="danger">{error}</Alert> : null}
    </AuthCard>
  );
}
