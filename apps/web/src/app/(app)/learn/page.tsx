'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Card, PageHeader } from '@eg/ui';
import { BookOpenText, CalendarDays, FileText, HelpCircle, Mic, Newspaper, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

const ITEMS: Array<{ href: string; title: MessageKey; desc: MessageKey; icon: LucideIcon }> = [
  { href: '/learn/ca', title: 'nav.currentAffairs', desc: 'learn.ca.desc', icon: Newspaper },
  { href: '/learn/pyq', title: 'nav.pyq', desc: 'learn.pyq.desc', icon: FileText },
  { href: '/learn/materials', title: 'nav.materials', desc: 'learn.materials.desc', icon: BookOpenText },
  { href: '/learn/updates', title: 'nav.updates', desc: 'learn.updates.desc', icon: CalendarDays },
  { href: '/learn/faqs', title: 'nav.faqs', desc: 'learn.faqs.desc', icon: HelpCircle },
  { href: '/learn/interview', title: 'nav.interview', desc: 'learn.interview.desc', icon: Mic },
];

export default function LearnHub() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t('learn.title')} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="block h-full">
              <Card className="flex h-full items-start gap-3 hover:border-primary-500">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-800"><i.icon className="size-6" aria-hidden /></span>
                <span>
                  <span className="block font-semibold">{t(i.title)}</span>
                  <span className="block text-sm text-ink-500">{t(i.desc)}</span>
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
