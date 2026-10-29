'use client';
import type { BillingPlan } from '@eg/api';
import { ApiError } from '@eg/api';
import { useI18n } from '@eg/i18n';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, PageHeader, Section, Skeleton, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useApi, useAuth } from '@/lib/auth';
import { errorKey } from '@/lib/errors';
import { openCheckout } from '@/lib/razorpay';

type Months = 3 | 6 | 12;

function PlanCard({ plan, busy, onBuy }: { plan: BillingPlan; busy: boolean; onBuy: (months: Months) => void }) {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const exams = useQuery({ queryKey: ['exams'], queryFn: () => api.exams(), staleTime: 10 * 60_000 });
  const names = plan.examIds.length === 0 ? t('plans.allExams') : plan.examIds.map((id) => { const e = exams.data?.find((x) => x.id === id); return e ? b(e.shortEn, e.shortHi) : id; }).join(', ');
  const options = (['3', '6', '12'] as const).filter((m) => plan.prices[m] != null);
  return (
    <Card as="li" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{b(plan.nameEn, plan.nameHi)}</h2>
        {plan.topTier ? <Badge tone="warning">★</Badge> : null}
      </div>
      <p className="text-sm text-ink-500">{t('plans.exams', { names })}</p>
      <ul className="space-y-2">
        {options.map((m) => (
          <li key={m} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3">
            <div><p className="font-semibold">{t('plans.months', { n: m })}</p><p className="text-lg font-bold">{t('plans.price', { n: fmt.number(plan.prices[m]) })}</p></div>
            <Button loading={busy} onClick={() => onBuy(Number(m) as Months)}>{t('plans.buy')}</Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function PlansPage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.plans(), staleTime: 5 * 60_000 });
  const ents = useQuery({ queryKey: ['entitlements'], queryFn: () => api.entitlements() });
  const [coupon, setCoupon] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'danger' | 'warning' | 'info'; text: string } | null>(null);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['entitlements'] }), qc.invalidateQueries({ queryKey: ['home'] }), qc.invalidateQueries({ queryKey: ['tests'] }), qc.invalidateQueries({ queryKey: ['me'] })]);

  const buy = useMutation({
    mutationFn: async (v: { plan: BillingPlan; months: Months }) => {
      setMessage(null);
      const order = await api.createOrder({ planId: v.plan.id, months: v.months });
      const r = await openCheckout({ keyId: order.keyId, orderId: order.razorpayOrderId, amountPaise: order.amountPaise, currency: order.currency, description: `${v.plan.nameEn} · ${v.months}`, name: user?.name, email: user?.email });
      if (r.status === 'dismissed') return { outcome: 'cancelled' as const };
      if (r.status === 'failed') return { outcome: 'failed' as const };
      setMessage({ tone: 'info', text: t('plans.pay.processing') });
      try {
        await api.verifyPayment(r.payment);
        return { outcome: 'paid' as const };
      } catch {
        return { outcome: 'unverified' as const };
      }
    },
    onSuccess: async (r) => {
      if (r.outcome === 'paid') setMessage({ tone: 'success', text: t('plans.pay.success') });
      if (r.outcome === 'failed') setMessage({ tone: 'danger', text: t('plans.pay.failed') });
      if (r.outcome === 'cancelled') setMessage({ tone: 'info', text: t('plans.pay.cancelled') });
      if (r.outcome === 'unverified') setMessage({ tone: 'warning', text: t('plans.pay.verifyFailed') });
      await refresh();
    },
    onError: (e) => setMessage({ tone: 'danger', text: e instanceof ApiError && e.status >= 500 ? t('plans.pay.notConfigured') : t(errorKey(e)) }),
  });

  const redeem = useMutation({
    mutationFn: () => api.redeemCoupon(coupon.trim()),
    onSuccess: async () => { toast.show(t('plans.coupon.ok'), 'success'); setCoupon(''); await refresh(); },
    onError: (e) => toast.show(t(errorKey(e)), 'danger'),
  });

  return (
    <>
      <PageHeader title={t('plans.title')} subtitle={t('plans.intro')} />
      {message ? <Alert tone={message.tone} className="mb-4">{message.text}</Alert> : null}

      {ents.data && ents.data.length > 0 ? (
        <Section title={t('me.plan')}>
          <ul className="space-y-2">
            {ents.data.map((e) => {
              const p = plans.data?.find((x) => x.id === e.planId);
              return <Card as="li" key={e.id} className="border-success-600 bg-success-50"><p className="font-semibold">{p ? b(p.nameEn, p.nameHi) : e.planId}</p><p className="text-sm">{t('plans.current', { date: fmt.date(e.endsAt) })}</p></Card>;
            })}
          </ul>
        </Section>
      ) : null}

      {plans.isLoading ? <Skeleton className="h-48" /> : plans.isError || !plans.data ? <ErrorState onRetry={() => plans.refetch()} /> : plans.data.length === 0 ? <EmptyState title={t('plans.empty')} /> : (
        <ul className="grid gap-4 md:grid-cols-2">
          {plans.data.map((p) => <PlanCard key={p.id} plan={p} busy={buy.isPending && buy.variables?.plan.id === p.id} onBuy={(months) => buy.mutate({ plan: p, months })} />)}
        </ul>
      )}
      <p className="mt-3 text-sm text-ink-500">{t('plans.free.note')}</p>

      <Section title={t('plans.coupon')} className="mt-8">
        <Card>
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (coupon.trim()) redeem.mutate(); }}>
            <div className="min-w-48 flex-1"><Field label={t('plans.coupon')}>{(p) => <Input {...p} value={coupon} onChange={(e) => setCoupon(e.target.value)} maxLength={40} autoCapitalize="characters" autoComplete="off" />}</Field></div>
            <Button type="submit" variant="secondary" loading={redeem.isPending} disabled={!coupon.trim()}>{t('plans.coupon.apply')}</Button>
          </form>
        </Card>
      </Section>
    </>
  );
}
