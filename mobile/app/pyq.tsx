import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Lock, ScrollText } from 'lucide-react-native';
import { View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Badge, Card, Empty, ErrorBox, Row, Screen, ScreenHeader, Section, Skeleton, Sticker, T } from '@/ui';

export default function Pyq() {
  const { t, b, num } = useI18n();
  const { api } = useAuth();
  const q = useQuery({ queryKey: ['pyq'], queryFn: () => api.pyq() });
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()} header={<ScreenHeader title={t('app.learn.pyq')} subtitle={t('app.learn.pyq.sub')} />}>
      {q.isLoading ? <><Skeleton /><Skeleton /></> : q.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : (q.data?.years.length ?? 0) === 0 ? <Empty text={t('app.tests.empty')} /> : q.data!.years.map((y) => (
        <Section key={String(y.year)} title={y.year ? String(y.year) : '—'}>
          {y.papers.map((p) => (
            <Card key={p.id} style={{ marginBottom: 10 }} onPress={() => router.push(`/test/${p.id}`)}>
              <Row>
                <Sticker icon={p.locked ? Lock : ScrollText} tone={p.locked ? 'gold' : 'lilac'} size={50} />
                <View style={{ flex: 1, gap: 3 }}>
                  <T v="h3" numberOfLines={2}>{b(p.titleEn, p.titleHi)}</T>
                  <T v="small">{p.questionCount ? t('app.tests.q', { n: num(p.questionCount) }) : ''}{p.durationMin ? ` · ${t('app.tests.min', { n: p.durationMin })}` : ''}</T>
                </View>
                <Badge text={p.access === 'free' ? t('app.free') : t('app.paid')} tone={p.access === 'free' ? 'mint' : 'gold'} />
              </Row>
            </Card>
          ))}
        </Section>
      ))}
    </Screen>
  );
}
