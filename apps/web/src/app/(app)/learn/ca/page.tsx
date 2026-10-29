'use client';
import { useI18n } from '@eg/i18n';
import { EmptyState, ErrorState, Input, PageHeader, Pagination, Select, Skeleton, Tabs } from '@eg/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CaCard } from '@/components/ca-card';
import { useApi } from '@/lib/auth';

const thisMonth = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 7);

export default function CurrentAffairsPage() {
  const { t, fmt } = useI18n();
  const api = useApi();
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily');
  const [category, setCategory] = useState<'' | 'CG' | 'NAT'>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(thisMonth());

  const q = (search.trim().length >= 2 ? search.trim() : undefined);
  const daily = useQuery({ queryKey: ['ca', category, q, page], queryFn: () => api.ca({ category: category || undefined, q, page, pageSize: 10 }), enabled: mode === 'daily', placeholderData: keepPreviousData });
  const monthly = useQuery({ queryKey: ['ca-month', month], queryFn: () => api.caMonth(month), enabled: mode === 'monthly' });

  return (
    <>
      <PageHeader title={t('ca.title')} />
      <Tabs label={t('ca.title')} value={mode} onChange={(v) => setMode(v as 'daily' | 'monthly')} items={[{ id: 'daily', label: t('ca.daily') }, { id: 'monthly', label: t('ca.monthly') }]} />
      <div className="my-4 grid gap-2 sm:grid-cols-3">
        {mode === 'daily' ? (
          <>
            <label className="sr-only" htmlFor="ca-q">{t('ca.search')}</label>
            <Input id="ca-q" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t('ca.search')} className="sm:col-span-2" />
            <label className="sr-only" htmlFor="ca-cat">{t('ca.category.all')}</label>
            <Select id="ca-cat" value={category} onChange={(e) => { setCategory(e.target.value as '' | 'CG' | 'NAT'); setPage(1); }}>
              <option value="">{t('ca.category.all')}</option>
              <option value="CG">{t('ca.category.CG')}</option>
              <option value="NAT">{t('ca.category.NAT')}</option>
            </Select>
          </>
        ) : (
          <>
            <label className="sr-only" htmlFor="ca-month">{t('ca.month')}</label>
            <Input id="ca-month" type="month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          </>
        )}
      </div>

      {mode === 'daily' ? (
        daily.isLoading ? <Skeleton className="h-40" /> : daily.isError || !daily.data ? <ErrorState onRetry={() => daily.refetch()} /> : daily.data.items.length === 0 ? <EmptyState title={t('ca.empty')} /> : (
          <>
            <ul className="space-y-3">{daily.data.items.map((i) => <CaCard key={i.id} item={i} />)}</ul>
            <Pagination page={daily.data.page} pageSize={daily.data.pageSize} total={daily.data.total} onPage={setPage} />
          </>
        )
      ) : monthly.isLoading ? <Skeleton className="h-40" /> : monthly.isError || !monthly.data ? <ErrorState onRetry={() => monthly.refetch()} /> : monthly.data.days.length === 0 ? <EmptyState title={t('ca.empty')} /> : (
        <div className="space-y-5">
          {monthly.data.days.map((d) => (
            <section key={d.date} aria-label={fmt.date(d.date)}>
              <h2 className="mb-2 text-lg font-semibold">{fmt.date(d.date)}</h2>
              <ul className="space-y-3">{d.items.map((i) => <CaCard key={i.id} item={i} />)}</ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
