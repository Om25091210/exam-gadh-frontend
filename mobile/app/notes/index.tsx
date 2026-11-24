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
          <Reveal>
            <LinearGradient colors={['#7B63FF', '#4A2FD1', '#2B1C86']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 18, marginBottom: 16, ...shadow.lift }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>{t('app.notes.progress', { a: num(done), b: num(total) }).toUpperCase()}</Text>
                  <Text style={{ color: C.white, fontSize: 22, fontWeight: '800' }}>{t('app.notes.subtopics', { n: num(subjects.reduce((n, s) => n + s.topics.reduce((m, x) => m + x.sectionCount, 0), 0)) })}</Text>
                  <View style={{ marginTop: 6 }}><ProgressBar value={done} max={Math.max(total, 1)} tone="#2FD6BF" /></View>
                </View>
                {lib.data?.premium ? <Crown size={34} color="#FFD36B" /> : <Lock size={30} color="rgba(255,255,255,0.8)" />}
              </Row>
            </LinearGradient>
          </Reveal>
          {subjects.map((s, i) => {
            const Icon = ICONS[i % ICONS.length] ?? BookOpen;
            return (
              <Reveal key={s.code} delay={Math.min(i, 8) * 50} style={{ marginBottom: 12 }}>
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
              </Reveal>
            );
          })}
        </>
      )}
    </Screen>
  );
}
