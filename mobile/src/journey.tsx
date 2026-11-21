import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Award, BookOpenCheck, CalendarCheck, ClipboardList, MessageCircleQuestion, Newspaper, NotebookPen, ScrollText, Swords, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { Drift, Float, Pulse, Reveal, Ring, Twinkle } from '@/anim';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { C, shadow, TONES, type Tone } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Design space is 360 wide; everything scales to the phone's width. */
const DW = 360;
const DH = 1040;
const ROAD = 'M180 86 C180 146 268 150 268 214 C268 276 92 270 92 334 C92 396 262 392 262 456 C262 518 96 512 96 578 C96 640 240 634 240 700 C240 762 100 756 100 822 C100 884 262 878 262 944 C262 990 180 1000 180 1030';

interface Node {
  key: string;
  x: number;
  y: number;
  label: MessageKey;
  icon: LucideIcon;
  tone: Tone;
  href: string;
  kind?: 'mock' | 'battle';
}
const NODES: Node[] = [
  { key: 'mock', x: 180, y: 86, label: 'map.mock', icon: BookOpenCheck, tone: 'indigo', href: '/(tabs)/tests', kind: 'mock' },
  { key: 'tests', x: 268, y: 214, label: 'map.tests', icon: ClipboardList, tone: 'sky', href: '/(tabs)/tests' },
  { key: 'notes', x: 92, y: 334, label: 'map.notes', icon: NotebookPen, tone: 'mint', href: '/notes' },
  { key: 'ca', x: 262, y: 456, label: 'map.ca', icon: Newspaper, tone: 'peach', href: '/ca' },
  { key: 'pyq', x: 96, y: 578, label: 'map.pyq', icon: ScrollText, tone: 'lilac', href: '/pyq' },
  { key: 'battle', x: 240, y: 700, label: 'app.battle.title', icon: Swords, tone: 'pink', href: '/battle', kind: 'battle' },
  { key: 'doubts', x: 100, y: 822, label: 'nav.doubts', icon: MessageCircleQuestion, tone: 'gold', href: '/doubts' },
  { key: 'planner', x: 262, y: 944, label: 'nav.planner', icon: CalendarCheck, tone: 'mint', href: '/planner' },
];

function Clouds({ k }: { k: number }) {
  const cloud = (w: number) => (
    <View>
      <View style={{ width: w, height: w * 0.32, borderRadius: w, backgroundColor: 'rgba(255,255,255,0.9)' }} />
      <View style={{ position: 'absolute', left: w * 0.2, top: -w * 0.14, width: w * 0.42, height: w * 0.34, borderRadius: w, backgroundColor: 'rgba(255,255,255,0.9)' }} />
    </View>
  );
  return (
    <>
      <Drift distance={36 * k} duration={11000} style={{ position: 'absolute', left: 18 * k, top: 34 * k }}>{cloud(70 * k)}</Drift>
      <Drift distance={-30 * k} duration={13000} style={{ position: 'absolute', right: 24 * k, top: 300 * k }}>{cloud(56 * k)}</Drift>
      <Drift distance={34 * k} duration={15000} style={{ position: 'absolute', left: 30 * k, top: 640 * k }}>{cloud(64 * k)}</Drift>
      <Drift distance={-26 * k} duration={12000} style={{ position: 'absolute', right: 20 * k, top: 900 * k }}>{cloud(52 * k)}</Drift>
    </>
  );
}

