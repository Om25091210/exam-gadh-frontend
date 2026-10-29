'use client';
import { Spinner } from '@eg/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AdminShell } from '@/components/shell/admin-shell';
import { useAdmin } from '@/lib/auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { phase, me } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (phase === 'anon') router.replace('/login');
    // a temporary password must be changed before anything else
    if (phase === 'authed' && me?.mustChangePassword && pathname !== '/account/password') router.replace('/account/password');
  }, [phase, me, pathname, router]);
  if (phase !== 'authed') return <div className="grid min-h-dvh place-items-center"><Spinner /></div>;
  return <AdminShell>{children}</AdminShell>;
}
