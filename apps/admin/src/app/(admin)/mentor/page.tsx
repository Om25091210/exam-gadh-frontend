'use client';
import { EmptyState, ErrorState, PageHeader, Pagination, Skeleton, Table, Tabs } from '@eg/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { fmtDate, fmtDateTime } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

export default function MentorPage() {
  const { api } = useAdmin();
  const [status, setStatus] = useState<'open' | 'sent'>('open');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['mentor', status, page], queryFn: () => api.mentorRequests({ status, page }), placeholderData: keepPreviousData });
  return (
    <>
      <PageHeader title="Study plans" subtitle="Students ask for a plan; a draft is generated from their answers. Review it, adjust it and send it." />
      <Tabs label="Status" value={status} onChange={(v) => { setStatus(v as typeof status); setPage(1); }} items={[{ id: 'open', label: 'Waiting for you' }, { id: 'sent', label: 'Sent' }]} />
      <div className="mt-4">
        {q.isLoading ? <Skeleton className="h-40" /> : q.isError || !q.data ? <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} /> : (
          <>
            <Table caption="Study plan requests" empty={<EmptyState title="Nothing here" />} columns={[{ key: 's', header: 'Student' }, { key: 'e', header: 'Exam' }, { key: 'h', header: 'Hours/day' }, { key: 'd', header: 'Exam date' }, { key: 'st', header: 'Status' }, { key: 'w', header: status === 'sent' ? 'Sent' : 'Asked' }]}
              rows={q.data.items.map((r) => ({ key: r.id, cells: { s: <Link href={`/mentor/${r.id}`} className="font-semibold text-primary-700 underline">{r.student?.name ?? 'Student'}</Link>, e: r.examId, h: r.hoursPerDay, d: r.examDate ? fmtDate(r.examDate) : '—', st: <StatusBadge status={r.status} />, w: fmtDateTime(r.sentAt ?? r.createdAt) } }))} />
            <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
