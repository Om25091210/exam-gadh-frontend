import { describe, expect, it } from 'vitest';
import { completeness, emptyLang, fromBody, isLangBlank, toBody, wrapMarker, type LangForm } from './question-form';

const lang = (over: Partial<LangForm> = {}): LangForm => ({ ...emptyLang(), stem: 'Capital of CG?', options: ['Raipur', 'Bilaspur', 'Durg', 'Korba'], ...over });

describe('toBody', () => {
  it('leaves out a language with nothing typed', () => {
    const b = toBody('single', { en: lang(), hi: emptyLang() });
    expect(Object.keys(b)).toEqual(['en']);
    expect(b.en).toMatchObject({ stem: 'Capital of CG?', options: ['Raipur', 'Bilaspur', 'Durg', 'Korba'] });
  });
  it('only sends the fields of the chosen type, trimmed, without blank list entries', () => {
    const b = toBody('multi_statement', { en: lang({ statements: [' one ', '', 'two'], listA: ['ignored', '', ''], explanation: ' because ' }), hi: emptyLang() });
    expect(b.en).toMatchObject({ statements: ['one', 'two'], explanation: 'because' });
    expect(b.en).not.toHaveProperty('listA');
  });
  it('assertion-reason carries assertion and reason', () => {
    const b = toBody('assertion_reason', { en: lang({ stem: '', assertion: 'A is true', reason: 'because R' }), hi: emptyLang() });
    expect(b.en).toMatchObject({ assertion: 'A is true', reason: 'because R' });
    expect(b.en).not.toHaveProperty('stem');
  });
});

describe('fromBody', () => {
  it('round-trips and pads lists so there is always room to type', () => {
    const src = toBody('match', { en: lang({ listA: ['a', 'b', 'c'], listB: ['1', '2', '3'] }), hi: emptyLang() });
    const form = fromBody('match', src);
    expect(form.en.listA).toEqual(['a', 'b', 'c']);
    expect(form.hi.options).toEqual(['', '', '', '']);
    expect(toBody('match', form)).toEqual(src);
  });
  it('handles a missing body', () => {
    expect(fromBody('single', undefined).en.statements).toHaveLength(2);
  });
});

describe('completeness', () => {
  it('asks for the missing pieces of each language that has text', () => {
    const c = completeness('single', { en: lang({ options: ['a', '', 'c', 'd'] }), hi: emptyLang() });
    expect(c.missing).toEqual(['English: option B']);
  });
  it('a blank form asks for content', () => {
    expect(completeness('single', { en: emptyLang(), hi: emptyLang() }).missing).toEqual(['Enter the question in Hindi or English']);
  });
  it('list-based types need their minimum number of entries', () => {
    const c = completeness('chronology', { en: lang({ items: ['one', 'two', ''] }), hi: emptyLang() });
    expect(c.missing).toContain('English: at least 3 items');
    expect(completeness('chronology', { en: lang({ items: ['one', 'two', 'three'] }), hi: emptyLang() }).missing).toEqual([]);
  });
  it('is complete when both languages are filled', () => {
    expect(completeness('single', { en: lang(), hi: lang({ stem: 'छत्तीसगढ़ की राजधानी?', options: ['रायपुर', 'बिलासपुर', 'दुर्ग', 'कोरबा'] }) }).missing).toEqual([]);
  });
});

describe('isLangBlank / wrapMarker', () => {
  it('detects blank and non-blank languages', () => {
    expect(isLangBlank(emptyLang(), 'single')).toBe(true);
    expect(isLangBlank(lang(), 'single')).toBe(false);
  });
  it('wraps the selection in a marker pair and moves the selection with it', () => {
    expect(wrapMarker('H2O is water', 1, 2, 'sub')).toEqual({ text: 'H[sub]2[/sub]O is water', start: 6, end: 7 });
  });
});
