import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Send, Star } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@eg/api';
import { Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C, shadow } from '@/theme';
import { Badge, Button, ErrorBox, Loading, Row, ScreenHeader, T } from '@/ui';

export default function DoubtThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, date } = useI18n();
  const { api } = useAuth();
  const qc = useQueryClient();
  const scroll = useRef<ScrollViewInstance>(null);
  const [reply, setReply] = useState('');
  const q = useQuery({ queryKey: ['doubt', id], queryFn: () => api.doubt(id), refetchInterval: 20_000 });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['doubt', id] });
    void qc.invalidateQueries({ queryKey: ['doubts'] });
  };
  const send = useMutation({
    mutationFn: () => api.replyDoubt(id, { text: reply.trim() }),
    onSuccess: (d) => {
      setReply('');
      qc.setQueryData(['doubt', id], d);
      refresh();
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (e) => Alert.alert(e instanceof ApiError ? e.message : t('app.error')),
  });
  const rate = useMutation({ mutationFn: (n: number) => api.rateDoubt(id, n), onSuccess: () => { Alert.alert(t('doubts.rated')); refresh(); } });
  const close = useMutation({ mutationFn: () => api.closeDoubt(id), onSuccess: refresh });
  const d = q.data;
  if (q.isLoading) return <Loading />;
  if (q.isError || !d) return <SafeAreaView style={{ flex: 1, padding: 16 }}><ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /></SafeAreaView>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title={t('doubts.title')} right={<Badge text={t(`doubts.status.${d.status}` as 'doubts.status.open')} tone={d.status === 'answered' ? 'mint' : d.status === 'open' ? 'gold' : 'gray'} />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 12 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
          {d.status === 'open' ? <T v="small" center>{t('doubts.sla', { time: date(d.slaDueAt) })}</T> : null}
          {d.messages.map((m, i) => {
            const mine = m.from === 'student';
            return (
              <Reveal key={m.id} delay={Math.min(i, 6) * 50} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                <View style={{ maxWidth: '86%', backgroundColor: mine ? C.primary : C.white, borderRadius: 20, borderBottomRightRadius: mine ? 6 : 20, borderBottomLeftRadius: mine ? 20 : 6, padding: 12, gap: 6, ...(mine ? {} : shadow.card) }}>
                  <T v="label" color={mine ? 'rgba(255,255,255,0.8)' : C.primary}>{mine ? t('doubts.you') : t('doubts.teacher')}</T>
                  <T v="body" color={mine ? C.white : C.ink}>{m.text}</T>
                  {m.attachments.map((a) => (a.url ? <Image key={a.key} source={{ uri: a.url }} style={{ width: 200, height: 160, borderRadius: 12 }} resizeMode="cover" /> : null))}
                  <T v="small" color={mine ? 'rgba(255,255,255,0.7)' : C.muted}>{date(m.createdAt)}</T>
                </View>
              </Reveal>
            );
          })}
          {d.status === 'answered' && !d.rating ? (
            <View style={{ alignItems: 'center', gap: 6, marginTop: 8 }}>
              <T v="h3">{t('doubts.rate')}</T>
              <Row gap={6}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => rate.mutate(n)} accessibilityRole="button" accessibilityLabel={`${n}`} hitSlop={6}>
                    <Star size={34} color={C.gold} />
                  </Pressable>
                ))}
              </Row>
            </View>
          ) : null}
          {d.status !== 'closed' && d.status === 'answered' ? <Button title={t('doubts.close')} variant="ghost" small onPress={() => close.mutate()} style={{ alignSelf: 'center' }} /> : null}
        </ScrollView>
        {d.status !== 'closed' ? (
          <View style={{ backgroundColor: C.white, padding: 10, ...shadow.lift }}>
            {d.status === 'answered' ? <T v="small" center style={{ marginBottom: 4 }}>{t('doubts.reopen.hint')}</T> : null}
            <Row gap={8}>
              <TextInput value={reply} onChangeText={setReply} multiline placeholder={t('doubts.reply')} placeholderTextColor={C.faint} style={{ flex: 1, maxHeight: 110, minHeight: 44, backgroundColor: C.bg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: C.ink }} />
              <Pressable onPress={() => reply.trim() && send.mutate()} accessibilityRole="button" accessibilityLabel={t('doubts.reply.send')} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: reply.trim() ? C.primary : C.faint, alignItems: 'center', justifyContent: 'center' }}>
                <Send size={20} color={C.white} />
              </Pressable>
            </Row>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
