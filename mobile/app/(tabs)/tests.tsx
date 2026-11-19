import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight, Clock, Lock, Radio, ScrollText, Target, Zap, ClipboardList, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { TestListItem } from '@eg/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Badge, Card, Chip, Empty, ErrorBox, Row, Screen, Skeleton, Sticker, T, useTabPad } from '@/ui';
import type { Tone } from '@/theme';

type Filter = 'all' | 'free' | 'paid' | 'live';
const KIND: Record<string, { icon: LucideIcon; tone: Tone }> = { pyq: { icon: ScrollText, tone: 'lilac' }, topic: { icon: Target, tone: 'mint' }, daily: { icon: Zap, tone: 'gold' }, live: { icon: Radio, tone: 'pink' } };

export function TestRow({ test }: { test: TestListItem }) {
  const { t, b } = useI18n();
  const k = KIND[test.kind] ?? (test.live ? KIND.live : { icon: ClipboardList, tone: 'indigo' as Tone });
  return (
    <Card style={{ marginBottom: 10 }} onPress={() => router.push(`/test/${test.id}`)}>
      <Row>
        <Sticker icon={test.locked ? Lock : k.icon} tone={test.locked ? 'gold' : k.tone} size={52} />
        <View style={{ flex: 1, gap: 3 }}>
          <T v="h3" numberOfLines={2}>{b(test.titleEn, test.titleHi)}</T>
          <Row gap={6}>
            <Clock size={13} color="#565A7C" />
            <T v="small">{t('app.tests.min', { n: test.durationMin })} · {t('app.tests.q', { n: test.questionCount })}</T>
          </Row>
          <Row gap={6}>
            {test.live ? <Badge text={t('app.tests.live')} tone="red" /> : null}
            <Badge text={test.access === 'free' ? t('app.free') : t('app.paid')} tone={test.access === 'free' ? 'mint' : 'gold'} />
            {test.mine.attempts > 0 ? <Badge text={`✓ ${test.mine.bestScore ?? ''}`} tone="indigo" /> : null}
          </Row>
        </View>
        <ChevronRight size={20} color="#B4B7D0" />
      </Row>
    </Card>
  );
}

export default function TestsTab() {
  const { t } = useI18n();
  const { api } = useAuth();
  const pad = useTabPad();
  const [filter, setFilter] = useState<Filter>('all');
  const q = useQuery({ queryKey: ['tests'], queryFn: () => api.tests({ pageSize: 50 }) });
  const items = useMemo(() => {
    const all = q.data?.items ?? [];
    return all.filter((x) => (filter === 'free' ? x.access === 'free' : filter === 'paid' ? x.access === 'paid' : filter === 'live' ? x.live : true));
  }, [q.data, filter]);
  return (
    <Screen bottomPad={pad} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <T v="h1" style={{ paddingTop: 12, paddingBottom: 12 }}>{t('nav.tests')}</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
        {(['all', 'free', 'paid', 'live'] as const).map((f) => (
          <Chip key={f} label={t(`app.tests.${f}` as 'app.tests.all')} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
      {q.isLoading ? <><Skeleton /><Skeleton /><Skeleton /></> : q.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : items.length === 0 ? <Empty text={t('app.tests.empty')} /> : items.map((x) => <TestRow key={x.id} test={x} />)}
    </Screen>
  );
}
