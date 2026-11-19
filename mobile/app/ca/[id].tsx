import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { RichText } from '@/rich';
import { C } from '@/theme';
import { Badge, Button, Card, ErrorBox, Row, Screen, ScreenHeader, Skeleton, T } from '@/ui';

export default function CaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, b, date } = useI18n();
  const { api } = useAuth();
  const q = useQuery({ queryKey: ['ca-item', id], queryFn: () => api.caItem(id) });
  const c = q.data;
  return (
    <Screen header={<ScreenHeader title={t('app.learn.ca')} />}>
      {q.isLoading ? <Skeleton h={220} /> : q.isError || !c ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : (
        <Card>
          <Row style={{ marginBottom: 8 }}>
            <Badge text={c.category === 'CG' ? t('app.ca.cg') : t('app.ca.nat')} tone={c.category === 'CG' ? 'pink' : 'indigo'} />
            <T v="small">{date(c.date)}</T>
          </Row>
          <T v="h1" style={{ fontSize: 22, marginBottom: 10 }}>{b(c.titleEn, c.titleHi)}</T>
          {c.locked ? <T v="body">{t('app.notes.locked')}</T> : (
            <>
              <RichText text={b(c.summaryEn, c.summaryHi)} style={{ fontSize: 16, lineHeight: 26, color: C.ink2 }} />
              {b(c.angleEn, c.angleHi) ? (
                <Card style={{ backgroundColor: C.primarySofter, marginTop: 14, shadowOpacity: 0 }}>
                  <T v="label">{t('app.ca.angle')}</T>
                  <RichText text={b(c.angleEn, c.angleHi)} style={{ fontSize: 15, lineHeight: 24, color: C.ink2, marginTop: 4 }} />
                </Card>
              ) : null}
              {c.sourceUrl ? <Button style={{ marginTop: 14 }} title={t('app.ca.source')} variant="soft" onPress={() => void WebBrowser.openBrowserAsync(c.sourceUrl!)} /> : null}
            </>
          )}
        </Card>
      )}
    </Screen>
  );
}
