import type { QuestionBodyInput, QuestionType } from '@eg/api';

/** Everything one language of a question can hold; which fields matter depends on the type. */
export interface LangForm {
  stem: string;
  assertion: string;
  reason: string;
  prompt: string;
  statements: string[];
  listA: string[];
  listB: string[];
  items: string[];
  options: [string, string, string, string];
  explanation: string;
}
export type Lang = 'hi' | 'en';

export const emptyLang = (): LangForm => ({ stem: '', assertion: '', reason: '', prompt: '', statements: ['', ''], listA: ['', '', ''], listB: ['', '', ''], items: ['', '', ''], options: ['', '', '', ''], explanation: '' });

/** Which fields the editor shows for a type. */
export const FIELDS: Record<QuestionType, Array<'stem' | 'assertion' | 'reason' | 'statements' | 'prompt' | 'listA' | 'listB' | 'items'>> = {
  single: ['stem'],
  passage: ['stem'],
  multi_statement: ['stem', 'statements', 'prompt'],
  match: ['stem', 'listA', 'listB'],
  assertion_reason: ['stem', 'assertion', 'reason'],
  chronology: ['stem', 'items'],
};

/** Allowed list sizes (mirrors the server's schema so most mistakes are caught while typing). */
export const LIST_LIMITS = { statements: [2, 6], listA: [2, 6], listB: [2, 6], items: [3, 6] } as const;

const filled = (a: string[]) => a.map((x) => x.trim()).filter(Boolean);

export function isLangBlank(l: LangForm, type: QuestionType): boolean {
  const f = FIELDS[type];
  return !l.explanation.trim() && !l.options.some((o) => o.trim()) && !f.some((k) => (Array.isArray(l[k]) ? filled(l[k] as string[]).length > 0 : String(l[k]).trim() !== ''));
}

/** Form -> the request body. A language with nothing typed is left out (the question is then single-language). */
export function toBody(type: QuestionType, form: Record<Lang, LangForm>): QuestionBodyInput {
  const out: QuestionBodyInput = {};
  for (const lang of ['en', 'hi'] as const) {
    const l = form[lang];
    if (isLangBlank(l, type)) continue;
    const body: Record<string, unknown> = { options: l.options.map((o) => o.trim()) };
    for (const k of FIELDS[type]) {
      const v = l[k];
      if (Array.isArray(v)) body[k] = filled(v);
      else if (String(v).trim()) body[k] = String(v).trim();
    }
    if (l.explanation.trim()) body.explanation = l.explanation.trim();
    (out as Record<string, unknown>)[lang] = body;
  }
  return out;
}

export function fromBody(type: QuestionType, body: QuestionBodyInput | undefined): Record<Lang, LangForm> {
  const read = (src: Record<string, unknown> | undefined): LangForm => {
    const l = emptyLang();
    if (!src) return l;
    const str = (k: string) => (typeof src[k] === 'string' ? (src[k] as string) : '');
    const arr = (k: string, min: number) => {
      const v = Array.isArray(src[k]) ? (src[k] as string[]) : [];
      return [...v, ...Array(Math.max(0, min - v.length)).fill('')];
    };
    l.stem = str('stem');
    l.assertion = str('assertion');
    l.reason = str('reason');
    l.prompt = str('prompt');
    l.explanation = str('explanation');
    l.statements = arr('statements', 2);
    l.listA = arr('listA', 3);
    l.listB = arr('listB', 3);
    l.items = arr('items', 3);
    const o = Array.isArray(src.options) ? (src.options as string[]) : [];
    l.options = [o[0] ?? '', o[1] ?? '', o[2] ?? '', o[3] ?? ''];
    void type;
    return l;
  };
  return { en: read(body?.en as Record<string, unknown> | undefined), hi: read(body?.hi as Record<string, unknown> | undefined) };
}

/** Wraps the selected text in a marker pair, e.g. [b]…[/b]. Returns the new text and where the selection should be. */
export function wrapMarker(text: string, start: number, end: number, marker: 'b' | 'i' | 'sub' | 'sup'): { text: string; start: number; end: number } {
  const open = `[${marker}]`;
  const close = `[/${marker}]`;
  return { text: text.slice(0, start) + open + text.slice(start, end) + close + text.slice(end), start: start + open.length, end: end + open.length };
}

export interface Completeness {
  missing: string[];
}
/** Quick checklist shown above Save: what is still empty for each language that has any text. */
export function completeness(type: QuestionType, form: Record<Lang, LangForm>): Completeness {
  const missing: string[] = [];
  for (const lang of ['en', 'hi'] as const) {
    const l = form[lang];
    if (isLangBlank(l, type)) continue;
    const name = lang === 'en' ? 'English' : 'Hindi';
    if (FIELDS[type].includes('stem') && type !== 'assertion_reason' && !l.stem.trim()) missing.push(`${name}: question text`);
    l.options.forEach((o, i) => { if (!o.trim()) missing.push(`${name}: option ${'ABCD'[i]}`); });
    if (type === 'assertion_reason') { if (!l.assertion.trim()) missing.push(`${name}: assertion`); if (!l.reason.trim()) missing.push(`${name}: reason`); }
    for (const k of ['statements', 'listA', 'listB', 'items'] as const) {
      if (!FIELDS[type].includes(k)) continue;
      const [min] = LIST_LIMITS[k];
      if (filled(l[k]).length < min) missing.push(`${name}: at least ${min} ${k === 'items' ? 'items' : k === 'statements' ? 'statements' : k === 'listA' ? 'items in List I' : 'items in List II'}`);
    }
  }
  if (!missing.length && isLangBlank(form.en, type) && isLangBlank(form.hi, type)) missing.push('Enter the question in Hindi or English');
  return { missing };
}
