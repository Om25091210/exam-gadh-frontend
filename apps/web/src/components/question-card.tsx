'use client';
import type { BookmarkedQuestion } from '@eg/api';
import { useI18n } from '@eg/i18n';
import { Alert, Card, Options, pickBody, QuestionBody, RichText } from '@eg/ui';
import type { ReactNode } from 'react';


/** A saved question (bookmark / revision / note). The right answer is shown only when the server released it. */
export function QuestionCard({ q, actions, badges }: { q: BookmarkedQuestion; actions?: ReactNode; badges?: ReactNode }) {
  const { t, lang } = useI18n();
  const like = { type: q.type, en: q.en, hi: q.hi, passage: null };
  const { body } = pickBody(like, lang);
  const revealed = q.correctOption !== null;
  return (
    <Card as="article" className="space-y-3">
      {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
      <QuestionBody q={like} lang={lang} />
      <Options q={like} lang={lang} name={`s-${q.questionId}`} selected={null} disabled correct={revealed ? q.correctOption! : undefined} />
      {revealed ? (
        body?.explanation ? <div className="rounded-xl bg-primary-50 p-3"><p className="mb-1 text-sm font-semibold text-primary-800">{t('review.explanation')}</p><p><RichText text={body.explanation} /></p></div> : null
      ) : (
        <Alert tone="info" live={false}>{t('revision.keyHidden')}</Alert>
      )}
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
}
