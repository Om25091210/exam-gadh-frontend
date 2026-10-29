'use client';
import { Badge, EmptyState, ErrorState, Input, PageHeader, Pagination, Skeleton, Stat, Table, Button } from '@eg/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { FilterSelect, useUrlFilters } from '@/components/data-bits';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { fmtDateTime } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

function DoubtsInner() {
  const { api } = useAdmin();
  const f = useUrlFilters<Record<string, string | undefined>>();
  const [search, setSearch] = useState(f.get('q'));
  const filters = { page: f.page, status: f.get('status') || undefined, sla: f.get('sla') || undefined, abuse: f.get('abuse') || undefined, q: f.get('q') || undefined };
  const stats = useQuery({ queryKey: ['doubt-stats'], queryFn: () => api.adminDoubtStats(30), refetchInterval: 120_000 });
  const q = useQuery({ queryKey: ['admin-doubts', filters], queryFn: () => api.adminDoubts(filters), placeholderData: keepPreviousData, refetchInterval: 60_000 });
  const set = (p: Record<string, string | undefined>) => f.set(p, '/doubts');
  const s = stats.data;
  return (
    <>
      <PageHeader title="Doubts" subtitle="Answer within the deadline. The list is sorted by who is closest to (or past) their deadline." />
      {s ? (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Waiting" value={s.byStatus.open ?? 0} />
          <Stat label="Past deadline" value={s.overdue} tone={s.overdue ? 'bad' : undefined} />
          <Stat label="Due within 6 h" value={s.dueSoon} />
          <Stat label="Median first reply" value={s.medianFirstResponseHours == null ? '—' : `${s.medianFirstResponseHours} h`} hint={s.withinSlaPct == null ? undefined : `${s.withinSlaPct}% within the deadline`} />
          <Stat label="Average rating" value={s.avgRating ?? '—'} hint={`${s.ratings} ratings, last 30 days`} />
        </div>
      ) : null}
      <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ q: search.trim().length >= 2 ? search.trim() : undefined }); }}>
        <label htmlFor="d-q" className="sr-only">Search doubts</label>
        <Input id="d-q" type="search" placeholder="Search text, name or e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <FilterSelect id="d-status" label="Any status" value={f.get('status')} onChange={(v) => set({ status: v })} options={[['open', 'Waiting'], ['answered', 'Answered'], ['closed', 'Closed']]} />
        <FilterSelect id="d-sla" label="Any deadline" value={f.get('sla')} onChange={(v) => set({ sla: v })} options={[['overdue', 'Past deadline'], ['due_soon', 'Due within 6 hours']]} />
        <FilterSelect id="d-abuse" label="Abuse flag" value={f.get('abuse')} onChange={(v) => set({ abuse: v })} options={[['true', 'Flagged'], ['false', 'Not flagged']]} />
      </div>
      {q.isLoading ? <Skeleton className="h-64" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <>
          <Table caption="Doubts" empty={<EmptyState title="No doubts match" />}
            columns={[{ key: 'd', header: 'Deadline' }, { key: 'st', header: 'Status' }, { key: 'who', header: 'Student' }, { key: 'p', header: 'Doubt' }, { key: 'f', header: '' }]}
            rows={q.data.items.map((d) => ({ key: d.id, cells: { d: <span className={d.overdue ? 'font-bold text-danger-600' : ''}>{fmtDateTime(d.slaDueAt)}{d.overdue ? ' (late)' : ''}</span>, st: <StatusBadge status={d.status} />, who: d.student.name, p: <Link href={`/doubts/${d.id}`} className="line-clamp-2 max-w-md text-primary-700 underline">{d.preview}</Link>, f: <span className="flex gap-1">{d.reopened ? <Badge tone="info">reopened</Badge> : null}{d.abuse ? <Badge tone="danger">abuse</Badge> : null}{d.rating ? <Badge>★ {d.rating}</Badge> : null}</span> } }))} />
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => f.set({ page: String(p) }, '/doubts')} />
        </>
      )}
    </>
  );
}
export default function DoubtsPage() {
  return <Suspense><DoubtsInner /></Suspense>;
}
