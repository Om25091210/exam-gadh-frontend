import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Check, Crown, ShieldCheck, Ticket } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { ApiError, type BillingPlan } from '@eg/api';
import { Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, R, shadow } from '@/theme';
import { Badge, Button, Card, Chip, Empty, ErrorBox, Row, Screen, ScreenHeader, Section, Skeleton, T } from '@/ui';

type Months = 3 | 6 | 12;

const PERKS = ['plans.perk.tests', 'plans.perk.notes', 'plans.perk.pyq', 'plans.perk.doubts', 'plans.perk.battle'] as const;

function PlanCard({ plan, index, extend }: { plan: BillingPlan; index: number; extend: boolean }) {
  const { t, b, num } = useI18n();
  const options = (['3', '6', '12'] as const).filter((m) => plan.prices[m] != null).map(Number) as Months[];
  const [months, setMonths] = useState<Months>(options[options.length - 1] ?? 3);
  const price = plan.prices[String(months)] ?? 0;
  const base = options.length && plan.prices[String(options[0])] ? plan.prices[String(options[0])] / options[0] : null; // the shortest term's monthly rate is the anchor
  const perMonth = price / months;
  const save = base && perMonth < base ? Math.round((1 - perMonth / base) * 100) : 0;
  const top = plan.topTier;
  const fg = top ? C.white : C.ink;
  const muted = top ? 'rgba(255,255,255,0.85)' : C.muted;
  const longest = options[options.length - 1];
  const body = (
    <View style={{ padding: 18, gap: 14 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={8} style={{ flex: 1 }}>
          <Crown size={22} color={top ? '#FFD36B' : C.primary} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: fg, flexShrink: 1 }}>{b(plan.nameEn, plan.nameHi)}</Text>
        </Row>
        {top ? <Badge text={t('plans.popular')} tone="gold" /> : null}
      </Row>

      <Row gap={8}>
        {options.map((m) => {
          const on = months === m;
          const mSave = base ? Math.round((1 - plan.prices[String(m)] / m / base) * 100) : 0;
          return (
            <Pressable key={m} onPress={() => setMonths(m)} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 16, borderWidth: 2, borderColor: on ? (top ? C.white : C.primary) : 'transparent', backgroundColor: on ? (top ? 'rgba(255,255,255,0.22)' : C.primarySofter) : top ? 'rgba(255,255,255,0.1)' : '#F3F4FA' }}>
              {m === longest && options.length > 1 ? <Text style={{ position: 'absolute', top: -9, fontSize: 9.5, fontWeight: '800', color: C.ink, backgroundColor: C.gold, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, overflow: 'hidden' }}>{t('plans.bestValue')}</Text> : null}
              <Text style={{ fontWeight: '800', fontSize: 15, color: top ? C.white : C.ink }}>{t('plans.months', { n: num(m) })}</Text>
              {mSave > 0 ? <Text style={{ fontSize: 11.5, fontWeight: '800', color: top ? '#7CFFE3' : C.mintDark }}>{t('plans.save', { n: num(mSave) })}</Text> : <Text style={{ fontSize: 11.5, color: muted }}> </Text>}
            </Pressable>
          );
        })}
      </Row>

      <View>
        <Row gap={10} style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: fg, lineHeight: 46 }}>{t('plans.price', { n: num(price) })}</Text>
          {save > 0 && base ? <Text style={{ fontSize: 16, color: muted, textDecorationLine: 'line-through', marginBottom: 6 }}>{t('plans.price', { n: num(Math.round(base * months)) })}</Text> : null}
        </Row>
        <Text style={{ color: muted, fontSize: 13.5, marginTop: 2 }}>{t('plans.perMonth', { n: num(Math.round(perMonth)) })} · {t('plans.perDay', { n: num(Math.max(1, Math.round(perMonth / 30))) })}</Text>
      </View>

      <View style={{ gap: 7 }}>
        {PERKS.map((k) => (
          <Row key={k} gap={8} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: top ? 'rgba(255,255,255,0.22)' : C.mintSoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}><Check size={12} color={top ? '#7CFFE3' : C.mintDark} strokeWidth={3.5} /></View>
            <Text style={{ flex: 1, color: top ? C.white : C.ink2, fontSize: 14, lineHeight: 20 }}>{t(k)}</Text>
          </Row>
        ))}
      </View>

      <Button title={extend ? t('plans.cta.extend', { n: num(months) }) : `${t('plans.cta.get')} · ${t('plans.price', { n: num(price) })}`} variant={top ? 'white' : 'primary'} onPress={() => router.push({ pathname: '/checkout', params: { planId: plan.id, months: String(months) } })} />
      <Row gap={6} style={{ justifyContent: 'center' }}>
        <ShieldCheck size={14} color={muted} />
        <Text style={{ color: muted, fontSize: 11.5, flexShrink: 1, textAlign: 'center' }}>{t('plans.oneTime')}</Text>
      </Row>
    </View>
  );
  return (
    <Reveal delay={index * 90} style={{ marginBottom: 16 }}>
      {top ? (
        <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, ...shadow.lift }}>{body}</LinearGradient>
      ) : (
        <View style={{ backgroundColor: C.white, borderRadius: 28, ...shadow.card }}>{body}</View>
      )}
    </Reveal>
  );
}

