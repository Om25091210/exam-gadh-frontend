import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';

/** Fades and slides a block in. Use `delay` to stagger a list. */
export function Reveal({ children, delay = 0, style, from = 'down' }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; from?: 'down' | 'up' }) {
  return (
    <Animated.View entering={(from === 'down' ? FadeInDown : FadeInUp).delay(Math.min(delay, 120)).duration(220)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Pops in with a small spring (success badges, counters). */
export function Pop({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={ZoomIn.delay(Math.min(delay, 120)).duration(220)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Gentle endless up-and-down float. */
export function Float({ children, style }: { children: ReactNode; amplitude?: number; duration?: number; delay?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>; // endless motion removed: it made the app laggy
}

/** Slow breathing scale, e.g. around the next step on the journey. */
export function Pulse({ children, style }: { children: ReactNode; to?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}

/** An expanding, fading ring (radar / "live" feel). */
export function Ring(_: { size: number; color: string; delay?: number }) {
  return null;
}

/** Drifts sideways forever (clouds). */
export function Drift({ children, style }: { children: ReactNode; distance?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}

/** Twinkling sparkle dot. */
export function Twinkle({ size = 8, color = '#FFD36B', style }: { size?: number; color?: string; delay?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ width: size, height: size, borderRadius: 2, backgroundColor: color, opacity: 0.7, transform: [{ rotate: '45deg' }] }, style]} />;
}

/** Confetti burst for wins and successful payments. Plays once. */
export function Confetti({ count = 12, colors = ['#FFD36B', '#FF7D95', '#2FD6BF', '#8A76FF', '#FFFFFF'] }: { count?: number; colors?: string[] }) {
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
