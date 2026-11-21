import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, ChevronDown, ChevronUp, Lightbulb, Send, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, TextInput, View } from 'react-native';
import { ApiError } from '@eg/api';
import { Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C } from '@/theme';
import { Button, Card, Row, Screen, ScreenHeader, T } from '@/ui';

export default function NewDoubt() {
  const { t, b } = useI18n();
  const { api } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; key: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(text.trim()), 600);
    return () => clearTimeout(id);
  }, [text]);
  const similar = useQuery({ queryKey: ['similar', debounced], queryFn: () => api.similarFaqs(debounced), enabled: debounced.length >= 8 });

  const attach = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    setUploading(true);
    try {
      const post = await api.doubtUpload({ purpose: 'doubt-image', contentType: 'image/jpeg' });
      const form = new FormData();
      for (const [k, v] of Object.entries(post.fields)) form.append(k, v);
      // the file must be the last field of the signed form
      form.append('file', { uri: a.uri, name: 'doubt.jpg', type: 'image/jpeg' } as unknown as Blob);
      const res = await fetch(post.url, { method: 'POST', body: form });
      if (!res.ok) throw new Error('upload');
      setPhoto({ uri: a.uri, key: post.key });
    } catch {
      Alert.alert(t('doubts.attachment.failed'));
    } finally {
      setUploading(false);
    }
  };

  const send = useMutation({
    mutationFn: () => api.createDoubt({ contextType: 'free', text: text.trim(), attachmentKeys: photo ? [photo.key] : undefined }),
    onSuccess: (d) => {
      void qc.invalidateQueries({ queryKey: ['doubts'] });
      void qc.invalidateQueries({ queryKey: ['doubt-quota'] });
      router.replace(`/doubts/${d.id}`);
    },
    onError: (e) => Alert.alert(e instanceof ApiError ? e.message : t('app.error')),
  });

  return (
    <Screen header={<ScreenHeader title={t('doubts.new')} />} bottomPad={40}>
      <Reveal>
        <Card style={{ gap: 10 }}>
          <T v="label">{t('doubts.text')}</T>
          <TextInput value={text} onChangeText={setText} multiline textAlignVertical="top" placeholder={t('doubts.text.hint')} placeholderTextColor={C.faint} maxLength={2000} style={{ minHeight: 130, fontSize: 16, lineHeight: 24, color: C.ink }} />
          {photo ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Image source={{ uri: photo.uri }} style={{ width: 110, height: 110, borderRadius: 16 }} />
              <Pressable onPress={() => setPhoto(null)} accessibilityRole="button" accessibilityLabel={t('doubts.attachment.remove')} style={{ position: 'absolute', top: -8, right: -8, width: 26, height: 26, borderRadius: 13, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color={C.white} />
              </Pressable>
            </View>
          ) : null}
          <Row gap={10}>
            <Button title={uploading ? t('doubts.attachment.uploading') : t('doubts.photo')} icon={Camera} variant="soft" small onPress={() => void attach()} loading={uploading} />
          </Row>
        </Card>
      </Reveal>

      {(similar.data?.length ?? 0) > 0 ? (
        <Reveal delay={80} style={{ marginTop: 14 }}>
          <Card style={{ gap: 8, backgroundColor: C.primarySofter }}>
            <Row gap={8}><Lightbulb size={18} color={C.gold} /><T v="h3" style={{ fontSize: 14 }}>{t('doubts.similar')}</T></Row>
            {similar.data!.map((f) => (
              <Pressable key={f.id} onPress={() => setOpen(open === f.id ? null : f.id)} accessibilityRole="button">
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="h3" style={{ fontSize: 14, flex: 1 }}>{b(f.qEn, f.qHi)}</T>
                  {open === f.id ? <ChevronUp size={18} color={C.muted} /> : <ChevronDown size={18} color={C.muted} />}
                </Row>
                {open === f.id ? <T v="body" style={{ fontSize: 14, marginTop: 4 }}>{b(f.aEn, f.aHi)}</T> : null}
              </Pressable>
            ))}
          </Card>
        </Reveal>
      ) : null}

      <View style={{ marginTop: 18 }}>
        <Button title={t('doubts.send')} icon={Send} loading={send.isPending} disabled={text.trim().length < 5 || uploading} onPress={() => send.mutate()} />
      </View>
    </Screen>
  );
}
