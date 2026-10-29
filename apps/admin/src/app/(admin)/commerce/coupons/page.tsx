'use client';
import type { AdminCoupon } from '@eg/api';
import { Badge, Button, EmptyState, ErrorState, PageHeader, Skeleton, Table, useToast } from '@eg/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { EditDialog, type FieldSpec } from '@/components/schema-form';
import { useAdmin } from '@/lib/auth';
import { fmtDateTime } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

const fields = (plans: Array<[string, string]>): FieldSpec[] => [
  { key: 'code', label: 'Code', type: 'text', required: true, createOnly: true, hint: 'Capital letters, digits, - and _. Students type this.' },
  { key: 'planId', label: 'Plan', type: 'select', required: true, createOnly: true, options: plans },
  { key: 'days', label: 'Days of access', type: 'number', required: true, min: 1, max: 3650 },
  { key: 'maxUses', label: 'Maximum uses', type: 'number', min: 1, hint: 'Empty = unlimited' },
  { key: 'expiresAt', label: 'Expires', type: 'datetime' },
  { key: 'active', label: 'Active', type: 'checkbox' },
];

export default function CouponsPage() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<AdminCoupon | 'new' | null>(null);
  const plans = useQuery({ queryKey: ['admin-plans'], queryFn: () => api.plans() });
  const q = useQuery({ queryKey: ['admin-coupons'], queryFn: () => api.coupons() });
  const canWrite = can('coupons:write');
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-coupons'] });
  return (
    <>
      <PageHeader title="Coupons" subtitle="A coupon gives free access for a number of days. Each student can use a coupon once." actions={canWrite ? <Button onClick={() => setEditing('new')}>New coupon</Button> : undefined} />
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <Table caption="Coupons" empty={<EmptyState title="No coupons yet" />} columns={[{ key: 'c', header: 'Code' }, { key: 'p', header: 'Plan' }, { key: 'd', header: 'Days' }, { key: 'u', header: 'Used' }, { key: 'x', header: 'Expires' }, { key: 's', header: 'State' }, { key: 'a', header: '' }]}
          rows={q.data.map((c) => ({ key: c.code, cells: { c: <span className="font-mono font-semibold">{c.code}</span>, p: c.planId, d: c.days, u: `${c.usedCount}${c.maxUses ? ` / ${c.maxUses}` : ''}`, x: c.expiresAt ? fmtDateTime(c.expiresAt) : 'never', s: c.active ? <Badge tone="success">active</Badge> : <Badge>off</Badge>, a: canWrite ? <Button size="sm" variant="secondary" onClick={() => setEditing(c)}>Edit</Button> : null } }))} />
      )}
      {editing ? <EditDialog open recordKey={editing === 'new' ? 'new' : editing.code} title={editing === 'new' ? 'New coupon' : `Edit ${editing.code}`} fields={fields((plans.data ?? []).map((p) => [p.id, p.nameEn]))} initial={editing === 'new' ? { active: true, days: 30 } : { ...editing }} editing={editing !== 'new'} onClose={() => setEditing(null)} onSave={async (v) => {
        if (editing === 'new') await api.createCoupon({ code: v.code, planId: v.planId, days: v.days, maxUses: v.maxUses ?? null, expiresAt: v.expiresAt ?? null, active: v.active !== false });
        else await api.updateCoupon(editing.code, { days: v.days, maxUses: v.maxUses ?? null, expiresAt: v.expiresAt ?? null, active: !!v.active });
        setEditing(null); void refresh(); toast.show('Saved', 'success');
      }} /> : null}
    </>
  );
}
