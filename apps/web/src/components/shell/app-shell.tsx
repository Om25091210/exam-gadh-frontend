'use client';
import { useI18n } from '@eg/i18n';
import { cn, LanguageToggle } from '@eg/ui';
import { Bell } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useApi } from '@/lib/auth';
import { isActive, NAV } from './nav';

function NotificationBell() {
  const { t } = useI18n();
  const api = useApi();
  const { data } = useQuery({ queryKey: ['notifications', 'unread'], queryFn: () => api.unreadCount(), refetchInterval: 60_000, staleTime: 30_000 });
  const n = data?.unread ?? 0;
  return (
    <Link href="/notifications" aria-label={n > 0 ? `${t('nav.notifications')} (${n})` : t('nav.notifications')} className="relative grid size-11 place-items-center rounded-xl hover:bg-black/5">
      <Bell className="size-6" aria-hidden />
      {n > 0 ? (
        <span aria-hidden className="absolute right-1.5 top-1.5 grid min-w-5 place-items-center rounded-full bg-danger-600 px-1 text-[11px] font-bold leading-5 text-white">
          {n > 9 ? '9+' : n}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3 focus:shadow-lg">
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary-800">
            <Image src="/logo.png" alt="" width={36} height={36} className="mix-blend-multiply" />
            <span className="hidden sm:inline">{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <NotificationBell />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4">
        <nav aria-label="Main" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 flex-col gap-1 py-4 md:flex">
          {NAV.map((n) => {
            const active = isActive(n, pathname);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold', active ? 'bg-primary-100 text-primary-800' : 'text-ink-700 hover:bg-black/5')}>
                <n.icon className="size-5" aria-hidden />
                {t(n.label)}
              </Link>
            );
          })}
        </nav>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 py-4 pb-28 md:pb-10">
          {children}
          <p className="mt-10 text-center text-xs text-ink-500">{t('footer.note')}</p>
        </main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map((n) => {
            const active = isActive(n, pathname);
            return (
              <li key={n.href}>
                <Link href={n.href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold', active ? 'text-primary-700' : 'text-ink-500')}>
                  <n.icon className={cn('size-6', active && 'stroke-[2.5]')} aria-hidden />
                  {t(n.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
