import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';

/** Fades and slides a block in. Use `delay` to stagger a list. */
export function Reveal({ children, delay = 0, style, from = 'down' }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; from?: 'down' | 'up' }) {
  return (
    <Animated.View entering={(from === 'down' ? FadeInDown : FadeInUp).delay(delay).duration(480).springify().damping(18)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Pops in with a small spring (success badges, counters). */
export function Pop({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={ZoomIn.delay(delay).springify().damping(11)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Gentle endless up-and-down float. */
export function Float({ children, amplitude = 6, duration = 2400, delay = 0, style }: { children: ReactNode; amplitude?: number; duration?: number; delay?: number; style?: StyleProp<ViewStyle> }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(withTiming(-amplitude, { duration, easing: Easing.inOut(Easing.quad) }), withTiming(amplitude, { duration, easing: Easing.inOut(Easing.quad) })), -1, true));
  }, [y, amplitude, duration, delay]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[a, style]}>{children}</Animated.View>;
}

/** Slow breathing scale, e.g. around the next step on the journey. */
export function Pulse({ children, to = 1.08, duration = 900, style }: { children: ReactNode; to?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(withSequence(withTiming(to, { duration, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration, easing: Easing.inOut(Easing.quad) })), -1, false);
  }, [s, to, duration]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[a, style]}>{children}</Animated.View>;
}

/** An expanding, fading ring (radar / "live" feel). */
export function Ring({ size, color, delay = 0 }: { size: number; color: string; delay?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false));
  }, [p, delay]);
  const a = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - p.value), transform: [{ scale: 1 + p.value * 0.7 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: color }, a]} />;
}

/** Drifts sideways forever (clouds). */
export function Drift({ children, distance = 40, duration = 9000, style }: { children: ReactNode; distance?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(distance, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [x, distance, duration]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={[a, style]}>{children}</Animated.View>;
}

/** Twinkling sparkle dot. */
export function Twinkle({ size = 8, color = '#FFD36B', delay = 0, style }: { size?: number; color?: string; delay?: number; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.2);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.2, { duration: 900 })), -1, false));
  }, [o, delay]);
  const a = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: 0.6 + o.value * 0.6 }, { rotate: '45deg' }] }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: 2, backgroundColor: color }, a, style]} />;
}

/** Confetti burst for wins and successful payments. Plays once. */
export function Confetti({ count = 26, colors = ['#FFD36B', '#FF7D95', '#2FD6BF', '#8A76FF', '#FFFFFF'] }: { count?: number; colors?: string[] }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({ i, x: Math.random() * 100, delay: Math.random() * 500, size: 6 + Math.random() * 7, color: colors[i % colors.length], drift: (Math.random() - 0.5) * 80, spin: 180 + Math.random() * 360, dur: 1600 + Math.random() * 1200 })), [count, colors]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 420, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <Piece key={p.i} {...p} />
      ))}
    </View>
  );
}
function Piece({ x, delay, size, color, drift, spin, dur }: { x: number; delay: number; size: number; color: string; drift: number; spin: number; dur: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: dur, easing: Easing.out(Easing.quad) }));
  }, [t, delay, dur]);
  const a = useAnimatedStyle(() => ({ opacity: 1 - t.value * 0.9, transform: [{ translateY: -20 + t.value * 380 }, { translateX: drift * t.value }, { rotate: `${spin * t.value}deg` }] }));
  return <Animated.View style={[{ position: 'absolute', left: `${x}%`, top: 0, width: size, height: size * 0.6, borderRadius: 2, backgroundColor: color }, a]} />;
}

/** Counts up to `value` (JS-driven; fine for a few numbers). */
export function useCountUp(value: number, ms = 700): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / ms);
      setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [value, ms]);
  return n;
}

/** Press feedback: a springy shrink while the finger is down. */
export function useSpringPress() {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return { style, onPressIn: () => (s.value = withSpring(0.95, { damping: 14 })), onPressOut: () => (s.value = withSpring(1, { damping: 10 })) };
}
