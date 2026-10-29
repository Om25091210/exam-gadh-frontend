import type { AttemptView } from '@eg/api';
import { describe, expect, it } from 'vitest';
import { compose, hasUnsaved, initState, navDirty, reducer, startCounter, toSnapshot, type ExamState } from './exam-state';
import { countStatuses, paletteStatus } from './palette';

const view = (over: Partial<AttemptView['state']> = {}): AttemptView =>
  ({
    attemptId: 'a1',
    questions: ['q1', 'q2', 'q3'].map((qid, i) => ({ qid, position: i + 1, sectionPos: 0, marks: 2, type: 'single', passage: null })),
    state: { currentIndex: 0, currentSection: 0, language: 'hi', seq: 0, answers: [], ...over },
  }) as unknown as AttemptView;

describe('paletteStatus', () => {
  it('covers the five states', () => {
    expect(paletteStatus(undefined)).toBe('notVisited');
    expect(paletteStatus({ selected: null, visited: false, marked: false })).toBe('notVisited');
    expect(paletteStatus({ selected: null, visited: true, marked: false })).toBe('notAnswered');
    expect(paletteStatus({ selected: 2, visited: true, marked: false })).toBe('answered');
    expect(paletteStatus({ selected: null, visited: true, marked: true })).toBe('marked');
    expect(paletteStatus({ selected: 0, visited: true, marked: true })).toBe('answeredMarked');
  });
  it('option 0 counts as answered', () => {
    expect(paletteStatus({ selected: 0, visited: true, marked: false })).toBe('answered');
  });
  it('counts a whole paper', () => {
    const c = countStatuses(['a', 'b', 'c', 'd'], { a: { selected: 1, visited: true, marked: false }, b: { selected: null, visited: true, marked: true }, c: { selected: null, visited: true, marked: false } });
    expect(c).toEqual({ notVisited: 1, notAnswered: 1, answered: 1, marked: 1, answeredMarked: 0 });
  });
});

describe('reducer', () => {
  const s0 = initState(view());
  it('selecting marks the question visited and unsaved', () => {
    const s = reducer(s0, { type: 'select', qid: 'q1', option: 2 });
    expect(s.answers.q1).toMatchObject({ selected: 2, visited: true });
    expect(s.dirty).toEqual({ q1: true });
    expect(hasUnsaved(s)).toBe(true);
  });
  it('clear keeps visited, mark toggles independently', () => {
    let s = reducer(s0, { type: 'select', qid: 'q1', option: 1 });
    s = reducer(s, { type: 'mark', qid: 'q1', marked: true });
    s = reducer(s, { type: 'clear', qid: 'q1' });
    expect(s.answers.q1).toMatchObject({ selected: null, visited: true, marked: true });
  });
  it('time ticks do not mark a question unsaved', () => {
    const s = reducer(reducer(s0, { type: 'visit', qid: 'q1' }), { type: 'time', qid: 'q1', sec: 5 });
    expect(s.answers.q1.timeSpentSec).toBe(5);
    const acked = reducer(s, { type: 'acked', revs: { q1: s.answers.q1.rev }, navRev: 0 });
    expect(acked.dirty).toEqual({});
    expect(reducer(acked, { type: 'time', qid: 'q1', sec: 1 }).dirty).toEqual({});
  });
  it('visiting twice changes nothing the second time', () => {
    const a = reducer(s0, { type: 'visit', qid: 'q1' });
    expect(reducer(a, { type: 'visit', qid: 'q1' })).toBe(a);
  });
  it('navigation and language mark the navigation state unsaved', () => {
    let s = reducer(s0, { type: 'go', index: 2 });
    expect(s.currentIndex).toBe(2);
    expect(navDirty(s)).toBe(true);
    s = reducer(s, { type: 'acked', revs: {}, navRev: s.navRev });
    expect(navDirty(s)).toBe(false);
    expect(navDirty(reducer(s, { type: 'language', lang: 'en' }))).toBe(true);
    expect(reducer(s, { type: 'language', lang: 'hi' })).toBe(s);
  });
  it('an acknowledged save does not clear a newer edit made while it was in flight', () => {
    let s = reducer(s0, { type: 'select', qid: 'q1', option: 1 });
    const sent = compose(s, (() => { let n = 10; return () => n++; })());
    s = reducer(s, { type: 'select', qid: 'q1', option: 3 }); // edited again before the reply
    s = reducer(s, { type: 'acked', revs: sent.revs, navRev: sent.navRev });
    expect(s.dirty).toEqual({ q1: true });
    expect(s.answers.q1.selected).toBe(3);
  });
});

describe('compose', () => {
  it('writes only unsaved questions with rising sequence numbers', () => {
    let s: ExamState = initState(view());
    s = reducer(s, { type: 'select', qid: 'q1', option: 1 });
    s = reducer(s, { type: 'mark', qid: 'q3', marked: true });
    let n = 5;
    const c = compose(s, () => n++);
    expect(c.body.answers.map((a) => a.qid).sort()).toEqual(['q1', 'q3']);
    const seqs = [...c.body.answers.map((a) => a.seq), c.body.seq];
    expect(new Set(seqs).size).toBe(seqs.length);
    expect(Math.min(...seqs)).toBe(5);
    expect(c.body).toMatchObject({ currentIndex: 0, language: 'hi' });
  });
});

describe('resume', () => {
  it('local unconfirmed edits win over the server copy; confirmed ones do not', () => {
    const v = view({ answers: [{ qid: 'q1', selected: 0, visited: true, marked: false, timeSpentSec: 3, seq: 4 }, { qid: 'q2', selected: 1, visited: true, marked: false, timeSpentSec: 3, seq: 4 }] });
    let s = initState(v);
    s = reducer(s, { type: 'select', qid: 'q1', option: 3 });
    const snap = toSnapshot('a1', s, 20);
    // another device later wrote q2 on the server; the snapshot says only q1 is unsaved
    const resumed = initState(view({ answers: [{ qid: 'q1', selected: 0, visited: true, marked: false, timeSpentSec: 3, seq: 4 }, { qid: 'q2', selected: 2, visited: true, marked: false, timeSpentSec: 3, seq: 9 }] }), snap);
    expect(resumed.answers.q1.selected).toBe(3);
    expect(resumed.answers.q2.selected).toBe(2);
    expect(resumed.dirty).toEqual({ q1: true });
  });
  it('ignores a snapshot from another attempt', () => {
    const snap = { ...toSnapshot('other', reducer(initState(view()), { type: 'select', qid: 'q1', option: 1 }), 5) };
    expect(initState(view(), snap).dirty).toEqual({});
  });
  it('sequence numbers start above everything the server holds and the saved counter', () => {
    const v = view({ seq: 7, answers: [{ qid: 'q1', selected: 0, visited: true, marked: false, timeSpentSec: 0, seq: 12 }] });
    expect(startCounter(v)).toBe(13);
    expect(startCounter(v, { ...toSnapshot('a1', initState(v), 30) })).toBe(31);
  });
});
