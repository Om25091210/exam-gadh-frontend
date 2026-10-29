import { describe, expect, it } from 'vitest';
import { notificationHref } from './notification-link';

const id = '11111111-2222-4333-8444-555555555555';
describe('notificationHref', () => {
  it('routes each kind to its screen', () => {
    expect(notificationHref({ kind: 'result_ready', data: { attemptId: id } })).toBe(`/results/${id}`);
    expect(notificationHref({ kind: 'live_test', data: { testId: id } })).toBe(`/tests/${id}`);
    expect(notificationHref({ kind: 'doubt_answered', data: { doubtId: id } })).toBe(`/doubts/${id}`);
    expect(notificationHref({ kind: 'study_plan_ready', data: null })).toBe('/planner');
    expect(notificationHref({ kind: 'plan_expiring', data: null })).toBe('/plans');
  });
  it('never builds a link from malformed data (no path injection)', () => {
    expect(notificationHref({ kind: 'result_ready', data: { attemptId: '../../admin' } })).toBeNull();
    expect(notificationHref({ kind: 'result_ready', data: null })).toBeNull();
    expect(notificationHref({ kind: 'something_new', data: null })).toBeNull();
  });
});
