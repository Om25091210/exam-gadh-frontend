'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { buttonClasses, Card, EmptyState, ErrorState, PageHeader, ProgressBar, Section, Select, Skeleton } from '@eg/ui';
import { AlertTriangle, CheckCircle2, CircleDashed, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { TopicStat } from '@eg/api';
import { TrendChart } from '@/components/trend-chart';
import { useApi } from '@/lib/auth';

const STRENGTH_LOOK: Record<TopicStat['strength'], { box: string; icon: typeof Minus }> = {
  weak: { box: 'border-danger-600 bg-danger-50 text-danger-700', icon: AlertTriangle },
  ok: { box: 'border-warning-700/50 bg-warning-50 text-warning-700', icon: Minus },
  strong: { box: 'border-success-600 bg-success-50 text-success-600', icon: CheckCircle2 },
  new: { box: 'border-line bg-surface text-ink-500', icon: CircleDashed },
};

export default function AnalyticsPage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const [days, setDays] = useState(90);
  const q = useQuery({ queryKey: ['analytics', days], queryFn: () => api.analytics(days) });
  if (q.isLoading) return <div className="space-y-3" aria-hidden><Skeleton className="h-10 w-48" /><Skeleton className="h-64" /></div>;
  if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  const a = q.data;
  const hasData = a.topics.length > 0;

  return (
    <>
      <PageHeader title={t('analytics.title')} actions={
        <div>
          <label className="sr-only" htmlFor="an-range">{t('analytics.range')}</label>
          <Select id="an-range" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[30, 90, 180].map((d) => <option key={d} value={d}>{t('analytics.days', { n: d })}</option>)}
          </Select>
        </div>
      } />

      <Section title={t('analytics.insights')}>
        <ul className="space-y-2">
          {a.insights.map((i, n) => (
            <Card as="li" key={n} className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 flex-1">{b(i.messageEn, i.messageHi)}</p>
              {i.action?.type === 'practice_topic' ? <Link href={`/practice?topic=${encodeURIComponent(i.action.topicCode ?? '')}`} className={buttonClasses('secondary', 'sm')}>{t('home.weak.practice')}</Link> : null}
              {i.action?.type === 'take_diagnostic' ? <Link href="/tests?kind=diagnostic" className={buttonClasses('primary', 'sm')}>{t('analytics.diagnostic')}</Link> : null}
            </Card>
          ))}
        </ul>
      </Section>

      {!hasData ? <EmptyState title={t('analytics.noData')} /> : (
        <>
          <Section title={t('analytics.heatmap')}>
            <p className="mb-2 text-sm text-ink-500">{t('analytics.heatmap.note')}</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {a.topics.map((x) => {
                const look = STRENGTH_LOOK[x.strength];
                return (
                  <li key={x.topicCode} className={`rounded-xl border-2 p-3 ${look.box}`}>
                    <p className="flex items-start justify-between gap-1 text-sm font-semibold text-ink-900"><span className="line-clamp-2">{b(x.nameEn, x.nameHi)}</span><look.icon className="size-4 shrink-0" aria-hidden /></p>
                    <p className="text-lg font-bold">{x.accuracyPct == null ? '—' : `${fmt.number(x.accuracyPct)}%`}</p>
                    <p className="text-xs">{t(`analytics.strength.${x.strength}` as MessageKey)} · {t('common.questions', { n: x.attempted })}</p>
                  </li>
                );
              })}
            </ul>
          </Section>

          {a.subjects.length > 0 ? (
            <Section title={t('analytics.subjects')}>
              <Card className="space-y-3">
                {a.subjects.map((s) => (
                  <div key={s.subjectCode}>
                    <div className="mb-1 flex justify-between text-sm"><span>{b(s.nameEn, s.nameHi)}</span><span className="tabular-nums">{s.accuracyPct == null ? '—' : `${fmt.number(s.accuracyPct)}%`}</span></div>
                    <ProgressBar value={s.accuracyPct ?? 0} label={b(s.nameEn, s.nameHi)} />
                  </div>
                ))}
              </Card>
            </Section>
          ) : null}

          {a.progress.length > 0 ? (
            <Section title={t('analytics.progress')}>
              <Card>
                <TrendChart points={a.progress.map((p) => ({ label: p.weekStarting, pct: p.avgPct }))} summary={a.progress.map((p) => t('analytics.progress.week', { date: p.weekStarting, pct: fmt.number(p.avgPct, 1), n: p.tests })).join('; ')} />
              </Card>
            </Section>
          ) : null}

          <Section title={t('analytics.time')}>
            <Card className="space-y-1">
              {a.time.avgSecPerAnswered != null ? <p>{t('analytics.time.avg', { n: a.time.avgSecPerAnswered })}</p> : null}
              <p>{t('analytics.time.rushed', { n: a.time.rushedWrongAnswers })}</p>
              <p>{t('analytics.time.slow', { n: a.time.slowCorrectAnswers })}</p>
              <p className="text-ink-500">{t('analytics.marks', { tests: a.marks.testsTaken, n: fmt.number(a.marks.negativeDeducted, 2) })}</p>
            </Card>
          </Section>
        </>
      )}
    </>
  );
}
