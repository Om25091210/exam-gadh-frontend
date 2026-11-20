import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, ClipboardCheck, MessageCircleQuestion } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { DEV_LOGIN, GOOGLE_WEB_CLIENT_ID } from '@/lib/config';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Button, T } from '@/ui';

/**
 * Native Google sign-in (account picker, no browser). It needs only the web client id here; Google matches the app itself by
 * its package name and signing key (an Android OAuth client registered for them in Google Cloud Console).
 */
function GoogleSignIn({ onToken, busy, onFail }: { onToken: (t: string) => void; busy: boolean; onFail: () => void }) {
  const { t } = useI18n();
  const [working, setWorking] = useState(false);
  const press = async () => {
    if (Platform.OS !== 'android') return onFail();
    setWorking(true);
    try {
      // loaded only on the phone: the library has no browser version
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GoogleSignin } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: false });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut().catch(() => undefined); // always show the account picker
      const res = await GoogleSignin.signIn();
      const id = res.type === 'success' ? res.data.idToken : null;
      if (id) onToken(id);
      else if (res.type !== 'cancelled') onFail();
    } catch {
      onFail();
    } finally {
      setWorking(false);
    }
  };
  return <Button title={t('app.signin.google')} onPress={() => void press()} loading={busy || working} />;
}

export default function LoginScreen() {
  const { t } = useI18n();
  const { signIn, endedCode } = useAuth();
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (token: string) => {
    setBusy(true);
    setError(null);
    try {
      await signIn(token);
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(code === 'ACCOUNT_SUSPENDED' ? 'auth.suspended' : code === 'ACCOUNT_DELETED' ? 'auth.deleted' : 'app.signin.failed');
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={['#F4F2FF', '#EEF0F8']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <Image source={require('../assets/logo.png')} style={{ width: 150, height: 150 }} resizeMode="contain" />
          <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink, textAlign: 'center', marginTop: 8 }}>{t('app.signin.title')}</Text>
          <T v="muted" center style={{ marginTop: 8 }}>{t('app.signin.sub')}</T>
        </View>
        <View style={{ marginTop: 22, gap: 10 }}>
          {([['auth.feat.tests', ClipboardCheck, '#5A3DF0'], ['auth.feat.analytics', BarChart3, '#0B9D89'], ['auth.feat.doubts', MessageCircleQuestion, '#E5486C']] as const).map(([k, Icon, col]) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 18, padding: 12, ...shadow.card }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: col + '1F' }}>
                <Icon size={20} color={col} />
              </View>
              <T v="h3" style={{ flex: 1, fontSize: 14 }}>{t(k)}</T>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 22, gap: 10 }}>
          {endedCode === 'SESSION_REPLACED' ? <T v="small" color={C.warn} center>{t('auth.sessionEnded')}</T> : null}
          {error ? <T v="small" color={C.danger} center>{t(error)}</T> : null}
          {Platform.OS === 'android' ? <GoogleSignIn onToken={go} busy={busy} onFail={() => setError('app.signin.failed')} /> : DEV_LOGIN ? null : <T v="small" color={C.warn} center>{t('app.signin.notset')}</T>}
          {DEV_LOGIN ? <Button title={t('app.signin.dev')} variant="soft" onPress={() => void go(`dev:mobile1:student@example.com:Test Student`)} /> : null}
          <T v="small" center>{t('auth.single')}</T>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
