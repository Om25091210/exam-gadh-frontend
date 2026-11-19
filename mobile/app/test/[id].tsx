import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError } from '@eg/api';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock, FileQuestion, Lock, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { RichText } from '@/rich';
import { C } from '@/theme';
import { Badge, Button, Card, ErrorBox, Hero, Row, Screen, ScreenHeader, Section, Skeleton, T } from '@/ui';
import { Text } from 'react-native';

export default function TestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, b, lang, num, date } = useI18n();
  const { api } = useAuth();
  const [practice, setPractice] = useState(false);
  const q = useQuery({ queryKey: ['test', id], queryFn: () => api.test(id) });
  const start = useMutation({
    mutationFn: () => api.startAttempt(id, { practice, language: lang }),
    onSuccess: (a) => router.replace(`/attempt/${a.attemptId}`),
    onError: (e) => Alert.alert(e instanceof ApiError ? e.message : t('app.error')),
  });
  const d = q.data;
  const open = d?.myAttempts.find((a) => a.status === 'in_progress');
  const done = d?.myAttempts.filter((a) => a.status !== 'in_progress') ?? [];
  const ins = d ? b(d.instructions.en, d.instructions.hi) : '';
  return (
    <Screen header={<ScreenHeader title={t('app.test.instructions')} />} bottomPad={30}>
      {q.isLoading ? <><Skeleton h={160} /><Skeleton /></> : q.isError || !d ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : (
        <>
          <Hero>
            <Row style={{ marginBottom: 8 }}>
              <Badge text={d.access === 'free' ? t('app.free') : t('app.paid')} tone={d.access === 'free' ? 'mint' : 'gold'} />
              {d.mode === 'live' ? <Badge text={t('app.tests.live')} tone="red" /> : null}
            </Row>
            <Text style={{ color: C.white, fontSize: 22, fontWeight: '800' }}>{b(d.titleEn, d.titleHi)}</Text>
            <Row gap={16} style={{ marginTop: 14 }}>
              <Row gap={6}><Clock size={16} color="rgba(255,255,255,0.9)" /><Text style={{ color: C.white, fontWeight: '700' }}>{t('app.tests.min', { n: d.durationMin })}</Text></Row>
              <Row gap={6}><FileQuestion size={16} color="rgba(255,255,255,0.9)" /><Text style={{ color: C.white, fontWeight: '700' }}>{t('app.tests.q', { n: d.questionCount })}</Text></Row>
              <Row gap={6}><Star size={16} color="rgba(255,255,255,0.9)" /><Text style={{ color: C.white, fontWeight: '700' }}>{t('app.tests.marks', { n: num(d.maxScore) })}</Text></Row>
            </Row>
          </Hero>

          <Section title={t('app.test.rules')}>
            <Card style={{ gap: 6 }}>
              <T>{t('app.test.correct', { n: d.scheme.correctMarks })}</T>
              {d.scheme.negativeFraction > 0 ? <T>{t('app.test.negative', { n: (d.scheme.correctMarks * d.scheme.negativeFraction).toFixed(2) })}</T> : null}
            </Card>
          </Section>

          {d.sections.length > 1 ? (
            <Section title={t('app.test.sections')}>
              <Card style={{ gap: 8 }}>
                {d.sections.map((s) => (
                  <Row key={s.position} style={{ justifyContent: 'space-between' }}>
                    <T v="h3" style={{ flex: 1, fontSize: 14 }}>{b(s.nameEn, s.nameHi)}</T>
                    <T v="small">{t('app.tests.q', { n: s.count })}{s.durationMin ? ` · ${t('app.tests.min', { n: s.durationMin })}` : ''}</T>
                  </Row>
                ))}
              </Card>
            </Section>
          ) : null}

          {ins ? (
            <Section title={t('app.test.instructions')}>
              <Card><RichText text={ins} style={{ fontSize: 15, lineHeight: 24, color: C.ink2 }} /></Card>
            </Section>
          ) : null}

          {d.endsAt || d.startsAt ? <T v="small" style={{ marginTop: 12 }}>{d.startsAt ? date(d.startsAt) : ''} {d.endsAt ? `→ ${date(d.endsAt)}` : ''}</T> : null}

          <View style={{ marginTop: 20, gap: 10 }}>
            {d.locked ? (
              <Card style={{ alignItems: 'center' }}>
                <Lock size={24} color={C.gold} />
                <T v="body" center style={{ marginTop: 6 }}>{t('app.test.locked')}</T>
              </Card>
            ) : open ? (
              <Button title={t('app.test.resume')} onPress={() => router.replace(`/attempt/${open.id}`)} />
            ) : (
              <>
                <Button title={t('app.test.start')} loading={start.isPending} onPress={() => start.mutate()} />
                {d.mode === 'static' ? <Button title={practice ? `✓ ${t('app.test.practice')}` : t('app.test.practice')} variant="soft" onPress={() => setPractice((v) => !v)} /> : null}
              </>
            )}
            {done.length > 0 ? done.slice(0, 3).map((a) => (
              <Button key={a.id} title={`${t('app.result.title')} #${a.attemptNo}`} variant="ghost" onPress={() => router.push(`/result/${a.id}`)} />
            )) : null}
          </View>
        </>
      )}
    </Screen>
  );
}
