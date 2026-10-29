'use client';
import type { ReconcileReport } from '@eg/api';
import { Alert, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Pagination, Skeleton, Table, useToast } from '@eg/ui';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { FilterSelect, useUrlFilters } from '@/components/data-bits';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { fmtDateTime, rupees } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

function ReconcileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { api, can } = useAdmin();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<ReconcileReport | null>(null);
  const run = useMutation({ mutationFn: () => api.reconcile(`${from}T00:00:00.000Z`, `${to}T23:59:59.000Z`), onSuccess: setReport, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const repair = useMutation({ mutationFn: (paymentId: string) => api.repairPayment(paymentId, `${from}T00:00:00.000Z`, `${to}T23:59:59.000Z`), onSuccess: () => { toast.show('Payment recorded and access granted', 'success'); run.mutate(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const lists = report ? (['missingInDb', 'unknownOrder', 'amountMismatch', 'missingAtGateway', 'refundedAtGateway'] as const).map((k) => [k, (report[k] as Array<Record<string, unknown>> | undefined) ?? []] as const) : [];
  const TITLE: Record<string, string> = { missingInDb: 'Paid at Razorpay but missing here (can be repaired)', unknownOrder: 'Paid at Razorpay for an order we do not know', amountMismatch: 'Amount differs', missingAtGateway: 'Recorded here but not found at Razorpay', refundedAtGateway: 'Refunded at Razorpay but not here' };
  return (
    <Modal open={open} onClose={onClose} title="Check payments against Razorpay" footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      <div className="space-y-3">
        <p className="text-sm text-ink-500">Compares what Razorpay captured with our records. Up to 31 days at a time.</p>
        <div className="grid grid-cols-2 gap-3"><Field label="From">{(p) => <Input {...p} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field><Field label="To">{(p) => <Input {...p} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}</Field></div>
        <Button loading={run.isPending} onClick={() => run.mutate()}>Run check</Button>
        {report ? (lists.every(([, l]) => l.length === 0) ? <Alert tone="success" live={false}>Everything matches.</Alert> : lists.filter(([, l]) => l.length).map(([k, l]) => (
          <Card key={k} className="space-y-1"><h3 className="font-semibold">{TITLE[k]} ({l.length})</h3><ul className="space-y-1 text-sm">{l.map((x, i) => <li key={i} className="flex flex-wrap items-center justify-between gap-2"><span className="break-all font-mono">{String(x.paymentId)}{x.amountPaise ? ` · ${rupees(Number(x.amountPaise))}` : ''}</span>{k === 'missingInDb' && can('orders:refund') ? <Button size="sm" onClick={() => repair.mutate(String(x.paymentId))} loading={repair.isPending}>Record it</Button> : null}</li>)}</ul></Card>
        ))) : null}
      </div>
    </Modal>
  );
}

function OrdersInner() {
  const { api, can } = useAdmin();
  const f = useUrlFilters<Record<string, string | undefined>>();
  const [search, setSearch] = useState(f.get('q'));
  const [recon, setRecon] = useState(false);
  const filters = { page: f.page, status: f.get('status') || undefined, q: f.get('q') || undefined };
  const q = useQuery({ queryKey: ['admin-orders', filters], queryFn: () => api.orders(filters), placeholderData: keepPreviousData });
  const set = (p: Record<string, string | undefined>) => f.set(p, '/commerce/orders');
  return (
    <>
      <PageHeader title="Orders and refunds" actions={can('orders:refund') ? <Button variant="secondary" onClick={() => setRecon(true)}>Check against Razorpay</Button> : undefined} />
      <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ q: search.trim().length >= 3 ? search.trim() : undefined }); }}>
        <label className="sr-only" htmlFor="o-q">Search by Razorpay order or payment id</label>
        <Input id="o-q" type="search" placeholder="Razorpay order or payment id" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="mb-4 max-w-xs"><FilterSelect id="o-status" label="Any status" value={f.get('status')} onChange={(v) => set({ status: v })} options={[['paid', 'Paid'], ['created', 'Not paid'], ['failed', 'Failed'], ['refunded', 'Refunded']]} /></div>
      {q.isLoading ? <Skeleton className="h-48" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <>
          <p className="mb-2 text-sm text-ink-500">{q.data.total} orders · {rupees(q.data.totalAmountPaise)} in this view</p>
          <Table caption="Orders" empty={<EmptyState title="No orders match" />} columns={[{ key: 'w', header: 'When' }, { key: 's', header: 'Student' }, { key: 'p', header: 'Plan' }, { key: 'a', header: 'Amount' }, { key: 'st', header: 'Status' }, { key: 'o', header: '' }]}
            rows={q.data.items.map((o) => ({ key: o.id, cells: { w: fmtDateTime(o.createdAt), s: <Link href={`/users/${o.user.id}`} className="text-primary-700 underline">{o.user.name}</Link>, p: `${o.plan.nameEn} · ${o.months} mo${o.couponCode ? ` · ${o.couponCode}` : ''}`, a: rupees(o.amountPaise), st: <StatusBadge status={o.status} />, o: <Link href={`/commerce/orders/${o.id}`} className="text-primary-700 underline">Open</Link> } }))} />
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => f.set({ page: String(p) }, '/commerce/orders')} />
        </>
      )}
      <ReconcileDialog open={recon} onClose={() => setRecon(false)} />
    </>
  );
}
export default function OrdersPage() {
  return <Suspense><OrdersInner /></Suspense>;
}
