import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Bell, PlayCircle, Radio, Zap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Reveal } from '@/anim';
import { ChestModal } from '@/home/chest';
import { RankCard, ScoreStrip, WeakSpotCard } from '@/home/cards';
import { MissionHero } from '@/home/hero';
import { JOURNEY_KEYS, JourneyMap } from '@/journey';
import { useAuth } from '@/lib/auth';
import { useExplored } from '@/lib/explored';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Badge, Card, ErrorBox, Row, Screen, Section, Skeleton, Sticker, T, useTabPad } from '@/ui';

export default function HomeTab() {
  const { t, b, num } = useI18n();
  const { api, user } = useAuth();
  const qc = useQueryClient();
  const { seen } = useExplored();
  const pad = useTabPad();
  const { width: screenW } = useWindowDimensions();
  const mapW = Math.min(screenW, 560) - 32;
  const [chestOpen, setChestOpen] = useState(false);
  const q = useQuery({ queryKey: ['home'], queryFn: () => api.home() });
  const chest = useQuery({ queryKey: ['chest'], queryFn: () => api.chest() });
  const battle = useQuery({ queryKey: ['battle-me'], queryFn: () => api.battleMe() });

  // coming back from a test, practice set or battle: show the new streak, rank and chest straight away
  useFocusEffect(
    useCallback(() => {
      void qc.invalidateQueries({ queryKey: ['home'] });
      void qc.invalidateQueries({ queryKey: ['chest'] });
      void qc.invalidateQueries({ queryKey: ['leaderboard', 'week'] });
    }, [qc]),
  );

  const first = (user?.name ?? '').split(' ')[0];
  const h = q.data;
  const live = h?.live[0];
  const resume = h?.continue[0];
  const series = h?.series[0];
  const avg = h && h.trend.length ? Math.max(0, Math.round(h.trend.reduce((n, x) => n + x.pct, 0) / h.trend.length)) : null;
  const quiz = h?.dailyQuiz.available && !h.dailyQuiz.done ? h.dailyQuiz : null;

  // one best next action, in this order of urgency
  const cta = resume
    ? { label: t('hero.cta.resume'), sub: b(resume.titleEn, resume.titleHi), onPress: () => router.push(`/attempt/${resume.attemptId}`) }
    : chest.data?.available
      ? { label: t('hero.cta.chest'), sub: t('chest.title'), onPress: () => setChestOpen(true) }
      : quiz
        ? { label: t('hero.cta.quiz'), sub: t('app.tests.q', { n: quiz.test.questionCount ?? 0 }), onPress: () => router.push(`/test/${quiz.test.id}`) }
        : { label: t('hero.cta.battle'), sub: t('battle.sub'), onPress: () => router.push('/battle') };

  return (
    <Screen bottomPad={pad} refreshing={q.isRefetching} onRefresh={() => { void q.refetch(); void chest.refetch(); }}>
      <Reveal>
        <Row style={{ paddingTop: 8, paddingBottom: 12, justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.push('/(tabs)/me')} accessibilityRole="button" accessibilityLabel={t('app.tab.me')}>
            <LinearGradient colors={['#8A76FF', '#4A2FD1']} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', ...shadow.card }}>
              <Text style={{ color: C.white, fontSize: 20, fontWeight: '800' }}>{(first[0] ?? 'E').toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.primaryDark, letterSpacing: -0.3 }}>ExamGadh</Text>
          <Pressable onPress={() => router.push('/notifications')} accessibilityRole="button" accessibilityLabel={t('nav.notifications')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow.card }}>
            <Bell size={20} color={C.primary} />
            {(h?.unreadNotifications ?? 0) > 0 ? <View style={{ position: 'absolute', top: 9, right: 11, width: 10, height: 10, borderRadius: 5, backgroundColor: C.danger, borderWidth: 2, borderColor: C.white }} /> : null}
          </Pressable>
        </Row>
      </Reveal>

      {q.isLoading ? (
        <>
          <Skeleton h={300} style={{ borderRadius: 32 }} />
          <Skeleton h={120} />
        </>
      ) : q.isError || !h ? (
        <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} />
      ) : (
        <View style={{ gap: 14 }}>
          <MissionHero name={first} streak={h.streak.current} activeToday={h.streak.activeToday} chest={chest.data ?? null} cta={cta} onChest={() => setChestOpen(true)} />

          {live ? (
            <Reveal delay={80}>
              <Card onPress={() => router.push(`/test/${live.id}`)}>
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
          ) : null}

          <RankCard />
          {h.weakTopics[0] ? <WeakSpotCard topic={h.weakTopics[0]} /> : null}
          <ScoreStrip tests={h.series.reduce((n, x) => n + x.attempted, 0) || h.trend.length} avg={avg} points={battle.data?.points ?? null} />

          <Section title={t('home.journey')} action={<Badge text={t('journey.explored', { n: JOURNEY_KEYS.filter((k) => seen.has(k)).length, total: JOURNEY_KEYS.length })} tone="indigo" />}>
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
                    <Badge text={t('home.series.progress', { done: num(s.attempted), total: num(s.total) })} tone="indigo" />
                  </Row>
                  <View style={{ height: 8, borderRadius: 99, backgroundColor: C.primarySoft, overflow: 'hidden' }}>
                    <View style={{ width: `${s.total ? (s.attempted / s.total) * 100 : 0}%`, height: '100%', backgroundColor: C.primary, borderRadius: 99 }} />
                  </View>
                </Card>
              ))}
            </Section>
          ) : null}
        </View>
      )}
      <ChestModal visible={chestOpen} onClose={() => setChestOpen(false)} />
    </Screen>
  );
}
