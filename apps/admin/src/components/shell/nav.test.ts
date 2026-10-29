import { describe, expect, it } from 'vitest';
import { isActive, NAV_GROUPS, visibleNav } from './nav';

describe('visibleNav', () => {
  it('shows only what the role can open and drops empty groups', () => {
    const support = new Set(['users:read', 'orders:read', 'doubts:read', 'reports:read']);
    const groups = visibleNav((p) => support.has(p));
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain('/users');
    expect(hrefs).toContain('/doubts');
    expect(hrefs).not.toContain('/questions');
    expect(hrefs).not.toContain('/settings');
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
  });
  it('a super admin sees every item', () => {
    const all = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    expect(visibleNav(() => true).flatMap((g) => g.items.map((i) => i.href))).toEqual(all);
  });
  it('every item asks for a real permission name', () => {
    for (const g of NAV_GROUPS) for (const i of g.items) expect(i.permission).toMatch(/^[a-z-]+:[a-z-]+$/);
  });
});
describe('isActive', () => {
  it('matches the page and its children only', () => {
    expect(isActive('/tests', '/tests')).toBe(true);
    expect(isActive('/tests', '/tests/123/builder')).toBe(true);
    expect(isActive('/tests', '/testsuite')).toBe(false);
  });
});
