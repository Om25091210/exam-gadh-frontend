'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { cn } from '@eg/ui';
import { paletteStatus, type PaletteInput, type PaletteStatus } from '@/lib/exam/palette';

const LABEL: Record<PaletteStatus, MessageKey> = {
  notVisited: 'exam.legend.notVisited',
  notAnswered: 'exam.legend.notAnswered',
  answered: 'exam.legend.answered',
  marked: 'exam.legend.marked',
  answeredMarked: 'exam.legend.answeredMarked',
};

/** Colour AND shape: square grey / tab-shaped red / rounded green / circle purple / circle purple + green dot. */
const LOOK: Record<PaletteStatus, string> = {
  notVisited: 'bg-q-notvisited text-ink-900 rounded-md',
  notAnswered: 'bg-q-notanswered text-white rounded-t-xl rounded-b-sm',
  answered: 'bg-q-answered text-white rounded-b-xl rounded-t-sm',
  marked: 'bg-q-marked text-white rounded-full',
  answeredMarked: 'bg-q-marked text-white rounded-full',
};

export function StatusChip({ status, className }: { status: PaletteStatus; className?: string }) {
  return (
    <span aria-hidden className={cn('relative inline-grid size-6 shrink-0 place-items-center text-[10px] font-bold', LOOK[status], className)}>
      {status === 'answeredMarked' ? <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border border-white bg-q-answered" /> : null}
    </span>
  );
}

export function Legend({ counts }: { counts: Record<PaletteStatus, number> }) {
  const { t, fmt } = useI18n();
  const order: PaletteStatus[] = ['answered', 'notAnswered', 'notVisited', 'marked', 'answeredMarked'];
  return (
    <ul className="grid grid-cols-1 gap-1.5 text-sm">
      {order.map((s) => (
        <li key={s} className="flex items-center gap-2">
          <StatusChip status={s} />
          <span className="flex-1">{t(LABEL[s])}</span>
          <span className="font-semibold tabular-nums">{fmt.number(counts[s])}</span>
        </li>
      ))}
    </ul>
  );
}

export interface PaletteQuestion {
  qid: string;
  position: number;
  sectionPos: number;
}

export function Palette({
  questions,
  answers,
  currentQid,
  onGo,
  isLocked,
}: {
  questions: PaletteQuestion[];
  answers: Record<string, PaletteInput | undefined>;
  currentQid: string;
  onGo: (qid: string) => void;
  /** questions in finished/not-yet-open sections cannot be opened */
  isLocked?: (q: PaletteQuestion) => boolean;
}) {
  const { t } = useI18n();
  return (
    <ol className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-5" aria-label={t('exam.palette')}>
      {questions.map((q) => {
        const status = paletteStatus(answers[q.qid]);
        const locked = isLocked?.(q) ?? false;
        return (
          <li key={q.qid}>
            <button
              type="button"
              disabled={locked}
              onClick={() => onGo(q.qid)}
              aria-current={q.qid === currentQid ? 'true' : undefined}
              aria-label={`${t('exam.question', { n: q.position })}: ${t(LABEL[status])}`}
              className={cn(
                'relative grid size-11 w-full place-items-center text-sm font-bold tabular-nums disabled:opacity-40',
                LOOK[status],
                q.qid === currentQid && 'ring-4 ring-accent-500 ring-offset-1',
              )}
            >
              {q.position}
              {status === 'answeredMarked' ? <span aria-hidden className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-q-answered" /> : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
