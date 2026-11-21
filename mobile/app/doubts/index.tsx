import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { CheckCircle2, Clock, MessageCircleQuestion, Plus, Star } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import type { DoubtStatus } from '@eg/api';
import { Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C } from '@/theme';
import { Badge, Button, Card, Chip, Empty, ErrorBox, ProgressBar, Row, Screen, ScreenHeader, Skeleton, Sticker, T } from '@/ui';

const TONE = { open: 'gold', answered: 'mint', closed: 'gray' } as const;

export default function DoubtsList() {
  const { t, date } = useI18n();
  const { api } = useAuth();
  const [status, setStatus] = useState<DoubtStatus | undefined>(undefined);
  const q = useQuery({ queryKey: ['doubts', status], queryFn: () => api.doubts({ status }) });
  const quota = useQuery({ queryKey: ['doubt-quota'], queryFn: () => api.doubtQuota() });
  const qt = quota.data;
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => { void q.refetch(); void quota.refetch(); }} header={<ScreenHeader title={t('doubts.title')} right={<Button title={t('doubts.new')} small icon={Plus} onPress={() => router.push('/doubts/new')} />} />} bottomPad={40}>
      {qt ? (
        <Reveal>
          <Card style={{ marginBottom: 14, gap: 8 }}>
            <T v="small">{t('doubts.quota.day', { used: qt.daily.used, limit: qt.daily.limit })}</T>
            <ProgressBar value={qt.daily.used} max={qt.daily.limit} tone={qt.daily.used >= qt.daily.limit ? C.coral : C.primary} />
            {qt.monthly ? (
              <>
                <T v="small">{t('doubts.quota.month', { used: qt.monthly.used, limit: qt.monthly.limit })}</T>
                <ProgressBar value={qt.monthly.used} max={qt.monthly.limit} tone={qt.monthly.used >= qt.monthly.limit ? C.coral : C.mint} />
              </>
            ) : null}
          </Card>
        </Reveal>
      ) : null}
      <Row gap={8} style={{ marginBottom: 14 }}>
        <Chip label={t('app.tests.all')} active={!status} onPress={() => setStatus(undefined)} />
        {(['open', 'answered', 'closed'] as const).map((s) => (
          <Chip key={s} label={t(`doubts.status.${s}` as 'doubts.status.open')} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </Row>
      {q.isLoading ? <><Skeleton /><Skeleton /></> : q.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : (q.data?.items.length ?? 0) === 0 ? <Empty text={t('doubts.empty')} /> : q.data!.items.map((d, i) => (
        <Reveal key={d.id} delay={i * 60} style={{ marginBottom: 10 }}>
          <Card onPress={() => router.push(`/doubts/${d.id}`)}>
            <Row>
              <Sticker icon={d.status === 'answered' ? CheckCircle2 : d.status === 'open' ? Clock : MessageCircleQuestion} tone={d.status === 'answered' ? 'mint' : d.status === 'open' ? 'gold' : 'lilac'} size={50} />
              <View style={{ flex: 1, gap: 4 }}>
                <T v="h3" numberOfLines={2} style={{ fontSize: 15 }}>{d.preview}</T>
                <Row gap={8}>
                  <Badge text={t(`doubts.status.${d.status}` as 'doubts.status.open')} tone={TONE[d.status]} />
                  <T v="small">{date(d.createdAt)}</T>
                  {d.rating ? <Row gap={2}><Star size={12} color={C.gold} fill={C.gold} /><T v="small">{d.rating}</T></Row> : null}
                </Row>
                {d.status === 'open' ? <T v="small">{t('doubts.sla', { time: date(d.slaDueAt) })}</T> : null}
              </View>
            </Row>
          </Card>
        </Reveal>
      ))}
    </Screen>
  );
}
