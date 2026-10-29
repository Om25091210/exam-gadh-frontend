import { ApiError } from '@eg/api';
import type { MessageKey } from '@eg/i18n';

const KNOWN = new Set(['PAYMENT_REQUIRED', 'NOT_OPEN', 'ATTEMPT_LIMIT', 'ENTRY_CLOSED', 'ATTEMPT_IN_USE', 'NOT_FOUND', 'RESULT_NOT_RELEASED', 'ALREADY_REPORTED', 'NOT_ENOUGH_QUESTIONS', 'PRACTICE_LIMIT', 'ALREADY_ENROLLED', 'DOUBT_DAILY_QUOTA', 'DOUBT_FREE_QUOTA', 'DOUBT_CLOSED', 'INVALID_ATTACHMENT', 'MENTOR_REQUEST_OPEN', 'INVALID_EXAM_DATE', 'INVALID_COUPON', 'COUPON_USED']);

/** Turns any thrown value into a translated message. The backend's `code` is the contract; its English `message` is never shown. */
export function errorKey(e: unknown): MessageKey {
  if (e instanceof ApiError) {
    if (e.isNetwork) return 'common.error.network';
    if (KNOWN.has(e.code)) return `error.${e.code}` as MessageKey;
  }
  return 'common.error.generic';
}
