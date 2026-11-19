import { Text, type StyleProp, type TextStyle } from 'react-native';

/** Question text uses [b] [i] [sub] [sup] markers. They become nested <Text> spans: never HTML. */
export function RichText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const parts: Array<{ s: string; b?: boolean; i?: boolean; sub?: boolean; sup?: boolean }> = [];
  const state = { b: false, i: false, sub: false, sup: false };
  const re = /\[(\/?)(b|i|sub|sup)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ s: text.slice(last, m.index), ...state });
    state[m[2] as 'b'] = m[1] !== '/';
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ s: text.slice(last), ...state });
  return (
    <Text style={style}>
      {parts.map((p, i) => (
        <Text key={i} style={[p.b && { fontWeight: '800' }, p.i && { fontStyle: 'italic' }, (p.sub || p.sup) && { fontSize: ((style as TextStyle | undefined)?.fontSize ?? 15) * 0.75 }]}>
          {p.s}
        </Text>
      ))}
    </Text>
  );
}
