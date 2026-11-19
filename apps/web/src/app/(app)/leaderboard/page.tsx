'use client';
import { useI18n } from '@eg/i18n';
import { Alert, ErrorState, Skeleton, Tabs } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LeaderboardTable, Podium } from '@/components/leaderboard-table';
import { useApi } from '@/lib/auth';

export default function LeaderboardPage() {
  const { t, fmt } = useI18n();
  const api = useApi();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const q = useQuery({ queryKey: ['leaderboard', period], queryFn: () => api.overallLeaderboard(period, 50) });
  return (
    <>
      <section className="mb-5 overflow-hidden rounded-[2rem] bg-hero p-5 pb-6 text-white shadow-[var(--shadow-lift)]">
        <h1 className="text-2xl font-extrabold tracking-tight">{t('leaderboard.overall')}</h1>
        <p className="text-sm text-white/85">{t('leaderboard.overall.note')}</p>
        {q.data && q.data.entries.length > 0 ? <Podium entries={q.data.entries} /> : null}
      </section>
      <div className="mb-4"><Tabs label={t('leaderboard.overall')} value={period} onChange={(v) => setPeriod(v as typeof period)} items={(['week', 'month', 'all'] as const).map((p) => ({ id: p, label: t(`leaderboard.period.${p}`) }))} /></div>
      {q.isLoading ? <Skeleton className="h-64" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : (
        <div className="space-y-3">
          {q.data.me ? <Alert tone="success">{t('leaderboard.you', { rank: fmt.number(q.data.me.rank), total: fmt.number(q.data.total) })}</Alert> : null}
          <LeaderboardTable entries={q.data.entries.slice(3)} showTests />
          <p className="text-sm text-ink-500">{t('leaderboard.hidden')}</p>
        </div>
      )}
    </>
  );
}
