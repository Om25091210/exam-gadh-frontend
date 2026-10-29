'use client';
import { useI18n } from '@eg/i18n';
import { buttonClasses, EmptyState, ErrorState, PageHeader, Skeleton, Tabs } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ReviewCard, useStudyMarks } from '@/components/review-card';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

type Filter = 'all' | 'wrong' | 'skipped' | 'correct';

export default function ReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t } = useI18n();
  const api = useApi();
  const [filter, setFilter] = useState<Filter>('all');
  const q = useQuery({ queryKey: ['review', attemptId], queryFn: () => api.review(attemptId), retry: false, staleTime: 5 * 60_000 });
  const marks = useStudyMarks();

  if (q.isLoading) return <div className="space-y-3" aria-hidden><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;
  if (q.isError || !q.data) return <ErrorState message={t(errorKey(q.error))} onRetry={() => q.refetch()} />;
  const all = q.data.questions;
  const count = (o: Filter) => (o === 'all' ? all.length : all.filter((x) => x.outcome === o).length);
  const shown = filter === 'all' ? all : all.filter((x) => x.outcome === filter);

  return (
    <>
      <PageHeader title={t('review.title')} actions={<Link href={`/results/${attemptId}`} className={buttonClasses('secondary', 'sm')}>{t('result.title')}</Link>} />
      <div className="mb-4">
        <Tabs
          label={t('review.title')}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          items={(['all', 'wrong', 'skipped', 'correct'] as const).map((f) => ({ id: f, label: t(`review.filter.${f}`), count: count(f) }))}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState title={t('review.empty')} />
      ) : (
        <div className="space-y-4">
          {shown.map((x) => <ReviewCard key={x.qid} q={x} attemptId={attemptId} bookmarked={marks.bookmarked.has(x.questionId)} note={marks.notes.get(x.questionId)} />)}
        </div>
      )}
    </>
  );
}
