'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Badge, buttonClasses, Card, ErrorState, ProgressBar, Section, Skeleton } from '@eg/ui';
import { BarChart3, CalendarCheck, Flame, MessageCircleQuestion, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TrendChart } from '@/components/trend-chart';
import { useApi, useAuth } from '@/lib/auth';
import { formatClock } from '@/lib/time';

function HomeSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function HomePage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['home'], queryFn: () => api.home() });

  if (q.isLoading) return <HomeSkeleton />;
  if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  const h = q.data;
  const first = (user?.name ?? '').split(' ')[0];

  return (
    <>
      <section className="bg-hero relative mb-6 overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[var(--shadow-lift)] sm:p-7">
        <div aria-hidden className="absolute -right-10 -top-10 size-44 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -bottom-16 right-16 size-40 rounded-full bg-accent-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('home.greeting', { name: first })}</h1>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
              <Flame className={h.streak.activeToday ? 'size-4 text-accent-500' : 'size-4 text-white/60'} aria-hidden />
              {fmt.number(h.streak.current)} {t('home.streak')}
            </p>
            <p className="mt-2 text-primary-100">{h.streak.activeToday ? t('home.streak.today') : t('home.streak.keep')}</p>
          </div>
          {h.dailyQuiz.available ? (
            <div className="min-w-56 rounded-2xl bg-white/12 p-4 backdrop-blur ring-1 ring-white/20">
              <p className="text-sm text-primary-100">{t('home.daily')}</p>
              <p className="font-semibold">{b(h.dailyQuiz.test.titleEn, h.dailyQuiz.test.titleHi)}</p>
              {h.dailyQuiz.done && h.dailyQuiz.result ? (
                <Link href={`/results/${h.dailyQuiz.result.attemptId}`} className="mt-2 inline-block font-bold underline">
                  {fmt.number(h.dailyQuiz.result.score, 1)} / {fmt.number(h.dailyQuiz.result.maxScore, 1)}
                </Link>
              ) : (
                <Link href={`/tests/${h.dailyQuiz.test.id}`} className={buttonClasses('accent', 'sm', 'mt-2')}>
                  {t('tests.start')}
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <Section title={t('home.quick')}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ['/practice', 'nav.practice', BarChart3, 'bg-primary-50 text-primary-700'],
              ['/planner', 'nav.planner', CalendarCheck, 'bg-accent-100 text-accent-700'],
              ['/doubts', 'nav.doubts', MessageCircleQuestion, 'bg-info-50 text-info-700'],
              ['/leaderboard', 'nav.leaderboard', Trophy, 'bg-warning-50 text-warning-700'],
            ] as const
          ).map(([href, label, Icon, tone]) => (
            <li key={href}>
              <Link href={href} className="flex h-full flex-col items-start gap-3 rounded-card border border-line/80 bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="font-semibold">{t(label)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {h.plan.expiringSoon ? (
        <Alert tone="warning" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{t('home.plan.expiring', { days: Math.min(...h.plan.active.map((p) => p.daysLeft)) })}</span>
            <Link href="/plans" className={buttonClasses('accent', 'sm')}>
              {t('home.plan.view')}
            </Link>
          </div>
        </Alert>
      ) : null}

      {h.continue.length > 0 ? (
        <Section title={t('home.continue')}>
          <ul className="space-y-2">
            {h.continue.map((c) => (
              <Card as="li" key={c.attemptId} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b(c.titleEn, c.titleHi)}</p>
                  <p className="text-sm text-ink-500">
                    {t('home.continue.left', { time: formatClock(c.remainingSec) })} · {c.answered}/{c.total}
                  </p>
                </div>
                <Link href={`/attempt/${c.attemptId}`} className={buttonClasses('primary')}>
                  {t('home.continue.resume')}
                </Link>
              </Card>
            ))}
          </ul>
        </Section>
      ) : null}

      {h.live.length > 0 ? (
        <Section title={t('home.live')} className="mt-6">
          <ul className="space-y-2">
            {h.live.map((l) => (
              <Card as="li" key={l.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b(l.titleEn, l.titleHi)}</p>
                  <p className="text-sm text-ink-500">{l.state === 'open' ? t('home.live.open') : l.startsAt ? t('home.live.upcoming', { time: fmt.dateTime(l.startsAt) }) : ''}</p>
                </div>
                <Badge tone={l.state === 'open' ? 'success' : 'info'}>{t('tests.kind.live')}</Badge>
                <Link href={`/tests/${l.id}`} className={buttonClasses('secondary', 'sm')}>
                  {t('tests.instructions')}
                </Link>
              </Card>
            ))}
          </ul>
        </Section>
      ) : null}

      {h.series.length > 0 ? (
        <Section title={t('home.series')} className="mt-6">
          <ul className="grid gap-2 sm:grid-cols-2">
            {h.series.map((s) => (
              <Card as="li" key={s.id}>
                <Link href={`/series/${s.id}`} className="font-semibold hover:underline">
                  {b(s.titleEn, s.titleHi)}
                </Link>
                <p className="mb-2 text-sm text-ink-500">{t('home.series.progress', { done: s.attempted, total: s.total })}</p>
                <ProgressBar value={s.attempted} max={s.total} label={b(s.titleEn, s.titleHi)} />
              </Card>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title={t('home.trend')} className="mt-6">
        <Card>
          {h.trend.length > 0 ? (
            <TrendChart points={h.trend.map((p) => ({ label: b(p.titleEn, p.titleHi), pct: p.pct }))} summary={h.trend.map((p) => `${b(p.titleEn, p.titleHi)}: ${Math.round(p.pct)}%`).join('; ')} />
          ) : (
            <p className="text-ink-500">{t('common.none')}</p>
          )}
        </Card>
      </Section>

      <Section title={t('home.weak')}>
        {h.weakTopics.length > 0 ? (
          <ul className="space-y-2">
            {h.weakTopics.map((w) => (
              <Card as="li" key={w.topicCode} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b(w.nameEn, w.nameHi)}</p>
                  <p className="text-sm text-ink-500">
                    {fmt.number(w.accuracyPct)}% · {t('common.questions', { n: w.attempted })}
                  </p>
                </div>
                <Link href={`/practice?topic=${encodeURIComponent(w.topicCode)}`} className={buttonClasses('secondary', 'sm')}>
                  {t('home.weak.practice')}
                </Link>
              </Card>
            ))}
          </ul>
        ) : (
          <p className="text-ink-500">{t('home.weak.empty')}</p>
        )}
      </Section>

      {h.announcements.length > 0 ? (
        <Section title={t('home.updates')} action={<Link href="/learn/updates" className="text-sm font-semibold text-primary-700 underline">{t('common.all')}</Link>}>
          <ul className="space-y-2">
            {h.announcements.map((a) => (
              <Card as="li" key={a.id}>
                <p className="font-semibold">{b(a.titleEn, a.titleHi)}</p>
                <p className="text-sm text-ink-700">{b(a.bodyEn, a.bodyHi)}</p>
              </Card>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
