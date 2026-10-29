'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import type { TestKind } from '@eg/api';
import { EmptyState, ErrorState, Pagination, PageHeader, Select, Skeleton } from '@eg/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TestCard } from '@/components/test-card';
import { useApi } from '@/lib/auth';

const KINDS: TestKind[] = ['mock', 'topic', 'subject', 'pyq', 'csat', 'sectional', 'daily', 'live', 'diagnostic'];

function TestsInner() {
  const { t, b } = useI18n();
  const api = useApi();
  const router = useRouter();
  const sp = useSearchParams();
  const filters = {
    examId: sp.get('exam') || undefined,
    kind: (sp.get('kind') as TestKind | null) || undefined,
    access: (sp.get('access') as 'free' | 'paid' | null) || undefined,
    page: Number(sp.get('page') ?? 1) || 1,
  };
  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`/tests?${next.toString()}`);
  };

  const exams = useQuery({ queryKey: ['exams'], queryFn: () => api.exams(), staleTime: 10 * 60_000 });
  const q = useQuery({ queryKey: ['tests', filters], queryFn: () => api.tests({ ...filters, pageSize: 12 }), placeholderData: keepPreviousData });

  return (
    <>
      <PageHeader title={t('tests.title')} />
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="sr-only" htmlFor="f-exam">{t('tests.filter.exam')}</label>
        <Select id="f-exam" value={filters.examId ?? ''} onChange={(e) => set({ exam: e.target.value })}>
          <option value="">{t('common.all')} · {t('tests.filter.exam')}</option>
          {exams.data?.map((e) => (
            <option key={e.id} value={e.id}>{b(e.nameEn, e.nameHi)}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="f-kind">{t('tests.filter.kind')}</label>
        <Select id="f-kind" value={filters.kind ?? ''} onChange={(e) => set({ kind: e.target.value })}>
          <option value="">{t('tests.kind.all')}</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>{t(`tests.kind.${k}` as MessageKey)}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="f-access">{t('tests.filter.access')}</label>
        <Select id="f-access" value={filters.access ?? ''} onChange={(e) => set({ access: e.target.value })}>
          <option value="">{t('tests.access.all')}</option>
          <option value="free">{t('common.free')}</option>
          <option value="paid">{t('common.paid')}</option>
        </Select>
      </div>

      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : q.data && q.data.items.length > 0 ? (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {q.data.items.map((x) => <TestCard key={x.id} test={x} />)}
          </ul>
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => set({ page: String(p) })} />
        </>
      ) : (
        <EmptyState title={t('tests.empty')} />
      )}
    </>
  );
}

export default function TestsPage() {
  return (
    <Suspense>
      <TestsInner />
    </Suspense>
  );
}
