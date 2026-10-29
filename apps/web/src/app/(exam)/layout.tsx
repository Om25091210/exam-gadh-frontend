'use client';
import { Spinner } from '@eg/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

/** The exam hall has no app chrome (no nav, no distractions), but still needs a signed-in student. */
export default function ExamLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (status === 'anon') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);
  if (status !== 'authed') return <div className="grid min-h-dvh place-items-center"><Spinner /></div>;
  return <>{children}</>;
}
