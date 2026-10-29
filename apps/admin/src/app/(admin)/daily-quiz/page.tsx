'use client';
import { Alert, Button, Card, EmptyState, ErrorState, Field, Input, PageHeader, Select, Skeleton, Table, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

export default function DailyQuizPage() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [testId, setTestId] = useState('');
  const list = useQuery({ queryKey: ['daily-quiz'], queryFn: () => api.dailyQuizList() });
  const tests = useQuery({ queryKey: ['admin-tests', 'daily-pick'], queryFn: () => api.adminTests({ state: 'published', pageSize: 100 }) });
  const set = useMutation({ mutationFn: () => api.setDailyQuiz(date, testId), onSuccess: () => { toast.show('Daily quiz set', 'success'); void qc.invalidateQueries({ queryKey: ['daily-quiz'] }); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const titleOf = (id: string) => tests.data?.items.find((t) => t.id === id)?.titleEn ?? id;
  return (
    <>
      <PageHeader title="Daily quiz" subtitle="The test students see as today's quiz on their home screen. Dates are India dates." />
      {can('content:write') ? (
        <Card className="mb-4 grid items-end gap-3 sm:grid-cols-[10rem_1fr_auto]">
          <Field label="Date">{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label="Published test">{(p) => <Select {...p} value={testId} onChange={(e) => setTestId(e.target.value)}><option value="">Choose a test</option>{tests.data?.items.map((t) => <option key={t.id} value={t.id}>{t.titleEn}</option>)}</Select>}</Field>
          <Button disabled={!date || !testId} loading={set.isPending} onClick={() => set.mutate()}>Set quiz</Button>
        </Card>
      ) : <Alert tone="info" live={false}>You can view the schedule but not change it.</Alert>}
      {list.isLoading ? <Skeleton className="h-32" /> : list.isError || !list.data ? <ErrorState message={adminErrorText(list.error)} onRetry={() => list.refetch()} /> : (
        <Table caption="Daily quiz schedule" empty={<EmptyState title="No daily quiz scheduled" />} columns={[{ key: 'd', header: 'Date' }, { key: 't', header: 'Test' }]} rows={list.data.map((x) => ({ key: x.date, cells: { d: x.date, t: x.test?.titleEn ?? titleOf(x.testId) } }))} />
      )}
    </>
  );
}
