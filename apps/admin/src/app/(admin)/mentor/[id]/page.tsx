'use client';
import type { PlanTask, StudyPlan } from '@eg/api';
import { Alert, Badge, Button, buttonClasses, Card, ErrorState, Input, PageHeader, Select, Skeleton, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const TYPES: Array<[PlanTask['type'], string]> = [['study', 'Study'], ['practice', 'Practice'], ['revision', 'Revision'], ['mock', 'Mock test'], ['rest', 'Rest']];
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export default function MentorRequestPage() {
  const { id } = useParams<{ id: string }>();
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['mentor-request', id], queryFn: () => api.mentorRequest(id) });
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  useEffect(() => { if (q.data?.plan) { setPlan(clone(q.data.plan as StudyPlan)); setDirty(false); } }, [q.data]);

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['mentor-request', id] }); void qc.invalidateQueries({ queryKey: ['mentor'] }); };
  const save = useMutation({ mutationFn: () => api.saveMentorPlan(id, plan), onSuccess: () => { toast.show('Plan saved', 'success'); refresh(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const regen = useMutation({ mutationFn: () => api.regenerateMentorPlan(id), onSuccess: () => { toast.show('New draft generated from the student’s latest answers', 'success'); refresh(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const send = useMutation({ mutationFn: async () => { if (dirty) await api.saveMentorPlan(id, plan); await api.sendMentorPlan(id); }, onSuccess: () => { setConfirmSend(false); toast.show('Plan sent to the student', 'success'); refresh(); }, onError: (e) => { setConfirmSend(false); toast.show(adminErrorText(e), 'danger'); } });

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} />;
  const r = q.data;
  const open = r.status === 'open' && can('mentor:manage');
  const edit = (fn: (p: StudyPlan) => void) => setPlan((p) => { if (!p) return p; const n = clone(p); fn(n); return n; }) as unknown as void;
  const markDirty = () => setDirty(true);
  const weak = r.topicAccuracy.filter((t) => t.accuracyPct != null).sort((a, b) => (a.accuracyPct ?? 0) - (b.accuracyPct ?? 0)).slice(0, 6);

  return (
    <>
      <PageHeader title={`Plan for ${r.student?.name ?? 'student'}`} subtitle={r.student?.email} actions={<><StatusBadge status={r.status} /><Link href="/mentor" className={buttonClasses('secondary', 'sm')}>Back</Link></>} />
      <Card className="mb-4 grid gap-2 sm:grid-cols-4">
        <div><p className="text-sm text-ink-500">Exam</p><p className="font-semibold">{r.examId}</p></div>
        <div><p className="text-sm text-ink-500">Hours per day</p><p className="font-semibold">{r.hoursPerDay}</p></div>
        <div><p className="text-sm text-ink-500">Exam date</p><p className="font-semibold">{r.examDate ?? 'not given'}</p></div>
        <div><p className="text-sm text-ink-500">Weakest topics</p><p className="text-sm">{weak.length ? weak.map((t) => `${t.nameEn} ${t.accuracyPct}%`).join(', ') : 'not enough answers yet'}</p></div>
      </Card>
      {open ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>Save changes</Button>
          <Button variant="secondary" loading={regen.isPending} onClick={() => regen.mutate()}>Generate a fresh draft</Button>
          <Button variant="primary" onClick={() => setConfirmSend(true)}>Send to student</Button>
        </div>
      ) : r.status === 'sent' ? <Alert tone="success" className="mb-4" live={false}>This plan was sent. The student can ask for a new one.</Alert> : <Alert tone="info" className="mb-4" live={false}>You can view this plan but not change it.</Alert>}
      {dirty ? <Alert tone="warning" className="mb-4" live={false}>You have unsaved changes. Generating a fresh draft replaces them.</Alert> : null}

      {plan ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-500">{plan.summary.weeks} weeks · {Math.round(plan.summary.studyMinutes / 60)} hours planned · {plan.startDate} to {plan.endDate}</p>
          {plan.weeks.map((w, wi) => (
            <Card key={w.week} className="p-0">
              <details open={wi === 0}>
                <summary className="flex min-h-12 cursor-pointer flex-wrap items-center gap-2 p-3 font-semibold">Week {w.week} <Badge tone={w.phase === 'revise' ? 'warning' : 'info'}>{w.phase}</Badge><span className="text-sm font-normal text-ink-500">{w.focus.map((f) => f.nameEn).join(', ')}</span></summary>
                <div className="space-y-3 border-t border-line p-3">
                  {w.days.map((d, di) => (
                    <div key={d.date} className="rounded-xl border border-line p-2">
                      <p className="mb-1 font-semibold">{d.date} <span className="font-normal text-ink-500">· {d.tasks.reduce((n, t) => n + t.minutes, 0)} min</span></p>
                      <ul className="space-y-2">
                        {d.tasks.map((t, ti) => (
                          <li key={ti} className="grid items-center gap-2 sm:grid-cols-[8rem_1fr_1fr_6rem_auto]">
                            <Select aria-label="Task type" disabled={!open} value={t.type} onChange={(e) => { edit((p) => { p.weeks[wi].days[di].tasks[ti].type = e.target.value as PlanTask['type']; }); markDirty(); }}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
                            <Input aria-label="Title in English" disabled={!open} value={t.titleEn} onChange={(e) => { edit((p) => { p.weeks[wi].days[di].tasks[ti].titleEn = e.target.value; }); markDirty(); }} />
                            <Input aria-label="Title in Hindi" lang="hi" disabled={!open} value={t.titleHi} onChange={(e) => { edit((p) => { p.weeks[wi].days[di].tasks[ti].titleHi = e.target.value; }); markDirty(); }} />
                            <Input aria-label="Minutes" type="number" min={0} max={720} disabled={!open} value={t.minutes} onChange={(e) => { edit((p) => { p.weeks[wi].days[di].tasks[ti].minutes = Math.max(0, Math.min(720, Number(e.target.value) || 0)); }); markDirty(); }} />
                            {open ? <Button variant="ghost" size="sm" aria-label="Remove task" onClick={() => { edit((p) => { p.weeks[wi].days[di].tasks.splice(ti, 1); }); markDirty(); }}>✕</Button> : <span />}
                          </li>
                        ))}
                      </ul>
                      {open ? <Button variant="ghost" size="sm" className="mt-1" disabled={d.tasks.length >= 12} onClick={() => { edit((p) => { p.weeks[wi].days[di].tasks.push({ type: 'study', minutes: 30, titleEn: 'New task', titleHi: 'नया कार्य' }); }); markDirty(); }}>Add task</Button> : null}
                    </div>
                  ))}
                </div>
              </details>
            </Card>
          ))}
        </div>
      ) : null}
      <ConfirmDialog open={confirmSend} title="Send this plan to the student?" confirmLabel="Send" busy={send.isPending} onConfirm={() => send.mutate()} onClose={() => setConfirmSend(false)}>The student is notified and can see the whole plan. After sending you cannot edit it; they can ask for a new one.</ConfirmDialog>
    </>
  );
}
