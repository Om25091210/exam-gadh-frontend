'use client';
import type { SeriesRow } from '@eg/api';
import { Badge, Button, EmptyState, ErrorState, PageHeader, Skeleton, Table } from '@eg/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { EditDialog, type FieldSpec } from '@/components/schema-form';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const seriesFields = (exams: Array<[string, string]>): FieldSpec[] => [
  { key: 'examId', label: 'Exam', type: 'select', required: true, options: exams, createOnly: true },
  { key: 'titleEn', label: 'Title (English)', type: 'text', required: true },
  { key: 'titleHi', label: 'Title (Hindi)', type: 'text', required: true, lang: 'hi' },
  { key: 'descEn', label: 'Description (English)', type: 'textarea', rows: 3 },
  { key: 'descHi', label: 'Description (Hindi)', type: 'textarea', rows: 3, lang: 'hi' },
  { key: 'access', label: 'Access', type: 'select', required: true, options: [['free', 'Free'], ['paid', 'Paid']] },
  { key: 'sort', label: 'Order', type: 'number' },
];

export default function SeriesPage() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });
  const q = useQuery({ queryKey: ['admin-series'], queryFn: () => api.adminSeries() });
  return (
    <>
      <PageHeader title="Test series" subtitle="A series is an ordered set of tests students can join." actions={can('series:write') ? <Button onClick={() => setCreating(true)}>New series</Button> : undefined} />
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <Table
          caption="Series"
          empty={<EmptyState title="No series yet" />}
          columns={[{ key: 't', header: 'Series' }, { key: 'e', header: 'Exam' }, { key: 'a', header: 'Access' }, { key: 's', header: 'Status' }, { key: 'n', header: 'Tests' }]}
          rows={q.data.map((s: SeriesRow) => ({ key: s.id, cells: { t: <Link href={`/series/${s.id}`} className="font-semibold text-primary-700 underline">{s.titleEn}</Link>, e: s.examId, a: <Badge tone={s.access === 'paid' ? 'warning' : 'info'}>{s.access}</Badge>, s: <StatusBadge status={s.status} />, n: s._count?.items ?? '—' } }))}
        />
      )}
      {creating ? <EditDialog open recordKey="new" title="New series" fields={seriesFields((tree.data?.exams ?? []).map((e) => [e.id, e.shortEn]))} initial={{ access: 'paid', sort: 0 }} editing={false} onClose={() => setCreating(false)} onSave={async (v) => { await api.createSeries(v as Partial<SeriesRow>); setCreating(false); void qc.invalidateQueries({ queryKey: ['admin-series'] }); }} /> : null}
    </>
  );
}
