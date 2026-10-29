'use client';
import { Badge, Button, buttonClasses, EmptyState, ErrorState, Input, PageHeader, Pagination, Skeleton, Table, useToast } from '@eg/ui';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

export default function NotesPage() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const term = search.trim().length >= 2 ? search.trim() : undefined;
  const q = useQuery({ queryKey: ['content', 'notes', term, page], queryFn: () => api.contentList('notes', { q: term, page, pageSize: 20 }), placeholderData: keepPreviousData });
  const toggle = useMutation({ mutationFn: (v: { id: string; publish: boolean }) => api.contentStatus('notes', v.id, v.publish ? 'published' : 'draft'), onSuccess: () => { toast.show('Updated', 'success'); void qc.invalidateQueries({ queryKey: ['content', 'notes'] }); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  return (
    <>
      <PageHeader title="Notes" subtitle="Structured study notes shown by subject. Students read them in Hindi or English." actions={can('content:write') ? <Link href="/content/notes/new" className={buttonClasses('primary')}>New note</Link> : undefined} />
      <div className="mb-3 max-w-md"><label className="sr-only" htmlFor="n-search">Search notes</label><Input id="n-search" type="search" placeholder="Search by title or id" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
      {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
        <>
          <Table caption="Notes" empty={<EmptyState title="No notes yet" />} columns={[{ key: 't', header: 'Title' }, { key: 's', header: 'Subject' }, { key: 'a', header: 'Access' }, { key: 'st', header: 'State' }, { key: 'act', header: '' }]}
            rows={q.data.items.map((n) => ({ key: String(n.id), cells: { t: <Link href={`/content/notes/${n.id}`} className="font-semibold text-primary-700 underline">{String(n.titleEn)}</Link>, s: String(n.subjectCode), a: <Badge tone={n.access === 'paid' ? 'warning' : 'info'}>{String(n.access)}</Badge>, st: <StatusBadge status={n.published ? 'published' : 'draft'} />, act: can('content:publish') ? <Button size="sm" variant="secondary" onClick={() => toggle.mutate({ id: String(n.id), publish: !n.published })}>{n.published ? 'Unpublish' : 'Publish'}</Button> : null } }))} />
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
