import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, type NoteBlock } from '@eg/api';
import { useLocalSearchParams } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { RichText } from '@/rich';
import { C, shadow } from '@/theme';
import { Card, Chip, ErrorBox, Row, Screen, ScreenHeader, Skeleton, T } from '@/ui';

function Block({ b, k }: { b: NoteBlock; k: number }) {
  if (b.t === 'h') return <RichText text={b.x} style={{ fontSize: 17 * k, fontWeight: '800', color: C.ink, marginTop: 14, marginBottom: 4 }} />;
  if (b.t === 'li')
    return (
      <Row gap={10} style={{ alignItems: 'flex-start', marginVertical: 3 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary, marginTop: 10 }} />
        <View style={{ flex: 1 }}><RichText text={b.x} style={{ fontSize: 16 * k, lineHeight: 25 * k, color: C.ink2 }} /></View>
      </Row>
    );
  return <RichText text={b.x} style={{ fontSize: 16 * k, lineHeight: 26 * k, color: C.ink2, marginVertical: 5 }} />;
}

export default function NoteReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, b, lang, num } = useI18n();
  const { api } = useAuth();
  const qc = useQueryClient();
  const [big, setBig] = useState(false);
  const q = useQuery({ queryKey: ['note', id], queryFn: () => api.noteDetail(id) });
  const like = useMutation({
    mutationFn: (to: boolean) => (to ? api.likeNote(id) : api.unlikeNote(id)),
    onSuccess: (r) => {
      qc.setQueryData(['note', id], (old: typeof q.data) => (old ? { ...old, liked: r.liked, likes: r.likes } : old));
      void qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
  const n = q.data;
  const locked = q.error instanceof ApiError && q.error.code === 'PAYMENT_REQUIRED';
  return (
    <Screen header={<ScreenHeader title={n ? b(n.titleEn, n.titleHi) : t('app.learn.notes')} />} bottomPad={24} footer={n ? (
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Pressable onPress={() => like.mutate(!n.liked)} accessibilityRole="button" accessibilityLabel={n.liked ? t('app.notes.liked') : t('app.notes.like')} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}>
            <Row gap={8} style={{ backgroundColor: n.liked ? C.pink : C.white, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 99, ...shadow.lift }}>
              <Heart size={20} color={n.liked ? C.white : C.pink} fill={n.liked ? C.white : 'transparent'} />
              <T v="h3" color={n.liked ? C.white : C.ink}>{n.liked ? t('app.notes.liked') : t('app.notes.like')} · {num(n.likes ?? 0)}</T>
            </Row>
          </Pressable>
        </View>
      ) : null}>
      {q.isLoading ? <><Skeleton h={120} /><Skeleton h={200} /></> : locked ? (
        <Card><T v="body" center>{t('app.notes.locked')}</T></Card>
      ) : q.isError || !n ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : (
        <>
          <Row gap={8} style={{ marginBottom: 6 }}>
            <Chip label={big ? 'A−' : 'A+'} onPress={() => setBig((v) => !v)} />
          </Row>
          {n.sections.map((s) => {
            const body = (lang === 'hi' ? s.hi ?? s.en : s.en ?? s.hi) ?? null;
            if (!body) return null;
            return (
              <Card key={s.anchor} style={{ marginBottom: 12 }}>
                <T v="h2" style={{ marginBottom: 6, color: C.primaryDark }}>{body.title}</T>
                <View>
                  {body.blocks.map((blk, i) => (
                    <Block key={i} b={blk} k={big ? 1.18 : 1} />
                  ))}
                </View>
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}
