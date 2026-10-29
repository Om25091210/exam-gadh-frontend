'use client';
import { useI18n } from '@eg/i18n';
import { Alert, buttonClasses, ErrorState, PageHeader, Skeleton } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

export default function TestLeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const { t, fmt, b } = useI18n();
  const api = useApi();
  const test = useQuery({ queryKey: ['test', id], queryFn: () => api.test(id) });
  const q = useQuery({ queryKey: ['test-leaderboard', id], queryFn: () => api.testLeaderboard(id, 50) });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={t(errorKey(q.error))} onRetry={() => q.refetch()} />;
  const d = q.data;
  return (
    <>
      <PageHeader title={t('leaderboard.title')} subtitle={test.data ? b(test.data.titleEn, test.data.titleHi) : undefined} actions={<Link href={`/tests/${id}`} className={buttonClasses('secondary', 'sm')}>{t('common.back')}</Link>} />
      {!d.released ? (
        <Alert tone="info">{t('leaderboard.notReleased')} {d.resultReleaseAt ? t('result.notReleased', { time: fmt.dateTime(d.resultReleaseAt) }) : null}</Alert>
      ) : (
        <div className="space-y-3">
          {d.me ? <Alert tone="success">{t('leaderboard.you', { rank: d.me.rank, total: d.total })}</Alert> : null}
          <LeaderboardTable entries={d.entries} />
          <p className="text-sm text-ink-500">{t('leaderboard.hidden')}</p>
        </div>
      )}
    </>
  );
}
