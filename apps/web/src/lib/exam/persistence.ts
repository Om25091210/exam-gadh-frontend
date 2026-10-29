import { del, get, set } from 'idb-keyval';
import type { Snapshot } from './exam-state';

const key = (attemptId: string) => `eg:attempt:${attemptId}`;

/** IndexedDB can be blocked (private mode, storage pressure); every call fails soft so the exam keeps working in memory. */
export interface SnapshotStore {
  load(attemptId: string): Promise<Snapshot | null>;
  save(s: Snapshot): Promise<void>;
  clear(attemptId: string): Promise<void>;
}

export const idbStore: SnapshotStore = {
  async load(id) {
    try {
      const s = (await get(key(id))) as Snapshot | undefined;
      return s && s.v === 1 && s.attemptId === id ? s : null;
    } catch {
      return null;
    }
  },
  async save(s) {
    try {
      await set(key(s.attemptId), s);
    } catch {
      /* ignore: memory copy still works */
    }
  },
  async clear(id) {
    try {
      await del(key(id));
    } catch {
      /* ignore */
    }
  },
};
