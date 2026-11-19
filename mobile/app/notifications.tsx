import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C } from '@/theme';
import { Button, Card, Empty, ErrorBox, Row, Screen, ScreenHeader, Skeleton, Sticker, T } from '@/ui';

export default function Notifications() {
  const { t, b, date } = useI18n();
  const { api } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications({ pageSize: 50 }) });
  const read = useMutation({ mutationFn: (id: string) => api.markRead(id), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); void qc.invalidateQueries({ queryKey: ['home'] }); } });
  const all = useMutation({ mutationFn: () => api.markAllRead(), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); void qc.invalidateQueries({ queryKey: ['home'] }); } });
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()} header={<ScreenHeader title={t('nav.notifications')} />}>
      {q.isLoading ? <><Skeleton /><Skeleton /></> : q.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : q.data!.items.length === 0 ? <Empty text={t('common.none')} /> : (
        <>
          <Button title={t('notifications.markAll')} variant="soft" small onPress={() => all.mutate()} style={{ marginBottom: 12, alignSelf: 'flex-end' }} />
          {q.data!.items.map((n) => (
            <Pressable key={n.id} onPress={() => !n.read && read.mutate(n.id)} accessibilityRole="button">
              <Card style={{ marginBottom: 10, borderLeftWidth: n.read ? 0 : 4, borderLeftColor: C.primary }}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <Sticker icon={Bell} tone={n.read ? 'lilac' : 'indigo'} size={44} />
                  <View style={{ flex: 1 }}>
                    <T v="h3">{b(n.titleEn, n.titleHi)}</T>
                    <T v="body" style={{ fontSize: 14 }}>{b(n.bodyEn, n.bodyHi)}</T>
                    <T v="small">{date(n.createdAt)}</T>
                  </View>
                </Row>
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}
