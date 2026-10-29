'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Alert, Badge, Button, buttonClasses, Card, ErrorState, Field, PageHeader, Skeleton, Textarea, useToast, cn } from '@eg/ui';
import { Star } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

export default function DoubtThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { t, fmt } = useI18n();
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState('');
  const q = useQuery({ queryKey: ['doubt', id], queryFn: () => api.doubt(id), refetchInterval: (s) => (s.state.data?.status === 'open' ? 60_000 : false) });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['doubt', id] }), qc.invalidateQueries({ queryKey: ['doubts'] }), qc.invalidateQueries({ queryKey: ['doubt-quota'] })]);
  const reply = useMutation({ mutationFn: () => api.replyDoubt(id, { text: text.trim() }), onSuccess: () => { setText(''); void refresh(); } });
  const rate = useMutation({ mutationFn: (n: number) => api.rateDoubt(id, n), onSuccess: () => { toast.show(t('doubts.rated'), 'success'); void refresh(); }, onError: (e) => toast.show(t(errorKey(e)), 'danger') });
  const close = useMutation({ mutationFn: () => api.closeDoubt(id), onSuccess: () => void refresh() });

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={t(errorKey(q.error))} onRetry={() => q.refetch()} />;
  const d = q.data;
  const tone = d.status === 'open' ? 'warning' : d.status === 'answered' ? 'success' : 'neutral';

  return (
    <>
      <PageHeader title={t(`doubts.context.${d.contextType}` as MessageKey)} actions={<Link href="/doubts" className={buttonClasses('secondary', 'sm')}>{t('common.back')}</Link>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{t(`doubts.status.${d.status}` as MessageKey)}</Badge>
        {d.reopened ? <Badge tone="info">{t('doubts.reopened')}</Badge> : null}
        {d.status === 'open' ? <span className="text-sm text-ink-500">{t('doubts.sla', { time: fmt.dateTime(d.slaDueAt) })}</span> : null}
      </div>

      <ol className="space-y-3">
        {d.messages.map((m) => (
          <li key={m.id} className={cn('flex', m.from === 'student' ? 'justify-end' : 'justify-start')}>
            <Card className={cn('max-w-[90%] space-y-2', m.from === 'staff' ? 'border-primary-500 bg-primary-50' : 'bg-surface')}>
              <p className="text-xs font-semibold text-ink-500">{m.from === 'student' ? t('doubts.you') : t('doubts.teacher')} · {fmt.dateTime(m.createdAt)}</p>
              <p className="whitespace-pre-line">{m.text}</p>
              {m.attachments.map((a) => /\.(png|jpe?g|webp)$/i.test(a.key)
                ? <a key={a.key} href={a.url} target="_blank" rel="noopener noreferrer"><img src={a.url} alt="" className="max-h-64 rounded-lg" /></a> // eslint-disable-line @next/next/no-img-element
                : <audio key={a.key} controls src={a.url} className="w-full" />)}
            </Card>
          </li>
        ))}
      </ol>

      {d.status !== 'open' && d.firstResponseAt ? (
        <Card className="mt-4">
          <p className="mb-2 font-semibold">{t('doubts.rate')}</p>
          <div className="flex gap-1" role="group" aria-label={t('doubts.rate')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n}`} aria-pressed={d.rating === n} onClick={() => rate.mutate(n)} className="grid size-11 place-items-center rounded-lg hover:bg-black/5">
                <Star className={cn('size-7', (d.rating ?? 0) >= n ? 'fill-accent-500 text-accent-500' : 'text-ink-300')} aria-hidden />
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {d.status !== 'closed' ? (
        <Card className="mt-4 space-y-3">
          <Field label={t('doubts.reply')} hint={d.status === 'answered' ? t('doubts.reopen.hint') : undefined}>{(p) => <Textarea {...p} rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />}</Field>
          {reply.isError ? <Alert tone="danger">{t(errorKey(reply.error))}</Alert> : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => reply.mutate()} loading={reply.isPending} disabled={text.trim().length === 0}>{t('doubts.reply.send')}</Button>
            <Button variant="ghost" onClick={() => close.mutate()} loading={close.isPending}>{t('doubts.close')}</Button>
          </div>
        </Card>
      ) : null}
    </>
  );
}
