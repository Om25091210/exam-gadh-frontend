import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, ClipboardCheck, MessageCircleQuestion } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { DEV_LOGIN, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/lib/config';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Button, T } from '@/ui';

WebBrowser.maybeCompleteAuthSession();

function GoogleSignIn({ onToken, onBusy }: { onToken: (t: string) => void; onBusy: boolean }) {
  const { t } = useI18n();
  const [request, response, prompt] = Google.useIdTokenAuthRequest({ webClientId: GOOGLE_WEB_CLIENT_ID, androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined });
  useEffect(() => {
    if (response?.type === 'success') {
      const id = (response.params as { id_token?: string }).id_token;
      if (id) onToken(id);
    }
  }, [response, onToken]);
  return <Button title={t('app.signin.google')} onPress={() => void prompt()} disabled={!request} loading={onBusy} />;
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
          {GOOGLE_WEB_CLIENT_ID ? <GoogleSignIn onToken={go} onBusy={busy} /> : <T v="small" color={C.warn} center>{t('app.signin.notset')}</T>}
          {DEV_LOGIN ? <Button title={t('app.signin.dev')} variant="soft" onPress={() => void go(`dev:mobile1:student@example.com:Test Student`)} /> : null}
          <T v="small" center>{t('auth.single')}</T>
          {Platform.OS === 'web' ? null : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
