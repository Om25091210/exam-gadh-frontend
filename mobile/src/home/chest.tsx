import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Confetti, Pop, Ring, useCountUp } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Button } from '@/ui';

/** The once-a-day chest. The reward is rolled by the server; the animation only reveals it. */
export function ChestModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, num } = useI18n();
  const { api } = useAuth();
  const qc = useQueryClient();
  const [points, setPoints] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const shake = useSharedValue(0);
  const lid = useSharedValue(0);
  const glow = useSharedValue(0);
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!visible) return;
    setPoints(null);
    setFailed(false);
    lid.value = 0;
    glow.value = 0;
    scale.value = 1;
    shake.value = withRepeat(withSequence(withTiming(-5, { duration: 110 }), withTiming(5, { duration: 110 }), withTiming(-4, { duration: 110 }), withTiming(0, { duration: 110 }), withDelay(1100, withTiming(0, { duration: 1 }))), -1, false);
  }, [visible, shake, lid, glow, scale]);

  const open = useMutation({
    mutationFn: () => api.openChest(),
    onSuccess: (r) => {
      shake.value = 0;
      scale.value = withSequence(withTiming(1.12, { duration: 160 }), withSpring(1, { damping: 8 }));
      lid.value = withDelay(140, withSpring(1, { damping: 9, stiffness: 120 }));
      glow.value = withDelay(220, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      setTimeout(() => setPoints(r.points), 450);
      void qc.invalidateQueries({ queryKey: ['chest'] });
      void qc.invalidateQueries({ queryKey: ['battle-me'] });
    },
    onError: () => setFailed(true),
  });

  const body = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value}deg` }, { scale: scale.value }] }));
  const lidStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lid.value * 64 }, { rotate: `${-lid.value * 28}deg` }, { translateX: -lid.value * 18 }], opacity: 1 - lid.value * 0.35 }));
  const light = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.4 + glow.value * 1.1 }] }));
  const shown = useCountUp(points ?? 0, 800);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(20,12,70,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {points !== null ? <Confetti count={points >= 25 ? 46 : 28} /> : null}
        <Text style={{ color: C.white, fontSize: 24, fontWeight: '800', marginBottom: 28 }}>{points === null ? t('chest.title') : points >= 25 ? t('chest.big') : t('chest.title')}</Text>

        <Pressable onPress={() => !open.isPending && points === null && open.mutate()} accessibilityRole="button" accessibilityLabel={t('chest.tap')} style={{ width: 230, height: 230, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,211,107,0.22)', borderWidth: 2, borderColor: 'rgba(255,211,107,0.5)' }, light]} />
          {points === null ? <Ring size={170} color="#FFD36B" /> : null}
          <Animated.View style={body}>
            <View style={{ width: 150, alignItems: 'center' }}>
              <Animated.View style={[{ zIndex: 2 }, lidStyle]}>
                <LinearGradient colors={['#FF9A7A', '#E5486C']} style={{ width: 160, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...shadow.card }}>
                  <View style={{ position: 'absolute', width: 26, height: 44, backgroundColor: '#FFD36B' }} />
                  <View style={{ position: 'absolute', top: -16, flexDirection: 'row', gap: 2 }}>
                    <View style={{ width: 30, height: 26, borderRadius: 15, backgroundColor: '#FFD36B', transform: [{ rotate: '-24deg' }] }} />
                    <View style={{ width: 30, height: 26, borderRadius: 15, backgroundColor: '#FFC14D', transform: [{ rotate: '24deg' }] }} />
                  </View>
                </LinearGradient>
              </Animated.View>
              <LinearGradient colors={['#FF7D95', '#C2305A']} style={{ width: 144, height: 112, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginTop: -2, alignItems: 'center', ...shadow.lift }}>
                <View style={{ width: 26, height: 112, backgroundColor: '#FFD36B' }} />
              </LinearGradient>
            </View>
          </Animated.View>
          {points !== null ? (
            <Pop delay={300} style={{ position: 'absolute', top: 30 }}>
              <Sparkles size={40} color="#FFD36B" />
            </Pop>
          ) : null}
        </Pressable>

        <View style={{ minHeight: 90, alignItems: 'center', marginTop: 18 }}>
          {points === null ? (
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 17, fontWeight: '700' }}>{failed ? t('chest.error') : open.isPending ? '…' : t('chest.tap')}</Text>
          ) : (
            <Pop delay={450}>
              <Text style={{ color: '#FFD36B', fontSize: 40, fontWeight: '800' }}>{t('chest.won', { n: num(shown) })}</Text>
            </Pop>
          )}
        </View>
        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          <Button title={points === null ? t('app.close') : t('chest.done')} variant={points === null ? 'ghost' : 'accent'} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
