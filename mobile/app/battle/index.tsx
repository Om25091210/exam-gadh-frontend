import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bot, Crown, Frown, Handshake, Swords, Trophy, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Confetti, Pop } from '@/anim';
import { useBattle } from '@/battle';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Options, pick, QuestionBody } from '@/question';
import { C, shadow } from '@/theme';
import { Badge, Button, Card, Row, ScreenHeader, Screen, StatTile, T } from '@/ui';
import { BarChart3, Layers } from 'lucide-react-native';

function Player({ name, score, you, bot, align }: { name: string; score: number; you?: boolean; bot?: boolean; align: 'left' | 'right' }) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, alignItems: align === 'left' ? 'flex-start' : 'flex-end' }}>
      <LinearGradient colors={you ? ['#8A76FF', '#4A2FD1'] : ['#FF9DB0', '#E5486C']} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
        {bot ? <Bot size={22} color={C.white} /> : <Text style={{ color: C.white, fontWeight: '800', fontSize: 18 }}>{(name[0] ?? '?').toUpperCase()}</Text>}
      </LinearGradient>
      <Text numberOfLines={1} style={{ fontWeight: '800', color: C.ink, marginTop: 4, maxWidth: 130 }}>{you ? t('app.battle.you') : name}</Text>
      {bot ? <Badge text={t('app.battle.partner')} tone="gray" /> : null}
      <Text style={{ fontSize: 24, fontWeight: '800', color: you ? C.primary : C.pinkDark }}>{score}</Text>
    </View>
  );
}

