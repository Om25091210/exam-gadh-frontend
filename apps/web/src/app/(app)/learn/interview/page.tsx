'use client';
import { useI18n } from '@eg/i18n';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Select, Skeleton } from '@eg/ui';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useApi } from '@/lib/auth';

export default function InterviewPage() {
  const { t, b } = useI18n();
  const api = useApi();
  const [examId, setExamId] = useState('');
  const [category, setCategory] = useState('');
  const exams = useQuery({ queryKey: ['exams'], queryFn: () => api.exams(), staleTime: 10 * 60_000 });
  const q = useQuery({ queryKey: ['interview', examId], queryFn: () => api.interview({ examId: examId || undefined }) });
  const categories = useMemo(() => [...new Set(q.data?.map((x) => x.category) ?? [])].sort(), [q.data]);
  const shown = (q.data ?? []).filter((x) => !category || x.category === category);
  return (
    <>
      <PageHeader title={t('interview.title')} />
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <label className="sr-only" htmlFor="iv-exam">{t('tests.filter.exam')}</label>
        <Select id="iv-exam" value={examId} onChange={(e) => { setExamId(e.target.value); setCategory(''); }}>
          <option value="">{t('common.all')} · {t('tests.filter.exam')}</option>
          {exams.data?.map((e) => <option key={e.id} value={e.id}>{b(e.nameEn, e.nameHi)}</option>)}
        </Select>
        <label className="sr-only" htmlFor="iv-cat">{t('interview.category')}</label>
        <Select id="iv-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('common.all')} · {t('interview.category')}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError ? <ErrorState onRetry={() => q.refetch()} /> : shown.length === 0 ? <EmptyState title={t('interview.empty')} /> : (
        <ul className="space-y-2">
          {shown.map((x) => (
            <Card as="li" key={x.id} className="p-0">
              <details className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-start justify-between gap-3 p-4 font-semibold">
                  <span><Badge className="mr-2">{x.category}</Badge>{b(x.qEn, x.qHi)}</span>
                  <ChevronDown className="mt-1 size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="border-t border-line p-4"><p className="mb-1 text-sm font-semibold text-ink-500">{t('interview.points')}</p><p className="whitespace-pre-line text-ink-700">{b(x.pointsEn, x.pointsHi)}</p></div>
              </details>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
