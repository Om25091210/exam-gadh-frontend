'use client';
import { Alert, Button, Card, ErrorState, Field, Input, PageHeader, Select, Skeleton, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

interface Spec {
  key: string;
  label: string;
  help: string;
  kind: 'number' | 'boolean' | 'select' | 'hours';
  options?: Array<[string, string]>;
  min?: number;
  max?: number;
}
const SPECS: Spec[] = [
  { key: 'attempt.multiClientPolicy', label: 'Same test open in two tabs or devices', help: 'Takeover: the newest tab continues and the old one is told to stop. Block: a second tab is refused while the first is active.', kind: 'select', options: [['takeover', 'Newest wins (takeover)'], ['block', 'Refuse the second one (block)']] },
  { key: 'attempt.lockStaleSec', label: 'Seconds before a silent tab is considered gone', help: 'Used by the block policy.', kind: 'number', min: 10, max: 600 },
  { key: 'content.requireBothLanguages', label: 'Publishing a test needs Hindi and English on every question', help: 'Switch on once the question bank is fully translated.', kind: 'boolean' },
  { key: 'doubts.dailyQuota', label: 'Doubts a student may ask per day', help: 'India calendar day.', kind: 'number', min: 1, max: 50 },
  { key: 'doubts.freeMonthly', label: 'Doubts a free student may ask per month', help: 'Students with an active plan are not limited by this.', kind: 'number', min: 0, max: 100 },
  { key: 'doubts.slaHours', label: 'Hours to answer a doubt', help: 'The deadline staff are shown; replying to an answered doubt restarts it.', kind: 'number', min: 1, max: 240 },
  { key: 'notifications.dailyCap', label: 'Reminders a student may get per day', help: 'Answers to their own actions (doubt answered, result ready) are never limited.', kind: 'number', min: 0, max: 20 },
  { key: 'notifications.quietHours', label: 'Quiet hours (hours, India time)', help: 'No push reminders between these hours (push delivery is not set up yet).', kind: 'hours' },
];

export default function SettingsPage() {
  const { api } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  useEffect(() => { if (q.data) setDraft({ ...q.data.values }); }, [q.data]);
  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => api.setSetting(key, value),
    onSuccess: () => { toast.show('Setting saved', 'success'); void qc.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (e) => toast.show(adminErrorText(e), 'danger'),
  });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} />;
  const changed = (k: string) => JSON.stringify(draft[k]) !== JSON.stringify(q.data!.values[k]);
  return (
    <>
      <PageHeader title="Settings" subtitle="Changes take effect within about 30 seconds. Every change is recorded in the audit log." />
      <div className="space-y-3">
        {SPECS.map((s) => {
          const v = draft[s.key];
          return (
            <Card key={s.key} className="space-y-2">
              <h2 className="font-semibold">{s.label}</h2>
              <p className="text-sm text-ink-500">{s.help} <span className="whitespace-nowrap">Default: {JSON.stringify(q.data!.defaults[s.key])}</span></p>
              <div className="flex flex-wrap items-end gap-3">
                {s.kind === 'number' ? <Field label="Value">{(p) => <Input {...p} type="number" min={s.min} max={s.max} className="w-32" value={String(v ?? '')} onChange={(e) => setDraft((d) => ({ ...d, [s.key]: Number(e.target.value) }))} />}</Field> : null}
                {s.kind === 'select' ? <Field label="Value">{(p) => <Select {...p} value={String(v ?? '')} onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}>{s.options?.map(([o, l]) => <option key={o} value={o}>{l}</option>)}</Select>}</Field> : null}
                {s.kind === 'boolean' ? <Field label="Value">{(p) => <Select {...p} value={v ? 'yes' : 'no'} onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value === 'yes' }))}><option value="no">Off</option><option value="yes">On</option></Select>}</Field> : null}
                {s.kind === 'hours' ? (
                  <>
                    <Field label="From hour (0–23)">{(p) => <Input {...p} type="number" min={0} max={23} className="w-28" value={String((v as number[] | undefined)?.[0] ?? '')} onChange={(e) => setDraft((d) => ({ ...d, [s.key]: [Number(e.target.value), (d[s.key] as number[])?.[1] ?? 7] }))} />}</Field>
                    <Field label="To hour (0–23)">{(p) => <Input {...p} type="number" min={0} max={23} className="w-28" value={String((v as number[] | undefined)?.[1] ?? '')} onChange={(e) => setDraft((d) => ({ ...d, [s.key]: [(d[s.key] as number[])?.[0] ?? 22, Number(e.target.value)] }))} />}</Field>
                  </>
                ) : null}
                <Button disabled={!changed(s.key)} loading={save.isPending && save.variables?.key === s.key} onClick={() => save.mutate({ key: s.key, value: draft[s.key] })}>Save</Button>
              </div>
            </Card>
          );
        })}
        <Alert tone="info" live={false}>Exam patterns (marks, timing, negative marking) are edited under Exams &amp; topics, not here.</Alert>
      </div>
    </>
  );
}
