import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronRight, Lock } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Empty, ErrorBox, ProgressBar, Row, Screen, ScreenHeader, Skeleton, T } from '@/ui';

export default function SubjectTopics() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { t, b, num } = useI18n();
  const { api } = useAuth();
  const lib = useQuery({ queryKey: ['note-library'], queryFn: () => api.noteLibrary() });
  const subject = lib.data?.subjects.find((s) => s.code === code);
  const premium = !!lib.data?.premium;
  return (
    <Screen refreshing={lib.isRefetching} onRefresh={() => void lib.refetch()} header={<ScreenHeader title={subject ? b(subject.nameEn, subject.nameHi) : t('app.learn.notes')} subtitle={subject ? t('app.notes.progress', { a: num(subject.completedCount), b: num(subject.topics.length) }) : undefined} />}>
      {lib.isLoading ? <><Skeleton h={78} /><Skeleton h={78} /></> : lib.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void lib.refetch()} /> : !subject ? <Empty text={t('app.notes.empty')} /> : (
        <>
          <View style={{ marginBottom: 14 }}><ProgressBar value={subject.completedCount} max={Math.max(subject.topics.length, 1)} tone={C.mint} /></View>
          {subject.topics.map((n, i) => (
            <View key={n.id}>
              {n.part && n.part !== subject.topics[i - 1]?.part ? <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: C.primaryDark, marginTop: i ? 14 : 0, marginBottom: 8 }}>{n.part.toUpperCase()}</Text> : null}
              <Pressable onPress={() => router.push(`/notes/${n.id}`)} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, backgroundColor: C.white, borderRadius: 20, padding: 14, marginBottom: 10, ...shadow.card })}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: n.completed ? C.mint : C.primarySoft }}>
                    {n.completed ? <Check size={19} color={C.white} /> : <Text style={{ fontWeight: '800', color: C.primaryDark }}>{num(i + 1)}</Text>}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <T v="h3" numberOfLines={3}>{b(n.titleEn, n.titleHi)}</T>
                    {n.blurb ? <T v="small" numberOfLines={2}>{n.blurb}</T> : null}
                    <T v="small" color={C.primary}>{t('app.notes.subtopics', { n: num(n.sectionCount) })} · {t('app.notes.read', { n: num(n.readMinutes) })}</T>
                  </View>
                  {n.access === 'paid' && !premium ? <Lock size={15} color={C.faint} /> : null}
                  <ChevronRight size={20} color={C.faint} />
                </Row>
              </Pressable>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
