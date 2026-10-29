'use client';
import { Badge, Button, EmptyState, ErrorState, Input, PageHeader, Pagination, Skeleton, Table, useToast } from '@eg/ui';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notFound, useParams } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/confirm';
import { EditDialog } from '@/components/schema-form';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { ENTITIES, workflowMoves, type RefOptions } from '@/lib/content-config';
import { fmtDate, fmtDateTime } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

function cell(key: string, row: Record<string, unknown>): ReactNode {
  const v = row[key];
  if (key === 'state') return row.state ? <StatusBadge status={String(row.state)} /> : '—';
  if (key === 'date') return fmtDate(String(v));
  if (key === 'pinned') return v ? <Badge tone="warning">pinned</Badge> : '';
  if (key === 'access') return <Badge tone={v === 'paid' ? 'warning' : 'info'}>{String(v)}</Badge>;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtDateTime(v);
  return <span className="line-clamp-2 max-w-md">{v == null ? '—' : String(v)}</span>;
}

export default function ContentListPage() {
  const { entity } = useParams<{ entity: string }>();
  const cfg = ENTITIES[entity];
  if (!cfg) notFound();
  return <ContentList entityKey={entity} />;
}

function ContentList({ entityKey }: { entityKey: string }) {
  const cfg = ENTITIES[entityKey];
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Record<string, unknown> | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Record<string, unknown> | null>(null);
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });
  const refs: RefOptions = useMemo(() => ({ exams: (tree.data?.exams ?? []).map((e) => [e.id, e.shortEn]), subjects: (tree.data?.subjects ?? []).map((s) => [s.code, s.nameEn]), topics: (tree.data?.subjects ?? []).flatMap((s) => s.topics).map((t) => [t.code, `${t.nameEn}`]) }), [tree.data]);
  const term = search.trim().length >= 2 ? search.trim() : undefined;
  const list = useQuery({ queryKey: ['content', entityKey, term, page], queryFn: () => api.contentList(cfg.path, { q: term, page, pageSize: 20 }), placeholderData: keepPreviousData });
  const canWrite = can(cfg.writePermission);
  const canPublish = can('content:publish');
  const idOf = (row: Record<string, unknown>) => String(row[cfg.idField]);
  const refresh = () => qc.invalidateQueries({ queryKey: ['content', entityKey] });

  const move = useMutation({ mutationFn: (v: { id: string; to: 'draft' | 'in_review' | 'published' | 'archived' }) => api.contentStatus(cfg.path, v.id, v.to), onSuccess: () => { toast.show('Updated', 'success'); void refresh(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const remove = useMutation({ mutationFn: (id: string) => api.contentDelete(cfg.path, id), onSuccess: () => { setDeleting(null); toast.show('Deleted', 'success'); void refresh(); }, onError: (e) => { setDeleting(null); toast.show(adminErrorText(e), 'danger'); } });

  const columns = [...cfg.columns.map((c) => ({ key: c.key, header: c.header })), { key: 'actions', header: '' }];
  return (
    <>
      <PageHeader title={cfg.title} subtitle={cfg.intro} actions={canWrite ? <Button onClick={() => setEditing('new')}>New {cfg.singular}</Button> : undefined} />
      <div className="mb-3 max-w-md"><label htmlFor="c-search" className="sr-only">{cfg.searchHint}</label><Input id="c-search" type="search" placeholder={cfg.searchHint} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
      {list.isLoading ? <Skeleton className="h-48" /> : list.isError || !list.data ? <ErrorState message={adminErrorText(list.error)} onRetry={() => list.refetch()} /> : (
        <>
          <Table
            caption={cfg.title}
            empty={<EmptyState title={`No ${cfg.title.toLowerCase()} yet`} />}
            columns={columns}
            rows={list.data.items.map((row) => ({
              key: idOf(row),
              cells: {
                ...Object.fromEntries(cfg.columns.map((c, i) => [c.key, i === 0 && canWrite ? <button type="button" className="text-left font-semibold text-primary-700 underline" onClick={() => setEditing(row)}>{cell(c.key, row)}</button> : cell(c.key, row)])),
                actions: canWrite ? (
                  <div className="flex flex-wrap justify-end gap-1">
                    {cfg.workflow ? workflowMoves(row.state, cfg.workflow).filter((m) => !m.publisher || canPublish).map((m) => <Button key={m.to} size="sm" variant="secondary" loading={move.isPending && move.variables?.id === idOf(row) && move.variables.to === m.to} onClick={() => move.mutate({ id: idOf(row), to: m.to })}>{m.label}</Button>) : null}
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>Delete</Button>
                  </div>
                ) : null,
              },
            }))}
          />
          <Pagination page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPage={setPage} />
        </>
      )}
      {editing ? (
        <EditDialog
          open
          recordKey={editing === 'new' ? 'new' : idOf(editing)}
          title={editing === 'new' ? `New ${cfg.singular}` : `Edit ${cfg.singular}`}
          fields={cfg.fields(refs)}
          editing={editing !== 'new'}
          initial={editing === 'new' ? cfg.defaults : { ...editing }}
          onClose={() => setEditing(null)}
          onSave={async (v) => {
            const body = Object.fromEntries(Object.entries(v).filter(([k]) => !['createdAt', 'updatedAt', 'state', ...(cfg.idField === 'id' ? ['id'] : [])].includes(k)));
            if (editing === 'new') await api.contentCreate(cfg.path, body);
            else await api.contentUpdate(cfg.path, idOf(editing), cfg.idField === 'key' ? (({ key: _k, ...r }) => (void _k, r))(body as Record<string, unknown>) : body);
            toast.show('Saved', 'success');
            setEditing(null);
            void refresh();
          }}
        />
      ) : null}
      <ConfirmDialog open={!!deleting} title={`Delete this ${cfg.singular}?`} danger confirmLabel="Delete" busy={remove.isPending} onConfirm={() => deleting && remove.mutate(idOf(deleting))} onClose={() => setDeleting(null)}>Live content cannot be deleted: unpublish or archive it first.</ConfirmDialog>
    </>
  );
}
