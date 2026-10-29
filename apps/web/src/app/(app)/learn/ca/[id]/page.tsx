'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Badge, buttonClasses, Card, ErrorState, PageHeader, RichText, Skeleton } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

export default function CaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, b, fmt } = useI18n();
  const api = useApi();
  const q = useQuery({ queryKey: ['ca-item', id], queryFn: () => api.caItem(id) });
  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError || !q.data) return <ErrorState message={t(errorKey(q.error))} onRetry={() => q.refetch()} />;
  const c = q.data;
  return (
    <>
      <PageHeader title={b(c.titleEn, c.titleHi)} subtitle={fmt.date(c.date)} actions={<Link href="/learn/ca" className={buttonClasses('secondary', 'sm')}>{t('common.back')}</Link>} />
      <div className="mb-3 flex flex-wrap gap-2"><Badge tone={c.category === 'CG' ? 'success' : 'info'}>{t(`ca.category.${c.category}`)}</Badge>{c.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
      {c.imageUrl ? <Image src={c.imageUrl} alt="" width={800} height={450} unoptimized className="mb-4 h-auto w-full rounded-card" /> : null}
      {c.locked ? (
        <Alert tone="warning" title={t('ca.locked')}><Link href="/plans" className={buttonClasses('accent', 'sm', 'mt-2')}>{t('home.plan.view')}</Link></Alert>
      ) : (
        <div className="space-y-4">
          <Card><p className="whitespace-pre-line text-lg"><RichText text={b(c.summaryEn, c.summaryHi)} /></p></Card>
          {c.angleEn || c.angleHi ? <Card className="border-accent-500/40 bg-accent-100"><p className="mb-1 text-sm font-semibold text-accent-700">{t('ca.angle')}</p><p><RichText text={b(c.angleEn, c.angleHi)} /></p></Card> : null}
          <div className="flex flex-wrap gap-2">
            {c.quizTestId ? <Link href={`/tests/${c.quizTestId}`} className={buttonClasses('primary')}>{t('ca.quiz')}</Link> : null}
            {c.sourceUrl ? <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary')}>{t('ca.source')}</a> : null}
          </div>
        </div>
      )}
    </>
  );
}
