import { describe, expect, it } from 'vitest';
import { fromLocalInput, rupees, toLocalInput } from './datetime';

describe('datetime helpers', () => {
  it('converts between ISO and India-time inputs without drifting', () => {
    const iso = '2026-11-01T04:30:00.000Z';
    expect(toLocalInput(iso)).toBe('2026-11-01T10:00');
    expect(fromLocalInput('2026-11-01T10:00')).toBe(iso);
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
  });
  it('handles empty values', () => {
    expect(toLocalInput(null)).toBe('');
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('not a date')).toBeNull();
  });
  it('formats rupees from paise', () => {
    expect(rupees(39900)).toBe('₹399');
    expect(rupees(12345)).toBe('₹123.45');
  });
});
