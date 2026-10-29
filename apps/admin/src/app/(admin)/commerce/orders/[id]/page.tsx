'use client';
import { Alert, Badge, buttonClasses, Button, Card, ErrorState, Field, Input, Modal, PageHeader, Section, Skeleton, Table, Textarea, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { fmtDateTime, rupees } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [rupee, setRupee] = useState('');
  const q = useQuery({ queryKey: ['admin-order', id], queryFn: () => api.order(id) });
  const refund = useMutation({
    mutationFn: () => api.refundOrder(id, { reason: reason.trim(), ...(rupee ? { amountPaise: Math.round(Number(rupee) * 100) } : {}) }),
    onSuccess: () => { setOpen(false); setReason(''); setRupee(''); toast.show('Refund sent to Razorpay', 'success'); void qc.invalidateQueries({ queryKey: ['admin-order', id] }); void qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: (e) => toast.show(adminErrorText(e), 'danger'),
  });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} />;
  const o = q.data;
  return (
    <>
      <PageHeader title={`Order ${o.razorpayOrderId}`} subtitle={`${o.user.name} · ${o.user.email}`} actions={<><StatusBadge status={o.status} /><Link href="/commerce/orders" className={buttonClasses('secondary', 'sm')}>Back</Link></>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card><p className="text-sm text-ink-500">Plan</p><p className="font-semibold">{o.plan.nameEn} · {o.months} months</p></Card>
        <Card><p className="text-sm text-ink-500">Amount</p><p className="font-semibold">{rupees(o.amountPaise)}</p></Card>
        <Card><p className="text-sm text-ink-500">Created</p><p className="font-semibold">{fmtDateTime(o.createdAt)}</p></Card>
        <Card><p className="text-sm text-ink-500">Invoice</p><p className="font-semibold">{o.invoice?.number ?? '—'}</p></Card>
      </div>
      {o.status === 'paid' && can('orders:refund') ? <Button variant="danger" className="mb-4" onClick={() => setOpen(true)}>Refund</Button> : null}
      <Section title="Payments">
        <Table caption="Payments" empty={<p className="text-ink-500">No payments recorded.</p>} columns={[{ key: 'id', header: 'Payment id' }, { key: 'a', header: 'Amount' }, { key: 'm', header: 'Method' }, { key: 's', header: 'Status' }, { key: 'w', header: 'When' }]} rows={o.payments.map((p) => ({ key: p.id, cells: { id: <span className="break-all font-mono text-sm">{p.razorpayPaymentId}</span>, a: rupees(p.amountPaise), m: p.method ?? '—', s: <Badge tone={p.status === 'refunded' ? 'warning' : p.status === 'captured' ? 'success' : 'neutral'}>{p.status}</Badge>, w: fmtDateTime(p.createdAt) } }))} />
      </Section>
      <Modal open={open} onClose={() => setOpen(false)} title="Refund this order" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" disabled={reason.trim().length < 5} loading={refund.isPending} onClick={() => refund.mutate()}>Refund</Button></>}>
        <div className="space-y-3">
          <Alert tone="warning" live={false}>The refund is sent to Razorpay. Access is removed only if the whole amount is refunded. This is recorded in the audit log.</Alert>
          <Field label="Amount in rupees" hint={`Empty = full refund (${rupees(o.amountPaise)})`}>{(p) => <Input {...p} type="number" min={1} step={1} value={rupee} onChange={(e) => setRupee(e.target.value)} />}</Field>
          <Field label="Reason (required)">{(p) => <Textarea {...p} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />}</Field>
        </div>
      </Modal>
    </>
  );
}
