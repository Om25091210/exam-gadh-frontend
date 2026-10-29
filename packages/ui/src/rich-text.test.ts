import { describe, expect, it } from 'vitest';
import { parseRich } from './rich-text';

describe('parseRich', () => {
  it('plain text stays one node', () => {
    expect(parseRich('hello')).toEqual(['hello']);
  });
  it('nests markers and splits lines into breaks', () => {
    expect(parseRich('H[sub]2[/sub]O is [b]very [i]common[/i][/b]\nnext')).toEqual([
      'H', { tag: 'sub', children: ['2'] }, 'O is ', { tag: 'b', children: ['very ', { tag: 'i', children: ['common'] }] }, { br: true }, 'next',
    ]);
  });
  it('ignores unmatched closers and closes unclosed markers', () => {
    expect(parseRich('a[/b]b[i]c')).toEqual(['a', 'b', { tag: 'i', children: ['c'] }]);
  });
  it('leaves raw angle brackets and scripts as plain text (they are rendered as text, not HTML)', () => {
    expect(parseRich('<script>alert(1)</script>')).toEqual(['<script>alert(1)</script>']);
  });
  it('unknown markers are text', () => {
    expect(parseRich('[u]x[/u]')).toEqual(['[u]x[/u]']);
  });
});
