'use client';
import { useI18n } from '@eg/i18n';
import { Card, EmptyState, ErrorState, Input, PageHeader, Skeleton } from '@eg/ui';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useApi } from '@/lib/auth';

export default function FaqsPage() {
  const { t, b } = useI18n();
  const api = useApi();
  const [search, setSearch] = useState('');
  const term = search.trim().length >= 2 ? search.trim() : undefined;
  const q = useQuery({ queryKey: ['faqs', term], queryFn: () => api.faqs(term) });
  return (
    <>
      <PageHeader title={t('faq.title')} />
      <label className="sr-only" htmlFor="faq-q">{t('faq.search')}</label>
      <Input id="faq-q" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('faq.search')} className="mb-4" />
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : q.data.length === 0 ? <EmptyState title={t('faq.empty')} /> : (
        <ul className="space-y-2">
          {q.data.map((f) => (
            <Card as="li" key={f.id} className="p-0">
              <details className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold">
                  {b(f.qEn, f.qHi)}
                  <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="border-t border-line p-4 text-ink-700">{b(f.aEn, f.aHi)}</p>
              </details>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
