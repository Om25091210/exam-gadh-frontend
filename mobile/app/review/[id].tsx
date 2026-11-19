import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Options, pick, QuestionBody } from '@/question';
import { RichText } from '@/rich';
import { C } from '@/theme';
import { Badge, Card, ErrorBox, Row, Screen, ScreenHeader, Skeleton, T } from '@/ui';
import { View } from 'react-native';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, num } = useI18n();
  const { api } = useAuth();
  const q = useQuery({ queryKey: ['review', id], queryFn: () => api.review(id) });
  return (
    <Screen header={<ScreenHeader title={t('app.result.review')} />} bottomPad={40}>
      {q.isLoading ? <><Skeleton h={200} /><Skeleton h={200} /></> : q.isError || !q.data ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void q.refetch()} /> : q.data.questions.map((r, i) => {
        const { body } = pick(r, lang);
        return (
          <Card key={r.qid} style={{ marginBottom: 14, gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T v="label">{t('app.questionsLabel', { n: i + 1, total: q.data.questions.length })}</T>
              <Badge text={r.outcome === 'correct' ? t('app.result.correct') : r.outcome === 'wrong' ? t('app.result.wrong') : t('app.result.skipped')} tone={r.outcome === 'correct' ? 'mint' : r.outcome === 'wrong' ? 'red' : 'gray'} />
            </Row>
            <QuestionBody q={r} lang={lang} />
            <Options q={r} lang={lang} selected={r.selected} correct={r.correctOption} />
            <T v="small">{num(r.marksAwarded, 2)} · {r.timeSpentSec}s</T>
            {body?.explanation ? (
              <View style={{ backgroundColor: C.primarySofter, borderRadius: 16, padding: 12 }}>
                <T v="label">{t('app.result.explanation')}</T>
                <RichText text={body.explanation} style={{ fontSize: 15, lineHeight: 24, color: C.ink2, marginTop: 4 }} />
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}
