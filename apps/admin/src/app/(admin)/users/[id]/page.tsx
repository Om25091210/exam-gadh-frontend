'use client';
import { Alert, Badge, Button, Card, ErrorState, Field, Input, Modal, PageHeader, Section, Select, Skeleton, Table, Textarea, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { fmtDateTime, rupees } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [modal, setModal] = useState<'suspend' | 'grant' | 'revoke-sessions' | { revoke: string } | null>(null);
  const [reason, setReason] = useState('');
  const [planId, setPlanId] = useState('');
  const [days, setDays] = useState(30);
  const [note, setNote] = useState('');
  const q = useQuery({ queryKey: ['user', id], queryFn: () => api.user(id) });
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.plans(), enabled: can('users:grant-access') });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['user', id] }); void qc.invalidateQueries({ queryKey: ['users'] }); };
  const act = <T,>(fn: () => Promise<T>, ok: string) => ({ mutationFn: fn, onSuccess: () => { toast.show(ok, 'success'); setModal(null); setReason(''); refresh(); }, onError: (e: unknown) => toast.show(adminErrorText(e), 'danger') });
  const suspend = useMutation(act(() => api.suspendUser(id, reason.trim()), 'Student suspended'));
  const activate = useMutation(act(() => api.activateUser(id), 'Student reactivated'));
  const sessions = useMutation(act(() => api.revokeUserSessions(id), 'Signed out everywhere'));
  const grant = useMutation(act(() => api.grantAccess(id, { planId, days, note: note.trim() || undefined }), 'Access granted'));
  const revoke = useMutation(act(() => api.revokeEntitlement(typeof modal === 'object' && modal ? modal.revoke : '', reason.trim()), 'Access revoked'));

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} />;
  const u = q.data;
  const p = u.profile;
  const now = Date.now();
  return (
    <>
      <PageHeader title={p.name} subtitle={p.email} actions={<StatusBadge status={p.status} />} />
      {p.suspendReason ? <Alert tone="warning" className="mb-4">Suspended: {p.suspendReason}</Alert> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {can('users:suspend') ? (p.status === 'active' ? <Button variant="danger" size="sm" onClick={() => setModal('suspend')}>Suspend</Button> : <Button size="sm" onClick={() => activate.mutate()} loading={activate.isPending}>Reactivate</Button>) : null}
        {can('users:suspend') ? <Button variant="secondary" size="sm" onClick={() => setModal('revoke-sessions')}>Sign out everywhere</Button> : null}
        {can('users:grant-access') ? <Button variant="secondary" size="sm" onClick={() => setModal('grant')}>Grant access</Button> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Card><p className="text-sm text-ink-500">Joined</p><p className="font-semibold">{fmtDateTime(p.createdAt)}</p></Card>
        <Card><p className="text-sm text-ink-500">Last seen</p><p className="font-semibold">{fmtDateTime(p.lastSeenAt)}</p></Card>
        <Card><p className="text-sm text-ink-500">District / target exam</p><p className="font-semibold">{p.district ?? '—'} / {p.targetExam ?? '—'}</p></Card>
        <Card><p className="text-sm text-ink-500">Doubts asked</p><p className="font-semibold">{u.doubts}</p></Card>
      </div>

      <Section title="Access" className="mt-6">
        <Table caption="Entitlements" empty={<p className="text-ink-500">No plan or access grants.</p>} columns={[{ key: 'p', header: 'Plan' }, { key: 's', header: 'Source' }, { key: 'e', header: 'Ends' }, { key: 'st', header: 'State' }, { key: 'a', header: '' }]}
          rows={u.entitlements.map((e) => ({ key: e.id, cells: { p: e.plan.nameEn, s: e.source, e: fmtDateTime(e.endsAt), st: e.revokedAt ? <Badge tone="danger">revoked</Badge> : new Date(e.endsAt).getTime() > now ? <Badge tone="success">active</Badge> : <Badge>ended</Badge>, a: can('users:grant-access') && !e.revokedAt && new Date(e.endsAt).getTime() > now ? <Button size="sm" variant="ghost" onClick={() => setModal({ revoke: e.id })}>Revoke</Button> : null } }))} />
      </Section>
      <Section title="Recent tests">
        <Table caption="Attempts" empty={<p className="text-ink-500">No attempts.</p>} columns={[{ key: 't', header: 'Test' }, { key: 's', header: 'Status' }, { key: 'sc', header: 'Score' }, { key: 'r', header: 'Ranked' }, { key: 'w', header: 'When' }]}
          rows={u.attempts.map((a) => ({ key: a.id, cells: { t: a.version.test.titleEn, s: a.status.replace('_', ' '), sc: a.result ? `${a.result.score} / ${a.result.maxScore} (${a.result.accuracyPct}%)` : '—', r: a.isRanked ? 'yes' : 'practice', w: fmtDateTime(a.submittedAt ?? a.startedAt) } }))} />
      </Section>
      <Section title="Orders">
        <Table caption="Orders" empty={<p className="text-ink-500">No orders.</p>} columns={[{ key: 'p', header: 'Plan' }, { key: 'a', header: 'Amount' }, { key: 's', header: 'Status' }, { key: 'w', header: 'When' }]}
          rows={u.orders.map((o) => ({ key: o.id, cells: { p: `${o.planId} · ${o.months} mo`, a: rupees(o.amountPaise), s: <StatusBadge status={o.status} />, w: fmtDateTime(o.createdAt) } }))} />
      </Section>
      <Section title="Topic accuracy">
        <Table caption="Topics" empty={<p className="text-ink-500">No answers yet.</p>} columns={[{ key: 't', header: 'Topic' }, { key: 'a', header: 'Answered' }, { key: 'c', header: 'Correct' }, { key: 'p', header: 'Accuracy' }]} rows={u.topicStats.map((t) => ({ key: t.topicCode, cells: { t: t.topicCode, a: t.attempted, c: t.correct, p: t.accuracyPct == null ? '—' : `${t.accuracyPct}%` } }))} />
      </Section>
      <Section title="Signed-in devices">
        <Table caption="Sessions" empty={<p className="text-ink-500">Not signed in anywhere.</p>} columns={[{ key: 'd', header: 'Device' }, { key: 'p', header: 'Platform' }, { key: 'l', header: 'Last seen' }, { key: 'i', header: 'IP' }]} rows={u.activeSessions.map((s) => ({ key: s.id, cells: { d: s.deviceName ?? '—', p: s.platform, l: fmtDateTime(s.lastSeenAt), i: s.ip ?? '—' } }))} />
      </Section>

      <ConfirmDialog open={modal === 'suspend'} title="Suspend this student?" danger confirmLabel="Suspend" busy={suspend.isPending} onConfirm={() => reason.trim().length >= 3 && suspend.mutate()} onClose={() => setModal(null)}>
        <p className="mb-2">They are signed out immediately and cannot sign in again until you reactivate them.</p>
        <Field label="Reason (required, kept in the audit log)">{(p) => <Textarea {...p} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />}</Field>
      </ConfirmDialog>
      <ConfirmDialog open={modal === 'revoke-sessions'} title="Sign out on every device?" confirmLabel="Sign out" busy={sessions.isPending} onConfirm={() => sessions.mutate()} onClose={() => setModal(null)}>They will need to sign in with Google again.</ConfirmDialog>
      <ConfirmDialog open={typeof modal === 'object' && modal !== null} title="Revoke this access?" danger confirmLabel="Revoke" busy={revoke.isPending} onConfirm={() => reason.trim().length >= 3 && revoke.mutate()} onClose={() => setModal(null)}>
        <Field label="Reason (required)">{(p) => <Textarea {...p} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />}</Field>
      </ConfirmDialog>
      <Modal open={modal === 'grant'} onClose={() => setModal(null)} title="Grant access" footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button disabled={!planId || days < 1} loading={grant.isPending} onClick={() => grant.mutate()}>Grant</Button></>}>
        <div className="space-y-3">
          <Field label="Plan">{(f) => <Select {...f} value={planId} onChange={(e) => setPlanId(e.target.value)}><option value="">Choose a plan</option>{plans.data?.map((x) => <option key={x.id} value={x.id}>{x.nameEn}</option>)}</Select>}</Field>
          <Field label="Days">{(f) => <Input {...f} type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value))} />}</Field>
          <Field label="Note (optional)">{(f) => <Input {...f} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />}</Field>
        </div>
      </Modal>
    </>
  );
}
