'use client';
import type { MentorRequestView, PlanDay } from '@eg/api';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, PageHeader, Section, Select, Skeleton } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useApi, useAuth } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

function DayView({ day, highlight }: { day: PlanDay; highlight?: boolean }) {
  const { t, b, fmt } = useI18n();
  return (
    <li className={highlight ? 'rounded-xl border-2 border-primary-600 bg-primary-50 p-3' : 'rounded-xl border border-line p-3'}>
      <p className="mb-1 font-semibold">{fmt.date(day.date)} <span className="font-normal text-ink-500">· {t('planner.minutes', { n: day.minutes })}</span></p>
      <ul className="space-y-1 text-sm">
        {day.tasks.map((k, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2"><Badge>{t(`planner.type.${k.type}` as MessageKey)}</Badge><span>{b(k.titleEn, k.titleHi)}</span>{k.minutes > 0 ? <span className="text-ink-500">{t('planner.minutes', { n: k.minutes })}</span> : null}</li>
        ))}
      </ul>
    </li>
  );
}

function RequestForm({ onDone }: { onDone: () => void }) {
  const { t, b } = useI18n();
  const api = useApi();
  const { user } = useAuth();
  const exams = useQuery({ queryKey: ['exams'], queryFn: () => api.exams(), staleTime: 10 * 60_000 });
  const [examId, setExamId] = useState(user?.targetExam ?? '');
  const [hours, setHours] = useState(4);
  const [date, setDate] = useState('');
  const mut = useMutation({ mutationFn: () => api.requestPlan({ examId, hoursPerDay: hours, examDate: date || undefined }), onSuccess: onDone });
  const tomorrow = new Date(Date.now() + 86_400_000 + 5.5 * 3600_000).toISOString().slice(0, 10);
  return (
    <Card className="space-y-4">
      <p className="text-ink-700">{t('planner.intro')}</p>
      <Field label={t('planner.exam')}>{(p) => <Select {...p} value={examId} onChange={(e) => setExamId(e.target.value)}><option value="">—</option>{exams.data?.map((e) => <option key={e.id} value={e.id}>{b(e.nameEn, e.nameHi)}</option>)}</Select>}</Field>
      <Field label={t('planner.hours')}>{(p) => <Select {...p} value={hours} onChange={(e) => setHours(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 8, 10].map((h) => <option key={h} value={h}>{h}</option>)}</Select>}</Field>
      <Field label={t('planner.examDate')}>{(p) => <Input {...p} type="date" min={tomorrow} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
      {mut.isError ? <Alert tone="danger">{t(errorKey(mut.error))}</Alert> : null}
      <Button disabled={!examId} loading={mut.isPending} onClick={() => mut.mutate()}>{t('planner.request')}</Button>
    </Card>
  );
}

function PlanView({ r, todayIso }: { r: MentorRequestView; todayIso: string }) {
  const { t, b, fmt } = useI18n();
  const plan = r.plan!;
  return (
    <Section title={t('planner.plan')}>
      <p className="mb-3 text-sm text-ink-500">{t('planner.total', { h: fmt.number(plan.summary.studyMinutes / 60, 1), w: plan.summary.weeks })}</p>
      <ul className="space-y-2">
        {plan.weeks.map((w) => (
          <Card as="li" key={w.week} className="p-0">
            <details open={w.days.some((d) => d.date === todayIso)}>
              <summary className="flex min-h-12 cursor-pointer flex-wrap items-center gap-2 p-3 font-semibold">
                {t('planner.week', { n: w.week })} <Badge tone={w.phase === 'revise' ? 'warning' : 'info'}>{t(`planner.phase.${w.phase}` as MessageKey)}</Badge>
                {w.focus.length > 0 ? <span className="text-sm font-normal text-ink-500">{t('planner.focus', { names: w.focus.map((f) => b(f.nameEn, f.nameHi)).join(', ') })}</span> : null}
              </summary>
              <div className="border-t border-line p-3">
                {w.noteEn ? <p className="mb-2 text-sm text-ink-700">{b(w.noteEn, w.noteHi)}</p> : null}
                <ul className="space-y-2">{w.days.map((d) => <DayView key={d.date} day={d} highlight={d.date === todayIso} />)}</ul>
              </div>
            </details>
          </Card>
        ))}
      </ul>
    </Section>
  );
}

export default function PlannerPage() {
  const { t } = useI18n();
  const api = useApi();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const mine = useQuery({ queryKey: ['mentor'], queryFn: () => api.mentor() });
  const today = useQuery({ queryKey: ['mentor-today'], queryFn: () => api.mentorToday() });
  const done = () => { setShowForm(false); void qc.invalidateQueries({ queryKey: ['mentor'] }); void qc.invalidateQueries({ queryKey: ['mentor-today'] }); };

  if (mine.isLoading) return <Skeleton className="h-48" />;
  if (mine.isError || !mine.data) return <ErrorState onRetry={() => mine.refetch()} />;
  const requests = mine.data.requests;
  const open = requests.find((r) => r.status === 'open');
  const sent = requests.find((r) => r.status === 'sent');

  return (
    <>
      <PageHeader title={t('planner.title')} actions={!open && sent && !showForm ? <Button variant="secondary" onClick={() => setShowForm(true)}>{t('planner.newRequest')}</Button> : undefined} />
      {open ? <Alert tone="info" className="mb-4">{t('planner.waiting')}</Alert> : null}
      {!open && (!sent || showForm) ? <RequestForm onDone={done} /> : null}
      {today.data?.plan ? (
        <Section title={t('planner.today')} className="mt-4">
          {today.data.day ? <ul><DayView day={today.data.day} highlight /></ul> : <EmptyState title={t('planner.noPlanToday')} />}
        </Section>
      ) : null}
      {sent?.plan ? <PlanView r={sent} todayIso={today.data?.date ?? ''} /> : null}
    </>
  );
}
