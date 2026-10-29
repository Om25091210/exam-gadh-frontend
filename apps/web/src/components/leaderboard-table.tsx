'use client';
import type { LeaderboardEntry } from '@eg/api';
import { useI18n } from '@eg/i18n';
import { Badge, cn, EmptyState } from '@eg/ui';
import { formatSpent } from '@/lib/time';

/** Ranked list with the student's own row highlighted. Names are already shortened by the server ("Asha V."). */
export function LeaderboardTable({ entries, showTests }: { entries: LeaderboardEntry[]; showTests?: boolean }) {
  const { t, fmt } = useI18n();
  if (entries.length === 0) return <EmptyState title={t('leaderboard.empty')} />;
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{t('leaderboard.title')}</caption>
        <thead className="border-b border-line bg-black/[0.03] text-ink-700">
          <tr>
            <th scope="col" className="px-3 py-2">{t('leaderboard.rank')}</th>
            <th scope="col" className="px-3 py-2">{t('leaderboard.name')}</th>
            <th scope="col" className="px-3 py-2 text-right">{t('leaderboard.score')}</th>
            {showTests ? <th scope="col" className="px-3 py-2 text-right">{t('nav.tests')}</th> : null}
            <th scope="col" className="px-3 py-2 text-right">{t('leaderboard.time')}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={`${e.rank}-${e.name}`} className={cn('border-b border-line last:border-0', e.isMe && 'bg-primary-50 font-semibold')}>
              <td className="px-3 py-2 tabular-nums">{fmt.number(e.rank)}</td>
              <td className="px-3 py-2">{e.name} {e.isMe ? <Badge tone="info" className="ml-1">{t('result.you')}</Badge> : null}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt.number(e.score, 2)}{e.maxScore ? ` / ${fmt.number(e.maxScore, 0)}` : ''}</td>
              {showTests ? <td className="px-3 py-2 text-right tabular-nums">{e.tests}</td> : null}
              <td className="px-3 py-2 text-right tabular-nums">{formatSpent(e.timeSpentSec)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
