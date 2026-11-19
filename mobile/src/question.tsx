import type { Lang, QuestionLang } from '@eg/api';
import { Check, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/lib/i18n';
import { RichText } from '@/rich';
import { C } from '@/theme';
import { T } from '@/ui';

export interface QuestionLike {
  type: 'single' | 'multi_statement' | 'match' | 'assertion_reason' | 'chronology' | 'passage';
  en?: QuestionLang;
  hi?: QuestionLang;
  passage: { en?: string; hi?: string } | null;
}
const LETTERS = ['A', 'B', 'C', 'D'];

/** The language asked for, or the other one when the question has not been translated yet. */
export function pick(q: QuestionLike, lang: Lang): { body: QuestionLang | undefined; fellBack: boolean } {
  const want = q[lang];
  return want ? { body: want, fellBack: false } : { body: q[lang === 'hi' ? 'en' : 'hi'], fellBack: true };
}

const BODY = { fontSize: 17, lineHeight: 27, color: C.ink } as const;

export function QuestionBody({ q, lang }: { q: QuestionLike; lang: Lang }) {
  const { t } = useI18n();
  const { body, fellBack } = pick(q, lang);
  if (!body) return null;
  const passage = q.passage ? (q.passage[lang] ?? q.passage[lang === 'hi' ? 'en' : 'hi']) : null;
  return (
    <View style={{ gap: 12 }}>
      {fellBack ? <T v="small">{lang === 'hi' ? 'हिन्दी उपलब्ध नहीं है; अंग्रेज़ी दिखाई जा रही है।' : 'English is not available; showing Hindi.'}</T> : null}
      {passage ? (
        <View style={{ borderLeftWidth: 4, borderLeftColor: C.primary, backgroundColor: C.primarySofter, padding: 12, borderRadius: 12 }}>
          <T v="label">{t('exam.passage')}</T>
          <RichText text={passage} style={{ fontSize: 15, lineHeight: 24, color: C.ink2 }} />
        </View>
      ) : null}
      {q.type === 'assertion_reason' ? (
        <>
          {body.stem ? <RichText text={body.stem} style={BODY} /> : null}
          <Text style={BODY}><Text style={{ fontWeight: '800' }}>{t('exam.assertion')}: </Text>{body.assertion}</Text>
          <Text style={BODY}><Text style={{ fontWeight: '800' }}>{t('exam.reason')}: </Text>{body.reason}</Text>
        </>
      ) : (
        <RichText text={body.stem ?? ''} style={BODY} />
      )}
      {q.type === 'multi_statement' && body.statements ? (
        <View style={{ gap: 6 }}>
          {body.statements.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontWeight: '800', color: C.primaryDark, fontSize: 16 }}>{i + 1}.</Text>
              <View style={{ flex: 1 }}><RichText text={s} style={{ fontSize: 16, lineHeight: 25, color: C.ink }} /></View>
            </View>
          ))}
        </View>
      ) : null}
      {q.type === 'multi_statement' && body.prompt ? <RichText text={body.prompt} style={{ fontSize: 16, color: C.ink2 }} /> : null}
      {q.type === 'match' && body.listA && body.listB ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <T v="label">{t('exam.matchA')}</T>
            {body.listA.map((s, i) => <Text key={i} style={{ fontSize: 15, color: C.ink }}><Text style={{ fontWeight: '800' }}>{'ABCDEF'[i]}. </Text>{s}</Text>)}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <T v="label">{t('exam.matchB')}</T>
            {body.listB.map((s, i) => <Text key={i} style={{ fontSize: 15, color: C.ink }}><Text style={{ fontWeight: '800' }}>{i + 1}. </Text>{s}</Text>)}
          </View>
        </View>
      ) : null}
      {q.type === 'chronology' && body.items ? (
        <View style={{ gap: 4 }}>
          {body.items.map((s, i) => <Text key={i} style={{ fontSize: 16, color: C.ink }}><Text style={{ fontWeight: '800' }}>{i + 1}. </Text>{s}</Text>)}
        </View>
      ) : null}
    </View>
  );
}

/** Four options as large tappable cards. In review mode the right answer is green and the student's wrong pick red. */
export function Options({ q, lang, selected, onSelect, correct }: { q: QuestionLike; lang: Lang; selected: number | null; onSelect?: (i: number) => void; correct?: number }) {
  const { body } = pick(q, lang);
  if (!body) return null;
  const review = correct !== undefined;
  return (
    <View style={{ gap: 10 }}>
      {body.options.map((opt, i) => {
        const isSel = selected === i;
        const right = review && correct === i;
        const wrong = review && isSel && correct !== i;
        const border = right ? C.success : wrong ? C.danger : isSel ? C.primary : C.line;
        const bg = right ? C.successSoft : wrong ? C.dangerSoft : isSel ? C.primarySofter : C.white;
        return (
          <Pressable key={i} disabled={review} onPress={() => onSelect?.(i)} accessibilityRole="radio" accessibilityState={{ selected: isSel }} accessibilityLabel={`${LETTERS[i]}. ${opt}`} style={({ pressed }) => ({ transform: [{ scale: pressed && !review ? 0.985 : 1 }] })}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: border, backgroundColor: bg }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: isSel || right ? border : C.faint, backgroundColor: isSel && !review ? C.primary : right ? C.success : wrong ? C.danger : C.white, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '800', color: isSel || right || wrong ? C.white : C.muted }}>{LETTERS[i]}</Text>
              </View>
              <View style={{ flex: 1 }}><RichText text={opt} style={{ fontSize: 16, lineHeight: 24, color: C.ink }} /></View>
              {right ? <Check size={20} color={C.success} /> : wrong ? <X size={20} color={C.danger} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
