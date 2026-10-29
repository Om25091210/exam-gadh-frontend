'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Badge, buttonClasses, Card, ErrorState, PageHeader, ProgressBar, Section, Skeleton, Stat, Table } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ApiError } from '@eg/api';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';
import { formatSpent } from '@/lib/time';

export default function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const router = useRouter();
  const q = useQuery({ queryKey: ['result', attemptId], queryFn: () => api.result(attemptId), retry: false });
  const testId = q.data?.testId;
  const test = useQuery({ queryKey: ['test', testId], queryFn: () => api.test(testId!), enabled: !!testId });

  useEffect(() => {
    // still running: go back to the exam hall
    if (q.error instanceof ApiError && q.error.code === 'NOT_SUBMITTED') router.replace(`/attempt/${attemptId}`);
  }, [q.error, attemptId, router]);

  if (q.isLoading) return <div className="space-y-3" aria-hidden><Skeleton className="h-10 w-64" /><Skeleton className="h-40" /></div>;
  if (q.isError || !q.data) return <ErrorState message={t(errorKey(q.error))} onRetry={() => q.refetch()} />;
  const r = q.data;
  const title = test.data ? b(test.data.titleEn, test.data.titleHi) : t('result.title');

  if (!r.released) {
    return (
      <>
        <PageHeader title={title} />
        <Alert tone="info" title={t('result.wait')}>{t('result.notReleased', { time: fmt.dateTime(r.resultReleaseAt) })}</Alert>
        <Link href="/tests" className={buttonClasses('secondary', 'md', 'mt-4')}>{t('result.backToTests')}</Link>
      </>
    );
  }

  const pct = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0;
  const weakest = [...r.topics].filter((x) => x.attempted >= 2 && x.accuracyPct !== null).sort((a, z) => (a.accuracyPct ?? 0) - (z.accuracyPct ?? 0))[0];
  return (
    <>
      <PageHeader title={title} subtitle={t('result.title')} />
      <div className="mb-4 flex flex-wrap gap-2">
        {!r.isRanked ? <Badge tone="info">{t('tests.practiceMode')}</Badge> : null}
        {r.finalizedBy === 'auto_timer' ? <Badge tone="warning">{t('tests.status.auto_submitted')}</Badge> : null}
      </div>
      {r.finalizedBy === 'auto_timer' ? <Alert tone="warning" className="mb-4">{t('result.autoSubmitted')}</Alert> : null}

      <Card className="mb-4">
        <p className="text-sm text-ink-500">{t('result.score')}</p>
        <p className="text-4xl font-bold">{fmt.number(r.score, 2)} <span className="text-xl font-medium text-ink-500">/ {fmt.number(r.maxScore, 2)}</span></p>
        <div className="mt-2"><ProgressBar value={Math.max(0, pct)} label={t('result.score')} /></div>
        {r.qualifying ? (
          <div className="mt-3 space-y-1">
            <p className="text-sm text-ink-500">{t('result.qualify', { pct: r.qualifying.requiredPct })}</p>
            <Badge tone={r.qualifying.general ? 'success' : 'danger'}>{r.qualifying.general ? t('result.qualified') : t('result.notQualified')}</Badge>
          </div>
        ) : null}
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('result.rank')} value={r.rank ? fmt.number(r.rank) : '—'} hint={r.rank ? t('result.rankOf', { n: fmt.number(r.rankedAttempters) }) : t('result.practiceOnly')} />
        <Stat label={t('result.percentile')} value={r.percentile != null ? fmt.number(r.percentile, 1) : '—'} />
        <Stat label={t('result.accuracy')} value={`${fmt.number(r.accuracyPct, 1)}%`} />
        <Stat label={t('result.time')} value={formatSpent(r.timeSpentSec)} />
        <Stat label={t('result.correct')} value={r.correct} tone="good" />
        <Stat label={t('result.wrong')} value={r.wrong} tone="bad" />
        <Stat label={t('result.skipped')} value={r.skipped} />
        <Stat label={t('result.negative')} value={fmt.number(r.negativeDeducted, 2)} />
      </div>

      {r.comparison.topperScore != null ? (
        <Section title={t('result.compare')}>
          <Card className="space-y-3">
            {[
              { label: t('result.you'), v: r.score },
              { label: t('result.average'), v: r.comparison.averageScore ?? 0 },
              { label: t('result.topper'), v: r.comparison.topperScore },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><span className="font-semibold tabular-nums">{fmt.number(row.v, 2)}</span></div>
                <ProgressBar value={Math.max(0, row.v)} max={Math.max(r.maxScore, 1)} label={row.label} tone={row.label === t('result.you') ? 'primary' : 'accent'} />
              </div>
            ))}
          </Card>
        </Section>
      ) : null}

      {r.sections.length > 1 ? (
        <Section title={t('result.sections')}>
          <Table
            caption={t('result.sections')}
            columns={[{ key: 'n', header: t('result.sectionCol') }, { key: 's', header: t('result.scoreCol') }, { key: 'c', header: t('result.correct') }, { key: 'w', header: t('result.wrong') }, { key: 'k', header: t('result.skipped') }]}
            rows={r.sections.map((s) => ({ key: String(s.position), cells: { n: b(s.nameEn, s.nameHi), s: `${fmt.number(s.score, 2)} / ${fmt.number(s.maxScore, 2)}`, c: s.correct, w: s.wrong, k: s.skipped } }))}
          />
        </Section>
      ) : null}

      {r.topics.length > 0 ? (
        <Section title={t('result.topics')}>
          <Table
            caption={t('result.topics')}
            columns={[{ key: 'n', header: t('result.topicCol') }, { key: 'a', header: t('result.accuracyCol') }, { key: 'c', header: t('result.correct') }, { key: 'w', header: t('result.wrong') }, { key: 't', header: t('result.timeCol') }]}
            rows={r.topics.map((x) => ({ key: x.code, cells: { n: b(x.nameEn, x.nameHi), a: x.accuracyPct == null ? '—' : <span className="inline-flex items-center gap-2"><span className="w-10 tabular-nums">{fmt.number(x.accuracyPct)}%</span><span className="inline-block w-20"><ProgressBar value={x.accuracyPct} label={b(x.nameEn, x.nameHi)} /></span></span>, c: x.correct, w: x.wrong, t: formatSpent(x.timeSec) } }))}
          />
        </Section>
      ) : null}

      <Section title={t('result.nextStep')}>
        <div className="flex flex-wrap gap-2">
          <Link href={`/results/${attemptId}/review`} className={buttonClasses('primary')}>{t('result.review')}</Link>
          {r.isRanked ? <Link href={`/tests/${r.testId}/leaderboard`} className={buttonClasses('secondary')}>{t('result.leaderboard')}</Link> : null}
          <Link href={`/tests/${r.testId}`} className={buttonClasses('secondary')}>{t('result.retry')}</Link>
          {weakest ? <Link href={`/practice?topic=${encodeURIComponent(weakest.code)}`} className={buttonClasses('accent')}>{t('result.weakHint')}: {b(weakest.nameEn, weakest.nameHi)}</Link> : null}
          <Link href="/tests" className={buttonClasses('ghost')}>{t('result.backToTests')}</Link>
        </div>
      </Section>
    </>
  );
}
