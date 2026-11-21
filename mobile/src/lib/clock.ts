const IST = 5.5 * 3_600_000;

/** Milliseconds until the next midnight in India (when a day's streak is decided). */
export function msLeftToday(now = Date.now()): number {
  const d = new Date(now + IST);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - (now + IST);
}
/** "5h 12m" / "42m" */
export function hm(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}
/** 0 = Monday … 6 = Sunday, in India time. */
export function istWeekdayIndex(now = Date.now()): number {
  return (new Date(now + IST).getUTCDay() + 6) % 7;
}
export function istHour(now = Date.now()): number {
  return new Date(now + IST).getUTCHours();
}
