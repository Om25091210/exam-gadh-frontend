import { useMutation, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowUp, Crown, Swords, Target, TrendingUp } from 'lucide-react-native';
import { Alert, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ApiError, type WeakTopic } from '@eg/api';
import { Float, Reveal, useCountUp } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Button, ProgressBar, Row, T } from '@/ui';

function Initial({ name, size = 40, color = '#5A3DF0' }: { name: string; size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white }}>
      <Text style={{ color, fontWeight: '800', fontSize: size * 0.42 }}>{(name[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

/** Social comparison with a concrete, reachable target: "18 points to pass Riya". */
export function RankCard() {
  const { t, num } = useI18n();
  const { api } = useAuth();
  const q = useQuery({ queryKey: ['leaderboard', 'week'], queryFn: () => api.overallLeaderboard('week', 50) });
  const d = q.data;
  const me = d?.me ?? null;
  const above = me && me.rank > 1 ? [...(d?.entries ?? [])].filter((e) => e.rank < me.rank).sort((a, b) => b.rank - a.rank)[0] : null;
  const gap = me && above ? Math.max(1, Math.ceil(above.score - me.score + 0.01)) : 0;
  const shownRank = useCountUp(me?.rank ?? 0, 900);
  if (q.isLoading || q.isError) return null;
  return (
    <Reveal delay={120}>
      <Pressable onPress={() => router.push('/(tabs)/rank')} accessibilityRole="button" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <View style={{ backgroundColor: C.white, borderRadius: 28, padding: 16, ...shadow.card }}>
          <Row>
            <LinearGradient colors={['#FFD36B', '#E89A0C']} style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={26} color={C.white} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <T v="label">{t('rank.title')}</T>
              {me ? (
                <Row gap={8} style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink }}>#{num(shownRank)}</Text>
                  {above ? <Row gap={2}><ArrowUp size={14} color={C.success} /><T v="small" color={C.success}>{t('rank.gap', { n: num(gap), name: above.name })}</T></Row> : <T v="small" color={C.success}>{t('rank.top')}</T>}
                </Row>
              ) : (
                <T v="h3" style={{ fontSize: 15 }}>{t('rank.none')}</T>
              )}
            </View>
          </Row>
          {me && above ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              <Row gap={8}>
                <Initial name="Y" size={30} />
                <View style={{ flex: 1 }}><ProgressBar value={Math.max(0, me.score)} max={Math.max(1, above.score)} tone={C.mint} /></View>
                <Initial name={above.name} size={30} color="#E5486C" />
              </Row>
            </View>
          ) : null}
          <Row style={{ marginTop: 12 }}>
            <Button title={t('rank.cta')} variant="soft" small icon={Swords} onPress={() => router.push('/battle')} />
          </Row>
        </View>
      </Pressable>
    </Reveal>
  );
}

function AccuracyRing({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const col = pct >= 60 ? C.mint : pct >= 40 ? C.gold : C.coral;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EDE8FF" strokeWidth={8} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth={8} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} fill="none" />
      </Svg>
      <Text style={{ fontWeight: '800', color: C.ink, fontSize: size * 0.26 }}>{pct}%</Text>
    </View>
  );
}

/** Personalised and actionable: the topic that costs the most marks, one tap away from a 5-question fix. */
export function WeakSpotCard({ topic }: { topic: WeakTopic }) {
  const { t, b, lang } = useI18n();
  const { api } = useAuth();
  const go = useMutation({
    mutationFn: async () => {
      const p = await api.practice({ source: 'topic', topicCode: topic.topicCode, count: 5 });
      return api.startAttempt(p.testId, { practice: true, language: lang });
    },
    onSuccess: (a) => router.push(`/attempt/${a.attemptId}`),
    onError: (e) => Alert.alert(e instanceof ApiError ? e.message : t('app.error')),
  });
  const pct = Math.round(topic.accuracyPct);
  return (
    <Reveal delay={180}>
      <View style={{ backgroundColor: C.white, borderRadius: 28, padding: 16, ...shadow.card }}>
        <Row>
          <AccuracyRing pct={pct} />
          <View style={{ flex: 1, gap: 2 }}>
            <Row gap={6}><Target size={14} color={C.coral} /><T v="label">{t('weak.title')}</T></Row>
            <T v="h3" numberOfLines={2}>{b(topic.nameEn, topic.nameHi)}</T>
            <T v="small">{t('weak.sub', { pct })}</T>
          </View>
        </Row>
        <View style={{ marginTop: 12 }}>
          <Button title={t('weak.cta')} variant="primary" small icon={TrendingUp} loading={go.isPending} onPress={() => go.mutate()} />
        </View>
      </View>
    </Reveal>
  );
}

/** Small honest numbers, kept quiet so the hero stays the star. */
export function ScoreStrip({ tests, avg, points }: { tests: number; avg: number | null; points: number | null }) {
  const { t, num } = useI18n();
  const items: Array<[string, string]> = [[num(tests), t('home.stat.tests')], [avg === null ? '—' : `${avg}%`, t('home.stat.avg')], [points === null ? '—' : num(points), t('app.battle.points')]];
  return (
    <Reveal delay={240}>
      <View style={{ flexDirection: 'row', backgroundColor: C.white, borderRadius: 24, paddingVertical: 14, ...shadow.card }}>
        {items.map(([v, l], i) => (
          <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: C.line }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink }}>{v}</Text>
            <Text style={{ fontSize: 11.5, color: C.muted, fontWeight: '700' }}>{l}</Text>
          </View>
        ))}
      </View>
    </Reveal>
  );
}
export { Float };
