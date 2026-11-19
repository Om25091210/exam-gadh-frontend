import { ApiError, type AttemptView, type SectionWindow } from '@eg/api';
import { compose, hasUnsaved, initState, reducer, startCounter, toSnapshot, type ExamState, type Snapshot } from '@eg/exam/exam-state';
import { countStatuses, paletteStatus, type PaletteStatus } from '@eg/exam/palette';
import { SaveQueue, type SaveStatus } from '@eg/exam/save-queue';
import { ServerClock } from '@eg/exam/server-clock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, CloudOff, Grid3x3, Languages, Timer, TriangleAlert } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Options, QuestionBody } from '@/question';
import { C, shadow } from '@/theme';
import { Button, ErrorBox, Loading, Row, T } from '@/ui';

const snapKey = (id: string) => `eg:snap:${id}`;
const store = {
  load: async (id: string): Promise<Snapshot | null> => {
    try {
      const raw = await AsyncStorage.getItem(snapKey(id));
      return raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
      return null;
    }
  },
  save: (s: Snapshot) => AsyncStorage.setItem(snapKey(s.attemptId), JSON.stringify(s)).catch(() => undefined),
  clear: (id: string) => AsyncStorage.removeItem(snapKey(id)).catch(() => undefined),
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clock = (sec: number) => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(x).padStart(2, '0')}`;
};

const PAL: Record<PaletteStatus, { bg: string; fg: string; border?: string }> = {
  notVisited: { bg: '#E7E8F3', fg: C.muted },
  notAnswered: { bg: C.danger, fg: C.white },
  answered: { bg: C.success, fg: C.white },
  marked: { bg: '#7C3AED', fg: C.white },
  answeredMarked: { bg: '#7C3AED', fg: C.white, border: C.success },
};

type Boot = { view: AttemptView; snap: Snapshot | null } | { error: unknown } | null;

export default function AttemptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const { t } = useI18n();
  const [boot, setBoot] = useState<Boot>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [view, snap] = await Promise.all([api.openAttempt(id), store.load(id)]);
        if (alive) setBoot({ view, snap });
      } catch (error) {
        if (alive) setBoot({ error });
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, id]);
  useEffect(() => {
    if (boot && 'error' in boot && boot.error instanceof ApiError && boot.error.code === 'ATTEMPT_CLOSED') router.replace(`/result/${id}`);
  }, [boot, id]);
  if (!boot || ('error' in boot && boot.error instanceof ApiError && boot.error.code === 'ATTEMPT_CLOSED')) return <Loading />;
  if ('error' in boot) {
    const e = boot.error;
    return (
      <SafeAreaView style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <ErrorBox message={e instanceof ApiError && e.code === 'ATTEMPT_IN_USE' ? t('error.ATTEMPT_IN_USE') : t('app.error')} retryLabel={t('app.retry')} onRetry={() => router.replace(`/attempt/${id}`)} />
      </SafeAreaView>
    );
  }
  return <Runner key={boot.view.attemptId} view={boot.view} snap={boot.snap} />;
}

function Runner({ view, snap }: { view: AttemptView; snap: Snapshot | null }) {
  const { api } = useAuth();
  const { t, lang: uiLang } = useI18n();
  const qc = useQueryClient();
  const [state, dispatch] = useReducer(reducer, undefined, () => initState(view, snap));
  const stateRef = useRef<ExamState>(state);
  stateRef.current = state;

  const sclock = useMemo(() => {
    const c = new ServerClock();
    c.sync(view.serverTime, view.remainingSec);
    return c;
  }, [view]);
  const [remaining, setRemaining] = useState(view.remainingSec);
  const [windows, setWindows] = useState<SectionWindow[] | null>(view.sectionWindows);
  const [openSection, setOpenSection] = useState<number | null>(view.openSection);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [phase, setPhase] = useState<'running' | 'submitting'>('running');
  const [palette, setPalette] = useState(false);
  const [summary, setSummary] = useState(false);
  const [moved, setMoved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const questions = view.questions;
  const n = questions.length;
  const sectional = view.scheme.sectionalTimers && !!windows;
  const lang = state.language;

  // ---- saving
  const queueRef = useRef<SaveQueue | null>(null);
  if (!queueRef.current) {
    queueRef.current = new SaveQueue({
      save: (body) => api.saveState(view.attemptId, body),
      getState: () => stateRef.current,
      dispatch,
      startSeq: startCounter(view, snap),
      onStatus: setSaveStatus,
      onServer: (r) => {
        sclock.sync(r.serverTime, r.remainingSec);
        setWindows(r.sectionWindows);
        setOpenSection(r.openSection);
      },
      onFatal: (reason) => {
        if (reason === 'moved') setMoved(true);
        if (reason === 'closed') router.replace(`/result/${view.attemptId}`);
      },
    });
  }
  const queue = queueRef.current;
  useEffect(() => {
    queue.start();
    return () => queue.stop();
  }, [queue]);

  // a local copy so closing the app, a crash or a long offline spell loses nothing
  useEffect(() => {
    const id = setTimeout(() => void store.save(toSnapshot(view.attemptId, state, queue.currentSeq())), 400);
    return () => clearTimeout(id);
  }, [state, queue, view.attemptId]);
  const active = useRef(true);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      active.current = s === 'active';
      if (s !== 'active') {
        void store.save(toSnapshot(view.attemptId, stateRef.current, queue.currentSeq()));
        void queue.flush().catch(() => undefined);
      } else void queue.flush().catch(() => undefined);
    });
    return () => sub.remove();
  }, [queue, view.attemptId]);

  // ---- navigation
  const locked = useCallback((i: number) => (sectional ? questions[i].sectionPos !== openSection : false), [sectional, questions, openSection]);
  const cur = questions[state.currentIndex];
  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= n || locked(i)) return;
      dispatch({ type: 'go', index: i, section: questions[i].sectionPos });
      queue.schedule();
    },
    [n, locked, questions, queue],
  );
  useEffect(() => {
    if (cur && !stateRef.current.answers[cur.qid]?.visited) {
      dispatch({ type: 'visit', qid: cur.qid });
      queue.schedule();
    }
  }, [cur, queue]);

  const lastOpen = useRef(openSection);
  useEffect(() => {
    if (!sectional || openSection === null || lastOpen.current === openSection) return;
    lastOpen.current = openSection;
    const first = questions.findIndex((q) => q.sectionPos === openSection);
    if (first >= 0) {
      dispatch({ type: 'go', index: first, section: openSection });
      setNotice(t('exam.sectionEnded'));
    }
  }, [openSection, sectional, questions, t]);

  // ---- timers
  useEffect(() => {
    const id = setInterval(() => setRemaining(sclock.remainingSec()), 500);
    return () => clearInterval(id);
  }, [sclock]);
  const sectionLeft = useMemo(() => {
    if (!sectional || openSection === null) return null;
    const w = windows?.find((x) => x.position === openSection);
    return w ? sclock.secondsUntil(w.end) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectional, openSection, windows, sclock, remaining]);
  useEffect(() => {
    if (sectionLeft === 0) void queue.flush();
  }, [sectionLeft, queue]);
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      if (active.current && cur) dispatch({ type: 'time', qid: cur.qid, sec: 1 });
    }, 1000);
    return () => clearInterval(id);
  }, [cur, phase]);
  const warned = useRef({ five: false, one: false });
  useEffect(() => {
    if (remaining <= 300 && remaining > 60 && !warned.current.five) {
      warned.current.five = true;
      setNotice(t('app.exam.warn5'));
    }
    if (remaining <= 60 && remaining > 0 && !warned.current.one) {
      warned.current.one = true;
      setNotice(t('app.exam.warn1'));
    }
  }, [remaining, t]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  // ---- submit (idempotent key; keeps trying until the server accepts)
  const submitKey = useRef(`${view.attemptId}-${Crypto.randomUUID()}`);
  const submitting = useRef(false);
  const doSubmit = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPhase('submitting');
    setSummary(false);
    setPalette(false);
    for (;;) {
      try {
        await queue.flush().catch(() => false);
        const { body } = compose(stateRef.current, queue.nextSeq);
        await api.submit(view.attemptId, { submitKey: submitKey.current, answers: body.answers });
        await store.clear(view.attemptId);
        queue.stop();
        void qc.invalidateQueries();
        router.replace(`/result/${view.attemptId}`);
        return;
      } catch (e) {
        if (e instanceof ApiError && (e.code === 'ATTEMPT_CLOSED' || e.status === 404)) {
          queue.stop();
          router.replace(`/result/${view.attemptId}`);
          return;
        }
        await sleep(3000); // answers stay safe on the phone and on the server; keep trying
      }
    }
  }, [api, qc, queue, view.attemptId]);
  useEffect(() => {
    if (remaining <= 0 && phase === 'running') void doSubmit();
  }, [remaining, phase, doSubmit]);

  // the Android back button must not end the exam by accident
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'running') Alert.alert(t('exam.confirmLeave'), undefined, [{ text: t('app.exam.cancel'), style: 'cancel' }, { text: t('app.exam.submit'), onPress: () => setSummary(true) }]);
      return true;
    });
    return () => sub.remove();
  }, [phase, t]);

  // ---- actions
  const qid = cur?.qid ?? '';
  const answer = state.answers[qid];
  const nextIndex = (from: number) => {
    for (let i = from + 1; i < n; i++) if (!locked(i)) return i;
    return null;
  };
  const prevIndex = (from: number) => {
    for (let i = from - 1; i >= 0; i--) if (!locked(i)) return i;
    return null;
  };
  const select = (o: number) => {
    dispatch({ type: 'select', qid, option: o });
    queue.schedule();
  };
  const saveNext = () => {
    const nx = nextIndex(state.currentIndex);
    if (nx !== null) go(nx);
    else {
      queue.schedule();
      setSummary(true);
    }
  };
  const markNext = () => {
    dispatch({ type: 'mark', qid, marked: true });
    const nx = nextIndex(state.currentIndex);
    if (nx !== null) go(nx);
    queue.schedule();
  };
  const clearAns = () => {
    dispatch({ type: 'clear', qid });
    queue.schedule();
  };
  const prev = () => {
    const p = prevIndex(state.currentIndex);
    if (p !== null) go(p);
  };
  const flipLang = () => {
    dispatch({ type: 'language', lang: lang === 'hi' ? 'en' : 'hi' });
    queue.schedule();
  };

  const counts = countStatuses(questions.map((q) => q.qid), state.answers);
  const low = remaining <= 300;

  if (moved) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <ErrorBox message={t('app.exam.moved')} retryLabel={t('app.retry')} onRetry={() => router.replace(`/attempt/${view.attemptId}`)} />
      </SafeAreaView>
    );
  }
  if (phase === 'submitting') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 12 }}>
        <ActivityIndicator size="large" color={C.primary} />
        <T v="h3">{t('app.exam.submitting')}</T>
      </View>
    );
  }

  const StatusIcon = saveStatus === 'saved' ? CheckCircle2 : saveStatus === 'saving' ? ActivityIndicator : saveStatus === 'offline' ? CloudOff : TriangleAlert;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* top bar: timer, save status, language, palette */}
      <Row style={{ paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'space-between' }}>
        <Row gap={8} style={{ backgroundColor: low ? C.dangerSoft : C.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, ...shadow.card }}>
          <Timer size={18} color={low ? C.danger : C.primary} />
          <Text accessibilityLabel={t('app.exam.left', { time: clock(remaining) })} style={{ fontWeight: '800', fontSize: 17, color: low ? C.danger : C.ink, fontVariant: ['tabular-nums'] }}>{clock(remaining)}</Text>
        </Row>
        {saveStatus === 'saving' ? <ActivityIndicator size="small" color={C.muted} /> : <StatusIcon size={18} color={saveStatus === 'saved' ? C.success : saveStatus === 'offline' ? C.warn : C.danger} />}
        <Row gap={8}>
          <Pressable onPress={flipLang} accessibilityRole="button" accessibilityLabel="Language" style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', ...shadow.card }}>
            <Languages size={20} color={C.primary} />
          </Pressable>
          <Pressable onPress={() => setPalette(true)} accessibilityRole="button" accessibilityLabel={t('app.exam.palette')} style={{ height: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
            <Grid3x3 size={18} color={C.white} />
            <Text style={{ color: C.white, fontWeight: '800' }}>{counts.answered + counts.answeredMarked}/{n}</Text>
          </Pressable>
        </Row>
      </Row>
      {notice ? <View style={{ marginHorizontal: 14, marginBottom: 6, backgroundColor: C.warnSoft, padding: 10, borderRadius: 12 }}><Text style={{ color: C.warn, fontWeight: '700', textAlign: 'center' }}>{notice}</Text></View> : null}
      {saveStatus === 'offline' ? <View style={{ marginHorizontal: 14, marginBottom: 6 }}><T v="small" color={C.warn} center>{t('app.exam.offline')}</T></View> : null}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false} key={cur?.qid}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: C.primaryDark, fontWeight: '800' }}>{t('app.questionsLabel', { n: state.currentIndex + 1, total: n })}</Text>
          <Text style={{ color: C.muted, fontSize: 12 }}>+{cur?.marks ?? 0}</Text>
        </Row>
        <View style={{ backgroundColor: C.white, borderRadius: 24, padding: 16, marginBottom: 14, ...shadow.card }}>
          {cur ? <QuestionBody q={cur} lang={lang} /> : null}
        </View>
        {cur ? <Options q={cur} lang={lang} selected={answer?.selected ?? null} onSelect={select} /> : null}
      </ScrollView>

      {/* bottom actions */}
      <View style={{ backgroundColor: C.white, padding: 12, gap: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...shadow.lift }}>
        <Row gap={10}>
          <View style={{ flex: 1 }}><Button title={t('app.exam.markNext')} variant="soft" small onPress={markNext} /></View>
          <View style={{ flex: 1 }}><Button title={t('app.exam.clear')} variant="ghost" small onPress={clearAns} disabled={answer?.selected == null} /></View>
        </Row>
        <Row gap={10}>
          <View style={{ flex: 1 }}><Button title={t('app.exam.prev')} variant="soft" onPress={prev} disabled={prevIndex(state.currentIndex) === null} /></View>
          <View style={{ flex: 2 }}><Button title={nextIndex(state.currentIndex) === null ? t('app.exam.submit') : t('app.exam.saveNext')} onPress={saveNext} /></View>
        </Row>
      </View>

      {/* palette sheet */}
      <Modal visible={palette} transparent animationType="slide" onRequestClose={() => setPalette(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(26,26,59,0.45)' }} onPress={() => setPalette(false)} />
        <View style={{ backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, maxHeight: '78%' }}>
          <T v="h2" style={{ marginBottom: 10 }}>{t('app.exam.palette')}</T>
          <Row gap={10} style={{ flexWrap: 'wrap', marginBottom: 10 }}>
            {(['answered', 'notAnswered', 'marked', 'notVisited'] as const).map((k) => (
              <Row key={k} gap={5}>
                <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: PAL[k].bg }} />
                <T v="small">{t(`app.exam.${k}` as 'app.exam.answered')} {k === 'marked' ? counts.marked + counts.answeredMarked : counts[k]}</T>
              </Row>
            ))}
          </Row>
          <ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {questions.map((q, i) => {
                const st = paletteStatus(state.answers[q.qid]);
                const p = PAL[st];
                const isLocked = locked(i);
                return (
                  <Pressable key={q.qid} disabled={isLocked} onPress={() => { go(i); setPalette(false); }} accessibilityRole="button" accessibilityLabel={`${i + 1}`} style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: p.bg, borderWidth: i === state.currentIndex ? 3 : p.border ? 3 : 0, borderColor: i === state.currentIndex ? C.ink : p.border, alignItems: 'center', justifyContent: 'center', opacity: isLocked ? 0.35 : 1 }}>
                    <Text style={{ color: p.fg, fontWeight: '800' }}>{i + 1}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <View style={{ marginTop: 14 }}><Button title={t('app.exam.submit')} onPress={() => { setPalette(false); setSummary(true); }} /></View>
        </View>
      </Modal>

      {/* submit summary */}
      <Modal visible={summary} transparent animationType="fade" onRequestClose={() => setSummary(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(26,26,59,0.5)', justifyContent: 'center', padding: 22 }}>
          <View style={{ backgroundColor: C.white, borderRadius: 26, padding: 20 }}>
            <T v="h2">{t('app.exam.submitAsk')}</T>
            <View style={{ marginVertical: 14, gap: 8 }}>
              {([['answered', counts.answered + counts.answeredMarked], ['notAnswered', counts.notAnswered + counts.marked], ['notVisited', counts.notVisited]] as const).map(([k, v]) => (
                <Row key={k} style={{ justifyContent: 'space-between' }}>
                  <Row gap={8}><View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: PAL[k === 'answered' ? 'answered' : k].bg }} /><T v="body">{t(`app.exam.${k}` as 'app.exam.answered')}</T></Row>
                  <T v="h3">{v}</T>
                </Row>
              ))}
            </View>
            <Button title={t('app.exam.submit')} onPress={() => void doSubmit()} />
            <View style={{ height: 8 }} />
            <Button title={t('app.exam.cancel')} variant="ghost" onPress={() => setSummary(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
