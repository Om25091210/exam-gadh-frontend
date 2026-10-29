'use client';
import { useI18n } from '@eg/i18n';
import { Badge, buttonClasses, Card, EmptyState, ErrorState, PageHeader, ProgressBar, Section, Select, Skeleton } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/auth';

export default function PyqPage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const [examId, setExamId] = useState('');
  const exams = useQuery({ queryKey: ['exams'], queryFn: () => api.exams(), staleTime: 10 * 60_000 });
  const pyq = useQuery({ queryKey: ['pyq', examId], queryFn: () => api.pyq({ examId: examId || undefined }) });
  const freq = useQuery({ queryKey: ['pyq-freq', examId], queryFn: () => api.pyqFrequency(examId || undefined) });

  return (
    <>
      <PageHeader title={t('pyq.title')} />
      <div className="mb-4 max-w-xs">
        <label className="sr-only" htmlFor="pyq-exam">{t('tests.filter.exam')}</label>
        <Select id="pyq-exam" value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="">{t('common.all')} · {t('tests.filter.exam')}</option>
          {exams.data?.map((e) => <option key={e.id} value={e.id}>{b(e.nameEn, e.nameHi)}</option>)}
        </Select>
      </div>

      {freq.data && freq.data.total > 0 ? (
        <Section title={t('pyq.freq')}>
          <Card>
            <p className="mb-3 text-sm text-ink-500">{t('pyq.freq.note')}</p>
            <ul className="space-y-2">
              {freq.data.topics.slice(0, 8).map((x) => (
                <li key={x.topicCode}>
                  <div className="mb-1 flex justify-between text-sm"><span>{b(x.nameEn, x.nameHi) || x.topicCode}</span><span className="tabular-nums">{fmt.number(x.sharePct, 1)}%</span></div>
                  <ProgressBar value={x.sharePct} label={b(x.nameEn, x.nameHi) || x.topicCode} tone="accent" />
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      ) : null}

      {pyq.isLoading ? <Skeleton className="h-40" /> : pyq.isError || !pyq.data ? <ErrorState onRetry={() => pyq.refetch()} /> : pyq.data.years.length === 0 ? <EmptyState title={t('pyq.empty')} /> : (
        pyq.data.years.map((y) => (
          <Section key={String(y.year)} title={y.year ? t('pyq.year', { n: y.year }) : t('pyq.unknownYear')}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {y.papers.map((p) => (
                <Card as="li" key={p.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">{p.paper ? <Badge>{b(p.paper.nameEn, p.paper.nameHi)}</Badge> : null}{p.access === 'paid' ? <Badge tone={p.locked ? 'warning' : 'info'}>{t('common.paid')}</Badge> : <Badge tone="info">{t('common.free')}</Badge>}</div>
                  <p className="font-semibold">{b(p.titleEn, p.titleHi)}</p>
                  <p className="text-sm text-ink-500">{p.questionCount != null ? t('common.questions', { n: p.questionCount }) : ''}{p.durationMin ? ` · ${t('common.minutes', { n: p.durationMin })}` : ''}</p>
                  <Link href={`/tests/${p.id}`} className={buttonClasses(p.locked ? 'accent' : 'primary', 'sm', 'mt-auto self-start')}>{p.locked ? t('tests.paid.cta') : t('tests.instructions')}</Link>
                </Card>
              ))}
            </ul>
          </Section>
        ))
      )}
    </>
  );
}