function Road({ w, h }: { w: number; h: number }) {
  const off = useSharedValue(0);
  useEffect(() => {
    off.value = withRepeat(withTiming(-36, { duration: 2200, easing: Easing.linear }), -1, false);
  }, [off]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: off.value }));
  const trees: Array<[number, number, number]> = [[40, 150, 1], [320, 120, 0.8], [40, 470, 0.9], [330, 600, 1], [30, 700, 0.8], [330, 820, 0.9], [34, 960, 1], [318, 1010, 0.8]];
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${DW} ${DH}`} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <SvgGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F4F2FF" />
        </SvgGradient>
        <SvgGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D9D0FF" />
          <Stop offset="1" stopColor="#EDE8FF" />
        </SvgGradient>
      </Defs>
      <Path d={`M0 1000 C70 975 140 1010 210 990 S320 975 360 1000 L360 1040 L0 1040 Z`} fill="url(#hill)" />
      <Path d={ROAD} stroke="#C9BEFF" strokeWidth={40} strokeLinecap="round" fill="none" />
      <Path d={ROAD} stroke="url(#road)" strokeWidth={33} strokeLinecap="round" fill="none" />
      <AnimatedPath d={ROAD} stroke="#8A76FF" strokeWidth={3} strokeLinecap="round" strokeDasharray="12 24" fill="none" animatedProps={props} />
      {trees.map(([x, y, s], i) => (
        <G key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <Ellipse cx={0} cy={16} rx={14} ry={4} fill="rgba(90,61,240,0.12)" />
          <Path d="M0 14 V0" stroke="#9A6B47" strokeWidth={4} strokeLinecap="round" />
          <Circle cx={0} cy={-8} r={14} fill={i % 2 ? '#2FD6BF' : '#8A76FF'} opacity={0.9} />
          <Circle cx={-5} cy={-12} r={6} fill="#FFFFFF" opacity={0.25} />
        </G>
      ))}
      {[[130, 140], [60, 260], [300, 340], [140, 520], [300, 560], [160, 760], [50, 900], [300, 880]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={4.5} fill="#FF7A59" opacity={0.85} />
      ))}
    </Svg>
  );
}

function NodeView({ n, k, index, initial, mockNumber, liveOpen }: { n: Node; k: number; index: number; initial: string; mockNumber: number; liveOpen: boolean }) {
  const { t, num } = useI18n();
  const size = (n.kind === 'mock' ? 92 : 70) * k;
  const [bg, from, to] = TONES[n.tone];
  const Icon = n.icon;
  const body =
    n.kind === 'mock' ? (
      <Pulse to={1.06}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Ring size={size} color="#8A76FF" />
          <Ring size={size} color="#8A76FF" delay={900} />
          <LinearGradient colors={['#8A76FF', '#4A2FD1']} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow.lift }}>
            <Text style={{ color: C.white, fontSize: size * 0.42, fontWeight: '800' }}>{initial}</Text>
          </LinearGradient>
        </View>
      </Pulse>
    ) : n.kind === 'battle' ? (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Ring size={size} color="#E52E4D" />
        <LinearGradient colors={['#FF8A00', '#E52E4D', '#7B2FF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size * 0.34, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.white, ...shadow.lift }}>
          <Swords size={size * 0.5} color={C.white} />
        </LinearGradient>
        <View style={{ position: 'absolute', top: -8 * k, right: -10 * k, backgroundColor: '#16A34A', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 }}>
          <Text style={{ color: C.white, fontSize: 10 * Math.max(k, 0.9), fontWeight: '800' }}>LIVE</Text>
        </View>
      </View>
    ) : (
      <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.white, ...shadow.card }}>
        {n.key === 'tests' && liveOpen ? <Ring size={size} color="#DC2626" /> : null}
        <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size * 0.66, height: size * 0.66, borderRadius: size * 0.22, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={size * 0.36} color={C.white} strokeWidth={2.3} />
        </LinearGradient>
      </View>
    );
  const label = n.kind === 'mock' ? `${t('map.mock')} ${t('map.mock.n', { n: num(mockNumber) })}` : t(n.label);
  return (
    <View style={{ position: 'absolute', left: n.x * k - 60 * k, top: n.y * k - size / 2, width: 120 * k, alignItems: 'center' }}>
      <Reveal delay={150 + index * 90}>
        <Pressable onPress={() => router.push(n.href as never)} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ alignItems: 'center', transform: [{ scale: pressed ? 0.94 : 1 }] })}>
          <Float amplitude={n.kind ? 3 : 5} duration={2200 + index * 180} delay={index * 140}>{body}</Float>
          <View style={{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.96)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, ...shadow.card }}>
            <Text numberOfLines={1} style={{ fontSize: 12.5 * Math.max(k, 0.92), fontWeight: '800', color: C.ink }}>{label}</Text>
          </View>
        </Pressable>
      </Reveal>
    </View>
  );
}

/** The home screen's main feature: a winding, animated road with a tappable stop for every part of the app. */
export function JourneyMap({ width, initial, mockNumber, liveOpen }: { width: number; initial: string; mockNumber: number; liveOpen: boolean }) {
  const { t } = useI18n();
  const k = width / DW;
  const h = DH * k;
  return (
    <View style={{ width, height: h, borderRadius: 32, overflow: 'hidden', ...shadow.card }}>
      <LinearGradient colors={['#DCD4FF', '#EEEAFF', '#FFFFFF']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <Clouds k={k} />
      <Twinkle size={7 * k} style={{ position: 'absolute', left: 300 * k, top: 40 * k }} />
      <Twinkle size={6 * k} delay={500} color="#FF7D95" style={{ position: 'absolute', left: 50 * k, top: 410 * k }} />
      <Twinkle size={7 * k} delay={900} color="#2FD6BF" style={{ position: 'absolute', left: 310 * k, top: 760 * k }} />
      <Road w={width} h={h} />
      {NODES.map((n, i) => (
        <NodeView key={n.key} n={n} k={k} index={i} initial={initial} mockNumber={mockNumber} liveOpen={liveOpen} />
      ))}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 10 * k, alignItems: 'center' }}>
        <Float amplitude={4}>
          <View style={{ width: 58 * k, height: 58 * k, borderRadius: 29 * k, overflow: 'hidden', ...shadow.lift }}>
            <LinearGradient colors={['#FFD36B', '#E89A0C']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Award size={30 * k} color={C.white} />
            </LinearGradient>
          </View>
        </Float>
        <Text style={{ fontWeight: '800', color: '#A86A00', marginTop: 2, fontSize: 12.5 }}>{t('journey.finish')}</Text>
      </View>
    </View>
  );
}
