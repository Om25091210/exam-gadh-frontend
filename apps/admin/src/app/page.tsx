'use client';
import { Spinner } from '@eg/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdmin } from '@/lib/auth';

export default function Root() {
  const { phase } = useAdmin();
  const router = useRouter();
  useEffect(() => {
    if (phase === 'authed') router.replace('/dashboard');
    if (phase === 'anon') router.replace('/login');
  }, [phase, router]);
  return <div className="grid min-h-dvh place-items-center"><Spinner /></div>;
}
