'use client';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Pagination, RichText, Skeleton, Tabs, useToast } from '@eg/ui';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const REASON: Record<string, string> = { wrong_answer: 'Answer key looks wrong', typo: 'Typo', unclear: 'Unclear', translation: 'Translation', other: 'Other' };

export default function ReportsPage() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState<'open' | 'resolved' | 'dismissed'>('open');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['reports', status, page], queryFn: () => api.questionReports({ status, page }), placeholderData: keepPreviousData });
  const resolve = useMutation({
    mutationFn: (v: { id: string; to: 'resolved' | 'dismissed' }) => api.resolveReport(v.id, v.to),
    onSuccess: () => { toast.show('Updated', 'success'); void qc.invalidateQueries({ queryKey: ['reports'] }); },
    onError: (e) => toast.show(adminErrorText(e), 'danger'),
  });
  return (
    <>
      <PageHeader title="Reported issues" subtitle="Problems students flagged on questions." />
      <Tabs label="Status" value={status} onChange={(v) => { setStatus(v as typeof status); setPage(1); }} items={[{ id: 'open', label: 'Open' }, { id: 'resolved', label: 'Resolved' }, { id: 'dismissed', label: 'Dismissed' }]} />
      <div className="mt-4">
        {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : q.data.items.length === 0 ? <EmptyState title="Nothing here" /> : (
          <>
            <ul className="space-y-3">
              {q.data.items.map((r) => {
                const body = r.question?.body;
                return (
                  <Card as="li" key={r.id} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2"><Badge tone="warning">{REASON[r.reason] ?? r.reason}</Badge><span className="text-sm text-ink-500">{new Date(r.createdAt).toLocaleString('en-IN')}</span></div>
                    {r.note ? <p className="rounded-lg bg-black/5 p-2">&ldquo;{r.note}&rdquo;</p> : null}
                    {body ? <p className="text-ink-700"><RichText text={String((body.en?.stem ?? body.hi?.stem ?? '') as string)} /></p> : null}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/questions/${r.questionId}`} className="inline-flex min-h-9 items-center rounded-xl border border-line bg-surface px-3 text-sm font-semibold hover:bg-primary-50">Open question {r.question?.code ?? ''}</Link>
                      {status === 'open' && can('reports:resolve') ? (
                        <>
                          <Button size="sm" onClick={() => resolve.mutate({ id: r.id, to: 'resolved' })}>Mark resolved</Button>
                          <Button size="sm" variant="ghost" onClick={() => resolve.mutate({ id: r.id, to: 'dismissed' })}>Dismiss</Button>
                        </>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </ul>
            <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
