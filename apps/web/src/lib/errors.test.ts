import { ApiError } from '@eg/api';
import { describe, expect, it } from 'vitest';
import { errorKey } from './errors';

describe('errorKey', () => {
  it('maps known backend codes to translated messages', () => {
    expect(errorKey(new ApiError(403, 'PAYMENT_REQUIRED', 'x'))).toBe('error.PAYMENT_REQUIRED');
    expect(errorKey(new ApiError(409, 'ATTEMPT_LIMIT', 'x'))).toBe('error.ATTEMPT_LIMIT');
  });
  it('network failures and unknown errors get safe messages', () => {
    expect(errorKey(new ApiError(0, 'NETWORK', 'x'))).toBe('common.error.network');
    expect(errorKey(new ApiError(500, 'SOMETHING_NEW', 'internal detail'))).toBe('common.error.generic');
    expect(errorKey(new Error('boom'))).toBe('common.error.generic');
  });
});
