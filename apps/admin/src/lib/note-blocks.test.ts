import { describe, expect, it } from 'vitest';
import { blocksToText, textToBlocks } from './note-blocks';

describe('note blocks', () => {
  it('turns text into headings, paragraphs and list items', () => {
    expect(textToBlocks('# Rivers\n\nMahanadi is the longest\nriver of the state.\n\n- Hasdeo\n- Sheonath')).toEqual([
      { t: 'h', x: 'Rivers' },
      { t: 'p', x: 'Mahanadi is the longest river of the state.' },
      { t: 'li', x: 'Hasdeo' },
      { t: 'li', x: 'Sheonath' },
    ]);
  });
  it('ignores blank input and stray spaces', () => {
    expect(textToBlocks('  \n\n')).toEqual([]);
    expect(textToBlocks('  one  \n  two ')).toEqual([{ t: 'p', x: 'one two' }]);
  });
  it('round-trips', () => {
    const blocks = textToBlocks('# Title\n\nPara one.\n\nPara two.\n- a\n- b');
    expect(textToBlocks(blocksToText(blocks))).toEqual(blocks);
  });
  it('empty blocks give empty text', () => {
    expect(blocksToText(undefined)).toBe('');
    expect(blocksToText([])).toBe('');
  });
});
