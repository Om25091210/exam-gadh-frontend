import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, Flame, Layers, PlayCircle, Radio, Zap, BarChart3 } from 'lucide-react-native';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Reveal, useCountUp } from '@/anim';
import { JourneyMap } from '@/journey';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Badge, Card, ErrorBox, Row, Screen, Section, Skeleton, StatTile, Sticker, T, useTabPad } from '@/ui';

function Stats({ streak, tests, avg }: { streak: number; tests: number; avg: number | null }) {
  const { t, num } = useI18n();
  const a = useCountUp(streak);
  const b = useCountUp(tests);
  const c = useCountUp(avg ?? 0);
  return (
    <Row gap={10}>
      <StatTile icon={Flame} value={num(a)} label={t('home.stat.streak')} colors={['#7D67FF', '#4A2FD1']} />
      <StatTile icon={Layers} value={num(b)} label={t('home.stat.tests')} colors={['#4FE3CB', '#12A995']} />
      <StatTile icon={BarChart3} value={avg === null ? '—' : `${c}%`} label={t('home.stat.avg')} colors={['#FF9DB0', '#E5486C']} />
    </Row>
  );
}

export default function HomeTab() {
  const { t, b, num } = useI18n();
  const { api, user } = useAuth();
  const pad = useTabPad();
  const { width: screenW } = useWindowDimensions();
  const mapW = Math.min(screenW, 560) - 32;
  const q = useQuery({ queryKey: ['home'], queryFn: () => api.home() });
  const first = (user?.name ?? '').split(' ')[0];
  const h = q.data;
  const live = h?.live[0];
  const resume = h?.continue[0];
  const series = h?.series[0];
  const avg = h && h.trend.length ? Math.max(0, Math.round(h.trend.reduce((n, x) => n + x.pct, 0) / h.trend.length)) : null;

  return (
    <Screen bottomPad={pad} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <Reveal>
        <Row style={{ paddingTop: 8, paddingBottom: 14 }}>
          <Pressable onPress={() => router.push('/(tabs)/me')} accessibilityRole="button" accessibilityLabel={t('app.tab.me')}>
            <LinearGradient colors={['#8A76FF', '#4A2FD1']} style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', ...shadow.card }}>
              <Text style={{ color: C.white, fontSize: 21, fontWeight: '800' }}>{(first[0] ?? 'E').toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
          <View style={{ flex: 1 }}>
            <T v="h2" numberOfLines={1}>{t('app.home.hello', { name: first })}</T>
            <Row gap={4}>
              <Flame size={15} color={h?.streak.activeToday ? C.coral : C.faint} />
              <T v="small">{h && h.streak.current > 0 ? `${num(h.streak.current)} ${t('home.stat.streak')}` : t('home.streak.keep')}</T>
            </Row>
          </View>
          <Pressable onPress={() => router.push('/notifications')} accessibilityRole="button" accessibilityLabel={t('nav.notifications')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow.card }}>
            <Bell size={20} color={C.primary} />
            {(h?.unreadNotifications ?? 0) > 0 ? <View style={{ position: 'absolute', top: 9, right: 11, width: 10, height: 10, borderRadius: 5, backgroundColor: C.danger, borderWidth: 2, borderColor: C.white }} /> : null}
          </Pressable>
        </Row>
      </Reveal>

      {q.isLoading ? (
        <>
          <Skeleton h={96} />
          <Skeleton h={420} />
        </>
      ) : q.isError || !h ? (
        <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <Reveal delay={60}>
            <Stats streak={h.streak.current} tests={h.series.reduce((n, x) => n + x.attempted, 0) || h.trend.length} avg={avg} />
          </Reveal>

          {live ? (
            <Reveal delay={120}>
              <Card style={{ marginTop: 14 }} onPress={() => router.push(`/test/${live.id}`)}>
                <Row>
                  <Sticker icon={Radio} tone="pink" size={46} />
                  <View style={{ flex: 1 }}>
                    <T v="h3" numberOfLines={1}>{b(live.titleEn, live.titleHi)}</T>
                    <T v="small">{live.state === 'open' ? t('strip.live.now') : live.startsAt ? t('home.live.upcoming', { time: new Date(live.startsAt).toLocaleString() }) : ''}</T>
                  </View>
                  <Badge text={live.state === 'open' ? t('app.tests.live') : t('strip.open')} tone={live.state === 'open' ? 'red' : 'indigo'} />
                </Row>
              </Card>
            </Reveal>
          ) : resume ? (
            <Reveal delay={120}>
              <Card style={{ marginTop: 14 }} onPress={() => router.push(`/attempt/${resume.attemptId}`)}>
                <Row>
                  <Sticker icon={PlayCircle} tone="indigo" size={46} />
                  <View style={{ flex: 1 }}>
                    <T v="h3" numberOfLines={1}>{b(resume.titleEn, resume.titleHi)}</T>
                    <T v="small">{t('app.home.continue')} · {num(resume.answered)}/{num(resume.total)}</T>
                  </View>
                  <Badge text={t('home.continue.resume')} tone="indigo" />
                </Row>
              </Card>
            </Reveal>
          ) : null}

          <Section title={t('home.journey')}>
            <T v="muted" style={{ marginTop: -6, marginBottom: 12 }}>{t('journey.sub')}</T>
            <JourneyMap width={mapW} initial={(first[0] ?? 'E').toUpperCase()} mockNumber={series ? Math.min(series.total, series.attempted + 1) : 1} liveOpen={h.live.some((l) => l.state === 'open')} />
          </Section>

          {h.dailyQuiz.available ? (
            <Section title={t('app.home.daily')}>
              <Card onPress={() => router.push(`/test/${h.dailyQuiz.available ? h.dailyQuiz.test.id : ''}`)}>
                <Row>
                  <Sticker icon={Zap} tone="gold" size={50} />
                  <View style={{ flex: 1 }}>
                    <T v="h3" numberOfLines={1}>{h.dailyQuiz.available ? b(h.dailyQuiz.test.titleEn, h.dailyQuiz.test.titleHi) : ''}</T>
                    <T v="small">{h.dailyQuiz.available ? t('app.tests.q', { n: h.dailyQuiz.test.questionCount ?? 0 }) : ''}</T>
                  </View>
                  {h.dailyQuiz.available && h.dailyQuiz.done ? <Badge text="✓" tone="mint" /> : <Badge text={t('tests.start')} tone="gold" />}
                </Row>
              </Card>
            </Section>
          ) : null}

          {h.series.length > 0 ? (
            <Section title={t('home.series')}>
              {h.series.map((s) => (
                <Card key={s.id} style={{ marginBottom: 10 }}>
                  <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <T v="h3" style={{ flex: 1 }} numberOfLines={1}>{b(s.titleEn, s.titleHi)}</T>
                    <Badge text={t('home.series.progress', { done: s.attempted, total: s.total })} tone="indigo" />
                  </Row>
                  <View style={{ height: 8, borderRadius: 99, backgroundColor: C.primarySoft, overflow: 'hidden' }}>
                    <View style={{ width: `${s.total ? (s.attempted / s.total) * 100 : 0}%`, height: '100%', backgroundColor: C.primary, borderRadius: 99 }} />
                  </View>
                </Card>
              ))}
            </Section>
          ) : null}
        </>
      )}
    </Screen>
  );
}
