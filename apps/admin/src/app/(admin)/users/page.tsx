'use client';
import { Badge, Button, EmptyState, ErrorState, Input, PageHeader, Pagination, Skeleton, Table } from '@eg/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { FilterSelect, useUrlFilters } from '@/components/data-bits';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { fmtDate } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

function UsersInner() {
  const { api } = useAdmin();
  const f = useUrlFilters<Record<string, string | undefined>>();
  const [search, setSearch] = useState(f.get('q'));
  const filters = { page: f.page, pageSize: 25, q: f.get('q') || undefined, status: f.get('status') || undefined, paid: f.get('paid') || undefined, targetExam: f.get('exam') || undefined, sort: f.get('sort') || undefined };
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });
  const q = useQuery({ queryKey: ['users', filters], queryFn: () => api.users(filters), placeholderData: keepPreviousData });
  const set = (p: Record<string, string | undefined>) => f.set(p, '/users');
  return (
    <>
      <PageHeader title="Students" subtitle="Search by name or e-mail. Phone numbers and Google ids are never shown here." />
      <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ q: search.trim().length >= 2 ? search.trim() : undefined }); }}>
        <label htmlFor="u-q" className="sr-only">Search students</label>
        <Input id="u-q" type="search" placeholder="Name or e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <FilterSelect id="u-status" label="Any status" value={f.get('status')} onChange={(v) => set({ status: v })} options={[['active', 'Active'], ['suspended', 'Suspended']]} />
        <FilterSelect id="u-paid" label="Free and paid" value={f.get('paid')} onChange={(v) => set({ paid: v })} options={[['true', 'Paying'], ['false', 'Free']]} />
        <FilterSelect id="u-exam" label="Any target exam" value={f.get('exam')} onChange={(v) => set({ exam: v })} options={(tree.data?.exams ?? []).map((e) => [e.id, e.shortEn])} />
        <FilterSelect id="u-sort" label="Newest first" value={f.get('sort')} onChange={(v) => set({ sort: v })} options={[['oldest', 'Oldest first'], ['name', 'By name'], ['lastSeen', 'Recently active']]} />
      </div>
      {q.isLoading ? <Skeleton className="h-64" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <>
          <Table caption="Students" empty={<EmptyState title="No students match" />}
            columns={[{ key: 'n', header: 'Name' }, { key: 'e', header: 'E-mail' }, { key: 'x', header: 'Target' }, { key: 'd', header: 'District' }, { key: 'a', header: 'Attempts' }, { key: 'p', header: 'Plan' }, { key: 's', header: 'Status' }, { key: 'j', header: 'Joined' }]}
            rows={q.data.items.map((u) => ({ key: u.id, cells: { n: <Link href={`/users/${u.id}`} className="font-semibold text-primary-700 underline">{u.name}</Link>, e: u.email, x: u.targetExam ?? '—', d: u.district ?? '—', a: u.attempts, p: u.paid ? <Badge tone="success">paying</Badge> : <Badge>free</Badge>, s: <StatusBadge status={u.status} />, j: fmtDate(u.createdAt) } }))} />
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => f.set({ page: String(p) }, '/users')} />
          <p className="mt-2 text-sm text-ink-500">{q.data.total.toLocaleString('en-IN')} students</p>
        </>
      )}
    </>
  );
}
export default function UsersPage() {
  return <Suspense><UsersInner /></Suspense>;
}
