import type { AnswerState, AnswerWrite, AttemptView, Lang, SaveStateBody } from '@eg/api';

/** One question's answer as held in the browser. `rev` counts local edits so an acknowledged save never clears a newer edit. */
export interface LocalAnswer {
  selected: number | null;
  visited: boolean;
  marked: boolean;
  timeSpentSec: number;
  rev: number;
}

export interface ExamState {
  answers: Record<string, LocalAnswer>;
  /** questions whose latest local edit is not yet confirmed by the server */
  dirty: Record<string, true>;
  currentIndex: number;
  currentSection: number;
  language: Lang;
  /** bumped on every navigation/language change; acknowledged separately from answers */
  navRev: number;
  navAckedRev: number;
}

export type Action =
  | { type: 'select'; qid: string; option: number }
  | { type: 'clear'; qid: string }
  | { type: 'mark'; qid: string; marked: boolean }
  | { type: 'visit'; qid: string }
  | { type: 'go'; index: number; section?: number }
  | { type: 'language'; lang: Lang }
  | { type: 'time'; qid: string; sec: number }
  | { type: 'acked'; revs: Record<string, number>; navRev: number }
  | { type: 'section'; section: number };

/** Local progress saved in IndexedDB so a refresh, crash or long offline spell loses nothing. */
export interface Snapshot {
  v: 1;
  attemptId: string;
  answers: Record<string, LocalAnswer>;
  dirty: string[];
  currentIndex: number;
  currentSection: number;
  language: Lang;
  navDirty: boolean;
  counter: number;
}

const blank = (): LocalAnswer => ({ selected: null, visited: false, marked: false, timeSpentSec: 0, rev: 0 });
const fromServer = (a: AnswerState): LocalAnswer => ({ selected: a.selected, visited: a.visited, marked: a.marked, timeSpentSec: a.timeSpentSec, rev: 0 });

export function initState(view: AttemptView, snap?: Snapshot | null): ExamState {
  const answers: Record<string, LocalAnswer> = {};
  for (const a of view.state.answers) answers[a.qid] = fromServer(a);
  const dirty: Record<string, true> = {};
  let { currentIndex, currentSection, language } = view.state;
  let navRev = 0;
  if (snap && snap.attemptId === view.attemptId) {
    // edits the server has not confirmed win over the server copy
    const ids = new Set(view.questions.map((q) => q.qid));
    for (const qid of snap.dirty) {
      if (ids.has(qid) && snap.answers[qid]) {
        answers[qid] = { ...snap.answers[qid], rev: (answers[qid]?.rev ?? 0) + 1 };
        dirty[qid] = true;
      }
    }
    if (snap.navDirty) {
      currentIndex = Math.min(Math.max(0, snap.currentIndex), view.questions.length - 1);
      currentSection = snap.currentSection;
      language = snap.language;
      navRev = 1;
    }
  }
  return { answers, dirty, currentIndex, currentSection, language, navRev, navAckedRev: 0 };
}

function touch(state: ExamState, qid: string, patch: Partial<LocalAnswer>): ExamState {
  const cur = state.answers[qid] ?? blank();
  const next: LocalAnswer = { ...cur, ...patch, rev: cur.rev + 1 };
  return { ...state, answers: { ...state.answers, [qid]: next }, dirty: { ...state.dirty, [qid]: true } };
}

export function reducer(state: ExamState, a: Action): ExamState {
  switch (a.type) {
    case 'select':
      return touch(state, a.qid, { selected: a.option, visited: true });
    case 'clear':
      return touch(state, a.qid, { selected: null, visited: true });
    case 'mark':
      return touch(state, a.qid, { marked: a.marked, visited: true });
    case 'visit': {
      const cur = state.answers[a.qid];
      return cur?.visited ? state : touch(state, a.qid, { visited: true });
    }
    case 'time': {
      // time is accumulated without marking the question dirty on every tick; it rides along with the next save
      const cur = state.answers[a.qid] ?? blank();
      return { ...state, answers: { ...state.answers, [a.qid]: { ...cur, timeSpentSec: cur.timeSpentSec + a.sec } } };
    }
    case 'go':
      return { ...state, currentIndex: a.index, currentSection: a.section ?? state.currentSection, navRev: state.navRev + 1 };
    case 'section':
      return state.currentSection === a.section ? state : { ...state, currentSection: a.section, navRev: state.navRev + 1 };
    case 'language':
      return state.language === a.lang ? state : { ...state, language: a.lang, navRev: state.navRev + 1 };
    case 'acked': {
      const dirty = { ...state.dirty };
      for (const [qid, rev] of Object.entries(a.revs)) if (state.answers[qid]?.rev === rev) delete dirty[qid];
      return { ...state, dirty, navAckedRev: Math.max(state.navAckedRev, a.navRev) };
    }
  }
}

export const navDirty = (s: ExamState) => s.navRev !== s.navAckedRev;
export const hasUnsaved = (s: ExamState) => Object.keys(s.dirty).length > 0 || navDirty(s);

/** Builds the next save request. Each write gets a fresh, ever-increasing sequence number so the server can drop stale replays. */
export function compose(s: ExamState, nextSeq: () => number): { body: SaveStateBody; revs: Record<string, number>; navRev: number } {
  const revs: Record<string, number> = {};
  const answers: AnswerWrite[] = [];
  for (const qid of Object.keys(s.dirty)) {
    const a = s.answers[qid];
    if (!a) continue;
    revs[qid] = a.rev;
    answers.push({ qid, selected: a.selected, visited: a.visited, marked: a.marked, timeSpentSec: Math.min(36_000, Math.round(a.timeSpentSec)), seq: nextSeq() });
  }
  return { body: { seq: nextSeq(), currentIndex: s.currentIndex, currentSection: s.currentSection, language: s.language, answers }, revs, navRev: s.navRev };
}

export function toSnapshot(attemptId: string, s: ExamState, counter: number): Snapshot {
  return { v: 1, attemptId, answers: s.answers, dirty: Object.keys(s.dirty), currentIndex: s.currentIndex, currentSection: s.currentSection, language: s.language, navDirty: navDirty(s), counter };
}

/** Starting point for sequence numbers: above everything the server has already stored. */
export function startCounter(view: AttemptView, snap?: Snapshot | null): number {
  const serverMax = Math.max(view.state.seq, ...view.state.answers.map((a) => a.seq), 0);
  return Math.max(serverMax, snap?.attemptId === view.attemptId ? snap.counter : 0) + 1;
}
