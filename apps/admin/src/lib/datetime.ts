/** ISO timestamp -> value for <input type="datetime-local"> in India time (the only time zone staff work in). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600_000);
  return d.toISOString().slice(0, 16);
}

/** datetime-local value (India time) -> ISO timestamp, or null when empty. */
export function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const t = Date.parse(`${v}:00.000Z`);
  return Number.isNaN(t) ? null : new Date(t - 5.5 * 3600_000).toISOString();
}

export const fmtDateTime = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '—');
export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }) : '—');
export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0 })}`;
