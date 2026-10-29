'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import type { DoubtStatus } from '@eg/api';
import { Alert, Badge, buttonClasses, Card, EmptyState, ErrorState, PageHeader, Pagination, Skeleton, Tabs } from '@eg/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/auth';

const TONE = { open: 'warning', answered: 'success', closed: 'neutral' } as const;

export default function DoubtsPage() {
  const { t, fmt } = useI18n();
  const api = useApi();
  const [status, setStatus] = useState<'all' | DoubtStatus>('all');
  const [page, setPage] = useState(1);
  const quota = useQuery({ queryKey: ['doubt-quota'], queryFn: () => api.doubtQuota() });
  const q = useQuery({ queryKey: ['doubts', status, page], queryFn: () => api.doubts({ page, status: status === 'all' ? undefined : status }), placeholderData: keepPreviousData });

  return (
    <>
      <PageHeader title={t('doubts.title')} actions={<Link href="/doubts/new" className={buttonClasses('primary')}>{t('doubts.new')}</Link>} />
      {quota.data ? (
        <Alert tone="info" className="mb-4" live={false}>
          <p>{t('doubts.quota.day', { used: quota.data.daily.used, limit: quota.data.daily.limit })}</p>
          {quota.data.monthly ? <p>{t('doubts.quota.month', { used: quota.data.monthly.used, limit: quota.data.monthly.limit })}</p> : null}
        </Alert>
      ) : null}
      <Tabs label={t('doubts.title')} value={status} onChange={(v) => { setStatus(v as typeof status); setPage(1); }} items={[{ id: 'all', label: t('common.all') }, { id: 'open', label: t('doubts.status.open') }, { id: 'answered', label: t('doubts.status.answered') }, { id: 'closed', label: t('doubts.status.closed') }]} />
      {q.isLoading ? <Skeleton className="mt-4 h-40" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : q.data.items.length === 0 ? <div className="mt-4"><EmptyState title={t('doubts.empty')} /></div> : (
        <>
          <ul className="mt-4 space-y-2">
            {q.data.items.map((d) => (
              <Card as="li" key={d.id}>
                <Link href={`/doubts/${d.id}`} className="block">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[d.status]}>{t(`doubts.status.${d.status}` as MessageKey)}</Badge>
                    <span className="text-sm text-ink-500">{t(`doubts.context.${d.contextType}` as MessageKey)}</span>
                    <span className="ml-auto text-sm text-ink-500">{fmt.dateTime(d.createdAt)}</span>
                  </div>
                  <p className="line-clamp-2">{d.preview}</p>
                  {d.status === 'open' ? <p className="mt-1 text-sm text-ink-500">{t('doubts.sla', { time: fmt.dateTime(d.slaDueAt) })}</p> : null}
                </Link>
              </Card>
            ))}
          </ul>
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
