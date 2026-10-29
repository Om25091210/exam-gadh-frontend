import { describe, expect, it } from 'vitest';
import { ServerClock } from './server-clock';

describe('ServerClock', () => {
  it('counts down from the server remaining time using the monotonic clock', () => {
    let mono = 1000;
    const c = new ServerClock(() => mono);
    c.sync('2026-10-29T10:00:00.000Z', 600);
    expect(c.remainingSec()).toBe(600);
    mono += 90_500;
    expect(c.remainingSec()).toBe(510);
    mono += 600_000;
    expect(c.remainingMs()).toBe(0);
  });
  it('a resync replaces the local estimate (e.g. after a long offline spell)', () => {
    let mono = 0;
    const c = new ServerClock(() => mono);
    c.sync('2026-10-29T10:00:00.000Z', 600);
    mono += 100_000;
    c.sync('2026-10-29T10:03:00.000Z', 420);
    expect(c.remainingSec()).toBe(420);
  });
  it('estimates server time and seconds until a section ends', () => {
    let mono = 0;
    const c = new ServerClock(() => mono);
    c.sync('2026-10-29T10:00:00.000Z', 3600);
    mono += 30_000;
    expect(new Date(c.serverNow()).toISOString()).toBe('2026-10-29T10:00:30.000Z');
    expect(c.secondsUntil('2026-10-29T10:10:00.000Z')).toBe(570);
    expect(c.secondsUntil('2026-10-29T09:00:00.000Z')).toBe(0);
  });
});
