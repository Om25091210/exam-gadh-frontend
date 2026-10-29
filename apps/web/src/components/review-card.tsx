'use client';
import { ApiError, type ReportReason, type ReviewQuestion } from '@eg/api';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Alert, Badge, Button, Card, Field, Modal, Options, pickBody, QuestionBody, RichText, Select, Textarea, useToast } from '@eg/ui';
import { Bookmark, BookmarkCheck, Flag, MessageCircleQuestion, StickyNote } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';
import { formatSpent } from '@/lib/time';


const REASONS: ReportReason[] = ['wrong_answer', 'typo', 'unclear', 'translation', 'other'];

export function ReviewCard({ q, attemptId, bookmarked, note }: { q: ReviewQuestion; attemptId: string; bookmarked: boolean; note: string | undefined }) {
  const { t, lang, fmt } = useI18n();
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(note ?? '');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('wrong_answer');
  const [reportNote, setReportNote] = useState('');

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (bookmarked) await api.removeBookmark('question', q.questionId);
      else await api.addBookmark({ kind: 'question', attemptId, qid: q.qid });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
    onError: (e) => toast.show(t(errorKey(e)), 'danger'),
  });
  const saveNote = useMutation({
    mutationFn: () => api.saveNote({ attemptId, qid: q.qid, text: noteText }),
    onSuccess: () => {
      toast.show(t('review.note.saved'), 'success');
      void qc.invalidateQueries({ queryKey: ['notes'] });
      setNoteOpen(false);
    },
    onError: (e) => toast.show(t(errorKey(e)), 'danger'),
  });
  const report = useMutation({
    mutationFn: () => api.reportQuestion({ attemptId, qid: q.qid, reason, note: reportNote.trim() || undefined }),
    onSuccess: () => {
      toast.show(t('review.report.sent'), 'success');
      setReportOpen(false);
    },
    onError: (e) => toast.show(e instanceof ApiError && e.code === 'ALREADY_REPORTED' ? t('error.ALREADY_REPORTED') : t(errorKey(e)), 'danger'),
  });

  const { body } = pickBody(q, lang);
  const explanation = body?.explanation ?? q.en?.explanation ?? q.hi?.explanation;
  const tone = q.outcome === 'correct' ? 'success' : q.outcome === 'wrong' ? 'danger' : 'neutral';

  return (
    <Card as="article" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-primary-800">{t('exam.question', { n: q.position })}</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone={tone}>{t(`result.${q.outcome === 'skipped' ? 'skipped' : q.outcome}` as MessageKey)}</Badge>
          <span className="text-ink-500">{t('review.marks', { n: fmt.number(q.marksAwarded, 2) })}</span>
          <span className="text-ink-500">{t('review.time', { n: formatSpent(q.timeSpentSec) })}</span>
        </div>
      </div>
      <QuestionBody q={q} lang={lang} />
      <Options q={q} lang={lang} name={`r-${q.qid}`} selected={q.selected} disabled correct={q.correctOption} />
      {q.selected === null ? <p className="text-sm text-ink-500">{t('review.notAnswered')}</p> : null}

      <div className="rounded-xl bg-primary-50 p-3">
        <p className="mb-1 text-sm font-semibold text-primary-800">{t('review.explanation')}</p>
        <p className="text-base">{explanation ? <RichText text={explanation} /> : t('review.noExplanation')}</p>
      </div>

      {note && !noteOpen ? (
        <div className="rounded-xl border border-accent-500/40 bg-accent-100 p-3 text-sm">
          <p className="mb-1 font-semibold text-accent-700">{t('review.note')}</p>
          <p>{note}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => toggleBookmark.mutate()} loading={toggleBookmark.isPending} aria-pressed={bookmarked}>
          {bookmarked ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
          {bookmarked ? t('review.bookmarked') : t('review.bookmark')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setNoteOpen((o) => !o)}>
          <StickyNote className="size-4" aria-hidden />
          {t('review.note')}
        </Button>
        <Link href={`/doubts/new?context=question&id=${q.questionId}`} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold hover:bg-primary-50">
          <MessageCircleQuestion className="size-4" aria-hidden />
          {t('review.askDoubt')}
        </Link>
        <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
          <Flag className="size-4" aria-hidden />
          {t('review.report')}
        </Button>
      </div>

      {noteOpen ? (
        <div className="space-y-2">
          <Field label={t('review.note')}>{(p) => <Textarea {...p} value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={2000} placeholder={t('review.note.placeholder')} />}</Field>
          <Button size="sm" onClick={() => saveNote.mutate()} loading={saveNote.isPending} disabled={noteText.trim().length === 0}>{t('review.note.save')}</Button>
        </div>
      ) : null}

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t('review.report.title')}
        footer={<><Button variant="secondary" onClick={() => setReportOpen(false)}>{t('common.cancel')}</Button><Button onClick={() => report.mutate()} loading={report.isPending}>{t('review.report.send')}</Button></>}
      >
        <div className="space-y-3">
          <Field label={t('review.report.reason')}>
            {(p) => (
              <Select {...p} value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
                {REASONS.map((r) => <option key={r} value={r}>{t(`review.report.reason.${r}` as MessageKey)}</option>)}
              </Select>
            )}
          </Field>
          <Field label={t('review.report.note')}>{(p) => <Textarea {...p} value={reportNote} onChange={(e) => setReportNote(e.target.value)} maxLength={1000} />}</Field>
          {report.isError ? <Alert tone="danger">{t('common.error.generic')}</Alert> : null}
        </div>
      </Modal>
    </Card>
  );
}

/** Which questions are bookmarked / have a note, as lookup tables for the review list. */
export function useStudyMarks() {
  const api = useApi();
  const b = useQuery({ queryKey: ['bookmarks', 'question'], queryFn: () => api.bookmarks('question') });
  const n = useQuery({ queryKey: ['notes'], queryFn: () => api.notes() });
  return {
    bookmarked: new Set(b.data?.questions.map((x) => x.questionId) ?? []),
    notes: new Map(n.data?.map((x) => [x.questionId, x.text]) ?? []),
  };
}
