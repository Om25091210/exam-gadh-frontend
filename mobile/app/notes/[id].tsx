import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NoteBlock, NoteDetail, NoteSection } from '@eg/api';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, ArrowUp, Bookmark, Check, Crown, Heart, Lock, Search, X } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, type ScrollViewInstance, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pop, Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { RichText, stripMarks } from '@/rich';
import { C, shadow } from '@/theme';
import { ErrorBox, Row, Skeleton, T } from '@/ui';

const SIZES = [1, 1.15, 1.3] as const;

// ---------------------------------------------------------------- blocks
function Table({ head, rows, k }: { head?: string[] | null; rows: string[][]; k: number }) {
  const cols = Math.max(head?.length ?? 0, ...rows.map((r) => r.length));
  const w = cols <= 2 ? 190 : cols === 3 ? 160 : 140;
  const cell = (txt: string, i: number, header: boolean, zebra: boolean) => (
    <View key={i} style={{ width: w * k > 260 ? 260 : w * k, padding: 10, backgroundColor: header ? C.primary : zebra ? C.primarySofter : C.white, borderRightWidth: 1, borderColor: C.line }}>
      <RichText text={txt} style={{ fontSize: 13.5 * k, lineHeight: 20 * k, color: header ? C.white : C.ink2, fontWeight: header ? '800' : '400' }} />
    </View>
  );
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: C.line, backgroundColor: C.white }}>
      <View>
        {head ? <View style={{ flexDirection: 'row' }}>{Array.from({ length: cols }, (_, i) => cell(head[i] ?? '', i, true, false))}</View> : null}
        {rows.map((r, ri) => (
          <View key={ri} style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: C.line }}>
            {Array.from({ length: cols }, (_, i) => cell(r[i] ?? '', i, false, ri % 2 === 1))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Picture({ b }: { b: Extract<NoteBlock, { t: 'img' }> }) {
  if (!b.u) return null;
  return <Image source={{ uri: b.u }} accessibilityLabel={b.a || undefined} resizeMode="contain" style={{ width: '100%', aspectRatio: b.w && b.h ? b.w / b.h : 1.5, marginVertical: 8, borderRadius: 12 }} />;
}

function Block({ b, k }: { b: NoteBlock; k: number }) {
  switch (b.t) {
    case 'h':
    case 'h3':
      return <RichText text={b.x} style={{ fontSize: 17 * k, lineHeight: 24 * k, fontWeight: '800', color: C.primaryDark, marginTop: 16, marginBottom: 4 }} />;
    case 'h4':
      return <RichText text={b.x} style={{ fontSize: 15.5 * k, fontWeight: '800', color: C.ink, marginTop: 10, marginBottom: 2 }} />;
    case 'li': {
      const lv = b.l ?? 0;
      return (
        <Row gap={10} style={{ alignItems: 'flex-start', marginVertical: 3, paddingLeft: lv * 18 }}>
          <View style={{ width: lv ? 6 : 7, height: lv ? 6 : 7, borderRadius: 4, marginTop: 10 * k, backgroundColor: lv ? C.mint : C.primary }} />
          <View style={{ flex: 1 }}><RichText text={b.x} style={{ fontSize: 16 * k, lineHeight: 25 * k, color: C.ink2 }} /></View>
        </Row>
      );
    }
    case 'callout':
      return (
        <View style={{ marginVertical: 10, borderRadius: 16, backgroundColor: C.goldSoft, borderLeftWidth: 5, borderLeftColor: C.gold, padding: 14, gap: 4 }}>
          {b.x.split('\n').map((ln, i) => <RichText key={i} text={ln} style={{ fontSize: 15 * k, lineHeight: 23 * k, color: C.ink }} />)}
        </View>
      );
    case 'table':
      return <Table head={b.head} rows={b.rows} k={k} />;
    case 'img':
      return <Picture b={b} />;
    default:
      return <RichText text={b.x} style={{ fontSize: 16 * k, lineHeight: 26 * k, color: C.ink2, marginVertical: 5 }} />;
  }
}

// ---------------------------------------------------------------- screen
export default function NoteReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, b, lang, num } = useI18n();
  const { api } = useAuth();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollViewInstance>(null);
  const ys = useRef<Record<string, number>>({});
  const indexBottom = useRef(0);
  const [sizeIx, setSizeIx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);
  const k = SIZES[sizeIx];

  const q = useQuery({ queryKey: ['note', id], queryFn: () => api.noteDetail(id), staleTime: 20 * 60_000 });
  const n = q.data;
  const refreshLists = () => { void qc.invalidateQueries({ queryKey: ['note-library'] }); void qc.invalidateQueries({ queryKey: ['notes'] }); };
  const like = useMutation({
    mutationFn: (to: boolean) => (to ? api.likeNote(id) : api.unlikeNote(id)),
    onSuccess: (r) => qc.setQueryData(['note', id], (old: NoteDetail | undefined) => (old ? { ...old, liked: r.liked, likes: r.likes } : old)),
  });
  const done = useMutation({
    mutationFn: (to: boolean) => api.markNoteRead(id, to),
    onSuccess: (r) => { qc.setQueryData(['note', id], (old: NoteDetail | undefined) => (old ? { ...old, completed: r.completed } : old)); refreshLists(); },
  });

  const body = (s: NoteSection) => (lang === 'hi' ? s.hi ?? s.en : s.en ?? s.hi) ?? { title: '', blocks: [] };
  const sections = useMemo(() => n?.sections ?? [], [n]);
  const firstLocked = sections.findIndex((s) => s.locked);

  const found = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    return sections
      .map((s) => {
        const bd = body(s);
        let c = 0;
        const hay = [bd.title, ...bd.blocks.map((x) => (x.t === 'table' ? [...(x.head ?? []), ...x.rows.flat()].join(' ') : x.t === 'img' ? '' : x.x))].map(stripMarks).join('\n').toLowerCase();
        for (let i = hay.indexOf(term); i >= 0; i = hay.indexOf(term, i + term.length)) c++;
        return { s, c, title: bd.title };
      })
      .filter((r) => r.c > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sections, lang]);

  const jump = useCallback((anchor: string) => {
    const y = ys.current[anchor];
    if (y != null) scroller.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    setSearching(false);
  }, []);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setShowTop(contentOffset.y > indexBottom.current + 60);
    setProgress(Math.min(1, contentOffset.y / Math.max(1, contentSize.height - layoutMeasurement.height)));
  };
  const lay = (anchor: string) => (e: LayoutChangeEvent) => { ys.current[anchor] = e.nativeEvent.layout.y; };

  const title = n ? b(n.titleEn, n.titleHi) : '';
  const subjectName = n ? b(n.subjectNameEn ?? '', n.subjectNameHi ?? '') : '';
  const locked = !!n?.locked && firstLocked >= 0;

  const header = (
    <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
      {searching ? (
        <Row gap={8}>
          <Pressable onPress={() => { setSearching(false); setQuery(''); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close search"><X size={22} color={C.ink} /></Pressable>
          <TextInput autoFocus value={query} onChangeText={setQuery} placeholder={t('app.notes.search')} placeholderTextColor={C.faint} style={{ flex: 1, fontSize: 16, color: C.ink, backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 }} />
        </Row>
      ) : (
        <Row gap={6}>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/notes'))} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={{ padding: 6 }}><ArrowLeft size={22} color={C.ink} /></Pressable>
          <View style={{ flex: 1 }}>
            <T v="h3" numberOfLines={1}>{title || t('app.learn.notes')}</T>
            {subjectName ? <T v="small" numberOfLines={1}>{subjectName}</T> : null}
          </View>
          <Pressable onPress={() => setSearching(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('app.notes.search')} style={{ padding: 8 }}><Search size={21} color={C.ink} /></Pressable>
          <Pressable onPress={() => n && like.mutate(!n.liked)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('app.notes.like')} style={{ padding: 8 }}>
            <Heart size={21} color={n?.liked ? C.pink : C.ink} fill={n?.liked ? C.pink : 'transparent'} />
          </Pressable>
          <Pressable onPress={() => setSizeIx((v) => (v + 1) % SIZES.length)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('app.notes.fontSize')} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: C.primarySoft }}>
            <Text style={{ fontWeight: '800', color: C.primaryDark, fontSize: 15 }}>Aa</Text>
          </Pressable>
        </Row>
      )}
      <View style={{ height: 3, borderRadius: 2, backgroundColor: C.primarySoft, marginTop: 8, overflow: 'hidden' }}><View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: C.mint }} /></View>
    </View>
  );

  const paywall = (
    <Pop>
      <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 20, marginVertical: 14, gap: 10, ...shadow.lift }}>
        <Row gap={10}><Crown size={26} color="#FFD36B" /><Text style={{ color: C.white, fontSize: 20, fontWeight: '800', flex: 1 }}>{t('app.notes.premium.title')}</Text></Row>
        <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14.5, lineHeight: 22 }}>{t('app.notes.premium.body', { n: num(sections.length) })}</Text>
        <Text style={{ color: '#7CFFE3', fontSize: 13, fontWeight: '700' }}>{t('app.notes.premium.more', { n: num(sections.length - firstLocked) })} · {t('app.notes.premium.hint')}</Text>
        <Pressable onPress={() => router.push('/plans')} accessibilityRole="button" style={({ pressed }) => ({ backgroundColor: C.white, borderRadius: 16, paddingVertical: 14, alignItems: 'center', transform: [{ scale: pressed ? 0.97 : 1 }] })}>
          <Text style={{ color: C.primaryDark, fontWeight: '800', fontSize: 16 }}>{t('app.notes.premium.cta')}</Text>
        </Pressable>
      </LinearGradient>
    </Pop>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      {header}
      {q.isLoading ? <View style={{ padding: 16 }}><Skeleton h={140} /><Skeleton h={220} /></View> : q.isError || !n ? <View style={{ padding: 16 }}><ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /></View> : (
        <>
          <ScrollView ref={scroller} onScroll={onScroll} scrollEventThrottle={64} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* title + index */}
            <Reveal>
              <LinearGradient colors={['#7B63FF', '#4A2FD1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 18, marginTop: 6, ...shadow.card }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{subjectName.toUpperCase()}</Text>
                <Text style={{ color: C.white, fontSize: 24, lineHeight: 30, fontWeight: '800', marginTop: 4 }}>{title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>{t('app.notes.subtopics', { n: num(sections.length) })}</Text>
              </LinearGradient>
            </Reveal>

            <View onLayout={(e) => { indexBottom.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height; }} style={{ backgroundColor: C.white, borderRadius: 22, padding: 16, marginTop: 14, ...shadow.card }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{searching && query.trim().length >= 2 ? t('app.notes.matches', { n: num(found.length) }) : t('app.notes.index')}</Text>
              <Text style={{ color: C.muted, fontSize: 12.5, marginBottom: 8 }}>{t('app.notes.indexSub')}</Text>
              {searching && query.trim().length >= 2 && found.length === 0 ? <T v="muted">{t('app.notes.noMatch')}</T> : null}
              {(searching && query.trim().length >= 2 ? found.map((f) => ({ s: f.s, extra: f.c })) : sections.map((s) => ({ s, extra: 0 }))).map(({ s, extra }, i) => (
                <Pressable key={s.anchor} onPress={() => (s.locked ? scroller.current?.scrollToEnd({ animated: true }) : jump(s.anchor))} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderColor: C.line, opacity: pressed ? 0.6 : 1 })}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: s.locked ? C.goldSoft : C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    {s.locked ? <Lock size={13} color="#8A5A00" /> : <Text style={{ fontSize: 12, fontWeight: '800', color: C.primaryDark }}>{num(i + 1)}</Text>}
                  </View>
                  <Text numberOfLines={2} style={{ flex: 1, fontSize: 14.5, color: s.locked ? C.muted : C.ink, fontWeight: '600' }}>{body(s).title}</Text>
                  {extra ? <Text style={{ fontSize: 12, fontWeight: '800', color: C.primary }}>{extra}×</Text> : null}
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 6 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.faint }} />
              <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: C.muted }}>{t('app.notes.start')}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.faint }} />
            </View>

            {sections.map((s, i) => {
              const bd = body(s);
              if (s.locked) return i === firstLocked ? <View key={s.anchor} onLayout={lay(s.anchor)}>{paywall}</View> : null;
              return (
                <View key={s.anchor} onLayout={lay(s.anchor)} style={{ backgroundColor: C.white, borderRadius: 22, padding: 16, marginTop: 12, ...shadow.card }}>
                  <Row gap={10} style={{ alignItems: 'flex-start', marginBottom: 6 }}>
                    <View style={{ width: 5, alignSelf: 'stretch', borderRadius: 3, backgroundColor: C.primary }} />
                    <Text style={{ flex: 1, fontSize: 19 * k, lineHeight: 26 * k, fontWeight: '800', color: C.ink }}>{bd.title}</Text>
                  </Row>
                  {bd.blocks.map((blk, bi) => <Block key={bi} b={blk} k={k} />)}
                </View>
              );
            })}

            {locked ? (
              <View style={{ marginTop: 6, gap: 8 }}>
                {sections.slice(firstLocked).map((s) => (
                  <Row key={s.anchor} gap={10} style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12 }}>
                    <Lock size={16} color={C.faint} />
                    <Text numberOfLines={2} style={{ flex: 1, color: C.muted, fontWeight: '600' }}>{body(s).title}</Text>
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#8A5A00' }}>{t('app.notes.premiumTag')}</Text>
                  </Row>
                ))}
              </View>
            ) : null}

            {!n.next && !locked ? <T v="muted" center style={{ marginTop: 20 }}>{t('app.notes.end')}</T> : null}
          </ScrollView>

          {showTop ? (
            <Pop style={{ position: 'absolute', alignSelf: 'center', bottom: 92 + insets.bottom }}>
              <Pressable onPress={() => scroller.current?.scrollTo({ y: 0, animated: true })} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.ink, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10, transform: [{ scale: pressed ? 0.96 : 1 }], ...shadow.lift })}>
                <ArrowUp size={16} color={C.white} />
                <Text style={{ color: C.white, fontWeight: '800', fontSize: 13.5 }}>{t('app.notes.backToIndex')}</Text>
              </Pressable>
            </Pop>
          ) : null}

          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 + insets.bottom, backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...shadow.lift }}>
            <Row gap={10}>
              <Pressable onPress={() => done.mutate(!n.completed)} accessibilityRole="button" style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: n.completed ? C.mintSoft : C.primarySoft, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                {n.completed ? <Check size={18} color={C.mintDark} /> : <Bookmark size={18} color={C.primaryDark} />}
                <Text style={{ fontWeight: '800', color: n.completed ? C.mintDark : C.primaryDark, fontSize: 14.5 }}>{n.completed ? t('app.notes.completed') : t('app.notes.markDone')}</Text>
              </Pressable>
              {n.next ? (
                <Pressable onPress={() => router.replace(`/notes/${n.next!.id}`)} accessibilityRole="button" style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                  <LinearGradient colors={['#6C55F5', '#4A2FD1']} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 }}>
                    <Text style={{ fontWeight: '800', color: C.white, fontSize: 14.5 }}>{t('app.notes.next')}</Text>
                    <ArrowRight size={18} color={C.white} />
                  </LinearGradient>
                </Pressable>
              ) : null}
            </Row>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
