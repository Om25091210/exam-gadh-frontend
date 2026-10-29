import { ApiError, type SaveStateBody, type SaveStateResult } from '@eg/api';
import { compose, hasUnsaved, type Action, type ExamState } from './exam-state';

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'error';
export type FatalReason = 'moved' | 'closed' | 'auth';

export interface SaveQueueOptions {
  save: (body: SaveStateBody) => Promise<SaveStateResult>;
  getState: () => ExamState;
  dispatch: (a: Action) => void;
  /** first sequence number to use (above anything the server holds) */
  startSeq: number;
  onStatus: (s: SaveStatus) => void;
  onServer: (r: SaveStateResult) => void;
  onFatal: (r: FatalReason) => void;
  debounceMs?: number;
  heartbeatMs?: number;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
}

const BACKOFF_MS = [2000, 4000, 8000, 15000, 30000];

/**
 * Sends local edits to the server: debounced after each change, on a heartbeat (which also keeps the attempt lock
 * and re-syncs the timer), and straight away when the network returns. One request at a time so sequence numbers stay ordered.
 * A failed request changes nothing: the edits stay marked unsaved and are sent again.
 */
export class SaveQueue {
  private seq: number;
  private inflight: Promise<boolean> | null = null;
  private debounce: ReturnType<typeof setTimeout> | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private failures = 0;
  private stopped = false;
  // wrapped so the browser never sees them called as methods of this object ("Illegal invocation")
  private readonly st: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  private readonly ct: (id: ReturnType<typeof setTimeout>) => void;

  constructor(private readonly o: SaveQueueOptions) {
    this.seq = o.startSeq;
    const st = o.setTimeoutFn;
    const ct = o.clearTimeoutFn;
    this.st = (fn, ms) => (st ? st(fn, ms) : setTimeout(fn, ms));
    this.ct = (id) => (ct ? ct(id) : clearTimeout(id));
  }

  nextSeq = () => this.seq++;
  currentSeq = () => this.seq;

  start() {
    this.stopped = false;
    this.heartbeat = setInterval(() => void this.flush(), this.o.heartbeatMs ?? 20_000);
    if (typeof window !== 'undefined') window.addEventListener('online', this.onOnline);
  }

  stop() {
    this.stopped = true;
    if (this.debounce) this.ct(this.debounce);
    if (this.retry) this.ct(this.retry);
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (typeof window !== 'undefined') window.removeEventListener('online', this.onOnline);
  }

  private onOnline = () => {
    this.failures = 0;
    void this.flush();
  };

  /** Call after any local change. */
  schedule() {
    if (this.stopped) return;
    if (this.debounce) this.ct(this.debounce);
    this.debounce = this.st(() => void this.flush(), this.o.debounceMs ?? 1500);
  }

  /** Sends now. Resolves true when everything local is confirmed by the server. */
  flush(): Promise<boolean> {
    if (this.stopped) return Promise.resolve(false);
    if (this.inflight) return this.inflight.then(() => this.flush());
    this.inflight = this.run().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async run(): Promise<boolean> {
    if (this.debounce) {
      this.ct(this.debounce);
      this.debounce = null;
    }
    const state = this.o.getState();
    const { body, revs, navRev } = compose(state, this.nextSeq);
    this.o.onStatus('saving');
    try {
      const res = await this.o.save(body);
      this.failures = 0;
      // answers refused because their section is closed are refused for good, so they are acknowledged too (no endless retry)
      this.o.dispatch({ type: 'acked', revs, navRev });
      this.o.onServer(res);
      this.o.onStatus(hasUnsaved(this.o.getState()) ? 'saving' : 'saved');
      if (hasUnsaved(this.o.getState())) this.schedule();
      return !hasUnsaved(this.o.getState());
    } catch (e) {
      return this.fail(e);
    }
  }

  private fatal(reason: FatalReason): false {
    this.stop(); // nothing more may be sent for this attempt from this tab
    this.o.onFatal(reason);
    return false;
  }

  private fail(e: unknown): boolean {
    if (e instanceof ApiError) {
      if (e.status === 409 && (e.code === 'ATTEMPT_TAKEN_OVER' || e.code === 'ATTEMPT_IN_USE')) {
        return this.fatal('moved');
      }
      if (e.status === 409 && e.code === 'ATTEMPT_CLOSED') {
        return this.fatal('closed');
      }
      if (e.status === 401) {
        return this.fatal('auth');
      }
      if (e.status === 404) {
        return this.fatal('closed');
      }
    }
    const offline = e instanceof ApiError && e.isNetwork;
    this.o.onStatus(offline ? 'offline' : 'error');
    const wait = BACKOFF_MS[Math.min(this.failures++, BACKOFF_MS.length - 1)];
    if (this.retry) this.ct(this.retry);
    if (!this.stopped) this.retry = this.st(() => void this.flush(), wait);
    return false;
  }
}
