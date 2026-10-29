import { describe, expect, it } from 'vitest';
import { bi, en, hi, translate } from './index';

describe('i18n', () => {
  it('Hindi and English have exactly the same keys', () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
  });

  it('no Hindi text is left empty or identical to a placeholder', () => {
    for (const [k, v] of Object.entries(hi)) expect(v.trim().length, k).toBeGreaterThan(0);
  });

  it('every placeholder in English appears in Hindi too', () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const k of Object.keys(en) as Array<keyof typeof en>) expect(vars(hi[k]), k).toEqual(vars(en[k]));
  });

  it('fills placeholders', () => {
    expect(translate('en', 'common.minutes', { n: 90 })).toBe('90 min');
    expect(translate('hi', 'home.series.progress', { done: 3, total: 10 })).toBe('10 में से 3 टेस्ट पूरे');
  });

  it('bilingual values fall back to the other language when one is empty', () => {
    expect(bi('hi', 'Hello', 'नमस्ते')).toBe('नमस्ते');
    expect(bi('hi', 'Hello', '')).toBe('Hello');
    expect(bi('en', '', 'नमस्ते')).toBe('नमस्ते');
    expect(bi('en', null, null)).toBe('');
  });
});
