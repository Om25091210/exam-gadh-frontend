'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Badge, Button, EmptyState, ErrorState, PageHeader, Select, Skeleton } from '@eg/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QuestionCard } from '@/components/question-card';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';
import { Alert } from '@eg/ui';

export default function RevisionPage() {
  const { t, b } = useI18n();
  const api = useApi();
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: () => api.subjects(), staleTime: 10 * 60_000 });
  const q = useQuery({ queryKey: ['revision', topic], queryFn: () => api.revision({ topicCode: topic || undefined }) });
  const make = useMutation({ mutationFn: () => api.practice({ source: 'revision', count: 10 }), onSuccess: (r) => router.push(`/tests/${r.testId}`) });
  return (
    <>
      <PageHeader title={t('revision.title')} actions={<Button onClick={() => make.mutate()} loading={make.isPending} disabled={!q.data?.total}>{t('practice.revision.create')}</Button>} />
      <div className="mb-4 max-w-xs">
        <label className="sr-only" htmlFor="rev-topic">{t('practice.topic.pick')}</label>
        <Select id="rev-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">{t('common.all')}</option>
          {subjects.data?.map((s) => <optgroup key={s.code} label={b(s.nameEn, s.nameHi)}>{s.topics.map((x) => <option key={x.code} value={x.code}>{b(x.nameEn, x.nameHi)}</option>)}</optgroup>)}
        </Select>
      </div>
      {make.isError ? <Alert tone="danger" className="mb-4">{t(errorKey(make.error))}</Alert> : null}
      {q.isLoading ? <Skeleton className="h-48" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : q.data.questions.length === 0 ? <EmptyState title={t('revision.empty')} /> : (
        <div className="space-y-4">
          {q.data.questions.map((x) => <QuestionCard key={x.questionId} q={x} badges={x.reasons.map((r) => <Badge key={r} tone={r === 'wrong' ? 'danger' : 'info'}>{t(`revision.reason.${r}` as MessageKey)}</Badge>)} />)}
        </div>
      )}
    </>
  );
}
