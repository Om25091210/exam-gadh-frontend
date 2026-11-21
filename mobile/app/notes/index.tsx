import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Heart, Lock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C } from '@/theme';
import { Badge, Card, Chip, Empty, ErrorBox, Row, Screen, ScreenHeader, Skeleton, Sticker, T } from '@/ui';
import { NotebookPen } from 'lucide-react-native';

export default function NotesList() {
  const { t, b, num } = useI18n();
  const { api } = useAuth();
  const [subject, setSubject] = useState<string | null>(null);
  const notes = useQuery({ queryKey: ['notes'], queryFn: () => api.notesList() });
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: () => api.subjects(), staleTime: 10 * 60_000 });
  const nameOf = (code: string) => {
    const s = subjects.data?.find((x) => x.code === code);
    return s ? b(s.nameEn, s.nameHi) : code;
  };
  const codes = useMemo(() => Array.from(new Set((notes.data ?? []).map((n) => n.subjectCode))), [notes.data]);
  const items = (notes.data ?? []).filter((n) => !subject || n.subjectCode === subject);
  return (
    <Screen refreshing={notes.isRefetching} onRefresh={() => void notes.refetch()} header={<ScreenHeader title={t('app.learn.notes')} subtitle={t('app.learn.notes.sub')} />}>
      {codes.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
          <Chip label={t('app.notes.allSubjects')} active={subject === null} onPress={() => setSubject(null)} />
          {codes.map((c) => (
            <Chip key={c} label={nameOf(c)} active={subject === c} onPress={() => setSubject(c)} />
          ))}
        </ScrollView>
      ) : null}
      {notes.isLoading ? <><Skeleton /><Skeleton /></> : notes.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void notes.refetch()} /> : items.length === 0 ? <Empty text={t('app.notes.empty')} /> : items.map((n, i) => (
        <Reveal key={n.id} delay={Math.min(i, 8) * 45}>
        <Card style={{ marginBottom: 10 }} onPress={() => router.push(`/notes/${n.id}`)}>
          <Row>
            <Sticker icon={n.locked ? Lock : NotebookPen} tone={n.locked ? 'gold' : 'mint'} size={54} />
            <View style={{ flex: 1, gap: 4 }}>
              <T v="h3" numberOfLines={2}>{b(n.titleEn, n.titleHi)}</T>
              <T v="small">{nameOf(n.subjectCode)} · {t('app.notes.read', { n: n.readMinutes })}</T>
              <Row gap={8}>
                <Row gap={4}>
                  <Heart size={14} color={n.liked ? C.pink : C.faint} fill={n.liked ? C.pink : 'transparent'} />
                  <T v="small">{num(n.likes ?? 0)}</T>
                </Row>
                {n.access === 'paid' ? <Badge text={t('app.paid')} tone="gold" /> : null}
              </Row>
            </View>
          </Row>
        </Card>
        </Reveal>
      ))}
    </Screen>
  );
}
