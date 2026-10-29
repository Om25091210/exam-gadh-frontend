'use client';
import { ApiError, type AttemptView, type SectionWindow } from '@eg/api';
import { useI18n } from '@eg/i18n';
import { Alert, Badge, Button, cn, ErrorState, LanguageToggle, Modal, Spinner } from '@eg/ui';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CloudOff, Loader2, Maximize, Timer, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useApi } from '@/lib/auth';
import { errorKey } from '@/lib/errors';
import { compose, hasUnsaved, initState, reducer, startCounter, toSnapshot, type ExamState, type Snapshot } from '@/lib/exam/exam-state';
import { countStatuses } from '@/lib/exam/palette';
import { idbStore } from '@/lib/exam/persistence';
import { SaveQueue, type SaveStatus } from '@/lib/exam/save-queue';
import { ServerClock } from '@/lib/exam/server-clock';
import { formatClock } from '@/lib/time';
import { Legend, Palette } from './palette';
import { Options, QuestionBody } from './question-view';

type Boot = { view: AttemptView; snap: Snapshot | null } | { error: unknown } | null;

/** Loads the attempt (taking over this tab as its owner) and any unsent local edits, then starts the exam hall. */
export function ExamHall({ attemptId }: { attemptId: string }) {
  const api = useApi();
  const router = useRouter();
  const { t } = useI18n();
  const [boot, setBoot] = useState<Boot>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [view, snap] = await Promise.all([api.openAttempt(attemptId), idbStore.load(attemptId)]);
        if (alive) setBoot({ view, snap });
      } catch (error) {
        if (alive) setBoot({ error });
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, attemptId]);

  useEffect(() => {
    if (boot && 'error' in boot && boot.error instanceof ApiError && boot.error.code === 'ATTEMPT_CLOSED') router.replace(`/results/${attemptId}`);
  }, [boot, router, attemptId]);

  if (!boot || ('error' in boot && boot.error instanceof ApiError && boot.error.code === 'ATTEMPT_CLOSED')) {
    return <div className="grid min-h-dvh place-items-center"><Spinner /></div>;
  }
  if ('error' in boot) {
    const e = boot.error;
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center p-4">
        <ErrorState message={e instanceof ApiError && e.code === 'ATTEMPT_IN_USE' ? t('error.ATTEMPT_IN_USE') : t(errorKey(e))} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  return <ExamRunner key={boot.view.attemptId} view={boot.view} snap={boot.snap} />;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function submitKeyFor(attemptId: string): string {
  const k = `eg:submit:${attemptId}`;
  try {
    const have = sessionStorage.getItem(k);
    if (have) return have;
    const made = crypto.randomUUID();
    sessionStorage.setItem(k, made);
    return made;
  } catch {
    return `${attemptId}-${Date.now()}`;
  }
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useI18n();
  const map = {
    saved: { icon: CheckCircle2, text: t('exam.save.saved'), cls: 'text-success-600' },
    saving: { icon: Loader2, text: t('exam.save.saving'), cls: 'text-ink-500' },
    offline: { icon: CloudOff, text: t('exam.save.offline'), cls: 'text-warning-700' },
    error: { icon: TriangleAlert, text: t('exam.save.error'), cls: 'text-danger-600' },
  }[status];
  const Icon = map.icon;
  return (
    <span role="status" className={cn('flex items-center gap-1.5 text-sm font-medium', map.cls)}>
      <Icon className={cn('size-4', status === 'saving' && 'animate-spin')} aria-hidden />
      <span className={status === 'offline' || status === 'error' ? '' : 'hidden sm:inline'}>{map.text}</span>
    </span>
  );
}

function ExamRunner({ view, snap }: { view: AttemptView; snap: Snapshot | null }) {
  const api = useApi();
  const router = useRouter();
  const qc = useQueryClient();
  const { t, b } = useI18n();

  const [state, dispatch] = useReducer(reducer, undefined, () => initState(view, snap));
  const stateRef = useRef<ExamState>(state);
  stateRef.current = state;

  const clock = useMemo(() => {
    const c = new ServerClock();
    c.sync(view.serverTime, view.remainingSec);
    return c;
  }, [view]);
  const [remaining, setRemaining] = useState(view.remainingSec);
  const [windows, setWindows] = useState<SectionWindow[] | null>(view.sectionWindows);
  const [openSection, setOpenSection] = useState<number | null>(view.openSection);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [phase, setPhase] = useState<'running' | 'submitting'>('running');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [finishSectionOpen, setFinishSectionOpen] = useState(false);
  const [moved, setMoved] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  const sectional = view.scheme.sectionalTimers && !!windows;
  const questions = view.questions;
  const n = questions.length;

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
        clock.sync(r.serverTime, r.remainingSec);
        setWindows(r.sectionWindows);
        setOpenSection(r.openSection);
      },
      onFatal: (reason) => {
        if (reason === 'moved') setMoved(true);
        if (reason === 'closed') router.replace(`/results/${view.attemptId}`);
      },
    });
  }
  const queue = queueRef.current;
  useEffect(() => {
    queue.start();
    return () => queue.stop();
  }, [queue]);

  // keep a local copy so a refresh, crash or long offline spell loses nothing
  useEffect(() => {
    const id = setTimeout(() => void idbStore.save(toSnapshot(view.attemptId, state, queue.currentSeq())), 400);
    return () => clearTimeout(id);
  }, [state, queue, view.attemptId]);
  useEffect(() => {
    const flushLocal = () => void idbStore.save(toSnapshot(view.attemptId, stateRef.current, queue.currentSeq()));
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushLocal();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushLocal);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushLocal);
    };
  }, [queue, view.attemptId]);

  // ---- navigation helpers
  const qOf = (i: number) => questions[i];
  const locked = useCallback((i: number) => (sectional ? questions[i].sectionPos !== openSection : false), [sectional, questions, openSection]);
  const cur = qOf(state.currentIndex);

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= n || locked(i)) return;
      dispatch({ type: 'go', index: i, section: questions[i].sectionPos });
      queue.schedule();
    },
    [n, locked, questions, queue],
  );

  // opening a question counts as visiting it
  useEffect(() => {
    if (cur && !stateRef.current.answers[cur.qid]?.visited) {
      dispatch({ type: 'visit', qid: cur.qid });
      queue.schedule();
    }
  }, [cur, queue]);

  // a section window moved on (time ran out): jump to the first question of the open section
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
    const id = setInterval(() => setRemaining(clock.remainingSec()), 500);
    return () => clearInterval(id);
  }, [clock]);

  const sectionLeft = useMemo(() => {
    if (!sectional || openSection === null) return null;
    const w = windows?.find((x) => x.position === openSection);
    return w ? clock.secondsUntil(w.end) : null;
    // `remaining` changes twice a second, which keeps this fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectional, openSection, windows, clock, remaining]);

  // the section's time is over: ask the server (the heartbeat save returns the new open section)
  useEffect(() => {
    if (sectionLeft === 0) void queue.flush();
  }, [sectionLeft, queue]);

  // time spent on the open question (only while the tab is visible)
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && cur) dispatch({ type: 'time', qid: cur.qid, sec: 1 });
    }, 1000);
    return () => clearInterval(id);
  }, [cur, phase]);

  const warned = useRef({ five: false, one: false });
  useEffect(() => {
    if (remaining <= 300 && remaining > 60 && !warned.current.five) {
      warned.current.five = true;
      setAnnounce(t('exam.warn5'));
    }
    if (remaining <= 60 && remaining > 0 && !warned.current.one) {
      warned.current.one = true;
      setAnnounce(t('exam.warn1'));
    }
  }, [remaining, t]);

  // ---- submit
  const submitting = useRef(false);
  const doSubmit = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPhase('submitting');
    setSummaryOpen(false);
    const key = submitKeyFor(view.attemptId);
    for (;;) {
      try {
        await queue.flush().catch(() => false);
        const { body } = compose(stateRef.current, queue.nextSeq);
        await api.submit(view.attemptId, { submitKey: key, answers: body.answers });
        await idbStore.clear(view.attemptId);
        queue.stop();
        void qc.invalidateQueries();
        router.replace(`/results/${view.attemptId}`);
        return;
      } catch (e) {
        if (e instanceof ApiError && (e.code === 'ATTEMPT_CLOSED' || e.status === 404)) {
          queue.stop();
          router.replace(`/results/${view.attemptId}`);
          return;
        }
        if (e instanceof ApiError && e.status === 401) {
          setSubmitError(true);
          await sleep(3000);
          continue;
        }
        setSubmitError(true);
        await sleep(3000); // answers stay safe in IndexedDB and on the server; keep trying
      }
    }
  }, [api, qc, queue, router, view.attemptId]);

  useEffect(() => {
    if (remaining <= 0 && phase === 'running') void doSubmit();
  }, [remaining, phase, doSubmit]);

  useEffect(() => {
    if (phase !== 'running') return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = t('exam.confirmLeave');
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
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
  const select = (opt: number) => {
    dispatch({ type: 'select', qid, option: opt });
    queue.schedule();
  };
  const clear = () => {
    dispatch({ type: 'clear', qid });
    queue.schedule();
  };
  const saveNext = () => {
    const nx = nextIndex(state.currentIndex);
    if (nx !== null) go(nx);
    else queue.schedule();
  };
  const markNext = () => {
    dispatch({ type: 'mark', qid, marked: true });
    const nx = nextIndex(state.currentIndex);
    if (nx !== null) go(nx);
    queue.schedule();
  };
  const toggleMark = () => {
    dispatch({ type: 'mark', qid, marked: !(answer?.marked ?? false) });
    queue.schedule();
  };
  const prev = () => {
    const p = prevIndex(state.currentIndex);
    if (p !== null) go(p);
  };

  // keyboard shortcuts (never while typing or with a dialog open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || summaryOpen || paletteOpen || finishSectionOpen || moved || phase !== 'running') return;
      const el = e.target as HTMLElement;
      if (el.closest('input[type=text], textarea, select, [contenteditable]')) return;
      const k = e.key.toLowerCase();
      const opt = '1234'.indexOf(k) >= 0 && k.length === 1 ? '1234'.indexOf(k) : 'abcd'.indexOf(k) >= 0 && k.length === 1 ? 'abcd'.indexOf(k) : -1;
      if (opt >= 0) select(opt);
      else if (k === 'n' || k === 'arrowright') saveNext();
      else if (k === 'p' || k === 'arrowleft') prev();
      else if (k === 'm') toggleMark();
      else if (k === 'c') clear();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const finishSection = async () => {
    setFinishSectionOpen(false);
    try {
      await queue.flush();
      const r = await api.advanceSection(view.attemptId);
      setWindows(r.sectionWindows);
      setOpenSection(r.openSection);
      clock.sync(r.serverTime, clock.remainingSec());
    } catch (e) {
      setNotice(t(errorKey(e)));
    }
  };

  // ---- derived UI data
  const counts = countStatuses(questions.map((q) => q.qid), state.answers);
  const paletteQuestions = questions.map((q) => ({ qid: q.qid, position: q.position, sectionPos: q.sectionPos }));
  const sectionNames = new Map(view.sections.map((s) => [s.position, b(s.nameEn, s.nameHi)]));
  const isLastOpenSection = sectional && openSection !== null && view.sections.length > 0 && openSection === view.sections[view.sections.length - 1].position;
  const lang = state.language;
  const low = remaining <= 300;

  const goToQid = (id: string) => {
    go(questions.findIndex((q) => q.qid === id));
    setPaletteOpen(false);
  };

  const paletteBlock = (
    <div className="space-y-4">
      {view.sections.length > 1 ? (
        view.sections.map((s) => (
          <div key={s.position}>
            <p className="mb-1 text-sm font-semibold text-ink-700">{b(s.nameEn, s.nameHi)}</p>
            <Palette
              questions={paletteQuestions.filter((q) => q.sectionPos === s.position)}
              answers={state.answers}
              currentQid={cur?.qid ?? ''}
              onGo={goToQid}
              isLocked={(q) => (sectional ? q.sectionPos !== openSection : false)}
            />
          </div>
        ))
      ) : (
        <Palette questions={paletteQuestions} answers={state.answers} currentQid={cur?.qid ?? ''} onGo={goToQid} />
      )}
      <Legend counts={counts} />
    </div>
  );

  if (!cur) return <ErrorState message={t('exam.loadFailed')} />;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold">{b(view.title.en, view.title.hi)}</h1>
            <div className="flex items-center gap-2">
              {view.isPractice ? <Badge tone="info">{t('exam.practiceBadge')}</Badge> : null}
              <SaveIndicator status={saveStatus} />
            </div>
          </div>
          <div className={cn('flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-xl font-bold tabular-nums', low ? 'bg-danger-50 text-danger-700' : 'bg-primary-50 text-primary-800')}>
            <Timer className="size-5" aria-hidden />
            <span role="timer" aria-label={t('exam.timeLeft')}>{formatClock(remaining)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden sm:block"><LanguageToggle value={state.language} onChange={(l) => { dispatch({ type: 'language', lang: l }); queue.schedule(); }} label={t('exam.language')} /></div>
            <button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.(); setFullscreen((f) => !f); }} aria-label={fullscreen ? t('exam.exitFullscreen') : t('exam.fullscreen')} aria-pressed={fullscreen} className="hidden size-11 place-items-center rounded-xl hover:bg-black/5 md:grid">
              <Maximize className="size-5" aria-hidden />
            </button>
            <Button variant="danger" size="sm" onClick={() => setSummaryOpen(true)} disabled={phase !== 'running'}>{t('exam.submit')}</Button>
          </div>
        </div>
        {view.sections.length > 1 ? (
          <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-3 pb-2" role="tablist" aria-label={t('exam.section')}>
            {view.sections.map((s) => {
              const isOpen = !sectional || s.position === openSection;
              const active = cur.sectionPos === s.position;
              return (
                <button
                  key={s.position}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  disabled={!isOpen}
                  onClick={() => { const i = questions.findIndex((q) => q.sectionPos === s.position); if (i >= 0) go(i); }}
                  className={cn('min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold disabled:opacity-40', active ? 'bg-primary-700 text-white' : 'bg-black/5 text-ink-700')}
                >
                  {sectionNames.get(s.position)}
                  {sectional && s.position === openSection && sectionLeft !== null ? <span className="ml-2 font-mono tabular-nums">{formatClock(sectionLeft)}</span> : null}
                </button>
              );
            })}
            {sectional && openSection !== null && !isLastOpenSection ? (
              <Button variant="secondary" size="sm" className="ml-auto shrink-0" onClick={() => setFinishSectionOpen(true)}>{t('exam.finishSection')}</Button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div aria-live="assertive" className="sr-only">{announce}</div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-3 py-4 pb-44 md:grid-cols-[1fr_18rem] md:pb-6">
        <main id="main" className="min-w-0 space-y-4">
          {moved ? null : notice ? <Alert tone="info">{notice}</Alert> : null}
          {submitError ? <Alert tone="warning">{t('exam.submitFailed')}</Alert> : null}
          {phase === 'submitting' && !submitError ? <Alert tone="info"><span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" aria-hidden />{remaining <= 0 ? t('exam.timeUp') : t('exam.submitting')}</span></Alert> : null}

          <section aria-labelledby="qhead" className="rounded-card border border-line bg-surface p-4 shadow-card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="qhead" className="text-base font-bold text-primary-800">
                {t('exam.question', { n: cur.position })} <span className="font-normal text-ink-500">{t('exam.of', { n })}</span>
              </h2>
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <span>{t('exam.marks', { n: cur.marks })}</span>
                {view.scheme.negativeFraction > 0 ? <span>· {t('exam.negative', { n: Math.round(cur.marks * view.scheme.negativeFraction * 100) / 100 })}</span> : null}
              </div>
            </div>
            <div className="mb-3 sm:hidden"><LanguageToggle value={state.language} onChange={(l) => { dispatch({ type: 'language', lang: l }); queue.schedule(); }} label={t('exam.language')} /></div>
            <QuestionBody q={cur} lang={lang} />
            <div className="mt-4">
              <Options q={cur} lang={lang} name={`q-${cur.qid}`} selected={answer?.selected ?? null} onSelect={select} disabled={phase !== 'running' || locked(state.currentIndex)} />
            </div>
          </section>
          <p className="hidden text-xs text-ink-500 md:block">{t('exam.keys')}</p>
        </main>

        <aside className="hidden md:block" aria-label={t('exam.palette')}>
          <div className="sticky top-28 rounded-card border border-line bg-surface p-3 shadow-card">
            <h2 className="mb-2 font-semibold">{t('exam.palette')}</h2>
            <div className="max-h-[60dvh] overflow-y-auto pr-1">{paletteBlock}</div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-3 py-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <Button variant="secondary" onClick={prev} disabled={prevIndex(state.currentIndex) === null || phase !== 'running'}>{t('exam.prev')}</Button>
          <Button variant="secondary" onClick={clear} disabled={answer?.selected == null || phase !== 'running'}>{t('exam.clear')}</Button>
          <Button variant="secondary" onClick={markNext} disabled={phase !== 'running'} className="col-span-2 md:col-span-1">{t('exam.markNext')}</Button>
          <Button onClick={saveNext} disabled={phase !== 'running'} className="col-span-2 md:col-span-1">{t('exam.saveNext')}</Button>
          <Button variant="ghost" onClick={() => setPaletteOpen(true)} className="col-span-2 md:hidden">
            {t('exam.palette')} · {t('exam.paletteCounts', { answered: counts.answered + counts.answeredMarked, notAnswered: counts.notAnswered, marked: counts.marked + counts.answeredMarked, notVisited: counts.notVisited })}
          </Button>
        </div>
      </div>

      <Modal open={paletteOpen} onClose={() => setPaletteOpen(false)} title={t('exam.palette')}>{paletteBlock}</Modal>

      <Modal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title={t('exam.summary.title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSummaryOpen(false)}>{t('exam.summary.review')}</Button>
            <Button variant="danger" onClick={() => void doSubmit()}>{t('exam.summary.confirm')}</Button>
          </>
        }
      >
        <p className="mb-3 text-ink-700">{t('exam.summary.body')}</p>
        <dl className="grid grid-cols-2 gap-2 text-base">
          <dt>{t('exam.summary.answered')}</dt><dd className="text-right font-bold">{counts.answered + counts.answeredMarked}</dd>
          <dt>{t('exam.summary.notAnswered')}</dt><dd className="text-right font-bold">{counts.notAnswered}</dd>
          <dt>{t('exam.summary.marked')}</dt><dd className="text-right font-bold">{counts.marked + counts.answeredMarked}</dd>
          <dt>{t('exam.summary.notVisited')}</dt><dd className="text-right font-bold">{counts.notVisited}</dd>
        </dl>
        {hasUnsaved(state) && saveStatus === 'offline' ? <Alert tone="warning" className="mt-3">{t('exam.save.offline')}</Alert> : null}
      </Modal>

      <Modal open={finishSectionOpen} onClose={() => setFinishSectionOpen(false)} title={t('exam.finishSection')} footer={<><Button variant="secondary" onClick={() => setFinishSectionOpen(false)}>{t('common.cancel')}</Button><Button onClick={() => void finishSection()}>{t('exam.finishSection')}</Button></>}>
        <p>{t('exam.finishSection.confirm')}</p>
      </Modal>

      <Modal open={moved} onClose={() => undefined} dismissible={false} title={t('exam.moved')} footer={<Button onClick={() => window.location.reload()}>{t('exam.moved.take')}</Button>}>
        <p>{t('error.ATTEMPT_IN_USE')}</p>
      </Modal>
    </div>
  );
}
