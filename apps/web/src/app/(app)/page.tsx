'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Avatar, Badge, buttonClasses, Card, ErrorState, ProgressBar, Section, Skeleton } from '@eg/ui';
import { Bell, Flame, Radio, PlayCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BattleCard } from '@/components/home/battle-card';
import { JourneyMap } from '@/components/home/journey-map';
import { useApi, useAuth } from '@/lib/auth';
import { formatClock } from '@/lib/time';

function HomeSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

export default function HomePage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['home'], queryFn: () => api.home() });
  const unread = useQuery({ queryKey: ['notifications', 'unread'], queryFn: () => api.unreadCount(), staleTime: 30_000 });

  if (q.isLoading) return <HomeSkeleton />;
  if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  const h = q.data;
  const name = user?.name ?? '';
  const first = name.split(' ')[0];
  const series = h.series[0];
  const mockNumber = series ? Math.min(series.total, series.attempted + 1) : 1;
  const live = h.live[0];
  const resume = h.continue[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
      <div className="space-y-4">
        {/* header: who, streak, notifications */}
        <header className="flex items-center gap-3">
          <Link href="/me" aria-label={t('nav.profile')} className="shrink-0 rounded-full ring-2 ring-white shadow-card">
            <Avatar name={name} src={user?.avatarUrl ?? null} size={48} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-ink-900">{t('home.greeting', { name: first })}</h1>
            <p className="flex items-center gap-1 text-sm text-ink-700">
              <Flame className={h.streak.activeToday ? 'size-4 text-accent-500' : 'size-4 text-ink-300'} aria-hidden />
              {h.streak.current > 0 ? `${fmt.number(h.streak.current)} ${t('home.streak')}` : t('home.streak.keep')}
            </p>
          </div>
          <Link href="/notifications" aria-label={t('nav.notifications')} className="relative grid size-11 place-items-center rounded-full bg-white shadow-card">
            <Bell className="size-5 text-primary-700" aria-hidden />
            {(unread.data?.unread ?? 0) > 0 ? <span aria-hidden className="absolute right-1 top-1 size-3 rounded-full bg-danger-600 ring-2 ring-white" /> : null}
          </Link>
        </header>

        {h.plan.expiringSoon ? (
          <Alert tone="warning">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{t('home.plan.expiring', { days: Math.min(...h.plan.active.map((p) => p.daysLeft)) })}</span>
              <Link href="/plans" className={buttonClasses('accent', 'sm')}>
                {t('home.plan.view')}
              </Link>
            </div>
          </Alert>
        ) : null}

        {/* one status strip: live test > test in progress */}
        {live ? (
          <Link href={`/tests/${live.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card">
            <span className={live.state === 'open' ? 'grid size-10 place-items-center rounded-xl bg-danger-50 text-danger-600' : 'grid size-10 place-items-center rounded-xl bg-info-50 text-info-700'}>
              <Radio className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{b(live.titleEn, live.titleHi)}</span>
              <span className="block text-sm text-ink-500">{live.state === 'open' ? t('strip.live.now') : live.startsAt ? t('home.live.upcoming', { time: fmt.dateTime(live.startsAt) }) : ''}</span>
            </span>
            <span className={buttonClasses('primary', 'sm')}>{live.state === 'open' ? t('strip.join') : t('strip.open')}</span>
          </Link>
        ) : resume ? (
          <Link href={`/attempt/${resume.attemptId}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-100 text-primary-700">
              <PlayCircle className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{b(resume.titleEn, resume.titleHi)}</span>
              <span className="block text-sm text-ink-500">
                {t('strip.progress')} · {formatClock(resume.remainingSec)}
              </span>
            </span>
            <span className={buttonClasses('primary', 'sm')}>{t('home.continue.resume')}</span>
          </Link>
        ) : null}

        <BattleCard />
      </div>

      <div className="lg:row-span-2 lg:col-start-2 lg:row-start-1">
        <JourneyMap avatarUrl={user?.avatarUrl ?? null} initial={(first[0] ?? 'E').toUpperCase()} mockHref={series ? `/series/${series.id}` : '/tests'} mockNumber={mockNumber} liveOpen={h.live.some((l) => l.state === 'open')} />
      </div>

      <div className="space-y-4 lg:col-start-1 lg:row-start-2">
        {h.dailyQuiz.available ? (
          <Card className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-ink-500">{t('home.daily')}</p>
              <p className="truncate font-bold">{b(h.dailyQuiz.test.titleEn, h.dailyQuiz.test.titleHi)}</p>
            </div>
            {h.dailyQuiz.done && h.dailyQuiz.result ? (
              <Link href={`/results/${h.dailyQuiz.result.attemptId}`} className="font-bold text-primary-700 underline">
                {fmt.number(h.dailyQuiz.result.score, 1)} / {fmt.number(h.dailyQuiz.result.maxScore, 1)}
              </Link>
            ) : (
              <Link href={`/tests/${h.dailyQuiz.test.id}`} className={buttonClasses('accent', 'sm')}>
                {t('tests.start')}
              </Link>
            )}
          </Card>
        ) : null}

        {h.series.length > 0 ? (
          <Section title={t('home.series')} className="mb-0">
            <ul className="space-y-2">
              {h.series.map((s) => (
                <Card as="li" key={s.id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Link href={`/series/${s.id}`} className="font-semibold hover:underline">
                      {b(s.titleEn, s.titleHi)}
                    </Link>
                    <Badge tone="info">{t('home.series.progress', { done: s.attempted, total: s.total })}</Badge>
                  </div>
                  <ProgressBar value={s.attempted} max={s.total} label={b(s.titleEn, s.titleHi)} />
                </Card>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
