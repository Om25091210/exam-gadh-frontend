'use client';
import { useI18n } from '@eg/i18n';
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton, Tabs, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { QuestionCard } from '@/components/question-card';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

type Tab = 'questions' | 'materials' | 'ca' | 'notes';

export default function BookmarksPage() {
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('questions');
  const bm = useQuery({ queryKey: ['bookmarks', 'all'], queryFn: () => api.bookmarks() });
  const notes = useQuery({ queryKey: ['notes'], queryFn: () => api.notes() });
  const remove = useMutation({
    mutationFn: (v: { kind: 'question' | 'material' | 'current_affair'; id: string }) => api.removeBookmark(v.kind, v.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
    onError: (e) => toast.show(t(errorKey(e)), 'danger'),
  });
  const delNote = useMutation({ mutationFn: (id: string) => api.deleteNote(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }), onError: (e) => toast.show(t(errorKey(e)), 'danger') });

  if (bm.isLoading || notes.isLoading) return <Skeleton className="h-48" />;
  if (bm.isError || !bm.data) return <ErrorState onRetry={() => bm.refetch()} />;
  const d = bm.data;
  const items = [
    { id: 'questions', label: t('bookmarks.questions'), count: d.questions.length },
    { id: 'materials', label: t('bookmarks.materials'), count: d.materials.length },
    { id: 'ca', label: t('bookmarks.ca'), count: d.currentAffairs.length },
    { id: 'notes', label: t('bookmarks.notes'), count: notes.data?.length ?? 0 },
  ];
  const empty = <EmptyState title={t('bookmarks.empty')} />;
  return (
    <>
      <PageHeader title={t('bookmarks.title')} />
      <Tabs label={t('bookmarks.title')} value={tab} onChange={(v) => setTab(v as Tab)} items={items} />
      <div className="mt-4 space-y-3">
        {tab === 'questions' && (d.questions.length === 0 ? empty : d.questions.map((x) => (
          <QuestionCard key={x.questionId} q={x} actions={<Button variant="ghost" size="sm" onClick={() => remove.mutate({ kind: 'question', id: x.questionId })}>{t('bookmarks.remove')}</Button>} />
        )))}
        {tab === 'materials' && (d.materials.length === 0 ? empty : d.materials.map((m) => (
          <Card as="li" key={m.id} className="flex items-center justify-between gap-3"><Link href="/learn/materials" className="font-semibold hover:underline">{b(m.titleEn, m.titleHi)}</Link><Button variant="ghost" size="sm" onClick={() => remove.mutate({ kind: 'material', id: m.id })}>{t('bookmarks.remove')}</Button></Card>
        )))}
        {tab === 'ca' && (d.currentAffairs.length === 0 ? empty : d.currentAffairs.map((c) => (
          <Card as="li" key={c.id} className="flex items-center justify-between gap-3"><div><Link href={`/learn/ca/${c.id}`} className="font-semibold hover:underline">{b(c.titleEn, c.titleHi)}</Link><p className="text-sm text-ink-500">{fmt.date(c.date)}</p></div><Button variant="ghost" size="sm" onClick={() => remove.mutate({ kind: 'current_affair', id: c.id })}>{t('bookmarks.remove')}</Button></Card>
        )))}
        {tab === 'notes' && (!notes.data || notes.data.length === 0 ? empty : notes.data.map((n) => (
          <div key={n.questionId} className="space-y-2">
            {n.question ? <QuestionCard q={n.question} /> : null}
            <Card className="border-accent-500/40 bg-accent-100"><p className="mb-1 text-sm font-semibold text-accent-700">{t('review.note')}</p><p className="whitespace-pre-line">{n.text}</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => delNote.mutate(n.questionId)}>{t('bookmarks.remove')}</Button></Card>
          </div>
        )))}
      </div>
    </>
  );
}
