'use client';
import type { SeriesRow } from '@eg/api';
import { Alert, Button, Card, EmptyState, ErrorState, Input, PageHeader, Select, Skeleton, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EditDialog, type FieldSpec } from '@/components/schema-form';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const fields: FieldSpec[] = [
  { key: 'titleEn', label: 'Title (English)', type: 'text', required: true },
  { key: 'titleHi', label: 'Title (Hindi)', type: 'text', required: true, lang: 'hi' },
  { key: 'descEn', label: 'Description (English)', type: 'textarea', rows: 3 },
  { key: 'descHi', label: 'Description (Hindi)', type: 'textarea', rows: 3, lang: 'hi' },
  { key: 'access', label: 'Access', type: 'select', required: true, options: [['free', 'Free'], ['paid', 'Paid']] },
  { key: 'sort', label: 'Order', type: 'number' },
];

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: ['admin-series', id], queryFn: () => api.adminSeriesOne(id) });
  const titles = useQuery({ queryKey: ['admin-tests', 'lookup', search], queryFn: () => api.adminTests({ state: 'published', q: search.trim().length >= 2 ? search.trim() : undefined, pageSize: 20 }) });
  const [known, setKnown] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!q.data) return;
    setIds(q.data.items.map((i) => i.testId));
    setKnown((k) => ({ ...k, ...Object.fromEntries(q.data!.items.map((i) => [i.testId, i.test?.titleEn ?? i.testId])) }));
  }, [q.data]);
  useEffect(() => { if (titles.data) setKnown((k) => ({ ...k, ...Object.fromEntries(titles.data!.items.map((t) => [t.id, t.titleEn])) })); }, [titles.data]);

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['admin-series'] }); };
  const saveItems = useMutation({ mutationFn: () => api.setSeriesItems(id, ids), onSuccess: () => { toast.show('Tests saved', 'success'); refresh(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const setStatus = useMutation({ mutationFn: (s: 'draft' | 'published' | 'archived') => api.patchSeries(id, { status: s }), onSuccess: () => { toast.show('Status updated', 'success'); refresh(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} />;
  const s = q.data;
  const dirty = JSON.stringify(ids) !== JSON.stringify(s.items.map((i) => i.testId));
  const move = (i: number, d: -1 | 1) => setIds((x) => { const n = [...x]; const j = i + d; if (j < 0 || j >= n.length) return x; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const canWrite = can('series:write');

  return (
    <>
      <PageHeader title={s.titleEn} subtitle={s.titleHi} actions={<><StatusBadge status={s.status} />{canWrite ? <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit details</Button> : null}</>} />
      {canWrite ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {s.status !== 'published' ? <Button onClick={() => setStatus.mutate('published')} loading={setStatus.isPending}>Publish series</Button> : <Button variant="secondary" onClick={() => setStatus.mutate('draft')}>Unpublish</Button>}
          {s.status !== 'archived' ? <Button variant="ghost" onClick={() => setStatus.mutate('archived')}>Archive</Button> : null}
        </div>
      ) : null}
      <Card className="space-y-3">
        <h2 className="font-semibold">Tests in this series ({ids.length})</h2>
        {ids.length === 0 ? <EmptyState title="No tests yet" /> : (
          <ol className="divide-y divide-line rounded-xl border border-line">
            {ids.map((tid, i) => (
              <li key={tid} className="flex items-center gap-2 p-2"><span className="w-8 text-right text-sm font-semibold text-ink-500">{i + 1}</span><span className="min-w-0 flex-1 truncate">{known[tid] ?? tid}</span>
                {canWrite ? <><Button variant="ghost" size="sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" aria-hidden /></Button><Button variant="ghost" size="sm" aria-label="Move down" disabled={i === ids.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" aria-hidden /></Button><Button variant="ghost" size="sm" aria-label="Remove" onClick={() => setIds((x) => x.filter((y) => y !== tid))}>✕</Button></> : null}
              </li>
            ))}
          </ol>
        )}
        {canWrite ? (
          <>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div><label className="sr-only" htmlFor="ser-find">Find a published test</label><Input id="ser-find" type="search" placeholder="Find a published test to add" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <Select aria-label="Choose a test to add" value="" onChange={(e) => { if (e.target.value && !ids.includes(e.target.value)) setIds((x) => [...x, e.target.value]); }}>
                <option value="">Add a test…</option>
                {titles.data?.items.filter((t) => !ids.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.titleEn}</option>)}
              </Select>
            </div>
            <Button disabled={!dirty} loading={saveItems.isPending} onClick={() => saveItems.mutate()}>Save tests</Button>
          </>
        ) : <Alert tone="info" live={false}>You can view this series but not change it.</Alert>}
      </Card>
      {editing ? <EditDialog open recordKey={s.id} title="Edit series" fields={fields} initial={{ ...s }} editing onClose={() => setEditing(false)} onSave={async (v) => { const { id: _i, examId: _e, status: _s, items: _it, _count: _c, ...rest } = v as Record<string, unknown>; void [_i, _e, _s, _it, _c]; await api.patchSeries(id, rest as Partial<SeriesRow>); setEditing(false); refresh(); toast.show('Saved', 'success'); }} /> : null}
    </>
  );
}
