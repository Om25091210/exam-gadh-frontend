import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { RichText } from '@/rich';
import { C } from '@/theme';
import { Badge, Card, Empty, ErrorBox, Row, Screen, ScreenHeader, Skeleton, T } from '@/ui';

export default function Interview() {
  const { t, b } = useI18n();
  const { api } = useAuth();
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['interview'], queryFn: () => api.interview() });
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()} header={<ScreenHeader title={t('app.learn.interview')} subtitle={t('app.learn.interview.sub')} />}>
      {q.isLoading ? <><Skeleton /><Skeleton /></> : q.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : (q.data?.length ?? 0) === 0 ? <Empty text={t('app.tests.empty')} /> : q.data!.map((i) => (
        <Pressable key={i.id} onPress={() => setOpen(open === i.id ? null : i.id)} accessibilityRole="button" accessibilityState={{ expanded: open === i.id }}>
          <Card style={{ marginBottom: 10 }}>
            <Row>
              <View style={{ flex: 1, gap: 6 }}>
                <Badge text={i.category} tone="indigo" />
                <T v="h3">{b(i.qEn, i.qHi)}</T>
              </View>
              {open === i.id ? <ChevronUp size={20} color={C.muted} /> : <ChevronDown size={20} color={C.muted} />}
            </Row>
            {open === i.id ? <RichText text={b(i.pointsEn, i.pointsHi)} style={{ fontSize: 15, lineHeight: 24, color: C.ink2, marginTop: 10 }} /> : null}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
