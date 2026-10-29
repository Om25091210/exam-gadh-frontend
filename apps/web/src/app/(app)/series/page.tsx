'use client';
import { useI18n } from '@eg/i18n';
import { Badge, buttonClasses, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@eg/ui';
import { Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useApi } from '@/lib/auth';

export default function SeriesPage() {
  const { t, b } = useI18n();
  const api = useApi();
  const q = useQuery({ queryKey: ['series'], queryFn: () => api.series() });
  return (
    <>
      <PageHeader title={t('series.title')} />
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : q.data.length === 0 ? <EmptyState title={t('series.empty')} /> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {q.data.map((s) => (
            <Card as="li" key={s.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {s.enrolled ? <Badge tone="success">{t('series.enrolled')}</Badge> : null}
                {s.access === 'paid' ? <Badge tone="warning">{s.locked ? <Lock className="size-3" aria-hidden /> : null}{t('common.paid')}</Badge> : <Badge tone="info">{t('common.free')}</Badge>}
              </div>
              <h2 className="font-semibold">{b(s.titleEn, s.titleHi)}</h2>
              <p className="text-sm text-ink-500">{b(s.descEn, s.descHi)}</p>
              <p className="text-sm">{t('series.tests', { n: s.tests })}</p>
              <Link href={`/series/${s.id}`} className={buttonClasses('secondary', 'sm', 'mt-auto self-start')}>{t('tests.instructions')}</Link>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
