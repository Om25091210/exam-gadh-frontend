'use client';
import type { StaffRole, StaffRow } from '@eg/api';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, Skeleton, Table, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm';
import { useAdmin } from '@/lib/auth';
import { fmtDateTime } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

const ROLES: Array<[StaffRole, string, string]> = [
  ['SUPER_ADMIN', 'Super admin', 'Everything, including staff accounts'],
  ['ADMIN', 'Admin', 'Everything except staff accounts'],
  ['CONTENT_EDITOR', 'Content editor', 'Writes drafts and builds tests; cannot publish'],
  ['TEACHER', 'Teacher', 'Answers doubts and drafts study plans'],
  ['SUPPORT', 'Support', 'Looks up students, orders and doubts; read-only'],
];

export default function StaffPage() {
  const { api, me } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('CONTENT_EDITOR');
  const [secret, setSecret] = useState<{ who: string; password: string } | null>(null);
  const [confirm, setConfirm] = useState<{ row: StaffRow; action: 'mfa' | 'password' | 'sessions' | 'disable' | 'enable' } | null>(null);
  const q = useQuery({ queryKey: ['staff'], queryFn: () => api.staff() });
  const refresh = () => qc.invalidateQueries({ queryKey: ['staff'] });
  const create = useMutation({ mutationFn: () => api.createStaff({ email: email.trim(), name: name.trim(), role }), onSuccess: (r) => { setCreating(false); setSecret({ who: r.email, password: r.temporaryPassword }); setEmail(''); setName(''); void refresh(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const setRoleFor = useMutation({ mutationFn: (v: { id: string; role: StaffRole }) => api.updateStaff(v.id, { role: v.role }), onSuccess: () => { toast.show('Role changed', 'success'); void refresh(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const run = useMutation({
    mutationFn: async (c: NonNullable<typeof confirm>) => {
      if (c.action === 'mfa') return api.resetStaffMfa(c.row.id);
      if (c.action === 'sessions') return api.revokeStaffSessions(c.row.id);
      if (c.action === 'password') return api.resetStaffPassword(c.row.id);
      return api.updateStaff(c.row.id, { disabled: c.action === 'disable' });
    },
    onSuccess: (r, c) => { setConfirm(null); if (c.action === 'password') setSecret({ who: c.row.email, password: (r as { temporaryPassword: string }).temporaryPassword }); else toast.show('Done', 'success'); void refresh(); },
    onError: (e) => { setConfirm(null); toast.show(adminErrorText(e), 'danger'); },
  });
  if (q.isLoading) return <Skeleton className="h-48" />;
  if (q.isError || !q.data) return <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} />;
  return (
    <>
      <PageHeader title="Staff" subtitle="Accounts for people who work in this admin panel. Everyone signs in with a password and a two-factor code." actions={<Button onClick={() => setCreating(true)}>Add staff</Button>} />
      <Table caption="Staff" empty={<EmptyState title="No staff accounts" />} columns={[{ key: 'n', header: 'Name' }, { key: 'r', header: 'Role' }, { key: 'm', header: '2FA' }, { key: 'l', header: 'Last sign-in' }, { key: 's', header: 'State' }, { key: 'a', header: '' }]}
        rows={q.data.map((s) => {
          const self = s.id === me?.id;
          return { key: s.id, cells: {
            n: <span><b>{s.name}</b><br /><span className="text-sm text-ink-500">{s.email}</span></span>,
            r: <Select aria-label={`Role of ${s.name}`} className="w-44!" disabled={self} value={s.role} onChange={(e) => setRoleFor.mutate({ id: s.id, role: e.target.value as StaffRole })}>{ROLES.map(([r, l]) => <option key={r} value={r}>{l}</option>)}</Select>,
            m: s.mfaEnrolled ? <Badge tone="success">on</Badge> : <Badge tone="warning">not set up</Badge>,
            l: fmtDateTime(s.lastLoginAt),
            s: s.disabled ? <Badge tone="danger">disabled</Badge> : <Badge tone="success">active</Badge>,
            a: self ? <span className="text-sm text-ink-500">you</span> : <div className="flex flex-wrap justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setConfirm({ row: s, action: 'password' })}>Reset password</Button><Button size="sm" variant="ghost" onClick={() => setConfirm({ row: s, action: 'mfa' })}>Reset 2FA</Button><Button size="sm" variant="ghost" onClick={() => setConfirm({ row: s, action: 'sessions' })}>Sign out</Button><Button size="sm" variant={s.disabled ? 'secondary' : 'ghost'} onClick={() => setConfirm({ row: s, action: s.disabled ? 'enable' : 'disable' })}>{s.disabled ? 'Enable' : 'Disable'}</Button></div>,
          } };
        })} />
      <Card className="mt-4"><h2 className="mb-1 font-semibold">What each role can do</h2><ul className="space-y-1 text-sm">{ROLES.map(([r, l, d]) => <li key={r}><b>{l}:</b> {d}</li>)}</ul><p className="mt-2 text-sm text-ink-500">The full list is in docs/PERMISSIONS.md.</p></Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Add a staff member" footer={<><Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button><Button disabled={!email.includes('@') || name.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>Create account</Button></>}>
        <div className="space-y-3"><Field label="Name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field><Field label="E-mail">{(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field><Field label="Role">{(p) => <Select {...p} value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>{ROLES.map(([r, l]) => <option key={r} value={r}>{l}</option>)}</Select>}</Field>
          <Alert tone="info" live={false}>You will be shown a temporary password once. Share it privately; they must change it at first sign-in.</Alert></div>
      </Modal>
      <Modal open={!!secret} onClose={() => setSecret(null)} title="Temporary password" footer={<Button onClick={() => setSecret(null)}>I have copied it</Button>}>
        <p className="mb-2">For <b>{secret?.who}</b>. It is shown only now and must be changed at first sign-in.</p>
        <p className="select-all break-all rounded-lg bg-black/5 p-3 font-mono text-lg">{secret?.password}</p>
      </Modal>
      <ConfirmDialog open={!!confirm} title={confirm ? ({ mfa: 'Reset two-factor sign-in?', password: 'Reset password?', sessions: 'Sign out everywhere?', disable: 'Disable this account?', enable: 'Enable this account?' })[confirm.action] : ''} danger={confirm?.action === 'disable' || confirm?.action === 'mfa'} confirmLabel="Confirm" busy={run.isPending} onConfirm={() => confirm && run.mutate(confirm)} onClose={() => setConfirm(null)}>
        {confirm?.action === 'mfa' ? `${confirm.row.name} must set up an authenticator app again at next sign-in. They are signed out now.` : confirm?.action === 'password' ? `${confirm?.row.name} is signed out and gets a new temporary password.` : confirm?.action === 'disable' ? `${confirm?.row.name} is signed out and cannot sign in until you enable the account.` : confirm?.action === 'sessions' ? `${confirm?.row.name} will have to sign in again.` : `${confirm?.row.name} will be able to sign in again.`}
      </ConfirmDialog>
    </>
  );
}
