import { Text, type StyleProp, type TextStyle } from 'react-native';

type Flags = { b: boolean; i: boolean; k: boolean; h: boolean; sub: boolean; sup: boolean };
const KEY_COLOR = '#C92A2A'; // [k] key term
const NOTE_COLOR = '#1C5DBA'; // [h] highlighted note

/** Text uses [b] [i] [k] (key term) [h] (note) [sub] [sup] markers. They become nested <Text> spans: never HTML. */
export function RichText({ text: raw, style }: { text?: string | null; style?: StyleProp<TextStyle> }) {
  const text = typeof raw === "string" ? raw : "";
  const parts: Array<{ s: string } & Flags> = [];
  const state: Flags = { b: false, i: false, k: false, h: false, sub: false, sup: false };
  const re = /\[(\/?)(b|i|k|h|sub|sup)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ s: text.slice(last, m.index), ...state });
    state[m[2] as keyof Flags] = m[1] !== '/';
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ s: text.slice(last), ...state });
  const base = (style as TextStyle | undefined)?.fontSize ?? 15;
  return (
    <Text style={style}>
      {parts.map((p, i) => (
        <Text key={i} style={[(p.b || p.k) && { fontWeight: '800' }, p.i && { fontStyle: 'italic' }, p.k && { color: KEY_COLOR }, p.h && { color: NOTE_COLOR, fontWeight: '700' }, (p.sub || p.sup) && { fontSize: base * 0.75 }]}>
          {p.s}
        </Text>
      ))}
    </Text>
  );
}

/** Plain text of a marked-up string (for search). */
export const stripMarks = (s: string) => s.replace(/\[\/?(b|i|k|h|sub|sup)\]/g, '');
