'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Badge, Button, buttonClasses, Card, EmptyState, ErrorState, PageHeader, Pagination, Select, Skeleton, useToast } from '@eg/ui';
import { FileText, Link2, Lock, PlayCircle } from 'lucide-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';
import type { MaterialItem } from '@eg/api';
import Link from 'next/link';

const ICON = { pdf: FileText, video: PlayCircle, link: Link2 };

function MaterialCard({ m }: { m: MaterialItem }) {
  const { t, b } = useI18n();
  const api = useApi();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const Icon = ICON[m.kind];
  const open = async () => {
    setBusy(true);
    try {
      const d = await api.material(m.id);
      const url = d.downloadUrl ?? d.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.show(t(errorKey(e)), 'danger');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card as="li" className="flex items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-800"><Icon className="size-6" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{b(m.titleEn, m.titleHi)}</p>
        <div className="mt-1 flex flex-wrap gap-2"><Badge>{t(`materials.kind.${m.kind}` as MessageKey)}</Badge>{m.access === 'paid' ? <Badge tone="warning">{m.locked ? <Lock className="size-3" aria-hidden /> : null}{t('common.paid')}</Badge> : null}</div>
        {m.kind === 'link' ? <p className="mt-1 text-xs text-ink-500">{t('materials.linkNote')}</p> : null}
      </div>
      {m.locked ? <Link href="/plans" className={buttonClasses('accent', 'sm')}>{t('tests.paid.cta')}</Link> : <Button size="sm" variant="secondary" loading={busy} onClick={open}>{m.kind === 'pdf' ? t('materials.download') : t('materials.open')}</Button>}
    </Card>
  );
}

export default function MaterialsPage() {
  const { t, b } = useI18n();
  const api = useApi();
  const [kind, setKind] = useState('');
  const [subject, setSubject] = useState('');
  const [page, setPage] = useState(1);
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: () => api.subjects(), staleTime: 10 * 60_000 });
  const q = useQuery({ queryKey: ['materials', kind, subject, page], queryFn: () => api.materials({ kind: kind || undefined, subjectCode: subject || undefined, page, pageSize: 12 }), placeholderData: keepPreviousData });
  return (
    <>
      <PageHeader title={t('materials.title')} />
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <label className="sr-only" htmlFor="m-sub">{t('profile.targetExam')}</label>
        <Select id="m-sub" value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }}>
          <option value="">{t('common.all')}</option>
          {subjects.data?.map((s) => <option key={s.code} value={s.code}>{b(s.nameEn, s.nameHi)}</option>)}
        </Select>
        <label className="sr-only" htmlFor="m-kind">{t('tests.filter.kind')}</label>
        <Select id="m-kind" value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }}>
          <option value="">{t('materials.kind.all')}</option>
          {(['pdf', 'video', 'link'] as const).map((k) => <option key={k} value={k}>{t(`materials.kind.${k}` as MessageKey)}</option>)}
        </Select>
      </div>
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState onRetry={() => q.refetch()} /> : q.data.items.length === 0 ? <EmptyState title={t('materials.empty')} /> : (
        <>
          <ul className="space-y-3">{q.data.items.map((m) => <MaterialCard key={m.id} m={m} />)}</ul>
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
