'use client';
import { useI18n } from '@eg/i18n';
import { Alert, ErrorState, PageHeader, Skeleton, Tabs } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { useApi } from '@/lib/auth';

export default function LeaderboardPage() {
  const { t, fmt } = useI18n();
  const api = useApi();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const q = useQuery({ queryKey: ['leaderboard', period], queryFn: () => api.overallLeaderboard(period, 50) });
  return (
    <>
      <PageHeader title={t('leaderboard.overall')} subtitle={t('leaderboard.overall.note')} />
      <div className="mb-4"><Tabs label={t('leaderboard.overall')} value={period} onChange={(v) => setPeriod(v as typeof period)} items={(['week', 'month', 'all'] as const).map((p) => ({ id: p, label: t(`leaderboard.period.${p}`) }))} /></div>
      {q.isLoading ? <Skeleton className="h-64" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : (
        <div className="space-y-3">
          {q.data.me ? <Alert tone="success">{t('leaderboard.you', { rank: fmt.number(q.data.me.rank), total: fmt.number(q.data.total) })}</Alert> : null}
          <LeaderboardTable entries={q.data.entries} showTests />
          <p className="text-sm text-ink-500">{t('leaderboard.hidden')}</p>
        </div>
      )}
    </>
  );
}
