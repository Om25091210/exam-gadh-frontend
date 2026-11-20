import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Empty, ErrorBox, Row, Screen, ScreenHeader, Skeleton } from '@/ui';

export default function BattleLeaderboard() {
  const { t, num } = useI18n();
  const { api } = useAuth();
  const q = useQuery({ queryKey: ['battle-lb'], queryFn: () => api.battleLeaderboard() });
  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()} header={<ScreenHeader title={t('app.battle.leaderboard')} />}>
      {q.isLoading ? <><Skeleton h={64} /><Skeleton h={64} /></> : q.isError || !q.data ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : q.data.entries.length === 0 ? <Empty text={t('app.rank.empty')} /> : (
        <View style={{ gap: 8 }}>
          {q.data.entries.map((e) => (
            <Row key={`${e.rank}-${e.name}`} style={{ backgroundColor: e.isMe ? C.primary : C.white, borderRadius: 20, padding: 12, ...shadow.card }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: e.isMe ? 'rgba(255,255,255,0.2)' : C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '800', color: e.isMe ? C.white : C.primaryDark }}>{num(e.rank)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontWeight: '800', color: e.isMe ? C.white : C.ink }}>{e.name}</Text>
                <Text style={{ fontSize: 12, color: e.isMe ? 'rgba(255,255,255,0.85)' : C.muted }}>{e.wins} {t('app.battle.wins')} · {e.played} {t('app.battle.played')}</Text>
              </View>
              <Text style={{ fontWeight: '800', fontSize: 18, color: e.isMe ? C.white : C.ink }}>{num(e.points)}</Text>
            </Row>
          ))}
        </View>
      )}
    </Screen>
  );
}
