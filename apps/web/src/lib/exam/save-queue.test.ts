import { ApiError, type SaveStateBody, type SaveStateResult } from '@eg/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initState, reducer, type Action, type ExamState } from './exam-state';
import { SaveQueue, type FatalReason, type SaveStatus } from './save-queue';

const view = { attemptId: 'a1', questions: [{ qid: 'q1' }, { qid: 'q2' }], state: { currentIndex: 0, currentSection: 0, language: 'hi', seq: 0, answers: [] } } as never;
const ok = (over: Partial<SaveStateResult> = {}): SaveStateResult => ({ saved: 1, rejected: [], serverTime: new Date().toISOString(), deadlineAt: new Date().toISOString(), remainingSec: 600, openSection: null, sectionWindows: null, ...over });

function harness(save: (b: SaveStateBody) => Promise<SaveStateResult>) {
  let state: ExamState = initState(view);
  const statuses: SaveStatus[] = [];
  const fatal: FatalReason[] = [];
  const dispatch = (a: Action) => {
    state = reducer(state, a);
  };
  const q = new SaveQueue({ save, getState: () => state, dispatch, startSeq: 1, onStatus: (s) => statuses.push(s), onServer: () => undefined, onFatal: (r) => fatal.push(r), debounceMs: 100, heartbeatMs: 10_000 });
  return { q, dispatch, getState: () => state, statuses, fatal };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('SaveQueue', () => {
  it('debounces a burst of edits into one request and marks them saved', async () => {
    const save = vi.fn().mockResolvedValue(ok());
    const h = harness(save);
    h.q.start();
    h.dispatch({ type: 'select', qid: 'q1', option: 1 });
    h.q.schedule();
    h.dispatch({ type: 'select', qid: 'q1', option: 2 });
    h.q.schedule();
    await vi.advanceTimersByTimeAsync(150);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].answers[0]).toMatchObject({ qid: 'q1', selected: 2 });
    expect(h.getState().dirty).toEqual({});
    expect(h.statuses.at(-1)).toBe('saved');
    h.q.stop();
  });

  it('keeps edits unsaved when offline, shows Offline, and resends when the network is back', async () => {
    const save = vi.fn().mockRejectedValueOnce(new ApiError(0, 'NETWORK', 'x')).mockResolvedValue(ok());
    const h = harness(save);
    h.q.start();
    h.dispatch({ type: 'select', qid: 'q1', option: 1 });
    await h.q.flush();
    expect(h.statuses.at(-1)).toBe('offline');
    expect(h.getState().dirty).toEqual({ q1: true });
    await vi.advanceTimersByTimeAsync(2100); // first backoff
    expect(save).toHaveBeenCalledTimes(2);
    expect(h.getState().dirty).toEqual({});
    expect(h.statuses.at(-1)).toBe('saved');
    h.q.stop();
  });

  it('a retry reuses newer sequence numbers than the failed attempt (never lower)', async () => {
    const save = vi.fn().mockRejectedValueOnce(new ApiError(0, 'NETWORK', 'x')).mockResolvedValue(ok());
    const h = harness(save);
    h.q.start();
    h.dispatch({ type: 'select', qid: 'q1', option: 1 });
    await h.q.flush();
    await vi.advanceTimersByTimeAsync(2100);
    const first = save.mock.calls[0][0].answers[0].seq;
    const second = save.mock.calls[1][0].answers[0].seq;
    expect(second).toBeGreaterThan(first);
    h.q.stop();
  });

  it('edits made while a request is in flight are sent in the next request, not lost', async () => {
    let release!: (r: SaveStateResult) => void;
    const save = vi.fn().mockImplementationOnce(() => new Promise<SaveStateResult>((r) => (release = r))).mockResolvedValue(ok());
    const h = harness(save);
    h.q.start();
    h.dispatch({ type: 'select', qid: 'q1', option: 1 });
    const first = h.q.flush();
    h.dispatch({ type: 'select', qid: 'q1', option: 3 });
    release(ok());
    await first;
    await vi.advanceTimersByTimeAsync(150);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0].answers[0].selected).toBe(3);
    expect(h.getState().dirty).toEqual({});
    h.q.stop();
  });

  it('reports a takeover from another tab as fatal and does not retry', async () => {
    const save = vi.fn().mockRejectedValue(new ApiError(409, 'ATTEMPT_TAKEN_OVER', 'x'));
    const h = harness(save);
    h.q.start();
    h.dispatch({ type: 'select', qid: 'q1', option: 1 });
    await h.q.flush();
    expect(h.fatal).toEqual(['moved']);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(save).toHaveBeenCalledTimes(1);
    h.q.stop();
  });

  it('a finished attempt (409 closed / 404) is fatal "closed"; an expired sign-in is fatal "auth"', async () => {
    for (const [status, code, reason] of [[409, 'ATTEMPT_CLOSED', 'closed'], [404, 'NOT_FOUND', 'closed'], [401, 'UNAUTHENTICATED', 'auth']] as const) {
      const h = harness(vi.fn().mockRejectedValue(new ApiError(status, code, 'x')));
      h.q.start();
      await h.q.flush();
      expect(h.fatal).toEqual([reason]);
      h.q.stop();
    }
  });

  it('sends a heartbeat even with nothing to save', async () => {
    const save = vi.fn().mockResolvedValue(ok());
    const h = harness(save);
    h.q.start();
    await vi.advanceTimersByTimeAsync(10_100);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].answers).toEqual([]);
    h.q.stop();
  });

  it('server errors show "error" and retry with backoff', async () => {
    const save = vi.fn().mockRejectedValueOnce(new ApiError(500, 'HTTP_500', 'x')).mockResolvedValue(ok());
    const h = harness(save);
    h.q.start();
    h.dispatch({ type: 'select', qid: 'q1', option: 0 });
    await h.q.flush();
    expect(h.statuses.at(-1)).toBe('error');
    await vi.advanceTimersByTimeAsync(2100);
    expect(h.statuses.at(-1)).toBe('saved');
    h.q.stop();
  });
});
