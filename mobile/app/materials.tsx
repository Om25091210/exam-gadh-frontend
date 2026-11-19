import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { FileText, Link2, Lock, PlayCircle, type LucideIcon } from 'lucide-react-native';
import { Alert, View } from 'react-native';
import { ApiError } from '@eg/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import type { Tone } from '@/theme';
import { Badge, Card, Empty, ErrorBox, Row, Screen, ScreenHeader, Skeleton, Sticker, T } from '@/ui';

const KIND: Record<string, { icon: LucideIcon; tone: Tone }> = { pdf: { icon: FileText, tone: 'pink' }, video: { icon: PlayCircle, tone: 'indigo' }, link: { icon: Link2, tone: 'sky' } };

export default function Materials() {
  const { t, b } = useI18n();
  const { api } = useAuth();
  const q = useQuery({ queryKey: ['materials'], queryFn: () => api.materials({ pageSize: 50 }) });
  const open = async (id: string) => {
    try {
      const m = await api.material(id);
      const url = m.downloadUrl ?? m.url;
      if (url) await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert(e instanceof ApiError && e.code === 'PAYMENT_REQUIRED' ? t('app.notes.locked') : t('app.error'));
    }
  };
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()} header={<ScreenHeader title={t('app.learn.material')} subtitle={t('app.learn.material.sub')} />}>
      {q.isLoading ? <><Skeleton /><Skeleton /></> : q.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : (q.data?.items.length ?? 0) === 0 ? <Empty text={t('app.tests.empty')} /> : q.data!.items.map((m) => {
        const k = KIND[m.kind] ?? KIND.link;
        return (
          <Card key={m.id} style={{ marginBottom: 10 }} onPress={() => void open(m.id)}>
            <Row>
              <Sticker icon={m.locked ? Lock : k.icon} tone={m.locked ? 'gold' : k.tone} size={52} />
              <View style={{ flex: 1, gap: 4 }}>
                <T v="h3" numberOfLines={2}>{b(m.titleEn, m.titleHi)}</T>
                <Badge text={m.kind.toUpperCase()} tone="gray" />
              </View>
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
