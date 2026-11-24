import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Crown, Landmark, Lock, Map, Mountain, Palette, Scale, Users, TrendingUp, Compass, Dumbbell, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, shadow, type Tone } from '@/theme';
import { Empty, ErrorBox, ProgressBar, Row, Screen, ScreenHeader, Skeleton, Sticker, T } from '@/ui';

const ICONS: LucideIcon[] = [Compass, Mountain, Landmark, Users, Palette, Scale, TrendingUp, Map, Dumbbell];
const TONE: Tone[] = ['indigo', 'mint', 'peach', 'sky', 'pink', 'lilac', 'gold'];

export default function NotesHome() {
  const { t, b, num } = useI18n();
  const { api } = useAuth();
  const lib = useQuery({ queryKey: ['note-library'], queryFn: () => api.noteLibrary() });
  const subjects = lib.data?.subjects ?? [];
  const total = subjects.reduce((n, s) => n + s.topics.length, 0);
  const done = subjects.reduce((n, s) => n + s.completedCount, 0);
  return (
    <Screen refreshing={lib.isRefetching} onRefresh={() => void lib.refetch()} header={<ScreenHeader title={t('app.learn.notes')} subtitle={t('app.learn.notes.sub')} />}>
      {lib.isLoading ? <><Skeleton h={110} /><Skeleton h={110} /></> : lib.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void lib.refetch()} /> : subjects.length === 0 ? <Empty text={t('app.notes.empty')} /> : (
        <>
          {subjects.map((s, i) => {
            const Icon = ICONS[i % ICONS.length] ?? BookOpen;
            return (
              <View key={s.code} style={{ marginBottom: 12 }}>
                <Pressable onPress={() => router.push(`/notes/s/${s.code}`)} accessibilityRole="button" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }], backgroundColor: C.white, borderRadius: 24, padding: 14, ...shadow.card })}>
                  <Row>
                    <Sticker icon={Icon} tone={TONE[i % TONE.length]} size={58} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <T v="h3" numberOfLines={2}>{b(s.nameEn, s.nameHi)}</T>
                      <T v="small">{t('app.notes.topicsCount', { n: num(s.topics.length) })} · {t('app.notes.progress', { a: num(s.completedCount), b: num(s.topics.length) })}</T>
                      <ProgressBar value={s.completedCount} max={Math.max(s.topics.length, 1)} tone={C.mint} />
                    </View>
                  </Row>
                </Pressable>
              </View>
            );
          })}
        </>
      )}
    </Screen>
  );
}
