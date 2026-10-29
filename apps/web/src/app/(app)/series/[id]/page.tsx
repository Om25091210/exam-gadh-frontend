'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Alert, Badge, Button, buttonClasses, Card, ErrorState, PageHeader, ProgressBar, Skeleton } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['series', id], queryFn: () => api.seriesDetail(id) });
  const toggle = useMutation({
    mutationFn: (join: boolean) => (join ? api.enroll(id).then(() => undefined) : api.unenroll(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['series'] }),
  });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={t(errorKey(q.error))} onRetry={() => q.refetch()} />;
  const s = q.data;
  return (
    <>
      <PageHeader title={b(s.titleEn, s.titleHi)} subtitle={b(s.descEn, s.descHi)} actions={
        s.locked ? <Link href="/plans" className={buttonClasses('accent')}>{t('tests.paid.cta')}</Link>
          : <Button variant={s.enrolled ? 'secondary' : 'primary'} loading={toggle.isPending} onClick={() => toggle.mutate(!s.enrolled)}>{s.enrolled ? t('series.leave') : t('series.enroll')}</Button>
      } />
      {toggle.isError ? <Alert tone="danger" className="mb-3">{t(errorKey(toggle.error))}</Alert> : null}
      <Card className="mb-4">
        <p className="mb-2 text-sm text-ink-500">{t('series.progress', { done: s.progress.attempted, total: s.progress.total })}</p>
        <ProgressBar value={s.progress.attempted} max={s.progress.total} label={b(s.titleEn, s.titleHi)} />
      </Card>
      <ol className="space-y-2">
        {s.tests.map((x, i) => (
          <Card as="li" key={x.id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold"><span className="mr-2 text-ink-500 tabular-nums">{i + 1}.</span>{b(x.titleEn, x.titleHi)}</p>
              <div className="mt-1 flex flex-wrap gap-2"><Badge>{t(`tests.kind.${x.kind}` as MessageKey)}</Badge>{x.bestPct != null ? <Badge tone="success">{t('series.best', { n: fmt.number(x.bestPct, 1) })}</Badge> : null}</div>
            </div>
            <Link href={`/tests/${x.id}`} className={buttonClasses(x.locked ? 'accent' : 'secondary', 'sm')}>{x.locked ? t('tests.paid.cta') : t('tests.instructions')}</Link>
          </Card>
        ))}
      </ol>
    </>
  );
}
