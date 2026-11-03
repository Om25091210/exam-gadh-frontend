import { describe, expect, it } from 'vitest';
import { isActive, NAV } from './nav';

const by = (href: string) => NAV.find((n) => n.href === href)!;
describe('isActive', () => {
  it('journey is active on the root and on the pages reached from the map', () => {
    expect(isActive(by('/'), '/')).toBe(true);
    expect(isActive(by('/'), '/tests/123')).toBe(true);
    expect(isActive(by('/'), '/results/abc/review')).toBe(true);
    expect(isActive(by('/'), '/learn/ca')).toBe(true);
    expect(isActive(by('/'), '/leaderboard')).toBe(false);
  });
  it('other tabs stay active on their sub-pages and related routes', () => {
    expect(isActive(by('/planner'), '/doubts/9')).toBe(true);
    expect(isActive(by('/me'), '/plans')).toBe(true);
    expect(isActive(by('/leaderboard'), '/leaderboard')).toBe(true);
  });
  it('does not match a path that merely starts with the same letters', () => {
    expect(isActive(by('/'), '/testsuite')).toBe(false);
  });
});
