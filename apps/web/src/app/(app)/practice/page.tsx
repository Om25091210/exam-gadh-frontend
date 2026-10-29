'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Button, Card, Field, PageHeader, Section, Select } from '@eg/ui';
import { BarChart3, Bookmark, CalendarCheck, ClipboardList, RotateCcw, Trophy, type LucideIcon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';
import type { MessageKey } from '@eg/i18n';

const LINKS: Array<{ href: string; label: MessageKey; icon: LucideIcon }> = [
  { href: '/practice/analytics', label: 'nav.analytics', icon: BarChart3 },
  { href: '/practice/revision', label: 'nav.revision', icon: RotateCcw },
  { href: '/practice/bookmarks', label: 'nav.bookmarks', icon: Bookmark },
  { href: '/series', label: 'series.title', icon: ClipboardList },
  { href: '/leaderboard', label: 'nav.leaderboard', icon: Trophy },
  { href: '/planner', label: 'nav.planner', icon: CalendarCheck },
];

function PracticeInner() {
  const { t, b } = useI18n();
  const api = useApi();
  const router = useRouter();
  const sp = useSearchParams();
  const [topic, setTopic] = useState(sp.get('topic') ?? '');
  const [count, setCount] = useState(10);
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: () => api.subjects(), staleTime: 10 * 60_000 });
  const make = useMutation({
    mutationFn: (body: Parameters<typeof api.practice>[0]) => api.practice(body),
    onSuccess: (r) => router.push(`/tests/${r.testId}`),
  });

  return (
    <>
      <PageHeader title={t('practice.title')} />
      <Section title={t('practice.topic')}>
        <Card className="space-y-3">
          <p className="text-ink-700">{t('practice.topic.desc')}</p>
          <Field label={t('practice.topic.pick')}>
            {(p) => (
              <Select {...p} value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">—</option>
                {subjects.data?.map((s) => (
                  <optgroup key={s.code} label={b(s.nameEn, s.nameHi)}>
                    {s.topics.map((x) => <option key={x.code} value={x.code}>{b(x.nameEn, x.nameHi)}</option>)}
                  </optgroup>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('practice.count')}>
            {(p) => (
              <Select {...p} value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            )}
          </Field>
          <Button disabled={!topic} loading={make.isPending && make.variables?.source === 'topic'} onClick={() => make.mutate({ source: 'topic', topicCode: topic, count })}>{t('practice.create')}</Button>
        </Card>
      </Section>
      <Section title={t('practice.revision')}>
        <Card className="space-y-3">
          <p className="text-ink-700">{t('practice.revision.desc')}</p>
          <Button variant="secondary" loading={make.isPending && make.variables?.source === 'revision'} onClick={() => make.mutate({ source: 'revision', count: 10 })}>{t('practice.revision.create')}</Button>
        </Card>
      </Section>
      {make.isError ? <Alert tone="danger" className="mb-4">{t(errorKey(make.error))}</Alert> : null}
      <Section title={t('practice.more')}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface p-3 font-semibold shadow-card hover:border-primary-500">
                <l.icon className="size-6 text-primary-700" aria-hidden />
                {t(l.label)}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

export default function PracticePage() {
  return (
    <Suspense>
      <PracticeInner />
    </Suspense>
  );
}
