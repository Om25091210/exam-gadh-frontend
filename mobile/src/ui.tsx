import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Loader, type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, shadow, TONES, type Tone } from './theme';

// ---------------------------------------------------------------- text
type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'muted' | 'label';
const TEXT: Record<Variant, TextStyle> = {
  h1: { fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.4 },
  h2: { fontSize: 19, fontWeight: '800', color: C.ink },
  h3: { fontSize: 16, fontWeight: '700', color: C.ink },
  body: { fontSize: 15, lineHeight: 23, color: C.ink2 },
  small: { fontSize: 13, color: C.muted },
  muted: { fontSize: 14, color: C.muted },
  label: { fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.4 },
};
export function T({ v = 'body', style, children, numberOfLines, color, center }: { v?: Variant; style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number; color?: string; center?: boolean }) {
  return (
    <Text numberOfLines={numberOfLines} style={[TEXT[v], color ? { color } : null, center ? { textAlign: 'center' } : null, style]}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------- layout
export function Screen({ children, scroll = true, refreshing, onRefresh, padded = true, bottomPad = 24, header, footer }: { children: ReactNode; scroll?: boolean; refreshing?: boolean; onRefresh?: () => void; padded?: boolean; bottomPad?: number; header?: ReactNode; footer?: ReactNode }) {
  const content = padded ? { paddingHorizontal: 16, paddingBottom: bottomPad } : { paddingBottom: bottomPad };
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={content} showsVerticalScrollIndicator={false} refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} /> : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function ScreenHeader({ title, subtitle, back = true, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  return (
    <View style={s.header}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={C.ink} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <T v="h2" numberOfLines={1}>{title}</T>
        {subtitle ? <T v="small" numberOfLines={1}>{subtitle}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <View style={s.sectionHead}>
        <T v="h2">{title}</T>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const body = <View style={[s.card, style]}>{children}</View>;
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

// ---------------------------------------------------------------- buttons
type BtnVariant = 'primary' | 'soft' | 'ghost' | 'danger' | 'accent' | 'white';
export function Button({ title, onPress, variant = 'primary', loading, disabled, icon: Icon, small, style }: { title: string; onPress?: () => void; variant?: BtnVariant; loading?: boolean; disabled?: boolean; icon?: LucideIcon; small?: boolean; style?: StyleProp<ViewStyle> }) {
  const off = disabled || loading;
  const grad: Record<BtnVariant, [string, string] | null> = { primary: ['#6C55F5', '#4A2FD1'], accent: ['#FF9A7A', '#FF7A59'], danger: ['#EF4444', '#B91C1C'], soft: null, ghost: null, white: null };
  const fg = variant === 'primary' || variant === 'danger' ? C.white : variant === 'accent' ? C.ink : variant === 'white' ? C.primary : variant === 'ghost' ? C.ink2 : C.primaryDark;
  const bg = variant === 'soft' ? C.primarySoft : variant === 'white' ? C.white : undefined;
  const inner = (
    <View style={[s.btnInner, small && { minHeight: 40, paddingHorizontal: 14 }]}>
      {loading ? <ActivityIndicator size="small" color={fg} /> : Icon ? <Icon size={small ? 16 : 18} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '800', fontSize: small ? 14 : 16 }}>{title}</Text>
    </View>
  );
  return (
    <Pressable onPress={off ? undefined : onPress} accessibilityRole="button" accessibilityState={{ disabled: !!off }} style={({ pressed }) => [{ opacity: off ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      {grad[variant] ? (
        <LinearGradient colors={grad[variant]!} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[s.btn, variant === 'primary' && shadow.card]}>
          {inner}
        </LinearGradient>
      ) : (
        <View style={[s.btn, { backgroundColor: bg }, variant === 'white' && shadow.card]}>{inner}</View>
      )}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }} style={[s.chip, active ? { backgroundColor: C.primary, borderColor: C.primary } : null]}>
      <Text style={{ color: active ? C.white : C.ink2, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------- visuals
/** Pastel tile with a glossy glyph and confetti: the app's illustration style. */
export function Sticker({ icon: Icon, tone = 'indigo', size = 64 }: { icon: LucideIcon; tone?: Tone; size?: number }) {
  const [bg, from, to] = TONES[tone];
  const g = size * 0.58;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ position: 'absolute', right: -size * 0.1, top: -size * 0.1, width: size * 0.45, height: size * 0.45, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.55)' }} />
      <View style={{ position: 'absolute', left: size * 0.13, top: size * 0.18, width: size * 0.1, height: size * 0.1, borderRadius: 99, backgroundColor: to, opacity: 0.45 }} />
      <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: g, height: g, borderRadius: g * 0.32, alignItems: 'center', justifyContent: 'center', shadowColor: to, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 5 }}>
        <Icon size={g * 0.52} color={C.white} strokeWidth={2.4} />
      </LinearGradient>
    </View>
  );
}

export function StatTile({ icon: Icon, value, label, colors }: { icon: LucideIcon; value: string; label: string; colors: [string, string] }) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.stat, shadow.card]}>
      <Icon size={20} color="rgba(255,255,255,0.92)" />
      <Text style={{ color: C.white, fontSize: 28, fontWeight: '800', marginTop: 8 }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>{label}</Text>
    </LinearGradient>
  );
}

export function Hero({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ borderRadius: 28, padding: 20, overflow: 'hidden' }, shadow.lift, style]}>
      <View style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <View style={{ position: 'absolute', right: 40, bottom: -50, width: 110, height: 110, borderRadius: 99, backgroundColor: 'rgba(47,214,191,0.22)' }} />
      {children}
    </LinearGradient>
  );
}

export function ProgressBar({ value, max = 100, tone = C.primary }: { value: number; max?: number; tone?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <View style={{ height: 8, borderRadius: 99, backgroundColor: C.primarySoft, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 99, backgroundColor: tone }} />
    </View>
  );
}

export function Badge({ text, tone = 'indigo' }: { text: string; tone?: 'indigo' | 'mint' | 'pink' | 'gold' | 'gray' | 'red' }) {
  const m = { indigo: [C.primarySoft, C.primaryDark], mint: [C.mintSoft, C.mintDark], pink: [C.pinkSoft, C.pinkDark], gold: [C.goldSoft, '#8A5A00'], gray: ['#ECEDF5', C.muted], red: [C.dangerSoft, C.danger] }[tone];
  return (
    <View style={{ backgroundColor: m[0], paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' }}>
      <Text style={{ color: m[1], fontSize: 11, fontWeight: '800' }}>{text}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
}

export function Skeleton({ h = 80, style }: { h?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: h, borderRadius: R.card, backgroundColor: '#E2E5F4', marginTop: 12 }, style]} />;
}

export function ErrorBox({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel: string }) {
  return (
    <Card style={{ alignItems: 'center', marginTop: 16 }}>
      <Loader size={26} color={C.pink} />
      <T v="body" center style={{ marginVertical: 8 }}>{message}</T>
      {onRetry ? <Button title={retryLabel} variant="soft" small onPress={onRetry} /> : null}
    </Card>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36 }}>
      <T v="muted" center>{text}</T>
    </View>
  );
}

export function Row({ children, style, gap = 12 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/** Bottom bar spacing for screens with the floating tab bar. */
export function useTabPad() {
  const i = useSafeAreaInsets();
  return 96 + i.bottom;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  card: { backgroundColor: C.white, borderRadius: R.card, padding: 16, ...shadow.card },
  btn: { borderRadius: 16, overflow: 'hidden' },
  btnInner: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  stat: { flex: 1, borderRadius: 22, padding: 14 },
});
