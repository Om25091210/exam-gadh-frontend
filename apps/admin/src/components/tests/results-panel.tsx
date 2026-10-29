'use client';
import type { AnalyticsQuestion } from '@eg/api';
import { Alert, Button, Card, Checkbox, EmptyState, ErrorState, Modal, Skeleton, Stat, Table, Textarea, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { saveBlob } from '@/lib/download';
import { adminErrorText } from '@/lib/errors';

export function ResultsPanel({ testId, versionId }: { testId: string; versionId: string }) {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['test-analytics', testId, versionId], queryFn: () => api.testAnalytics(testId, versionId) });
  const [fix, setFix] = useState<AnalyticsQuestion | null>(null);
  const [answer, setAnswer] = useState(0);
  const [reason, setReason] = useState('');
  const [updateBank, setUpdateBank] = useState(true);
  const correct = useMutation({
    mutationFn: () => api.correctKey(testId, versionId, { tvqId: fix!.tvqId, newAnswer: answer, reason: reason.trim(), updateQuestionBank: updateBank }),
    onSuccess: () => { toast.show('Answer key corrected and results re-graded', 'success'); setFix(null); setReason(''); void qc.invalidateQueries({ queryKey: ['test-analytics', testId] }); },
    onError: (e) => toast.show(adminErrorText(e), 'danger'),
  });
  const csv = async () => {
    try {
      const d = await api.testResultsCsv(testId, versionId);
      saveBlob(d.blob, d.filename);
    } catch (e) {
      toast.show(adminErrorText(e), 'danger');
    }
  };

  if (q.isLoading) return <Skeleton className="h-48" />;
  if (q.isError || !q.data) return <ErrorState message={adminErrorText(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data;
  if (d.attempts.rankedResults === 0 && d.attempts.practiceResults === 0) return <EmptyState title="No one has taken this version yet" />;
  const maxBucket = Math.max(1, ...d.distribution.map((b) => b.count));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-ink-700">Version {d.test.version} · {d.attempts.rankedResults} ranked results, {d.attempts.practiceResults} practice</p>
        {can('results:read') ? <Button variant="secondary" size="sm" onClick={() => void csv()}><Download className="size-4" aria-hidden />Download results (CSV)</Button> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Average score" value={d.scores.mean} hint={`of ${d.test.maxScore ?? '—'}`} />
        <Stat label="Median" value={d.scores.median} />
        <Stat label="Highest / lowest" value={`${d.scores.max ?? '—'} / ${d.scores.min ?? '—'}`} />
        <Stat label="Average accuracy" value={d.scores.avgAccuracyPct == null ? '—' : `${d.scores.avgAccuracyPct}%`} hint={d.scores.avgTimeSec ? `${Math.round(d.scores.avgTimeSec / 60)} min average` : undefined} />
      </div>
      <Card>
        <h3 className="mb-2 font-semibold">Score distribution</h3>
        <ul className="space-y-1" aria-label="Score distribution">
          {d.distribution.map((b) => (
            <li key={b.label} className="flex items-center gap-2 text-sm"><span className="w-20 text-right text-ink-500">{b.label}</span><span className="h-4 rounded bg-primary-600" style={{ width: `${(b.count / maxBucket) * 100}%`, minWidth: b.count ? 4 : 0 }} /><span className="tabular-nums">{b.count}</span></li>
          ))}
        </ul>
      </Card>
      {d.mostWrong.length ? (
        <Card>
          <h3 className="mb-2 font-semibold">Hardest questions</h3>
          <Table caption="Hardest questions" columns={[{ key: 'p', header: '#' }, { key: 'q', header: 'Question' }, { key: 'c', header: 'Right of those who tried' }]} rows={d.mostWrong.map((x) => ({ key: x.tvqId, cells: { p: x.position, q: <span className="line-clamp-2">{x.preview}</span>, c: `${Math.round((x.pCorrectOfAttempted ?? 0) * 100)}% (${x.correct}/${x.attempted})` } }))} />
        </Card>
      ) : null}
      <Card>
        <h3 className="mb-2 font-semibold">Every question</h3>
        <Table
          caption="Question analysis"
          columns={[{ key: 'p', header: '#' }, { key: 'q', header: 'Question' }, { key: 'tried', header: 'Tried' }, { key: 'right', header: 'Right' }, { key: 'di', header: 'Difficulty index' }, { key: 'time', header: 'Avg time' }, { key: 'act', header: '' }]}
          rows={d.questions.map((x) => ({ key: x.tvqId, cells: { p: x.position, q: <span className="line-clamp-2 max-w-sm">{x.preview}</span>, tried: x.attempted, right: x.correct, di: x.difficultyIndex ?? '—', time: x.avgTimeSec ? `${x.avgTimeSec}s` : '—', act: can('test:publish') ? <Button size="sm" variant="ghost" onClick={() => { setFix(x); setAnswer(0); }}>Correct key</Button> : null } }))}
        />
        <p className="mt-2 text-sm text-ink-500">Difficulty index is the share of all ranked students who got the question right; lower means harder.</p>
      </Card>

      <Modal open={!!fix} onClose={() => setFix(null)} title={`Correct the answer key: question ${fix?.position}`} footer={<><Button variant="secondary" onClick={() => setFix(null)}>Cancel</Button><Button variant="danger" disabled={reason.trim().length < 5} loading={correct.isPending} onClick={() => correct.mutate()}>Correct and re-grade</Button></>}>
        <div className="space-y-3">
          <p className="line-clamp-3 text-ink-700">{fix?.preview}</p>
          <Alert tone="warning" live={false}>This changes the score of every student who took this version. It is recorded in the audit log with your reason.</Alert>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">The correct option is</legend>
            <div className="grid grid-cols-4 gap-2">{'ABCD'.split('').map((l, i) => <label key={l} className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-2 border-line font-bold has-[:checked]:border-success-600 has-[:checked]:bg-success-50"><input type="radio" name="newkey" className="sr-only" checked={answer === i} onChange={() => setAnswer(i)} />{l}</label>)}</div>
          </fieldset>
          <label className="block text-sm font-medium">Reason (required)<Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} /></label>
          <Checkbox checked={updateBank} onChange={(e) => setUpdateBank(e.target.checked)} label="Also fix the question in the question bank" />
        </div>
      </Modal>
    </div>
  );
}
