'use client';
import { useI18n, type Lang, type MessageKey } from '@eg/i18n';
import { Alert, Badge, Button, buttonClasses, Card, Checkbox, ErrorState, PageHeader, RichText, Skeleton, Table } from '@eg/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, b, lang, fmt } = useI18n();
  const api = useApi();
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [testLang, setTestLang] = useState<Lang>(lang);

  const q = useQuery({ queryKey: ['test', id], queryFn: () => api.test(id) });
  const start = useMutation({
    mutationFn: (practice: boolean) => api.startAttempt(id, { language: testLang, practice }),
    onSuccess: (a) => router.push(`/attempt/${a.attemptId}`),
  });

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={q.error ? t(errorKey(q.error)) : undefined} onRetry={() => q.refetch()} />;
  const d = q.data;
  const now = Date.now();
  const notStarted = d.mode === 'live' && d.startsAt && new Date(d.startsAt).getTime() > now;
  const windowClosed = d.mode === 'live' && d.endsAt && new Date(d.endsAt).getTime() < now;
  const running = d.myAttempts.find((a) => a.status === 'in_progress');
  const rankedDone = d.myAttempts.some((a) => a.isRanked);
  const limitReached = d.attemptLimit != null && d.myAttempts.length >= d.attemptLimit && !windowClosed;
  const instructions = lang === 'hi' ? (d.instructions.hi ?? d.instructions.en) : (d.instructions.en ?? d.instructions.hi);

  return (
    <>
      <PageHeader title={b(d.titleEn, d.titleHi)} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={d.mode === 'live' ? 'success' : 'neutral'}>{t(`tests.kind.${d.kind}` as MessageKey)}</Badge>
        <Badge>{t('common.questions', { n: d.questionCount })}</Badge>
        <Badge>{t('common.minutes', { n: d.durationMin })}</Badge>
        <Badge>{t('common.marks', { n: fmt.number(d.maxScore, 1) })}</Badge>
        {d.attemptLimit ? <Badge>{t('tests.attemptLimit', { n: d.attemptLimit })}</Badge> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 text-lg font-semibold">{t('tests.instructions')}</h2>
            <div className="space-y-2 text-ink-700">
              <p><RichText text={instructions ?? t('tests.noInstructions')} /></p>
              <p>{t('tests.plusMarks', { n: d.scheme.correctMarks })}</p>
              <p>{d.scheme.negativeFraction > 0 ? t('tests.negative', { n: fmt.number(d.scheme.correctMarks * d.scheme.negativeFraction, 2) }) : t('tests.noNegative')}</p>
              {d.scheme.qualifyingPct != null ? <p>{t('tests.qualifying', { pct: d.scheme.qualifyingPct })}</p> : null}
              {d.sectionalTimers ? <p>{t('tests.sectionalNote')}</p> : null}
              {d.startsAt ? <p>{t('tests.live.starts', { time: fmt.dateTime(d.startsAt) })}</p> : null}
              {d.endsAt ? <p>{t('tests.live.ends', { time: fmt.dateTime(d.endsAt) })}</p> : null}
              {d.resultReleaseAt ? <p>{t('tests.results.release', { time: fmt.dateTime(d.resultReleaseAt) })}</p> : null}
            </div>
          </Card>

          {d.sections.length > 0 ? (
            <section aria-labelledby="sec">
              <h2 id="sec" className="mb-2 text-lg font-semibold">{t('tests.sections')}</h2>
              <Table
                caption={t('tests.sections')}
                columns={[{ key: 'n', header: t('exam.section') }, { key: 'q', header: t('common.questions', { n: '' }).trim() }, { key: 'm', header: t('common.minutes', { n: '' }).trim() }]}
                rows={d.sections.map((s) => ({ key: String(s.position), cells: { n: b(s.nameEn, s.nameHi), q: s.count, m: s.durationMin ?? '—' } }))}
              />
            </section>
          ) : null}

          {d.myAttempts.length > 0 ? (
            <section aria-labelledby="hist">
              <h2 id="hist" className="mb-2 text-lg font-semibold">{t('tests.history')}</h2>
              <ul className="space-y-2">
                {d.myAttempts.map((a) => (
                  <Card as="li" key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{t('tests.attemptNo', { n: a.attemptNo })} {a.isRanked ? null : <Badge className="ml-1">{t('tests.practiceMode')}</Badge>}</p>
                      <p className="text-sm text-ink-500">{t(`tests.status.${a.status}` as MessageKey)} · {fmt.dateTime(a.submittedAt ?? a.startedAt)}</p>
                    </div>
                    {a.status === 'in_progress' ? (
                      <Link href={`/attempt/${a.id}`} className={buttonClasses('primary', 'sm')}>{t('tests.resume')}</Link>
                    ) : (
                      <Link href={`/results/${a.id}`} className={buttonClasses('secondary', 'sm')}>{t('tests.viewResult')}</Link>
                    )}
                  </Card>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside>
          <Card className="space-y-3 md:sticky md:top-20">
            {d.locked ? (
              <>
                <Alert tone="warning">{t('error.PAYMENT_REQUIRED')}</Alert>
                <Link href="/plans" className={buttonClasses('accent', 'lg', 'w-full')}>{t('tests.paid.cta')}</Link>
              </>
            ) : running ? (
              <Link href={`/attempt/${running.id}`} className={buttonClasses('primary', 'lg', 'w-full')}>{t('tests.resume')}</Link>
            ) : notStarted ? (
              <Alert tone="info">{t('tests.notStarted')}</Alert>
            ) : limitReached ? (
              <Alert tone="warning">{t('error.ATTEMPT_LIMIT')}</Alert>
            ) : (
              <>
                {windowClosed ? <Alert tone="info">{t('tests.closed')}</Alert> : rankedDone ? <Alert tone="info">{t('tests.practiceNote')}</Alert> : null}
                <fieldset>
                  <legend className="mb-1 text-sm font-medium text-ink-700">{t('tests.language')}</legend>
                  <div className="flex gap-2">
                    {(['hi', 'en'] as const).map((l) => (
                      <label key={l} className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-3 has-[:checked]:border-primary-700 has-[:checked]:bg-primary-50">
                        <input type="radio" name="lang" value={l} checked={testLang === l} onChange={() => setTestLang(l)} className="accent-primary-700" />
                        <span lang={l}>{l === 'hi' ? 'हिन्दी' : 'English'}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} label={t('tests.agree')} />
                {start.isError ? <Alert tone="danger">{t(errorKey(start.error))}</Alert> : null}
                <Button size="lg" className="w-full" disabled={!agree} loading={start.isPending} onClick={() => start.mutate(rankedDone || !!windowClosed)}>
                  {t('tests.start')}
                </Button>
              </>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
