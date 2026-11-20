import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardCheck, NotebookPen, Swords, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { useOnboarding } from '@/lib/onboarding';
import { C, shadow } from '@/theme';
import { Button } from '@/ui';

const PAGES: Array<{ title: MessageKey; body: MessageKey; icon: LucideIcon; colors: [string, string, string]; accent: string }> = [
  { title: 'onb.1.title', body: 'onb.1.body', icon: ClipboardCheck, colors: ['#8A76FF', '#5A3DF0', '#2B1C86'], accent: '#FFD36B' },
  { title: 'onb.2.title', body: 'onb.2.body', icon: NotebookPen, colors: ['#4FE3CB', '#12A995', '#0B6E62'], accent: '#FFFFFF' },
  { title: 'onb.3.title', body: 'onb.3.body', icon: Swords, colors: ['#FF8A00', '#E52E4D', '#7B2FF7'], accent: '#FFF2CC' },
];

/** Three intro pages shown once, between choosing a language and signing in. */
export default function OnboardingScreen() {
  const { t } = useI18n();
  const { finish } = useOnboarding();
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  const go = (i: number) => {
    ref.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 6, minHeight: 44 }}>
        {last ? null : (
          <Pressable onPress={finish} accessibilityRole="button" hitSlop={10}>
            <Text style={{ color: C.muted, fontWeight: '800', fontSize: 15 }}>{t('onb.skip')}</Text>
          </Pressable>
        )}
      </View>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onEnd} style={{ flex: 1 }}>
        {PAGES.map((p, i) => {
          const Icon = p.icon;
          return (
            <View key={i} style={{ width, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }}>
              <LinearGradient colors={p.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: Math.min(width - 56, 320), height: Math.min(width - 56, 320), borderRadius: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadow.lift }}>
                <View style={{ position: 'absolute', right: -40, top: -40, width: 170, height: 170, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                <View style={{ position: 'absolute', left: -30, bottom: -50, width: 150, height: 150, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.10)' }} />
                <View style={{ width: 128, height: 128, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={72} color={p.accent} strokeWidth={2} />
                </View>
              </LinearGradient>
              <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink, textAlign: 'center', marginTop: 30 }}>{t(p.title)}</Text>
              <Text style={{ fontSize: 16, lineHeight: 25, color: C.muted, textAlign: 'center', marginTop: 10, maxWidth: 340 }}>{t(p.body)}</Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 22, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {PAGES.map((_, i) => (
            <View key={i} style={{ width: i === page ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? C.primary : C.faint }} />
          ))}
        </View>
        <Button title={last ? t('onb.start') : t('onb.next')} onPress={() => (last ? finish() : go(page + 1))} />
      </View>
    </SafeAreaView>
  );
}
