'use client';
import type { AdminPlan } from '@eg/api';
import { Badge, Button, EmptyState, ErrorState, PageHeader, Skeleton, Table, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm';
import { EditDialog, type FieldSpec } from '@/components/schema-form';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const fields = (exams: Array<[string, string]>): FieldSpec[] => [
  { key: 'id', label: 'Id', type: 'text', required: true, createOnly: true, hint: 'Short and permanent, e.g. pass_prelims' },
  { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
  { key: 'nameHi', label: 'Name (Hindi)', type: 'text', required: true, lang: 'hi' },
  { key: 'price3', label: 'Price for 3 months (₹)', type: 'number', min: 1 },
  { key: 'price6', label: 'Price for 6 months (₹)', type: 'number', min: 1 },
  { key: 'price12', label: 'Price for 12 months (₹)', type: 'number', min: 1 },
  { key: 'trialDays', label: 'Free trial days', type: 'number', min: 0, max: 60 },
  { key: 'examIds', label: 'Exams covered', type: 'tags', hint: `Exam ids, comma separated; empty = all exams. Available: ${exams.map(([id]) => id).join(', ')}` },
  { key: 'topTier', label: 'Highlight as the top plan', type: 'checkbox' },
  { key: 'active', label: 'On sale', type: 'checkbox' },
];

const toForm = (p: AdminPlan) => ({ ...p, price3: p.prices['3'], price6: p.prices['6'], price12: p.prices['12'], examIds: p.examIds ?? p.exams?.map((e) => e.examId) ?? [] });
const toBody = (v: Record<string, unknown>, editing: boolean) => {
  const prices: Record<string, number> = {};
  for (const m of ['3', '6', '12']) if (typeof v[`price${m}`] === 'number') prices[m] = v[`price${m}`] as number;
  const body: Record<string, unknown> = { nameEn: v.nameEn, nameHi: v.nameHi, prices, trialDays: v.trialDays ?? 0, topTier: !!v.topTier, active: v.active !== false, examIds: v.examIds ?? [] };
  if (!editing) body.id = v.id;
  return body;
};

export default function PlansPage() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<AdminPlan | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminPlan | null>(null);
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });
  const q = useQuery({ queryKey: ['admin-plans'], queryFn: () => api.plans() });
  const canWrite = can('plans:write');
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-plans'] });
  const del = useMutation({ mutationFn: (id: string) => api.deletePlan(id), onSuccess: () => { setDeleting(null); void refresh(); toast.show('Deleted', 'success'); }, onError: (e) => { setDeleting(null); toast.show(adminErrorText(e), 'danger'); } });
  return (
    <>
      <PageHeader title="Plans" subtitle="What students can buy. Prices are in rupees. A plan that has been bought cannot be deleted; take it off sale instead." actions={canWrite ? <Button onClick={() => setEditing('new')}>New plan</Button> : undefined} />
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <Table caption="Plans" empty={<EmptyState title="No plans yet" />} columns={[{ key: 'n', header: 'Plan' }, { key: 'p', header: '3 / 6 / 12 months' }, { key: 'e', header: 'Exams' }, { key: 's', header: 'State' }, { key: 'a', header: '' }]}
          rows={q.data.map((p) => ({ key: p.id, cells: { n: <span><b>{p.nameEn}</b> <span className="text-ink-500">{p.id}</span></span>, p: ['3', '6', '12'].map((m) => (p.prices[m] != null ? `₹${p.prices[m]}` : '—')).join(' / '), e: (p.examIds ?? p.exams?.map((x) => x.examId) ?? []).join(', ') || 'all', s: p.active ? <Badge tone="success">on sale</Badge> : <Badge>off sale</Badge>, a: canWrite ? <div className="flex justify-end gap-1"><Button size="sm" variant="secondary" onClick={() => setEditing(p)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>Delete</Button></div> : null } }))} />
      )}
      {editing ? <EditDialog open recordKey={editing === 'new' ? 'new' : editing.id} title={editing === 'new' ? 'New plan' : `Edit ${editing.nameEn}`} fields={fields((tree.data?.exams ?? []).map((e) => [e.id, e.shortEn]))} initial={editing === 'new' ? { active: true, topTier: false, trialDays: 0, examIds: [] } : toForm(editing)} editing={editing !== 'new'} onClose={() => setEditing(null)} onSave={async (v) => { if (editing === 'new') await api.createPlan(toBody(v, false)); else await api.updatePlan(editing.id, toBody(v, true)); setEditing(null); void refresh(); toast.show('Saved', 'success'); }} /> : null}
      <ConfirmDialog open={!!deleting} title={`Delete ${deleting?.nameEn}?`} danger confirmLabel="Delete" busy={del.isPending} onConfirm={() => deleting && del.mutate(deleting.id)} onClose={() => setDeleting(null)}>Plans with orders cannot be deleted.</ConfirmDialog>
    </>
  );
}
