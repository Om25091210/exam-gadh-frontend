'use client';
import { cn } from '@eg/ui';
import { LogOut, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAdmin } from '@/lib/auth';
import { isActive, visibleNav } from './nav';

export function AdminShell({ children }: { children: ReactNode }) {
  const { me, can, logout } = useAdmin();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = visibleNav(can);

  const nav = (
    <nav aria-label="Main" className="space-y-5 p-3">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const active = isActive(i.href, pathname);
              return (
                <li key={i.href}>
                  <Link href={i.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={cn('flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium', active ? 'bg-primary-100 text-primary-800' : 'text-ink-700 hover:bg-black/5')}>
                    <i.icon className="size-4 shrink-0" aria-hidden />
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3 focus:shadow-lg">Skip to content</a>
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-line bg-surface transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <Image src="/logo.png" alt="" width={32} height={32} className="mix-blend-multiply" />
          <span className="font-bold text-primary-800">ExamGadh Admin</span>
        </div>
        {nav}
      </aside>
      {open ? <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} /> : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur">
          <button type="button" className="grid size-10 place-items-center rounded-lg hover:bg-black/5 lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-right sm:block"><span className="block font-semibold">{me?.name}</span><span className="block text-xs text-ink-500">{me?.role.replace('_', ' ').toLowerCase()}</span></span>
            <Link href="/account/password" className="rounded-lg px-2 py-1 text-primary-700 underline">Password</Link>
            <button type="button" onClick={() => void logout()} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-semibold hover:bg-black/5"><LogOut className="size-4" aria-hidden />Sign out</button>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl p-4 pb-16">{children}</main>
      </div>
    </div>
  );
}
