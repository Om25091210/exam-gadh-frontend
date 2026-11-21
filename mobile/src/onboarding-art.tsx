import { Bot, Heart, Newspaper, NotebookPen, ScrollText, Swords, Timer, Trophy } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Float, Pulse, Ring, Twinkle } from '@/anim';
import { C, shadow } from '@/theme';

const WHITE = 'rgba(255,255,255,0.96)';

/** An option row that "gets picked" in turn, like someone answering. */
function Option({ index, picked }: { index: number; picked: number }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withRepeat(withSequence(withDelay(index * 1300, withTiming(1, { duration: 350 })), withTiming(1, { duration: 700 }), withTiming(0, { duration: 350 }), withDelay((2 - index) * 1300, withTiming(0, { duration: 1 }))), -1, false);
  }, [o, index]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  const tint = index === picked ? '#16A34A' : '#5A3DF0';
  return (
    <View style={{ height: 30, borderRadius: 10, backgroundColor: '#F1EFFF', marginTop: 8, justifyContent: 'center', overflow: 'hidden' }}>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: tint, opacity: 0.9 }, a]} />
      <View style={{ marginLeft: 10, width: 40 + index * 18, height: 7, borderRadius: 4, backgroundColor: 'rgba(90,61,240,0.35)' }} />
    </View>
  );
}

export function MockTestArt() {
  return (
    <View style={{ width: 300, height: 290, alignItems: 'center', justifyContent: 'center' }}>
      <Twinkle size={9} style={{ position: 'absolute', left: 24, top: 40 }} />
      <Twinkle size={7} delay={400} color="#FFFFFF" style={{ position: 'absolute', right: 20, bottom: 60 }} />
      <Float amplitude={5} duration={2600}>
        <View style={{ width: 230, backgroundColor: WHITE, borderRadius: 28, padding: 16, transform: [{ rotate: '-4deg' }], ...shadow.lift }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#E7E3FF', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '800', color: C.primary, fontSize: 12 }}>Q1</Text></View>
            <View style={{ flex: 1, height: 9, borderRadius: 5, backgroundColor: '#D9D4FF' }} />
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#ECE8FF', marginTop: 10, width: '85%' }} />
          {[0, 1, 2].map((i) => <Option key={i} index={i} picked={1} />)}
        </View>
      </Float>
      <Float amplitude={7} duration={2000} delay={200} style={{ position: 'absolute', right: 6, top: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, ...shadow.card }}>
          <Timer size={16} color={C.pinkDark} />
          <Text style={{ fontWeight: '800', color: C.ink }}>14:58</Text>
        </View>
      </Float>
      <Float amplitude={7} duration={2300} delay={600} style={{ position: 'absolute', left: 0, bottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF2CC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, ...shadow.card }}>
          <Trophy size={16} color="#B7791F" />
          <Text style={{ fontWeight: '800', color: '#8A5A00' }}>Rank #12</Text>
        </View>
      </Float>
    </View>
  );
}

function Highlighter() {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withRepeat(withSequence(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 900 }), withTiming(0, { duration: 400 })), -1, false);
  }, [w]);
  const a = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,211,107,0.7)', borderRadius: 4 }, a]} />;
}

export function NotesArt() {
  const card = (Icon: typeof NotebookPen, bg: string, fg: string, rot: string, x: number, y: number, delay: number, hl?: boolean) => (
    <Float amplitude={6} duration={2400 + delay} delay={delay} style={{ position: 'absolute', left: x, top: y }}>
      <View style={{ width: 130, height: 168, borderRadius: 24, backgroundColor: bg, padding: 14, transform: [{ rotate: rot }], ...shadow.lift }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' }}><Icon size={24} color={fg} /></View>
        {[88, 100, 70, 92].map((p, i) => (
          <View key={i} style={{ height: 8, borderRadius: 4, marginTop: i === 0 ? 14 : 8, backgroundColor: 'rgba(255,255,255,0.7)', width: `${p}%`, overflow: 'hidden' }}>
            {hl && i === 1 ? <Highlighter /> : null}
          </View>
        ))}
      </View>
    </Float>
  );
  return (
    <View style={{ width: 300, height: 290 }}>
      <Twinkle size={9} style={{ position: 'absolute', left: 18, top: 30 }} />
      <Twinkle size={7} delay={700} color="#FFFFFF" style={{ position: 'absolute', right: 30, bottom: 30 }} />
      {card(ScrollText, '#E4DCFF', '#6D3FD6', '-14deg', 0, 60, 300)}
      {card(Newspaper, '#FFE0D2', '#D9553A', '12deg', 160, 56, 0)}
      {card(NotebookPen, '#CFF7EE', '#0B9D89', '0deg', 82, 26, 600, true)}
      <Pulse to={1.18} duration={700} style={{ position: 'absolute', right: 44, top: 4 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow.card }}>
          <Heart size={24} color={C.pink} fill={C.pink} />
        </View>
      </Pulse>
    </View>
  );
}

function PointsBubble() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), withDelay(500, withTiming(0, { duration: 1 }))), -1, false);
  }, [y]);
  const a = useAnimatedStyle(() => ({ opacity: y.value < 0.15 ? y.value / 0.15 : 1 - Math.max(0, (y.value - 0.6) / 0.4), transform: [{ translateY: -y.value * 70 }, { scale: 0.9 + y.value * 0.2 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: 120, top: 70, backgroundColor: '#16A34A', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99 }, a]}>
      <Text style={{ color: C.white, fontWeight: '800', fontSize: 18 }}>+25</Text>
    </Animated.View>
  );
}

export function BattleArt() {
  const avatar = (child: React.ReactNode, bg: string, ring: string, left: boolean) => (
    <View style={{ position: 'absolute', top: 100, [left ? 'left' : 'right']: 6, width: 92, height: 92, alignItems: 'center', justifyContent: 'center' }}>
      <Ring size={92} color={ring} />
      <Float amplitude={5} duration={2200} delay={left ? 0 : 500}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: bg, borderWidth: 4, borderColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow.lift }}>{child}</View>
      </Float>
    </View>
  );
  return (
    <View style={{ width: 300, height: 290 }}>
      <Twinkle size={9} style={{ position: 'absolute', left: 120, top: 20 }} />
      <Twinkle size={7} delay={500} color="#FFD36B" style={{ position: 'absolute', right: 40, top: 60 }} />
      <Twinkle size={8} delay={900} style={{ position: 'absolute', left: 40, bottom: 40 }} />
      {avatar(<Text style={{ fontSize: 38, fontWeight: '800', color: C.primary }}>A</Text>, '#E7E3FF', '#FFFFFF', true)}
      {avatar(<Bot size={44} color={C.pinkDark} />, '#FFE1E8', '#FFD36B', false)}
      <Pulse to={1.2} duration={650} style={{ position: 'absolute', left: 112, top: 112 }}>
        <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <Swords size={46} color={C.white} />
        </View>
      </Pulse>
      <Text style={{ position: 'absolute', left: 0, right: 0, top: 206, textAlign: 'center', color: '#FFF2CC', fontSize: 30, fontWeight: '800', letterSpacing: 2 }}>VS</Text>
      <PointsBubble />
    </View>
  );
}
