'use client';
import type { LeaderboardEntry } from '@eg/api';
import { useI18n } from '@eg/i18n';
import { Avatar, cn, EmptyState } from '@eg/ui';
import { Crown } from 'lucide-react';
import { formatSpent } from '@/lib/time';

/** Top three on a podium (gold in the middle), as on the purple leaderboard card. */
export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const { fmt } = useI18n();
  const [first, second, third] = entries;
  const slot = (e: LeaderboardEntry | undefined, place: 1 | 2 | 3) => {
    if (!e) return <div className="w-1/3" />;
    const big = place === 1;
    const ring = place === 1 ? 'ring-[#ffd36b]' : place === 2 ? 'ring-[#5eead4]' : 'ring-[#ff9db0]';
    return (
      <div className={cn('flex w-1/3 flex-col items-center text-center text-white', big ? '-mt-4' : 'mt-2')}>
        {big ? <Crown className="mb-1 size-6 text-[#ffd36b]" aria-hidden /> : <span className="mb-1 grid size-5 place-items-center rounded-full bg-white/25 text-[11px] font-bold">{place}</span>}
        <Avatar name={e.name} src={null} size={big ? 76 : 60} className={cn('ring-4', ring)} />
        <p className="mt-2 max-w-full truncate text-sm font-bold">{e.name}</p>
        <p className="text-xs text-white/85">{fmt.number(e.score, 1)}</p>
      </div>
    );
  };
  return (
    <div className="flex items-end justify-center gap-2 px-2 pt-4">
      {slot(second, 2)}
      {slot(first, 1)}
      {slot(third, 3)}
    </div>
  );
}

/** Ranked list as rounded cards with the student's own row highlighted. Names are already shortened by the server ("Asha V."). */
export function LeaderboardTable({ entries, showTests }: { entries: LeaderboardEntry[]; showTests?: boolean }) {
  const { t, fmt } = useI18n();
  if (entries.length === 0) return <EmptyState title={t('leaderboard.empty')} />;
  return (
    <ol className="space-y-2" aria-label={t('leaderboard.title')}>
      {entries.map((e) => (
        <li key={`${e.rank}-${e.name}`} className={cn('flex items-center gap-3 rounded-2xl p-3 shadow-card', e.isMe ? 'bg-gradient-to-r from-[#6c55f5] to-[#4a2fd1] text-white' : 'bg-white')}>
          <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums', e.isMe ? 'bg-white/20' : 'bg-primary-50 text-primary-700')}>{fmt.number(e.rank)}</span>
          <Avatar name={e.name} src={null} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{e.name} {e.isMe ? <span className="ml-1 rounded-full bg-white/25 px-2 py-0.5 text-[11px]">{t('result.you')}</span> : null}</p>
            <p className={cn('text-xs', e.isMe ? 'text-white/85' : 'text-ink-500')}>
              {showTests ? `${e.tests} ${t('nav.tests')} · ` : ''}
              {formatSpent(e.timeSpentSec)}
            </p>
          </div>
          <p className="text-right font-extrabold tabular-nums">
            {fmt.number(e.score, 1)}
            {e.maxScore ? <span className={cn('text-xs font-medium', e.isMe ? 'text-white/80' : 'text-ink-500')}> / {fmt.number(e.maxScore, 0)}</span> : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
