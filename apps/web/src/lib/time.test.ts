import { describe, expect, it } from 'vitest';
import { formatClock, formatSpent } from './time';

describe('formatClock', () => {
  it('formats minutes and hours', () => {
    expect(formatClock(125)).toBe('2:05');
    expect(formatClock(5025)).toBe('1:23:45');
    expect(formatClock(3600)).toBe('1:00:00');
    expect(formatClock(9)).toBe('0:09');
  });
  it('never goes negative', () => {
    expect(formatClock(-5)).toBe('0:00');
  });
});
describe('formatSpent', () => {
  it('reads naturally', () => {
    expect(formatSpent(3725)).toBe('1 h 2 min');
    expect(formatSpent(95)).toBe('1 min 35 s');
    expect(formatSpent(120)).toBe('2 min');
    expect(formatSpent(7)).toBe('7 s');
  });
});
