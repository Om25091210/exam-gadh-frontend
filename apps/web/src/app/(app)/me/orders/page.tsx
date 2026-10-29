'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Badge, buttonClasses, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useApi } from '@/lib/auth';

const TONE = { created: 'neutral', paid: 'success', failed: 'danger', refunded: 'warning' } as const;

export default function OrdersPage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const q = useQuery({ queryKey: ['orders'], queryFn: () => api.orders() });
  return (
    <>
      <PageHeader title={t('me.orders')} />
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : q.data.length === 0 ? <EmptyState title={t('me.orders.empty')} /> : (
        <ul className="space-y-2">
          {q.data.map((o) => (
            <Card as="li" key={o.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{b(o.planNameEn, o.planNameHi)} · {t('plans.months', { n: o.months })}</p>
                <p className="text-sm text-ink-500">{fmt.dateTime(o.createdAt)} · ₹{fmt.number(o.amountPaise / 100, 2)}</p>
                <div className="mt-1 flex gap-2"><Badge tone={TONE[o.status]}>{t(`me.orders.status.${o.status}` as MessageKey)}</Badge>{o.couponCode ? <Badge>{o.couponCode}</Badge> : null}</div>
              </div>
              {o.invoiceNumber ? <Link href={`/me/orders/${o.id}`} className={buttonClasses('secondary', 'sm')}>{t('me.receipt')}</Link> : null}
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
