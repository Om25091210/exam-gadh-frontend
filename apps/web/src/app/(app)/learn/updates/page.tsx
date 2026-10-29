'use client';
import { useI18n } from '@eg/i18n';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Section, Skeleton } from '@eg/ui';
import { Pin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/auth';

export default function UpdatesPage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const q = useQuery({ queryKey: ['updates'], queryFn: () => api.updates() });
  if (q.isLoading) return <Skeleton className="h-48" />;
  if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  const { announcements, calendar } = q.data;
  return (
    <>
      <PageHeader title={t('updates.title')} />
      <Section title={t('updates.calendar')}>
        {calendar.length === 0 ? <EmptyState title={t('updates.calendar.empty')} /> : (
          <ol className="space-y-2">
            {calendar.map((c) => (
              <Card as="li" key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-semibold">{b(c.labelEn, c.labelHi)}</p>{c.stage ? <p className="text-sm text-ink-500">{c.stage}</p> : null}</div>
                <div className="text-right"><p className="font-semibold tabular-nums">{fmt.date(c.date)}</p>{c.sourceUrl ? <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-700 underline">{t('updates.source')}</a> : null}</div>
              </Card>
            ))}
          </ol>
        )}
      </Section>
      <Section title={t('updates.announcements')}>
        {announcements.length === 0 ? <EmptyState title={t('updates.empty')} /> : (
          <ul className="space-y-2">
            {announcements.map((a) => (
              <Card as="li" key={a.id}>
                <div className="mb-1 flex items-center gap-2">{a.pinned ? <Badge tone="warning"><Pin className="size-3" aria-hidden /></Badge> : null}<span className="text-sm text-ink-500">{fmt.date(a.publishedAt)}</span></div>
                <p className="font-semibold">{b(a.titleEn, a.titleHi)}</p>
                <p className="text-ink-700">{b(a.bodyEn, a.bodyHi)}</p>
                {a.linkUrl ? <a href={a.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-700 underline">{t('updates.source')}</a> : null}
              </Card>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
