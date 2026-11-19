import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, MinusCircle, XCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C } from '@/theme';
import { Button, Card, ErrorBox, Hero, ProgressBar, Row, Screen, ScreenHeader, Section, Skeleton, T } from '@/ui';

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, b, num, date } = useI18n();
  const { api } = useAuth();
  const q = useQuery({ queryKey: ['result', id], queryFn: () => api.result(id) });
  const r = q.data;
  const close = () => router.replace('/(tabs)/tests');
  return (
    <Screen header={<ScreenHeader title={t('app.result.title')} back={false} right={<Button title={t('app.close')} variant="soft" small onPress={close} />} />} bottomPad={40}>
      {q.isLoading ? <><Skeleton h={160} /><Skeleton /></> : q.isError || !r ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : !r.released ? (
        <Card style={{ alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={40} color={C.success} />
          <T v="h2" center>{t('app.exam.submitting').replace('…', '')} ✓</T>
          <T v="body" center>{t('app.result.notReleased', { date: date(r.resultReleaseAt) })}</T>
        </Card>
      ) : (
        <>
          <Hero>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>{t('app.result.score')}</Text>
            <Row gap={6} style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: C.white, fontSize: 48, fontWeight: '800' }}>{num(r.score, 1)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, marginBottom: 8 }}>/ {num(r.maxScore, 0)}</Text>
            </Row>
            <Row gap={20} style={{ marginTop: 6 }}>
              {r.rank ? <View><Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{t('app.result.rank')}</Text><Text style={{ color: C.white, fontWeight: '800', fontSize: 20 }}>#{num(r.rank)}</Text></View> : null}
              {r.percentile !== null ? <View><Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{t('app.result.percentile')}</Text><Text style={{ color: C.white, fontWeight: '800', fontSize: 20 }}>{num(r.percentile, 1)}</Text></View> : null}
              <View><Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>%</Text><Text style={{ color: C.white, fontWeight: '800', fontSize: 20 }}>{num(r.accuracyPct)}%</Text></View>
            </Row>
          </Hero>

          <Row gap={10} style={{ marginTop: 14 }}>
            {([[CheckCircle2, r.correct, 'app.result.correct', C.success, C.successSoft], [XCircle, r.wrong, 'app.result.wrong', C.danger, C.dangerSoft], [MinusCircle, r.skipped, 'app.result.skipped', C.muted, '#ECEDF5']] as const).map(([Icon, v, k, col, bg]) => (
              <View key={k} style={{ flex: 1, backgroundColor: bg, borderRadius: 20, padding: 12, alignItems: 'center' }}>
                <Icon size={22} color={col} />
                <Text style={{ fontSize: 24, fontWeight: '800', color: col }}>{num(v)}</Text>
                <T v="small">{t(k)}</T>
              </View>
            ))}
          </Row>

          {r.sections.length > 1 ? (
            <Section title={t('app.test.sections')}>
              <Card style={{ gap: 12 }}>
                {r.sections.map((s) => (
                  <View key={s.position} style={{ gap: 6 }}>
                    <Row style={{ justifyContent: 'space-between' }}><T v="h3" style={{ fontSize: 14 }}>{b(s.nameEn, s.nameHi)}</T><T v="small">{num(s.score, 1)} / {num(s.maxScore, 0)}</T></Row>
                    <ProgressBar value={Math.max(0, s.score)} max={s.maxScore || 1} />
                  </View>
                ))}
              </Card>
            </Section>
          ) : null}

          {r.topics.length > 0 ? (
            <Section title={t('nav.analytics')}>
              <Card style={{ gap: 12 }}>
                {r.topics.map((tp) => (
                  <View key={tp.code} style={{ gap: 6 }}>
                    <Row style={{ justifyContent: 'space-between' }}><T v="h3" style={{ fontSize: 14, flex: 1 }}>{b(tp.nameEn, tp.nameHi)}</T><T v="small">{tp.correct}/{tp.attempted} · {tp.accuracyPct !== null ? `${num(tp.accuracyPct)}%` : '—'}</T></Row>
                    <ProgressBar value={tp.accuracyPct ?? 0} tone={(tp.accuracyPct ?? 0) >= 60 ? C.mint : C.coral} />
                  </View>
                ))}
              </Card>
            </Section>
          ) : null}

          <View style={{ marginTop: 20, gap: 10 }}>
            <Button title={t('app.result.review')} onPress={() => router.push(`/review/${id}`)} />
          </View>
        </>
      )}
    </Screen>
  );
}
