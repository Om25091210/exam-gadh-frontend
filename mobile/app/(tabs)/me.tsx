import { useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Eye, LogOut, ShieldCheck } from 'lucide-react-native';
import { Alert, Switch, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C } from '@/theme';
import { Button, Card, Chip, Row, Screen, Section, T, useTabPad } from '@/ui';

export default function MeTab() {
  const { t, lang, setLang, date } = useI18n();
  const { user, api, signOut, refreshUser } = useAuth();
  const pad = useTabPad();
  const toggle = useMutation({ mutationFn: (v: boolean) => api.updateMe({ showOnLeaderboard: v }), onSuccess: () => void refreshUser() });
  const changeLang = (l: 'hi' | 'en') => {
    setLang(l);
    void api.updateMe({ language: l }).catch(() => undefined);
  };
  if (!user) return null;
  const ent = user.entitlements[0];
  return (
    <Screen bottomPad={pad}>
      <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 30, padding: 20, marginTop: 10, alignItems: 'center' }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)' }}>
          <Text style={{ fontSize: 36, fontWeight: '800', color: C.primary }}>{(user.name[0] ?? '?').toUpperCase()}</Text>
        </View>
        <Text style={{ color: C.white, fontSize: 21, fontWeight: '800', marginTop: 10 }}>{user.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{user.email}</Text>
      </LinearGradient>

      <Section title={t('app.me.plan')}>
        <Card>
          <Row>
            <Crown size={22} color={ent ? C.gold : C.faint} />
            <View style={{ flex: 1 }}>
              <T v="h3">{ent ? ent.planId : t('app.me.noPlan')}</T>
              {ent ? <T v="small">{t('plans.current', { date: date(ent.endsAt) })}</T> : null}
            </View>
          </Row>
        </Card>
      </Section>

      <Section title={t('app.me.language')}>
        <Row gap={8}>
          <Chip label="हिंदी" active={lang === 'hi'} onPress={() => changeLang('hi')} />
          <Chip label="English" active={lang === 'en'} onPress={() => changeLang('en')} />
        </Row>
      </Section>

      <Section title={t('nav.leaderboard')}>
        <Card>
          <Row>
            <Eye size={20} color={C.primary} />
            <T v="h3" style={{ flex: 1, fontSize: 14 }}>{t('app.me.leaderboardShow')}</T>
            <Switch value={user.showOnLeaderboard} onValueChange={(v) => toggle.mutate(v)} trackColor={{ true: C.primary, false: C.line }} />
          </Row>
        </Card>
      </Section>

      <Card style={{ marginTop: 18 }}>
        <Row>
          <ShieldCheck size={20} color={C.mintDark} />
          <T v="small" style={{ flex: 1 }}>{t('app.me.privacy')}</T>
        </Row>
      </Card>

      <View style={{ marginTop: 22 }}>
        <Button title={t('app.me.signOut')} variant="soft" icon={LogOut} onPress={() => Alert.alert(t('app.me.signOutAsk'), undefined, [{ text: t('app.cancel'), style: 'cancel' }, { text: t('app.me.signOut'), style: 'destructive', onPress: () => void signOut() }])} />
      </View>
    </Screen>
  );
}
