'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Button, buttonClasses, Card, ErrorState, Skeleton } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const q = useQuery({ queryKey: ['receipt', id], queryFn: () => api.receipt(id) });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={t(errorKey(q.error))} onRetry={() => q.refetch()} />;
  const r = q.data;
  return (
    <>
      <div className="mb-4 flex gap-2 print:hidden">
        <Link href="/me/orders" className={buttonClasses('secondary', 'sm')}>{t('common.back')}</Link>
        <Button size="sm" onClick={() => window.print()}>{t('me.receipt.print')}</Button>
      </div>
      <Card className="mx-auto max-w-xl space-y-4 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div><h1 className="text-2xl font-bold">ExamGadh</h1><p className="text-ink-500">{t('me.receipt.number', { n: r.number })}</p></div>
          <p className="text-right text-sm text-ink-500">{fmt.date(r.issuedAt)}</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-ink-500">{t('me.receipt.customer')}</dt><dd>{r.customer.name}<br />{r.customer.email}</dd>
          <dt className="text-ink-500">{t('me.plan')}</dt><dd>{b(r.plan.nameEn, r.plan.nameHi)} · {t('plans.months', { n: r.months })}</dd>
          {r.couponCode ? <><dt className="text-ink-500">{t('plans.coupon')}</dt><dd>{r.couponCode}</dd></> : null}
          {r.paymentId ? <><dt className="text-ink-500">{t('me.receipt.paymentId')}</dt><dd className="break-all">{r.paymentId}</dd></> : null}
          {r.method ? <><dt className="text-ink-500">{t('me.receipt.method')}</dt><dd>{r.method}</dd></> : null}
        </dl>
        <p className="border-t border-line pt-3 text-right text-2xl font-bold">₹{fmt.number(r.amountPaise / 100, 2)}</p>
        <Alert tone="neutral" live={false}>{t('me.receipt.note')}</Alert>
      </Card>
    </>
  );
}
