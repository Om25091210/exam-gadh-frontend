export type Block = { t: 'p' | 'li' | 'h'; x: string };

/**
 * Notes are edited as plain text and stored as blocks:
 *   a blank line separates paragraphs, "- text" is a list item, "# text" is a heading.
 */
export function textToBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ t: 'p', x: para.join(' ') });
    para = [];
  };
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith('# ')) {
      flush();
      blocks.push({ t: 'h', x: line.slice(2).trim() });
    } else if (line.startsWith('- ')) {
      flush();
      blocks.push({ t: 'li', x: line.slice(2).trim() });
    } else para.push(line);
  }
  flush();
  return blocks.filter((b) => b.x);
}

export function blocksToText(blocks: Block[] | undefined): string {
  if (!blocks?.length) return '';
  const out: string[] = [];
  blocks.forEach((b, i) => {
    if (b.t === 'li') out.push(`- ${b.x}`);
    else {
      if (i > 0) out.push('');
      out.push(b.t === 'h' ? `# ${b.x}` : b.x);
    }
  });
  return out.join('\n');
}
