import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reveal } from '@/anim';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { useOnboarding } from '@/lib/onboarding';
import { BattleArt, MockTestArt, NotesArt } from '@/onboarding-art';
import { C } from '@/theme';
import { Button } from '@/ui';

const PAGES: Array<{ title: MessageKey; body: MessageKey; colors: [string, string, string]; Art: () => React.JSX.Element }> = [
  { title: 'onb.1.title', body: 'onb.1.body', colors: ['#8A76FF', '#5A3DF0', '#2B1C86'], Art: MockTestArt },
  { title: 'onb.2.title', body: 'onb.2.body', colors: ['#4FE3CB', '#12A995', '#0B6E62'], Art: NotesArt },
  { title: 'onb.3.title', body: 'onb.3.body', colors: ['#FF8A00', '#E52E4D', '#7B2FF7'], Art: BattleArt },
];

function Page({ i, x, width, height }: { i: number; x: { value: number }; width: number; height: number }) {
  const { t } = useI18n();
  const p = PAGES[i];
  // the artwork slides slower than the page and fades while it leaves: a light parallax
  const art = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [(i - 1) * width, i * width, (i + 1) * width], [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(x.value, [(i - 1) * width, i * width, (i + 1) * width], [width * 0.4, 0, -width * 0.4], Extrapolation.CLAMP) }, { scale: interpolate(x.value, [(i - 1) * width, i * width, (i + 1) * width], [0.8, 1, 0.8], Extrapolation.CLAMP) }],
  }));
  return (
    <View style={{ width, height }}>
      <LinearGradient colors={p.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: height * 0.56, borderBottomLeftRadius: 56, borderBottomRightRadius: 56, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -60, top: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.10)' }} />
        <View style={{ position: 'absolute', left: -70, bottom: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.09)' }} />
        <Animated.View style={[{ marginTop: 30 }, art]}>
          <p.Art />
        </Animated.View>
      </LinearGradient>
      <View style={{ paddingHorizontal: 28, paddingTop: 26, alignItems: 'center' }}>
        <Reveal key={i}>
          <Text style={{ fontSize: 27, fontWeight: '800', color: C.ink, textAlign: 'center' }}>{t(p.title)}</Text>
          <Text style={{ fontSize: 16, lineHeight: 25, color: C.muted, textAlign: 'center', marginTop: 10, maxWidth: 340 }}>{t(p.body)}</Text>
        </Reveal>
      </View>
    </View>
  );
}

/** Three animated intro pages, shown once between choosing a language and signing in. */
export default function OnboardingScreen() {
  const { t } = useI18n();
  const { finish } = useOnboarding();
  const { width, height } = useWindowDimensions();
  const ref = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const x = useSharedValue(0);
  const last = page === PAGES.length - 1;
  const pageH = height - 150;
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  const go = (i: number) => {
    ref.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Animated.ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={16} onScroll={onScroll} onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))} style={{ flex: 1 }}>
        {PAGES.map((_, i) => (
          <Page key={i} i={i} x={x} width={width} height={pageH} />
        ))}
      </Animated.ScrollView>
      <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 24, paddingBottom: 14, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {PAGES.map((_, i) => (
            <View key={i} style={{ width: i === page ? 28 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? C.primary : C.faint }} />
          ))}
        </View>
        <Button title={last ? t('onb.start') : t('onb.next')} onPress={() => (last ? finish() : go(page + 1))} />
      </SafeAreaView>
      {last ? null : (
        <SafeAreaView edges={['top']} style={{ position: 'absolute', right: 0, top: 0 }}>
          <Pressable onPress={finish} accessibilityRole="button" hitSlop={12} style={{ margin: 14, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99 }}>
            <Text style={{ color: C.white, fontWeight: '800', fontSize: 14 }}>{t('onb.skip')}</Text>
          </Pressable>
        </SafeAreaView>
      )}
    </View>
  );
}
