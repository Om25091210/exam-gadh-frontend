import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Gift } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Float, Pulse, Reveal, Ring, Twinkle, useCountUp } from '@/anim';
import { useI18n } from '@/lib/i18n';
import { hm, istHour, istWeekdayIndex, msLeftToday } from '@/lib/clock';
import { C, shadow } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const GOALS = [3, 7, 14, 30, 60, 100, 365];

/** Streak ring: how far to the next goal (the closer, the more it pulls). */
function StreakRing({ streak, size = 104 }: { streak: number; size?: number }) {
  const goal = GOALS.find((g) => g > streak) ?? streak + 1;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(300, withTiming(Math.min(1, streak / goal), { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, [p, streak, goal]);
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  const n = useCountUp(streak, 900);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.22)" strokeWidth={10} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke="#FFD36B" strokeWidth={10} strokeLinecap="round" strokeDasharray={circ} fill="none" animatedProps={props} />
      </Svg>
      <Pulse to={1.14} duration={650}>
        <Flame size={size * 0.3} color={streak > 0 ? '#FFB020' : 'rgba(255,255,255,0.6)'} fill={streak > 0 ? '#FF7A59' : 'transparent'} />
      </Pulse>
      <Text style={{ color: C.white, fontSize: size * 0.27, fontWeight: '800', marginTop: -2 }}>{n}</Text>
    </View>
  );
}

function WeekDots({ streak, activeToday }: { streak: number; activeToday: boolean }) {
  const { lang } = useI18n();
  const labels = lang === 'hi' ? ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = istWeekdayIndex();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {labels.map((l, i) => {
        const off = i - today;
        const future = off > 0;
        const ago = -off;
        const done = !future && (activeToday ? ago < streak : ago >= 1 && ago <= streak);
        const isToday = off === 0;
        return (
          <View key={i} style={{ alignItems: 'center', gap: 5 }}>
            <Text style={{ color: isToday ? C.white : 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '800' }}>{l}</Text>
            <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#FFD36B' : 'rgba(255,255,255,0.14)', borderWidth: isToday ? 2 : 0, borderColor: C.white, borderStyle: future ? 'dashed' : 'solid' }}>
              {done ? <Flame size={16} color="#B45309" fill="#FF7A59" /> : null}
              {isToday && !done ? <Pulse to={1.25} duration={700}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.white }} /></Pulse> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** The one big button: always the single best next action. A light sweeps across it so the eye lands there first. */
function Cta({ label, sub, onPress }: { label: string; sub?: string; onPress: () => void }) {
  const [w, setW] = useState(300);
  const x = useSharedValue(-120);
  useEffect(() => {
    x.value = withRepeat(withSequence(withTiming(w + 120, { duration: 1500, easing: Easing.inOut(Easing.quad) }), withDelay(1800, withTiming(-120, { duration: 1 }))), -1, false);
  }, [x, w]);
  const sheen = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { skewX: '-20deg' }] }));
  return (
    <Pulse to={1.025} duration={1100}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}>
        <LinearGradient colors={['#FFB27A', '#FF7A59', '#F2583E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, paddingVertical: 15, paddingHorizontal: 20, overflow: 'hidden', alignItems: 'center', shadowColor: '#FF7A59', shadowOpacity: 0.7, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 12 }}>
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -10, bottom: -10, width: 46, backgroundColor: 'rgba(255,255,255,0.38)' }, sheen]} />
          <Text style={{ color: '#2B1204', fontSize: 18, fontWeight: '800' }}>{label}  →</Text>
          {sub ? <Text style={{ color: 'rgba(43,18,4,0.75)', fontSize: 12.5, fontWeight: '700', marginTop: 2 }}>{sub}</Text> : null}
        </LinearGradient>
      </Pressable>
    </Pulse>
  );
}

export interface HeroProps {
  name: string;
  streak: number;
  activeToday: boolean;
  chest: { available: boolean; eligible: boolean; opened: boolean } | null;
  cta: { label: string; sub?: string; onPress: () => void };
  onChest: () => void;
}

/** "Mission" card: where you stand (streak), what is at stake (time left), the surprise waiting (chest) and the one thing to do now. */
export function MissionHero({ name, streak, activeToday, chest, cta, onChest }: HeroProps) {
  const { t } = useI18n();
  const [left, setLeft] = useState(msLeftToday());
  useEffect(() => {
    const id = setInterval(() => setLeft(msLeftToday()), 30_000);
    return () => clearInterval(id);
  }, []);
  const hour = istHour();
  const greet = hour < 12 ? 'hero.gm' : hour < 17 ? 'hero.ga' : 'hero.ge';
  const goal = GOALS.find((g) => g > streak) ?? streak + 1;
  const atRisk = streak > 0 && !activeToday;
  const headline = atRisk ? t('hero.risk', { n: streak }) : activeToday ? t('hero.safe') : t('hero.start');
  const sub = atRisk ? `⏳ ${t('hero.left', { time: hm(left) })}` : t('hero.next', { n: goal - streak, goal });

  return (
    <Reveal>
      <LinearGradient colors={['#2B1C86', '#5A3DF0', '#8A76FF']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 32, padding: 20, overflow: 'hidden', ...shadow.lift }}>
        <View style={{ position: 'absolute', right: -40, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.10)' }} />
        <View style={{ position: 'absolute', left: -50, bottom: -70, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(47,214,191,0.18)' }} />
        <Twinkle size={8} style={{ position: 'absolute', right: 130, top: 26 }} />
        <Twinkle size={6} delay={600} color="#FFFFFF" style={{ position: 'absolute', left: 30, top: 70 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700' }}>{t(greet)}, {name}</Text>
            <Text style={{ color: C.white, fontSize: 21, lineHeight: 27, fontWeight: '800', marginTop: 4 }}>{headline}</Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: atRisk ? 'rgba(255,122,89,0.95)' : 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
              <Text style={{ color: C.white, fontSize: 12.5, fontWeight: '800' }}>{sub}</Text>
            </View>
          </View>
          <View>
            <StreakRing streak={streak} />
            {chest?.available ? (
              <Pressable onPress={onChest} accessibilityRole="button" accessibilityLabel={t('hero.cta.chest')} hitSlop={8} style={{ position: 'absolute', right: -6, bottom: -6 }}>
                <Float amplitude={4} duration={650}>
                  <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <Ring size={44} color="#FFD36B" />
                    <LinearGradient colors={['#FFD36B', '#E89A0C']} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white }}>
                      <Gift size={20} color={C.white} />
                    </LinearGradient>
                  </View>
                </Float>
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={{ marginTop: 16 }}>
          <WeekDots streak={streak} activeToday={activeToday} />
        </View>
        <View style={{ marginTop: 18 }}>
          <Cta label={cta.label} sub={cta.sub} onPress={cta.onPress} />
        </View>
        {chest && !chest.eligible ? <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12.5, textAlign: 'center', marginTop: 10 }}>🎁 {t('hero.chest.hint')}</Text> : null}
      </LinearGradient>
    </Reveal>
  );
}
