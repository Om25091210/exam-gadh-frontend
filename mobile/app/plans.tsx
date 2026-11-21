import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Check, Crown, Sparkles, Ticket } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { ApiError, type BillingPlan } from '@eg/api';
import { Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, R, shadow } from '@/theme';
import { Badge, Button, Card, Chip, Empty, ErrorBox, Row, Screen, ScreenHeader, Section, Skeleton, T } from '@/ui';

type Months = 3 | 6 | 12;

function PlanCard({ plan, index }: { plan: BillingPlan; index: number }) {
  const { t, b, num } = useI18n();
  const options = (['3', '6', '12'] as const).filter((m) => plan.prices[m] != null).map(Number) as Months[];
  const [months, setMonths] = useState<Months>(options[options.length - 1] ?? 3);
  const price = plan.prices[String(months)];
  const monthly = options.length && plan.prices[String(options[0])] ? plan.prices[String(options[0])] / options[0] : null;
  const save = monthly && price ? Math.round((1 - price / months / monthly) * 100) : 0;
  const top = plan.topTier;
  const fg = top ? C.white : C.ink;
  const muted = top ? 'rgba(255,255,255,0.85)' : C.muted;
  const body = (
    <View style={{ padding: 18, gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={8}>
          <Crown size={22} color={top ? '#FFD36B' : C.primary} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: fg }}>{b(plan.nameEn, plan.nameHi)}</Text>
        </Row>
        {top ? <Badge text="BEST" tone="gold" /> : null}
      </Row>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {options.map((m) => (
          <Pressable key={m} onPress={() => setMonths(m)} accessibilityRole="button" accessibilityState={{ selected: months === m }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, backgroundColor: months === m ? (top ? C.white : C.primary) : top ? 'rgba(255,255,255,0.18)' : C.primarySoft }}>
            <Text style={{ fontWeight: '800', fontSize: 13, color: months === m ? (top ? C.primaryDark : C.white) : top ? C.white : C.primaryDark }}>{t('plans.months', { n: m })}</Text>
          </Pressable>
        ))}
      </Row>
      <Row gap={8} style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 38, fontWeight: '800', color: fg }}>{t('plans.price', { n: num(price ?? 0) })}</Text>
        {save > 0 ? <Badge text={`-${save}%`} tone="mint" /> : null}
      </Row>
      <Text style={{ color: muted, fontSize: 13 }}>{t('plans.exams', { names: plan.examIds.length ? plan.examIds.join(', ') : t('plans.allExams') })}</Text>
      <View style={{ gap: 6 }}>
        {['plans.intro'].map((k) => (
          <Row key={k} gap={8} style={{ alignItems: 'flex-start' }}>
            <Check size={16} color={top ? '#7CFF8A' : C.success} style={{ marginTop: 3 }} />
            <Text style={{ flex: 1, color: muted, fontSize: 13.5, lineHeight: 20 }}>{t('plans.intro')}</Text>
          </Row>
        ))}
      </View>
      <Button title={t('plans.buy')} variant={top ? 'white' : 'primary'} onPress={() => router.push({ pathname: '/checkout', params: { planId: plan.id, months: String(months) } })} />
    </View>
  );
  return (
    <Reveal delay={index * 90} style={{ marginBottom: 14 }}>
      {top ? (
        <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, ...shadow.lift }}>{body}</LinearGradient>
      ) : (
        <View style={{ backgroundColor: C.white, borderRadius: 28, ...shadow.card }}>{body}</View>
      )}
    </Reveal>
  );
}

export default function Plans() {
  const { t, b, date } = useI18n();
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
  const active = ents.data?.[0];
  return (
    <Screen refreshing={plans.isRefetching} onRefresh={() => { void plans.refetch(); void ents.refetch(); }} header={<ScreenHeader title={t('plans.title')} subtitle={t('plans.free.note')} />} bottomPad={40}>
      {active ? (
        <Reveal>
          <LinearGradient colors={['#4FE3CB', '#12A995']} style={{ borderRadius: 24, padding: 16, marginBottom: 16, ...shadow.card }}>
            <Row>
              <Sparkles size={26} color={C.white} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.white, fontWeight: '800', fontSize: 17 }}>{active.planId}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.92)' }}>{t('plans.current', { date: date(active.endsAt) })}</Text>
              </View>
            </Row>
          </LinearGradient>
        </Reveal>
      ) : null}
      {plans.isLoading ? <><Skeleton h={220} /><Skeleton h={220} /></> : plans.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void plans.refetch()} /> : (plans.data?.length ?? 0) === 0 ? <Empty text={t('plans.empty')} /> : plans.data!.map((p, i) => <PlanCard key={p.id} plan={p} index={i} />)}

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
