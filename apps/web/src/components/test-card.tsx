'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import type { TestListItem } from '@eg/api';
import { Badge, buttonClasses, Card } from '@eg/ui';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export function TestCard({ test }: { test: TestListItem }) {
  const { t, b, fmt } = useI18n();
  const running = test.mine.inProgressAttemptId;
  return (
    <Card as="li" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={test.kind === 'live' ? 'success' : 'neutral'}>{t(`tests.kind.${test.kind}` as MessageKey)}</Badge>
        {test.access === 'paid' ? <Badge tone={test.locked ? 'warning' : 'info'}>{test.locked ? <Lock className="size-3" aria-hidden /> : null}{t('common.paid')}</Badge> : <Badge tone="info">{t('common.free')}</Badge>}
        {test.pyqYear ? <Badge>{test.pyqYear}</Badge> : null}
        {test.mine.attempts > 0 ? <Badge tone="success">{t('tests.attempted')}</Badge> : null}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold leading-snug">
          <Link href={`/tests/${test.id}`} className="hover:underline">
            {b(test.titleEn, test.titleHi)}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          {t('common.questions', { n: test.questionCount })} · {t('common.minutes', { n: test.durationMin })} · {t('common.marks', { n: fmt.number(test.maxScore, 1) })}
        </p>
        {test.startsAt ? <p className="text-sm text-ink-700">{t('tests.live.starts', { time: fmt.dateTime(test.startsAt) })}</p> : null}
        {test.mine.bestScore != null ? <p className="text-sm text-success-600">{t('tests.best', { n: fmt.number(test.mine.bestScore, 1) })}</p> : null}
      </div>
      <div className="mt-auto flex gap-2">
        <Link href={running ? `/attempt/${running}` : `/tests/${test.id}`} className={buttonClasses(running ? 'primary' : 'secondary', 'sm')}>
          {running ? t('tests.resume') : test.locked ? t('tests.paid.cta') : t('tests.instructions')}
        </Link>
      </div>
    </Card>
  );
}