export default function BattleScreen() {
  const { t, lang, num } = useI18n();
  const { api } = useAuth();
  const qc = useQueryClient();
  const { state: s, find, cancel, answer, reset, clearError } = useBattle();
  const me = useQuery({ queryKey: ['battle-me'], queryFn: () => api.battleMe() });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (s.phase !== 'question') return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [s.phase]);
  useEffect(() => {
    if (s.phase === 'end') void qc.invalidateQueries({ queryKey: ['battle-me'] });
  }, [s.phase, qc]);
  // the Android back button must not walk out of a running battle by accident
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (s.phase === 'question' || s.phase === 'reveal' || s.phase === 'matched') {
        Alert.alert(t('app.exam.cancel'), undefined, [{ text: t('app.ok') }]);
        return true;
      }
      if (s.phase === 'finding') {
        cancel();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [s.phase, t, cancel]);

  const m = me.data;
  const limit = s.error?.code === 'BATTLE_LIMIT' || (m && !m.canPlay);
  const openPlans = () => router.push('/plans');

  // ---------------------------------------------------------------- idle: lobby
  if (s.phase === 'idle') {
    return (
      <Screen header={<ScreenHeader title={t('app.battle.title')} subtitle={t('app.battle.sub')} />} bottomPad={30}>
        <LinearGradient colors={['#FF8A00', '#E52E4D', '#7B2FF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 22, ...shadow.lift }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.white, fontSize: 26, fontWeight: '800' }}>{t('battle.title')}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.92)', marginTop: 4 }}>{t('app.battle.rules')}</Text>
            </View>
            <View style={{ width: 76, height: 76, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Swords size={42} color={C.white} />
            </View>
          </Row>
        </LinearGradient>

        {m ? (
          <Row gap={10} style={{ marginTop: 14 }}>
            <StatTile icon={Trophy} value={num(m.points)} label={t('app.battle.points')} colors={['#7D67FF', '#4A2FD1']} />
            <StatTile icon={Crown} value={num(m.wins)} label={t('app.battle.wins')} colors={['#4FE3CB', '#12A995']} />
            <StatTile icon={Layers} value={num(m.played)} label={t('app.battle.played')} colors={['#FF9DB0', '#E5486C']} />
          </Row>
        ) : null}

        {limit ? (
          <Card style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
            <Crown size={30} color={C.gold} />
            <T v="h2" center>{t('app.battle.limit.title')}</T>
            <T v="body" center>{t('app.battle.limit.body', { n: m?.limit ?? 5 })}</T>
            <Button title={t('app.battle.limit.cta')} variant="accent" onPress={openPlans} style={{ alignSelf: 'stretch', marginTop: 6 }} />
          </Card>
        ) : (
          <View style={{ marginTop: 18, gap: 10 }}>
            {m && m.freeLeft !== null ? <T v="small" center>{t('app.battle.freeLeft', { n: m.freeLeft })}</T> : null}
            {s.error?.code === 'BATTLE_UNAVAILABLE' ? <T v="small" color={C.warn} center>{t('app.battle.unavailable')}</T> : s.error ? <T v="small" color={C.danger} center>{s.error.message}</T> : null}
            <Button title={t('app.battle.play')} icon={Zap} onPress={() => { clearError(); find(); }} />
          </View>
        )}
        <View style={{ marginTop: 10 }}>
          <Button title={t('app.battle.leaderboard')} variant="ghost" icon={BarChart3} onPress={() => router.push('/battle/leaderboard')} />
        </View>
      </Screen>
    );
  }

  // ---------------------------------------------------------------- finding
  if (s.phase === 'finding') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <LinearGradient colors={['#8A76FF', '#4A2FD1']} style={{ width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', ...shadow.lift }}>
          <Swords size={56} color={C.white} />
        </LinearGradient>
        <T v="h1" center>{t('app.battle.finding')}</T>
        <T v="muted" center>{s.connected ? t('app.battle.sub') : t('app.battle.connection')}</T>
        <Button title={t('app.battle.cancel')} variant="soft" onPress={cancel} />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------- matched: VS
  if (s.phase === 'matched' && s.matched) {
    const o = s.matched.opponent;
    return (
      <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Row gap={18} style={{ alignItems: 'center' }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 34, fontWeight: '800', color: C.primary }}>{(s.matched.you.name[0] ?? '?').toUpperCase()}</Text></View>
              <Text style={{ color: C.white, fontWeight: '800' }}>{t('app.battle.you')}</Text>
            </View>
            <Text style={{ color: '#FFD36B', fontSize: 34, fontWeight: '800' }}>{t('app.battle.vs')}</Text>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#FFE1E8', alignItems: 'center', justifyContent: 'center' }}>{o.isBot ? <Bot size={40} color={C.pinkDark} /> : <Text style={{ fontSize: 34, fontWeight: '800', color: C.pinkDark }}>{(o.name[0] ?? '?').toUpperCase()}</Text>}</View>
              <Text style={{ color: C.white, fontWeight: '800' }}>{o.name}</Text>
              {o.isBot ? <Badge text={t('app.battle.partner')} tone="gray" /> : null}
            </View>
          </Row>
          <Text style={{ color: C.white, fontSize: 26, fontWeight: '800', marginTop: 36 }}>{t('app.battle.getReady')}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ---------------------------------------------------------------- question / reveal
  if ((s.phase === 'question' || s.phase === 'reveal') && s.round && s.matched) {
    const r = s.round;
    const left = Math.max(0, s.deadline - now);
    const frac = s.phase === 'question' ? Math.min(1, left / r.roundMs) : 0;
    const low = frac < 0.33;
    const rv = s.reveal;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <Row style={{ padding: 14, justifyContent: 'space-between' }}>
          <Player name={s.matched.you.name} you score={s.scores.you} align="left" />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: C.primaryDark, fontWeight: '800' }}>{t('app.questionsLabel', { n: r.index + 1, total: r.total })}</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: low ? C.danger : C.ink }}>{s.phase === 'question' ? Math.ceil(left / 1000) : '–'}</Text>
          </View>
          <Player name={s.matched.opponent.name} bot={s.matched.opponent.isBot} score={s.scores.opponent} align="right" />
        </Row>
        <View style={{ height: 8, marginHorizontal: 14, borderRadius: 99, backgroundColor: C.primarySoft, overflow: 'hidden' }}>
          <View style={{ width: `${frac * 100}%`, height: '100%', borderRadius: 99, backgroundColor: low ? C.danger : C.primary }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: C.white, borderRadius: 24, padding: 16, marginBottom: 14, ...shadow.card }}>
            <QuestionBody q={r.question} lang={lang} />
          </View>
          <Options q={r.question} lang={lang} selected={rv ? rv.you.option : s.picked !== null && s.picked >= 0 ? s.picked : null} onSelect={s.phase === 'question' ? answer : undefined} correct={rv ? rv.correctOption : undefined} />
          {s.phase === 'question' ? (
            <T v="small" center style={{ marginTop: 14 }}>{s.picked !== null ? (s.opponentAnswered ? t('app.battle.opponentDone') : t('app.battle.waiting')) : s.opponentAnswered ? t('app.battle.opponentDone') : ' '}</T>
          ) : rv ? (
            <Card style={{ marginTop: 14, alignItems: 'center', gap: 4 }}>
              <T v="h2" color={rv.you.correct ? C.success : C.danger}>{rv.you.option === null ? t('app.battle.timeUp') : rv.you.correct ? t('app.battle.correct') : t('app.battle.wrong')}{rv.you.points > 0 ? `  +${rv.you.points}` : ''}</T>
              {rv.you.streak >= 3 ? <T v="small">🔥 ×1.5</T> : null}
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------- end
  if (s.phase === 'end' && s.end) {
    const e = s.end;
    const Icon = e.result === 'win' ? Trophy : e.result === 'draw' ? Handshake : Frown;
    const title = e.result === 'win' ? t('app.battle.win') : e.result === 'draw' ? t('app.battle.draw') : t('app.battle.loss');
    return (
      <Screen bottomPad={30} header={<ScreenHeader title={t('app.battle.title')} back={false} />}>
        {e.result === 'win' ? <Confetti /> : null}
        <LinearGradient colors={e.result === 'win' ? ['#4FE3CB', '#12A995'] : e.result === 'draw' ? ['#8A76FF', '#4A2FD1'] : ['#FF9DB0', '#E5486C']} style={{ borderRadius: 30, padding: 24, alignItems: 'center', ...shadow.lift }}>
          <Pop><Icon size={56} color={C.white} /></Pop>
          <Text style={{ color: C.white, fontSize: 30, fontWeight: '800', marginTop: 8 }}>{title}</Text>
          {e.forfeit ? <Text style={{ color: 'rgba(255,255,255,0.9)' }}>{t('app.battle.forfeit')}</Text> : null}
          <Row gap={30} style={{ marginTop: 16 }}>
            <View style={{ alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.85)' }}>{t('app.battle.you')}</Text><Text style={{ color: C.white, fontSize: 34, fontWeight: '800' }}>{num(e.you.score)}</Text></View>
            <View style={{ alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.85)' }}>{e.opponent.name}{e.opponent.isBot ? ` · ${t('app.battle.partner')}` : ''}</Text><Text style={{ color: C.white, fontSize: 34, fontWeight: '800' }}>{num(e.opponent.score)}</Text></View>
          </Row>
          {e.you.pointsDelta > 0 ? <Text style={{ color: '#FFF2CC', fontSize: 20, fontWeight: '800', marginTop: 12 }}>{t('app.battle.earned', { n: e.you.pointsDelta })}</Text> : null}
        </LinearGradient>
        {e.you.freeLeft !== null && e.you.freeLeft <= 0 ? (
          <Card style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
            <Crown size={28} color={C.gold} />
            <T v="h3" center>{t('app.battle.limit.title')}</T>
            <Button title={t('app.battle.limit.cta')} variant="accent" onPress={openPlans} style={{ alignSelf: 'stretch' }} />
          </Card>
        ) : null}
        <View style={{ marginTop: 18, gap: 10 }}>
          {e.you.freeLeft === null || e.you.freeLeft > 0 ? <Button title={t('app.battle.again')} icon={Zap} onPress={() => { reset(); void me.refetch(); }} /> : null}
          <Button title={t('app.battle.home')} variant="soft" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  return null;
}
