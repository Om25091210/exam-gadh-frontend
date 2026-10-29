'use client';
import type { TestKindName } from '@eg/api';
import { Badge, buttonClasses, EmptyState, ErrorState, Input, Button, PageHeader, Pagination, Skeleton, Table } from '@eg/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { FilterSelect, useUrlFilters } from '@/components/data-bits';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';
import { fmtDateTime } from '@/lib/datetime';

const KINDS: Array<[string, string]> = [['mock', 'Full mock'], ['topic', 'Topic test'], ['subject', 'Subject test'], ['pyq', 'Previous year'], ['csat', 'CSAT'], ['sectional', 'Sectional'], ['daily', 'Daily'], ['live', 'Live'], ['diagnostic', 'Diagnostic']];

function TestsInner() {
  const { api, can } = useAdmin();
  const f = useUrlFilters<Record<string, string | undefined>>();
  const [search, setSearch] = useState(f.get('q'));
  const filters = { page: f.page, pageSize: 20, examId: f.get('exam') || undefined, kind: (f.get('kind') || undefined) as TestKindName | undefined, state: (f.get('state') || undefined) as 'draft' | 'published' | 'archived' | undefined, q: f.get('q') || undefined };
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });
  const q = useQuery({ queryKey: ['admin-tests', filters], queryFn: () => api.adminTests(filters), placeholderData: keepPreviousData });
  const set = (p: Record<string, string | undefined>) => f.set(p, '/tests');
  return (
    <>
      <PageHeader title="Tests" actions={can('test:write') ? <Link href="/tests/new" className={buttonClasses('primary')}>New test</Link> : undefined} />
      <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ q: search.trim().length >= 2 ? search.trim() : undefined }); }}>
        <label htmlFor="t-q" className="sr-only">Search tests</label>
        <Input id="t-q" type="search" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <FilterSelect id="t-exam" label="Any exam" value={f.get('exam')} onChange={(v) => set({ exam: v })} options={(tree.data?.exams ?? []).map((e) => [e.id, e.shortEn])} />
        <FilterSelect id="t-kind" label="Any type" value={f.get('kind')} onChange={(v) => set({ kind: v })} options={KINDS} />
        <FilterSelect id="t-state" label="Any state" value={f.get('state')} onChange={(v) => set({ state: v })} options={[['draft', 'Not published'], ['published', 'Published'], ['archived', 'Archived']]} />
      </div>
      {q.isLoading ? <Skeleton className="h-64" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <>
          <Table
            caption="Tests"
            empty={<EmptyState title="No tests match" />}
            columns={[{ key: 't', header: 'Test' }, { key: 'exam', header: 'Exam' }, { key: 'kind', header: 'Type' }, { key: 'access', header: 'Access' }, { key: 'state', header: 'State' }, { key: 'v', header: 'Latest version' }, { key: 'starts', header: 'Starts' }]}
            rows={q.data.items.map((t) => ({
              key: t.id,
              cells: {
                t: <Link href={`/tests/${t.id}`} className="font-semibold text-primary-700 underline">{t.titleEn}</Link>,
                exam: t.examId, kind: t.kind + (t.mode === 'live' ? ' (live)' : ''),
                access: <Badge tone={t.access === 'paid' ? 'warning' : 'info'}>{t.access}</Badge>,
                state: t.archived ? <Badge tone="danger">archived</Badge> : t.published ? <Badge tone="success">published</Badge> : <Badge>draft</Badge>,
                v: t.latestVersion ? `v${t.latestVersion.version} · ${t.latestVersion.status} · ${t.latestVersion.questionCount ?? 0} q` : '—',
                starts: t.latestVersion?.startsAt ? fmtDateTime(t.latestVersion.startsAt) : '—',
              },
            }))}
          />
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => f.set({ page: String(p) }, '/tests')} />
        </>
      )}
    </>
  );
}

export default function TestsPage() {
  return (
    <Suspense>
      <TestsInner />
    </Suspense>
  );
}
