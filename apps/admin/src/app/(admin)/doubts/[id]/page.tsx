'use client';
import { Alert, Badge, Button, buttonClasses, Card, Checkbox, ErrorState, Field, PageHeader, QuestionBody, Options, Select, Skeleton, Textarea, useToast, cn } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { fmtDateTime } from '@/lib/datetime';
import { adminErrorText } from '@/lib/errors';

export default function DoubtPage() {
  const { id } = useParams<{ id: string }>();
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState('');
  const [close, setClose] = useState(false);
  const q = useQuery({ queryKey: ['admin-doubt', id], queryFn: () => api.adminDoubt(id) });
  const canned = useQuery({ queryKey: ['content', 'canned-replies', 'all'], queryFn: () => api.contentList('canned-replies', { pageSize: 100 }), enabled: can('doubts:answer') });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['admin-doubt', id] }); void qc.invalidateQueries({ queryKey: ['admin-doubts'] }); void qc.invalidateQueries({ queryKey: ['doubt-stats'] }); };
  const reply = useMutation({ mutationFn: () => api.replyDoubt(id, { text: text.trim(), close }), onSuccess: () => { toast.show('Reply sent', 'success'); setText(''); setClose(false); refresh(); }, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const closeIt = useMutation({ mutationFn: () => api.closeDoubtAdmin(id), onSuccess: refresh, onError: (e) => toast.show(adminErrorText(e), 'danger') });
  const flag = useMutation({ mutationFn: (v: boolean) => api.flagDoubt(id, v), onSuccess: refresh, onError: (e) => toast.show(adminErrorText(e), 'danger') });

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data;
  const qs = d.question ? { type: d.question.type as 'single', en: d.question.body.en as never, hi: d.question.body.hi as never, passage: null } : null;
  const insertCanned = (cid: string) => {
    const c = canned.data?.items.find((x) => String(x.id) === cid);
    if (c) setText((t) => `${t}${t ? '\n\n' : ''}${String(c.bodyHi)}\n\n${String(c.bodyEn)}`);
  };
  return (
    <>
      <PageHeader title={`Doubt from ${d.student.name}`} subtitle={d.student.email} actions={<><StatusBadge status={d.status} />{d.abuse ? <Badge tone="danger">abuse flagged</Badge> : null}<Link href="/doubts" className={buttonClasses('secondary', 'sm')}>Back to inbox</Link></>} />
      <p className="mb-3 text-sm text-ink-500">Asked {fmtDateTime(d.createdAt)} · deadline {fmtDateTime(d.slaDueAt)}{d.firstResponseAt ? ` · first reply ${fmtDateTime(d.firstResponseAt)}` : ''}{d.rating ? ` · rated ${d.rating}/5` : ''}</p>

      {qs && d.question ? (
        <Card className="mb-4 space-y-3">
          <p className="text-sm font-semibold text-ink-500">About this question ({d.question.code ?? d.question.id.slice(0, 8)}) · <Link className="text-primary-700 underline" href={`/questions/${d.question.id}`}>open in the bank</Link></p>
          <QuestionBody q={qs} lang="en" />
          <Options q={qs} lang="en" name="ctx" selected={d.question.answer} disabled correct={d.question.answer} />
        </Card>
      ) : null}

      <ol className="space-y-3">
        {d.messages.map((m) => (
          <li key={m.id} className={cn('flex', m.from === 'staff' ? 'justify-end' : 'justify-start')}>
            <Card className={cn('max-w-[90%] space-y-2', m.from === 'staff' ? 'border-primary-500 bg-primary-50' : '')}>
              <p className="text-xs font-semibold text-ink-500">{m.from === 'student' ? d.student.name : 'Staff'} · {fmtDateTime(m.createdAt)}</p>
              <p className="whitespace-pre-line">{m.text}</p>
              {m.attachments.map((a) => /\.(png|jpe?g|webp)$/i.test(a.key) ? <a key={a.key} href={a.url} target="_blank" rel="noopener noreferrer"><img src={a.url} alt="Attachment" className="max-h-72 rounded-lg" /></a> /* eslint-disable-line @next/next/no-img-element */ : <audio key={a.key} controls src={a.url} className="w-full" />)}
            </Card>
          </li>
        ))}
      </ol>

      {can('doubts:answer') ? (
        d.status === 'closed' ? <Alert tone="info" className="mt-4" live={false}>This doubt is closed.</Alert> : (
          <Card className="mt-4 space-y-3">
            {canned.data?.items.length ? <Field label="Insert a canned reply">{(p) => <Select {...p} value="" onChange={(e) => insertCanned(e.target.value)}><option value="">Choose…</option>{canned.data!.items.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.title)}</option>)}</Select>}</Field> : null}
            <Field label="Your reply">{(p) => <Textarea {...p} rows={6} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />}</Field>
            <Checkbox checked={close} onChange={(e) => setClose(e.target.checked)} label="Close the doubt with this reply" />
            <div className="flex flex-wrap gap-2">
              <Button disabled={text.trim().length === 0} loading={reply.isPending} onClick={() => reply.mutate()}>Send reply</Button>
              <Button variant="ghost" loading={closeIt.isPending} onClick={() => closeIt.mutate()}>Close without replying</Button>
              <Button variant="ghost" loading={flag.isPending} onClick={() => flag.mutate(!d.abuse)}>{d.abuse ? 'Remove abuse flag' : 'Flag as abuse'}</Button>
            </div>
          </Card>
        )
      ) : <Alert tone="info" className="mt-4" live={false}>You can read doubts but not answer them.</Alert>}
    </>
  );
}
