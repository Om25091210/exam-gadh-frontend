import type { AppNotification } from '@eg/api';

/** Where tapping a notification should go. Unknown kinds go nowhere (the card is just informational). */
export function notificationHref(n: Pick<AppNotification, 'kind' | 'data'>): string | null {
  const d = (n.data ?? {}) as Record<string, unknown>;
  const uuid = (v: unknown) => (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? v : null);
  switch (n.kind) {
    case 'result_ready':
      return uuid(d.attemptId) ? `/results/${d.attemptId}` : null;
    case 'live_test':
      return uuid(d.testId) ? `/tests/${d.testId}` : null;
    case 'doubt_answered':
      return uuid(d.doubtId) ? `/doubts/${d.doubtId}` : null;
    case 'study_plan_ready':
      return '/planner';
    case 'plan_expiring':
      return '/plans';
    case 'announcement':
      return '/learn/updates';
    default:
      return null;
  }
}
