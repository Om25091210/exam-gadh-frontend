'use client';
import type { Lang, QuestionLang } from '@eg/api';
import { useI18n } from '@eg/i18n';
import { cn, RichText } from '@eg/ui';
import { Check, X } from 'lucide-react';

export interface QuestionLike {
  type: 'single' | 'multi_statement' | 'match' | 'assertion_reason' | 'chronology' | 'passage';
  en?: QuestionLang;
  hi?: QuestionLang;
  passage: { en?: string; hi?: string } | null;
}

const LETTERS = ['A', 'B', 'C', 'D'];

/** The language asked for, or the other one when the question has not been translated yet. */
export function pickBody(q: QuestionLike, lang: Lang): { body: QuestionLang | undefined; fellBack: boolean } {
  const want = q[lang];
  if (want) return { body: want, fellBack: false };
  return { body: q[lang === 'hi' ? 'en' : 'hi'], fellBack: true };
}

export function QuestionBody({ q, lang }: { q: QuestionLike; lang: Lang }) {
  const { t } = useI18n();
  const { body, fellBack } = pickBody(q, lang);
  if (!body) return null;
  const passage = q.passage ? (q.passage[lang] ?? q.passage[lang === 'hi' ? 'en' : 'hi']) : null;
  return (
    <div lang={fellBack ? (lang === 'hi' ? 'en' : 'hi') : lang} className="space-y-3 text-lg">
      {fellBack ? <p className="text-sm text-ink-500">{lang === 'hi' ? 'हिन्दी उपलब्ध नहीं है; अंग्रेज़ी दिखाई जा रही है।' : 'English is not available; showing Hindi.'}</p> : null}
      {passage ? (
        <div className="rounded-xl border-l-4 border-primary-600 bg-primary-50 p-3 text-base">
          <p className="mb-1 text-sm font-semibold text-primary-800">{t('exam.passage')}</p>
          <p><RichText text={passage} /></p>
        </div>
      ) : null}
      {q.type === 'assertion_reason' ? (
        <>
          {body.stem ? <p><RichText text={body.stem} /></p> : null}
          <p><strong>{t('exam.assertion')}: </strong><RichText text={body.assertion} /></p>
          <p><strong>{t('exam.reason')}: </strong><RichText text={body.reason} /></p>
        </>
      ) : (
        <p><RichText text={body.stem} /></p>
      )}
      {q.type === 'multi_statement' && body.statements ? (
        <ol className="list-decimal space-y-1 pl-6 text-base" aria-label={t('exam.statement')}>
          {body.statements.map((s, i) => <li key={i}><RichText text={s} /></li>)}
        </ol>
      ) : null}
      {q.type === 'multi_statement' && body.prompt ? <p className="text-base"><RichText text={body.prompt} /></p> : null}
      {q.type === 'match' && body.listA && body.listB ? (
        <div className="grid grid-cols-2 gap-3 text-base">
          <div>
            <p className="mb-1 font-semibold">{t('exam.matchA')}</p>
            <ol className="space-y-1" type="a">
              {body.listA.map((s, i) => <li key={i} className="flex gap-2"><span className="font-semibold">{'abcdef'[i]}.</span><RichText text={s} /></li>)}
            </ol>
          </div>
          <div>
            <p className="mb-1 font-semibold">{t('exam.matchB')}</p>
            <ol className="space-y-1">
              {body.listB.map((s, i) => <li key={i} className="flex gap-2"><span className="font-semibold">{i + 1}.</span><RichText text={s} /></li>)}
            </ol>
          </div>
        </div>
      ) : null}
      {q.type === 'chronology' && body.items ? (
        <ol className="space-y-1 text-base" aria-label={t('exam.order')}>
          {body.items.map((s, i) => <li key={i} className="flex gap-2"><span className="font-semibold">{'ABCDEF'[i]}.</span><RichText text={s} /></li>)}
        </ol>
      ) : null}
    </div>
  );
}

export interface OptionsProps {
  q: QuestionLike;
  lang: Lang;
  name: string;
  selected: number | null;
  onSelect?: (i: number) => void;
  disabled?: boolean;
  /** review mode: highlight the right answer and the student's wrong one */
  correct?: number;
}

/** Four options as a radio group (large touch targets, keyboard and screen-reader friendly). */
export function Options({ q, lang, name, selected, onSelect, disabled, correct }: OptionsProps) {
  const { t } = useI18n();
  const { body } = pickBody(q, lang);
  if (!body) return null;
  const review = correct !== undefined;
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="sr-only">{t('exam.question', { n: '' })}</legend>
      {body.options.map((opt, i) => {
        const isSelected = selected === i;
        const isRight = review && correct === i;
        const isWrong = review && isSelected && correct !== i;
        return (
          <label
            key={i}
            className={cn(
              'flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border-2 bg-surface p-3 text-base transition-colors',
              !review && 'hover:border-primary-500',
              isSelected && !review && 'border-primary-700 bg-primary-50',
              !isSelected && !isRight && 'border-line',
              isRight && 'border-success-600 bg-success-50',
              isWrong && 'border-danger-600 bg-danger-50',
              disabled && 'cursor-default',
            )}
          >
            <input type="radio" name={name} value={i} checked={isSelected} onChange={() => onSelect?.(i)} className="sr-only" aria-label={`${t('exam.option', { n: LETTERS[i] })}`} />
            <span aria-hidden className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 text-sm font-bold', isSelected ? 'border-primary-700 bg-primary-700 text-white' : 'border-ink-300 text-ink-700', isRight && 'border-success-600 bg-success-600 text-white', isWrong && 'border-danger-600 bg-danger-600 text-white')}>
              {LETTERS[i]}
            </span>
            <span className="min-w-0 flex-1"><RichText text={opt} /></span>
            {isRight ? <Check className="size-5 shrink-0 text-success-600" aria-label={t('review.correctAnswer')} /> : null}
            {isWrong ? <X className="size-5 shrink-0 text-danger-600" aria-label={t('review.yourAnswer')} /> : null}
          </label>
        );
      })}
    </fieldset>
  );
}
