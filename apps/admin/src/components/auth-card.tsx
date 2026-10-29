import Image from 'next/image';
import type { ReactNode } from 'react';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 py-10">
      <div className="w-full space-y-5 rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={48} height={48} className="mix-blend-multiply" />
          <div>
            <p className="text-sm font-semibold text-primary-800">ExamGadh Admin</p>
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
        </div>
        {subtitle ? <p className="text-ink-500">{subtitle}</p> : null}
        {children}
      </div>
    </main>
  );
}
