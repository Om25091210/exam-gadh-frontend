'use client';
import type { CaItem } from '@eg/api';
import { useI18n } from '@eg/i18n';
import { Badge, Card } from '@eg/ui';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export function CaCard({ item }: { item: CaItem }) {
  const { b, t, fmt } = useI18n();
  return (
    <Card as="li">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
        <Badge tone={item.category === 'CG' ? 'success' : 'info'}>{t(`ca.category.${item.category}`)}</Badge>
        <span>{fmt.date(item.date)}</span>
        {item.locked ? <Badge tone="warning"><Lock className="size-3" aria-hidden />{t('common.paid')}</Badge> : null}
      </div>
      <h3 className="font-semibold leading-snug">
        <Link href={`/learn/ca/${item.id}`} className="hover:underline">{b(item.titleEn, item.titleHi)}</Link>
      </h3>
      {item.locked ? <p className="mt-1 text-sm text-ink-500">{t('ca.locked')}</p> : <p className="mt-1 line-clamp-3 text-ink-700">{b(item.summaryEn, item.summaryHi)}</p>}
    </Card>
  );
}
