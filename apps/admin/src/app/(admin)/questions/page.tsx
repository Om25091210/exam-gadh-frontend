'use client';
import type { ContentStatus, QuestionType } from '@eg/api';
import { Badge, Button, buttonClasses, EmptyState, ErrorState, Input, PageHeader, Pagination, Skeleton, Table, useToast } from '@eg/ui';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm';
import { FilterSelect, useUrlFilters } from '@/components/data-bits';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const TYPE_LABEL: Record<string, string> = { single: 'Single', multi_statement: 'Statements', match: 'Match', assertion_reason: 'Assertion', chronology: 'Order', passage: 'Passage' };

function QuestionsInner() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const f = useUrlFilters<Record<string, string | undefined>>();
  const [search, setSearch] = useState(f.get('q'));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<ContentStatus | null>(null);
  const filters = {
    page: f.page,
    pageSize: 25,
    status: (f.get('status') || undefined) as ContentStatus | undefined,
    type: (f.get('type') || undefined) as QuestionType | undefined,
    topicCode: f.get('topic') || undefined,
    difficulty: f.get('difficulty') ? Number(f.get('difficulty')) : undefined,
    source: (f.get('source') || undefined) as 'original' | 'pyq' | undefined,
    missing: (f.get('missing') || undefined) as 'hi' | 'en' | 'any' | undefined,
    reported: f.get('reported') === 'true' ? true : undefined,
    q: f.get('q') || undefined,
  };
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });
  const q = useQuery({ queryKey: ['questions', filters], queryFn: () => api.questions(filters), placeholderData: keepPreviousData });
  const bulkMove = useMutation({
    mutationFn: (to: ContentStatus) => api.bulkQuestionStatus([...selected], to),
    onSuccess: () => { toast.show('Updated', 'success'); setSelected(new Set()); setBulk(null); void qc.invalidateQueries({ queryKey: ['questions'] }); },
    onError: (e) => { setBulk(null); toast.show(adminErrorText(e), 'danger'); },
  });
  const set = (p: Record<string, string | undefined>) => f.set(p, '/questions');
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <>
      <PageHeader title="Questions" actions={can('content:write') ? <Link href="/questions/new" className={buttonClasses('primary')}>New question</Link> : undefined} />
      <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ q: search.trim().length >= 2 ? search.trim() : undefined }); }}>
        <label htmlFor="q-search" className="sr-only">Search questions</label>
        <Input id="q-search" type="search" placeholder="Search question text (Hindi or English)" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
        <FilterSelect id="f-status" label="Any status" value={f.get('status')} onChange={(v) => set({ status: v })} options={[['draft', 'Draft'], ['in_review', 'In review'], ['published', 'Published'], ['archived', 'Archived']]} />
        <FilterSelect id="f-type" label="Any type" value={f.get('type')} onChange={(v) => set({ type: v })} options={Object.entries(TYPE_LABEL)} />
        <FilterSelect id="f-topic" label="Any topic" value={f.get('topic')} onChange={(v) => set({ topic: v })} options={(tree.data?.subjects.flatMap((s) => s.topics) ?? []).map((t) => [t.code, t.nameEn])} />
        <FilterSelect id="f-diff" label="Any difficulty" value={f.get('difficulty')} onChange={(v) => set({ difficulty: v })} options={[['1', 'Easy'], ['2', 'Medium'], ['3', 'Hard']]} />
        <FilterSelect id="f-missing" label="Translation" value={f.get('missing')} onChange={(v) => set({ missing: v })} options={[['hi', 'Missing Hindi'], ['en', 'Missing English'], ['any', 'Missing either']]} />
        <FilterSelect id="f-source" label="Any source" value={f.get('source')} onChange={(v) => set({ source: v })} options={[['original', 'Original'], ['pyq', 'Previous year']]} />
      </div>

      {selected.size > 0 && can('content:write') ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-primary-50 p-3">
          <span className="font-semibold">{selected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={() => setBulk('in_review')}>Submit for review</Button>
          {can('content:publish') ? <Button size="sm" onClick={() => setBulk('published')}>Publish</Button> : null}
          {can('content:publish') ? <Button size="sm" variant="secondary" onClick={() => setBulk('archived')}>Archive</Button> : null}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      ) : null}

      {q.isLoading ? <Skeleton className="h-64" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <>
          <Table
            caption="Questions"
            empty={<EmptyState title="No questions match these filters" />}
            columns={[{ key: 'sel', header: '' }, { key: 'code', header: 'Code' }, { key: 'text', header: 'Question' }, { key: 'type', header: 'Type' }, { key: 'topic', header: 'Topic' }, { key: 'lang', header: 'Languages' }, { key: 'status', header: 'Status' }]}
            rows={q.data.items.map((x) => ({
              key: x.id,
              cells: {
                sel: can('content:write') ? <input type="checkbox" className="size-4 accent-primary-700" aria-label={`Select ${x.code ?? x.id}`} checked={selected.has(x.id)} onChange={() => toggle(x.id)} /> : null,
                code: <Link href={`/questions/${x.id}`} className="font-mono text-primary-700 underline">{x.code ?? x.id.slice(0, 8)}</Link>,
                text: <span className="line-clamp-2 max-w-md">{x.preview || '—'}</span>,
                type: TYPE_LABEL[x.type],
                topic: x.topicCode,
                lang: <span className="flex gap-1"><Badge tone={x.hasHi ? 'success' : 'warning'}>हि</Badge><Badge tone={x.hasEn ? 'success' : 'warning'}>EN</Badge>{x.reportedCount > 0 ? <Badge tone="danger">⚑ {x.reportedCount}</Badge> : null}</span>,
                status: <StatusBadge status={x.status} />,
              },
            }))}
          />
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={(p) => f.set({ page: String(p) }, '/questions')} />
          <p className="mt-2 text-sm text-ink-500">{q.data.total.toLocaleString('en-IN')} questions</p>
        </>
      )}
      <ConfirmDialog open={!!bulk} title={`Move ${selected.size} question(s) to ${bulk?.replace('_', ' ')}?`} confirmLabel="Move" busy={bulkMove.isPending} onConfirm={() => bulk && bulkMove.mutate(bulk)} onClose={() => setBulk(null)}>Questions that cannot make this move are skipped and reported.</ConfirmDialog>
    </>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense>
      <QuestionsInner />
    </Suspense>
  );
}
