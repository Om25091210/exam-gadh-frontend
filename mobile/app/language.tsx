import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n, type Lang } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { T } from '@/ui';

const OPTIONS: Array<{ lang: Lang; big: string; small: string }> = [
  { lang: 'hi', big: 'हिंदी', small: 'Hindi' },
  { lang: 'en', big: 'English', small: 'अंग्रेज़ी' },
];

/** First launch: ask for a language before anything else. It can be changed later from Profile. */
export default function LanguageScreen() {
  const { setLang } = useI18n();
  return (
    <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 104, height: 104, borderRadius: 30, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow.lift }}>
            <Image source={require('../assets/logo.png')} style={{ width: 88, height: 88 }} resizeMode="contain" />
          </View>
          <Text style={{ color: C.white, fontSize: 30, fontWeight: '800', marginTop: 28, textAlign: 'center' }}>अपनी भाषा चुनें</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 19, fontWeight: '600', marginTop: 4 }}>Choose your language</Text>
        </View>
        <View style={{ marginTop: 32, gap: 14 }}>
          {OPTIONS.map((o) => (
            <Pressable key={o.lang} onPress={() => setLang(o.lang)} accessibilityRole="button" accessibilityLabel={`${o.big} ${o.small}`} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
              <View style={{ backgroundColor: C.white, borderRadius: 26, paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadow.lift }}>
                <View>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: C.primaryDark }}>{o.big}</Text>
                  <T v="small">{o.small}</T>
                </View>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight size={20} color={C.primary} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 22, fontSize: 13 }}>आप इसे कभी भी बदल सकते हैं · You can change it any time</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}
