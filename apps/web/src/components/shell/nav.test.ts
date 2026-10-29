import { describe, expect, it } from 'vitest';
import { isActive, NAV } from './nav';

const by = (href: string) => NAV.find((n) => n.href === href)!;
describe('isActive', () => {
  it('home is active only on the exact root', () => {
    expect(isActive(by('/'), '/')).toBe(true);
    expect(isActive(by('/'), '/tests')).toBe(false);
  });
  it('sections stay active on their sub-pages and related routes', () => {
    expect(isActive(by('/tests'), '/tests/123')).toBe(true);
    expect(isActive(by('/tests'), '/results/abc/review')).toBe(true);
    expect(isActive(by('/practice'), '/leaderboard')).toBe(true);
    expect(isActive(by('/me'), '/doubts/9')).toBe(true);
  });
  it('does not match a path that merely starts with the same letters', () => {
    expect(isActive(by('/tests'), '/testsuite')).toBe(false);
  });
});
