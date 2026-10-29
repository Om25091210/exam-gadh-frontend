import { ApiError } from '@eg/api';

/** Field-level problems the backend returns as `details: [{ field, problems[] }]`. */
export interface FieldProblem {
  field: string;
  problems: string[];
}

export function fieldProblems(e: unknown): FieldProblem[] {
  if (e instanceof ApiError && Array.isArray(e.details)) {
    return (e.details as unknown[]).flatMap((d) => (d && typeof d === 'object' && 'field' in d && 'problems' in d ? [d as FieldProblem] : []));
  }
  return [];
}

const MESSAGES: Record<string, string> = {
  PERMISSION_DENIED: 'You do not have permission to do that.',
  PERMISSION_UNDECLARED: 'This action is not available.',
  CSRF_INVALID: 'Your page was out of date. Reload and try again.',
  DUPLICATE_QUESTION: 'A question with the same text already exists.',
  CODE_IN_USE: 'That code is already used.',
  NOT_FOUND: 'Not found.',
  INVALID_CODE: 'That code is not correct.',
  WRONG_PASSWORD: 'The current password is wrong.',
  WEAK_PASSWORD: 'The new password is not strong enough.',
  SAME_PASSWORD: 'Choose a different password.',
  ACCOUNT_LOCKED: 'Too many wrong attempts. Try again later.',
  INVALID_CREDENTIALS: 'Email or password is not correct.',
};

/** Message for a thrown error. The backend's `code` decides; unknown codes fall back to its message, then a generic line. */
export function adminErrorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.isNetwork) return 'Could not reach the server. Check your connection and try again.';
    const problems = fieldProblems(e);
    if (problems.length) return problems.map((p) => `${p.field}: ${p.problems.join(', ')}`).join(' · ');
    return MESSAGES[e.code] ?? e.message ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}
