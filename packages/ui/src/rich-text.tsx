import { createElement, Fragment, type ReactNode } from 'react';

type Marker = 'b' | 'i' | 'sub' | 'sup';
const TAG: Record<Marker, string> = { b: 'strong', i: 'em', sub: 'sub', sup: 'sup' };
const TOKEN = /\[(\/?)(b|i|sub|sup)\]/g;

export type RichNode = string | { tag: Marker; children: RichNode[] } | { br: true };

/**
 * Question and note text uses a tiny marker syntax ([b] [i] [sub] [sup]); there is no HTML.
 * This turns it into a node tree. Unmatched closers are ignored and unclosed markers are closed at the end,
 * so any input renders safely.
 */
export function parseRich(input: string): RichNode[] {
  const root: RichNode[] = [];
  const stack: Array<{ tag: Marker; children: RichNode[] }> = [];
  const current = () => (stack.length ? stack[stack.length - 1].children : root);
  const pushText = (text: string) => {
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (i > 0) current().push({ br: true });
      if (line) current().push(line);
    });
  };
  let last = 0;
  for (const m of input.matchAll(TOKEN)) {
    pushText(input.slice(last, m.index));
    last = m.index! + m[0].length;
    const [, closing, tag] = m;
    if (!closing) {
      const node = { tag: tag as Marker, children: [] as RichNode[] };
      current().push(node);
      stack.push(node);
    } else {
      const at = stack.map((s) => s.tag).lastIndexOf(tag as Marker);
      if (at >= 0) stack.length = at; // closes it and anything left open inside it
    }
  }
  pushText(input.slice(last));
  return root;
}

function toElements(nodes: RichNode[], keyPrefix = ''): ReactNode[] {
  return nodes.map((n, i) => {
    const key = `${keyPrefix}${i}`;
    if (typeof n === 'string') return createElement(Fragment, { key }, n);
    if ('br' in n) return createElement('br', { key });
    return createElement(TAG[n.tag], { key }, ...toElements(n.children, `${key}.`));
  });
}

/** Renders marker text as React elements. Never uses dangerouslySetInnerHTML. */
export function RichText({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  return createElement('span', { className }, ...toElements(parseRich(text)));
}
