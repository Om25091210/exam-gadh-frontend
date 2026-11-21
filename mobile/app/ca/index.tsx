import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Lock, Newspaper } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Badge, Card, Chip, Empty, ErrorBox, Row, Screen, ScreenHeader, Skeleton, Sticker, T } from '@/ui';

export default function CaList() {
  const { t, b, date } = useI18n();
  const { api } = useAuth();
  const [cat, setCat] = useState<'CG' | 'NAT' | undefined>(undefined);
  const q = useQuery({ queryKey: ['ca', cat], queryFn: () => api.ca({ category: cat, pageSize: 30 }) });
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()} header={<ScreenHeader title={t('app.learn.ca')} subtitle={t('app.learn.ca.sub')} />}>
      <Row gap={8} style={{ marginBottom: 14 }}>
        <Chip label={t('app.tests.all')} active={!cat} onPress={() => setCat(undefined)} />
        <Chip label={t('app.ca.cg')} active={cat === 'CG'} onPress={() => setCat('CG')} />
        <Chip label={t('app.ca.nat')} active={cat === 'NAT'} onPress={() => setCat('NAT')} />
      </Row>
      {q.isLoading ? <><Skeleton /><Skeleton /></> : q.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : (q.data?.items.length ?? 0) === 0 ? <Empty text={t('app.ca.empty')} /> : q.data!.items.map((c, i) => (
        <Reveal key={c.id} delay={Math.min(i, 8) * 45}>
        <Card style={{ marginBottom: 10 }} onPress={() => router.push(`/ca/${c.id}`)}>
          <Row>
            <Sticker icon={c.locked ? Lock : Newspaper} tone={c.locked ? 'gold' : c.category === 'CG' ? 'peach' : 'sky'} size={52} />
            <View style={{ flex: 1, gap: 4 }}>
              <T v="h3" numberOfLines={3}>{b(c.titleEn, c.titleHi)}</T>
              <Row gap={8}>
                <T v="small">{date(c.date)}</T>
                <Badge text={c.category === 'CG' ? t('app.ca.cg') : t('app.ca.nat')} tone={c.category === 'CG' ? 'pink' : 'indigo'} />
              </Row>
            </View>
          </Row>
        </Card>
        </Reveal>
      ))}
    </Screen>
  );
}
