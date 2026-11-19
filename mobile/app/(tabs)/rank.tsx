import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import type { LeaderboardEntry } from '@eg/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Chip, Empty, ErrorBox, Row, Screen, Skeleton, T, useTabPad } from '@/ui';

function Avatar({ name, size, ring }: { name: string; size: number; ring?: string }) {
  return (
    <LinearGradient colors={['#8A76FF', '#4A2FD1']} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 4 : 0, borderColor: ring }}>
      <Text style={{ color: C.white, fontWeight: '800', fontSize: size * 0.4 }}>{(name[0] ?? '?').toUpperCase()}</Text>
    </LinearGradient>
  );
}

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const { num } = useI18n();
  const slot = (e: LeaderboardEntry | undefined, place: 1 | 2 | 3) => {
    if (!e) return <View style={{ flex: 1 }} />;
    const big = place === 1;
    return (
      <View style={{ flex: 1, alignItems: 'center', marginTop: big ? 0 : 22 }}>
        {big ? <Crown size={24} color="#FFD36B" /> : <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontSize: 11, fontWeight: '800' }}>{place}</Text></View>}
        <View style={{ marginTop: 4 }}><Avatar name={e.name} size={big ? 76 : 60} ring={place === 1 ? '#FFD36B' : place === 2 ? '#5EEAD4' : '#FF9DB0'} /></View>
        <Text numberOfLines={1} style={{ color: C.white, fontWeight: '800', marginTop: 6, fontSize: 13 }}>{e.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{num(e.score, 1)}</Text>
      </View>
    );
  };
  return (
    <Row gap={6} style={{ alignItems: 'flex-end', marginTop: 14 }}>
      {slot(entries[1], 2)}
      {slot(entries[0], 1)}
      {slot(entries[2], 3)}
    </Row>
  );
}

export default function RankTab() {
  const { t, num } = useI18n();
  const { api } = useAuth();
  const pad = useTabPad();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const q = useQuery({ queryKey: ['leaderboard', period], queryFn: () => api.overallLeaderboard(period, 50) });
  const d = q.data;
  return (
    <Screen bottomPad={pad} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 30, padding: 20, marginTop: 10, ...shadow.lift }}>
        <Text style={{ color: C.white, fontSize: 26, fontWeight: '800' }}>{t('app.rank.title')}</Text>
        {d && d.entries.length > 0 ? <Podium entries={d.entries} /> : null}
      </LinearGradient>
      <Row gap={8} style={{ marginVertical: 14 }}>
        {(['week', 'month', 'all'] as const).map((p) => (
          <Chip key={p} label={t(`app.rank.${p}` as 'app.rank.week')} active={period === p} onPress={() => setPeriod(p)} />
        ))}
      </Row>
      {q.isLoading ? <><Skeleton h={64} /><Skeleton h={64} /></> : q.isError || !d ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : d.entries.length === 0 ? <Empty text={t('app.rank.empty')} /> : (
        <View style={{ gap: 8 }}>
          {d.me ? <T v="small" center>{t('app.rank.you', { rank: num(d.me.rank), total: num(d.total) })}</T> : null}
          {d.entries.slice(3).map((e) => (
            <Row key={`${e.rank}-${e.name}`} style={{ backgroundColor: e.isMe ? C.primary : C.white, borderRadius: 20, padding: 12, ...shadow.card }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: e.isMe ? 'rgba(255,255,255,0.2)' : C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '800', color: e.isMe ? C.white : C.primaryDark }}>{num(e.rank)}</Text>
              </View>
              <Avatar name={e.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontWeight: '800', color: e.isMe ? C.white : C.ink }}>{e.name}</Text>
                <Text style={{ fontSize: 12, color: e.isMe ? 'rgba(255,255,255,0.85)' : C.muted }}>{e.tests ?? 0} {t('nav.tests')}</Text>
              </View>
              <Text style={{ fontWeight: '800', color: e.isMe ? C.white : C.ink }}>{num(e.score, 1)}</Text>
            </Row>
          ))}
        </View>
      )}
    </Screen>
  );
}
