'use client';
import { useI18n } from '@eg/i18n';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Pagination, Skeleton, Checkbox } from '@eg/ui';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/auth';
import { notificationHref } from '@/lib/notification-link';

export default function NotificationsPage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const qc = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['notifications', 'list', unreadOnly, page], queryFn: () => api.notifications({ page, pageSize: 20, unread: unreadOnly }), placeholderData: keepPreviousData });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const read = useMutation({ mutationFn: (id: string) => api.markRead(id), onSuccess: refresh });
  const readAll = useMutation({ mutationFn: () => api.markAllRead(), onSuccess: refresh });

  return (
    <>
      <PageHeader title={t('notifications.title')} actions={<Button variant="secondary" size="sm" onClick={() => readAll.mutate()} loading={readAll.isPending} disabled={!q.data?.unread}>{t('notifications.markAll')}</Button>} />
      <Checkbox checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }} label={t('notifications.unreadOnly')} />
      {q.isLoading ? <Skeleton className="mt-3 h-40" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : q.data.items.length === 0 ? <EmptyState title={t('notifications.empty')} /> : (
        <>
          <ul className="mt-3 space-y-2">
            {q.data.items.map((n) => {
              const href = notificationHref(n);
              const body = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{b(n.titleEn, n.titleHi)}</p>
                    {!n.read ? <Badge tone="danger">•</Badge> : null}
                  </div>
                  <p className="text-ink-700">{b(n.bodyEn, n.bodyHi)}</p>
                  <p className="mt-1 text-xs text-ink-500">{fmt.dateTime(n.createdAt)}</p>
                </>
              );
              return (
                <Card as="li" key={n.id} className={n.read ? '' : 'border-primary-500 bg-primary-50'}>
                  {href ? <Link href={href} onClick={() => !n.read && read.mutate(n.id)} className="block">{body}</Link> : <button type="button" className="block w-full text-left" onClick={() => !n.read && read.mutate(n.id)}>{body}</button>}
                </Card>
              );
            })}
          </ul>
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