export default function Plans() {
  const { t, b, date, num } = useI18n();
  const { api, refreshUser } = useAuth();
  const qc = useQueryClient();
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.plans(), staleTime: 5 * 60_000 });
  const ents = useQuery({ queryKey: ['entitlements'], queryFn: () => api.entitlements() });
  const [code, setCode] = useState('');
  const redeem = useMutation({
    mutationFn: () => api.redeemCoupon(code.trim()),
    onSuccess: async () => {
      setCode('');
      Alert.alert(t('plans.coupon.ok'));
      await Promise.all([qc.invalidateQueries(), refreshUser()]);
    },
    onError: (e) => Alert.alert(e instanceof ApiError ? e.message : t('app.error')),
  });
  const active = ents.data?.[0]; // newest end date first
  const daysLeft = active ? Math.max(0, Math.ceil((new Date(active.endsAt).getTime() - Date.now()) / 86_400_000)) : 0;
  const span = active ? Math.max(1, (new Date(active.endsAt).getTime() - new Date(active.startsAt).getTime()) / 86_400_000) : 1;
  const activePlan = active ? plans.data?.find((p) => p.id === active.planId) : undefined;
  return (
    <Screen refreshing={plans.isRefetching} onRefresh={() => { void plans.refetch(); void ents.refetch(); }} header={<ScreenHeader title={t('plans.title')} subtitle={t('plans.free.note')} />} bottomPad={40}>
      {active ? (
        <Reveal>
          <LinearGradient colors={['#2FD6BF', '#0B9D89']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 20, marginBottom: 18, gap: 14, ...shadow.lift }}>
            <Row gap={12}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}><Crown size={28} color="#FFE08A" /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.white, fontWeight: '800', fontSize: 22 }}>{t('plans.active.title')}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13.5 }}>{activePlan ? b(activePlan.nameEn, activePlan.nameHi) : active.planId} · {t('plans.active.until', { date: date(active.endsAt) })}</Text>
              </View>
            </Row>
            <View style={{ gap: 6 }}>
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 30 }}>{t('plans.active.left', { n: num(daysLeft) })}</Text>
              <View style={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}><View style={{ width: `${Math.min(100, (daysLeft / span) * 100)}%`, height: '100%', backgroundColor: C.white, borderRadius: 99 }} /></View>
            </View>
            {daysLeft <= 14 ? <Text style={{ color: '#FFF6D6', fontWeight: '700', fontSize: 13.5 }}>{t('plans.active.soon')}</Text> : <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13.5 }}>{t('plans.active.thanks')}</Text>}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 18, padding: 14, gap: 8 }}>
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>{t('plans.active.perks').toUpperCase()}</Text>
              {PERKS.map((k) => (
                <Row key={k} gap={8}><Check size={16} color={C.white} strokeWidth={3} /><Text style={{ flex: 1, color: C.white, fontSize: 14 }}>{t(k)}</Text></Row>
              ))}
            </View>
          </LinearGradient>
          <T v="h2" style={{ marginBottom: 2 }}>{t('plans.active.extend.title')}</T>
          <T v="muted" style={{ marginBottom: 12 }}>{t('plans.active.extend.body')}</T>
        </Reveal>
      ) : (
        <Reveal>
          <View style={{ marginBottom: 16, gap: 4 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.4 }}>{t('plans.hero.title')}</Text>
            <T v="muted">{t('plans.hero.sub')}</T>
          </View>
        </Reveal>
      )}
      {plans.isLoading ? <><Skeleton h={220} /><Skeleton h={220} /></> : plans.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void plans.refetch()} /> : (plans.data?.length ?? 0) === 0 ? <Empty text={t('plans.empty')} /> : plans.data!.map((p, i) => <PlanCard key={p.id} plan={p} index={i} extend={!!active} />)}

      <Row gap={6} style={{ justifyContent: 'center', marginBottom: 6 }}><ShieldCheck size={15} color={C.muted} /><T v="small">{t('plans.secure')}</T></Row>

      <Section title={t('plans.coupon')}>
        <Card>
          <Row>
            <Ticket size={20} color={C.primary} />
            <TextInput value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="CODE" placeholderTextColor={C.faint} style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: '700', color: C.ink, paddingVertical: 8 }} />
            <Chip label={t('plans.coupon.apply')} active onPress={() => code.trim() && redeem.mutate()} />
          </Row>
        </Card>
      </Section>
    </Screen>
  );
}
