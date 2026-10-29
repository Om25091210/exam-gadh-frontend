'use client';
import { Badge, Button, EmptyState, ErrorState, Input, PageHeader, Pagination, Skeleton } from '@eg/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { FilterSelect, useUrlFilters } from '@/components/data-bits';
import { useAdmin } from '@/lib/auth';
import { fmtDateTime } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

function AuditInner() {
  const { api } = useAdmin();
  const f = useUrlFilters<Record<string, string | undefined>>();
  const [action, setAction] = useState(f.get('action'));
  const filters = { page: f.page, pageSize: 30, action: f.get('action') || undefined, actorType: f.get('actorType') || undefined, targetType: f.get('targetType') || undefined };
  const q = useQuery({ queryKey: ['audit', filters], queryFn: () => api.audit(filters), placeholderData: keepPreviousData });
  const set = (p: Record<string, string | undefined>) => f.set(p, '/audit');
  return (
    <>
      <PageHeader title="Audit log" subtitle="Who did what, and when. Passwords, tokens and secrets are never stored here." />
      <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ action: action.trim() || undefined }); }}>
        <label className="sr-only" htmlFor="a-action">Action starts with</label>
        <Input id="a-action" placeholder="Action starts with, e.g. question. or test.published" value={action} onChange={(e) => setAction(e.target.value)} />
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <FilterSelect id="a-type" label="Anyone" value={f.get('actorType')} onChange={(v) => set({ actorType: v })} options={[['admin', 'Staff'], ['user', 'Students'], ['system', 'System']]} />
        <FilterSelect id="a-target" label="Any object" value={f.get('targetType')} onChange={(v) => set({ targetType: v })} options={[['question', 'Question'], ['test', 'Test'], ['user', 'Student'], ['order', 'Order'], ['setting', 'Setting'], ['admin', 'Staff account']]} />
      </div>
      {q.isLoading ? <Skeleton className="h-64" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : q.data.items.length === 0 ? <EmptyState title="Nothing logged for these filters" /> : (
        <>
          <ul className="space-y-2">
            {q.data.items.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2"><Badge tone={r.actorType === 'admin' ? 'info' : r.actorType === 'user' ? 'success' : 'neutral'}>{r.actorType}</Badge><span className="font-mono text-sm font-semibold">{r.action}</span><span className="ml-auto text-sm text-ink-500">{fmtDateTime(r.createdAt)}</span></div>
                <p className="mt-1 break-all text-sm text-ink-700">by {r.actor}{r.target ? ` · on ${r.targetType ?? ''} ${r.target}` : ''}{r.ip ? ` · ${r.ip}` : ''}</p>
                {r.before != null || r.after != null || r.meta != null ? (
                  <details className="mt-1 text-sm"><summary className="cursor-pointer text-primary-700">Details</summary><pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-black/5 p-2 text-xs">{JSON.stringify({ before: r.before, after: r.after, meta: r.meta }, null, 2)}</pre></details>
                ) : null}
              </li>
            ))}
          </ul>
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => f.set({ page: String(p) }, '/audit')} />
        </>
      )}
    </>
  );
}
export default function AuditPage() {
  return <Suspense><AuditInner /></Suspense>;
}
