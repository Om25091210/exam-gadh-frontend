import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BarChart3, Bell, BookMarked, Flame, Layers, Mic, Newspaper, NotebookPen, PlayCircle, Radio, ScrollText, Swords, Trophy, Zap, type LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { C, R, shadow, type Tone } from '@/theme';
import { Badge, Button, Card, ErrorBox, Row, Screen, Section, Skeleton, StatTile, Sticker, T, useTabPad } from '@/ui';

const EXPLORE: Array<{ href: string; label: MessageKey; icon: LucideIcon; tone: Tone }> = [
  { href: '/(tabs)/tests', label: 'explore.series', icon: Layers, tone: 'indigo' },
  { href: '/(tabs)/tests', label: 'explore.live', icon: Radio, tone: 'pink' },
  { href: '/notes', label: 'app.learn.notes', icon: NotebookPen, tone: 'mint' },
  { href: '/ca', label: 'app.learn.ca', icon: Newspaper, tone: 'peach' },
  { href: '/pyq', label: 'app.learn.pyq', icon: ScrollText, tone: 'lilac' },
  { href: '/materials', label: 'app.learn.material', icon: BookMarked, tone: 'sky' },
  { href: '/interview', label: 'app.learn.interview', icon: Mic, tone: 'gold' },
  { href: '/(tabs)/rank', label: 'app.rank.title', icon: Trophy, tone: 'pink' },
];

export default function HomeTab() {
  const { t, b, num } = useI18n();
  const { api, user } = useAuth();
  const pad = useTabPad();
  const [soon, setSoon] = useState(false);
  const { width: screenW } = useWindowDimensions();
  const tileW = Math.floor((Math.min(screenW, 520) - 32 - 20) / 3);
  const q = useQuery({ queryKey: ['home'], queryFn: () => api.home() });
  const first = (user?.name ?? '').split(' ')[0];
  const h = q.data;
  const live = h?.live[0];
  const resume = h?.continue[0];
  const avg = h && h.trend.length ? Math.round(h.trend.reduce((n, x) => n + x.pct, 0) / h.trend.length) : null;

  return (
    <Screen bottomPad={pad} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
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

      {q.isLoading ? (
        <>
          <Skeleton h={96} />
          <Skeleton h={120} />
        </>
      ) : q.isError || !h ? (
        <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <Row gap={10}>
            <StatTile icon={Flame} value={num(h.streak.current)} label={t('home.stat.streak')} colors={['#7D67FF', '#4A2FD1']} />
            <StatTile icon={Layers} value={num(h.series.reduce((n, x) => n + x.attempted, 0) || h.trend.length)} label={t('home.stat.tests')} colors={['#4FE3CB', '#12A995']} />
            <StatTile icon={BarChart3} value={avg === null ? '—' : `${avg}%`} label={t('home.stat.avg')} colors={['#FF9DB0', '#E5486C']} />
          </Row>

          {live ? (
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
          ) : resume ? (
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
          ) : null}

          <Pressable onPress={() => setSoon(true)} accessibilityRole="button" style={({ pressed }) => ({ marginTop: 14, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <LinearGradient colors={['#FF8A00', '#E52E4D', '#7B2FF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 18, ...shadow.lift }}>
              <Row>
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.22)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#7CFF8A' }} />
                    <Text style={{ color: C.white, fontSize: 11, fontWeight: '800' }}>LIVE · {t('app.home.battle.soon')}</Text>
                  </View>
                  <Text style={{ color: C.white, fontSize: 24, fontWeight: '800', marginTop: 8 }}>{t('battle.title')}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 2 }}>{t('battle.sub')}</Text>
                  <View style={{ marginTop: 12, backgroundColor: C.white, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#E52E4D', fontWeight: '800' }}>{t('battle.cta')}</Text>
                    <Zap size={15} color="#E52E4D" />
                  </View>
                </View>
                <View style={{ width: 74, height: 74, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                  <Swords size={40} color={C.white} />
                </View>
              </Row>
            </LinearGradient>
          </Pressable>

          <Section title={t('app.home.explore')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {EXPLORE.map((e) => (
                <Pressable key={e.label + e.href} onPress={() => router.push(e.href as never)} accessibilityRole="button" accessibilityLabel={t(e.label)} style={({ pressed }) => ({ width: tileW, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
                  <View style={{ backgroundColor: C.white, borderRadius: R.card, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 8, minHeight: 118, ...shadow.card }}>
                    <Sticker icon={e.icon} tone={e.tone} size={58} />
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: C.ink, textAlign: 'center' }} numberOfLines={2}>{t(e.label)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
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

      <Modal visible={soon} transparent animationType="fade" onRequestClose={() => setSoon(false)}>
        <Pressable onPress={() => setSoon(false)} style={{ flex: 1, backgroundColor: 'rgba(26,26,59,0.5)', justifyContent: 'center', padding: 24 }}>
          <Card>
            <T v="h2">{t('battle.title')}</T>
            <T style={{ marginVertical: 10 }}>{t('journey.soon.battle')}</T>
            <Button title={t('app.close')} onPress={() => setSoon(false)} />
          </Card>
        </Pressable>
      </Modal>
    </Screen>
  );
}
