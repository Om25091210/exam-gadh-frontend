import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, CalendarCheck, ChevronDown, ChevronUp, ClipboardList, Coffee, Hourglass, Minus, Plus, RotateCcw, Target, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { ApiError, type MentorRequestView, type PlanTask, type StudyPlan } from '@eg/api';
import { Float, Reveal } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { C, shadow, type Tone } from '@/theme';
import { Badge, Button, Card, Chip, ErrorBox, Row, Screen, ScreenHeader, Section, Skeleton, Sticker, T } from '@/ui';

const TYPE: Record<PlanTask['type'], { icon: LucideIcon; tone: Tone; label: MessageKey }> = {
  study: { icon: BookOpen, tone: 'indigo', label: 'planner.type.study' },
  practice: { icon: Target, tone: 'mint', label: 'planner.type.practice' },
  revision: { icon: RotateCcw, tone: 'gold', label: 'planner.type.revision' },
  mock: { icon: ClipboardList, tone: 'pink', label: 'planner.type.mock' },
  rest: { icon: Coffee, tone: 'sky', label: 'planner.type.rest' },
};

function Task({ task }: { task: PlanTask }) {
  const { t, b } = useI18n();
  const k = TYPE[task.type];
  return (
    <Row style={{ paddingVertical: 6 }}>
      <Sticker icon={k.icon} tone={k.tone} size={42} />
      <View style={{ flex: 1 }}>
        <T v="h3" style={{ fontSize: 14 }} numberOfLines={2}>{b(task.titleEn, task.titleHi)}</T>
        <T v="small">{t(k.label)} · {t('planner.minutes', { n: task.minutes })}</T>
      </View>
    </Row>
  );
}

function PlanView({ plan }: { plan: StudyPlan }) {
  const { t, b, date, num } = useI18n();
  const [open, setOpen] = useState<number | null>(1);
  return (
    <>
      <Reveal>
        <LinearGradient colors={['#8A76FF', '#5A3DF0', '#2B1C86']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 20, ...shadow.lift }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>{t('planner.plan')}</Text>
          <Text style={{ color: C.white, fontSize: 28, fontWeight: '800', marginTop: 2 }}>{t('planner.total', { h: num(Math.round(plan.summary.studyMinutes / 60)), w: plan.summary.weeks })}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{date(plan.startDate)} → {date(plan.endDate)}</Text>
        </LinearGradient>
      </Reveal>
      <Section title={t('planner.plan')}>
        {plan.weeks.map((w, i) => (
          <Reveal key={w.week} delay={Math.min(i, 8) * 50} style={{ marginBottom: 10 }}>
            <Card>
              <Pressable onPress={() => setOpen(open === w.week ? null : w.week)} accessibilityRole="button" accessibilityState={{ expanded: open === w.week }}>
                <Row>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Row gap={8}>
                      <T v="h3">{t('planner.week', { n: w.week })}</T>
                      <Badge text={t(w.phase === 'learn' ? 'planner.phase.learn' : 'planner.phase.revise')} tone={w.phase === 'learn' ? 'indigo' : 'gold'} />
                    </Row>
                    {w.focus.length ? <T v="small" numberOfLines={2}>{t('planner.focus', { names: w.focus.map((f) => b(f.nameEn, f.nameHi)).join(', ') })}</T> : null}
                  </View>
                  {open === w.week ? <ChevronUp size={20} color={C.muted} /> : <ChevronDown size={20} color={C.muted} />}
                </Row>
              </Pressable>
              {open === w.week ? (
                <View style={{ marginTop: 10, gap: 10 }}>
                  {w.days.map((d) => (
                    <View key={d.date} style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 }}>
                      <T v="label">{date(d.date)} · {t('planner.minutes', { n: d.minutes })}</T>
                      {d.tasks.map((task, j) => <Task key={j} task={task} />)}
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          </Reveal>
        ))}
      </Section>
    </>
  );
}

function RequestForm({ onDone }: { onDone: () => void }) {
  const { t, b } = useI18n();
  const { api } = useAuth();
  const qc = useQueryClient();
  const exams = useQuery({ queryKey: ['exams'], queryFn: () => api.exams(), staleTime: 10 * 60_000 });
  const [examId, setExamId] = useState<string | null>(null);
  const [hours, setHours] = useState(4);
  const [examDate, setExamDate] = useState('');
  const chosen = examId ?? exams.data?.[0]?.id ?? null;
  const dateOk = examDate === '' || /^\d{4}-\d{2}-\d{2}$/.test(examDate);
  const go = useMutation({
    mutationFn: () => api.requestPlan({ examId: chosen!, hoursPerDay: hours, ...(examDate ? { examDate } : {}) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mentor'] });
      void qc.invalidateQueries({ queryKey: ['mentor-today'] });
      onDone();
    },
    onError: (e) => Alert.alert(e instanceof ApiError ? e.message : t('app.error')),
  });
  return (
    <Reveal>
      <Card style={{ gap: 14 }}>
        <T v="body">{t('planner.intro')}</T>
        <View style={{ gap: 8 }}>
          <T v="label">{t('planner.exam')}</T>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {(exams.data ?? []).map((e) => <Chip key={e.id} label={b(e.shortEn, e.shortHi)} active={chosen === e.id} onPress={() => setExamId(e.id)} />)}
          </Row>
        </View>
        <View style={{ gap: 8 }}>
          <T v="label">{t('planner.hours')}</T>
          <Row gap={16} style={{ alignSelf: 'center' }}>
            <Pressable onPress={() => setHours((h) => Math.max(1, h - 1))} accessibilityRole="button" accessibilityLabel="-" style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Minus size={20} color={C.primary} /></Pressable>
            <Text style={{ fontSize: 40, fontWeight: '800', color: C.ink, minWidth: 60, textAlign: 'center' }}>{hours}</Text>
            <Pressable onPress={() => setHours((h) => Math.min(12, h + 1))} accessibilityRole="button" accessibilityLabel="+" style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Plus size={20} color={C.primary} /></Pressable>
          </Row>
        </View>
        <View style={{ gap: 6 }}>
          <T v="label">{t('planner.examDate')}</T>
          <TextInput value={examDate} onChangeText={setExamDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.faint} keyboardType="numbers-and-punctuation" style={{ backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.ink, borderWidth: dateOk ? 0 : 2, borderColor: C.danger }} />
        </View>
        <Button title={t('planner.request')} icon={CalendarCheck} disabled={!chosen || !dateOk} loading={go.isPending} onPress={() => go.mutate()} />
      </Card>
    </Reveal>
  );
}

export default function Planner() {
  const { t, b } = useI18n();
  const { api } = useAuth();
  const [asking, setAsking] = useState(false);
  const mentor = useQuery({ queryKey: ['mentor'], queryFn: () => api.mentor() });
  const today = useQuery({ queryKey: ['mentor-today'], queryFn: () => api.mentorToday() });
  const reqs: MentorRequestView[] = [...(mentor.data?.requests ?? [])].sort((a, c) => c.createdAt.localeCompare(a.createdAt));
  const latest = reqs[0];
  const sent = reqs.find((r) => r.status === 'sent' && r.plan);
  const waiting = latest?.status === 'open';

  return (
    <Screen refreshing={mentor.isRefetching} onRefresh={() => { void mentor.refetch(); void today.refetch(); }} header={<ScreenHeader title={t('planner.title')} />} bottomPad={40}>
      {mentor.isLoading ? <><Skeleton h={140} /><Skeleton h={200} /></> : mentor.isError ? <ErrorBox message={t('app.error')} retryLabel={t('app.retry')} onRetry={() => void mentor.refetch()} /> : (
        <>
          {today.data?.day ? (
            <Reveal>
              <Card style={{ marginBottom: 14 }}>
                <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <T v="h2">{t('planner.today')}</T>
                  <Badge text={t('planner.minutes', { n: today.data.day.minutes })} tone="indigo" />
                </Row>
                {today.data.day.tasks.map((task, i) => <Task key={i} task={task} />)}
              </Card>
            </Reveal>
          ) : sent ? <T v="muted" center style={{ marginBottom: 12 }}>{t('planner.noPlanToday')}</T> : null}

          {asking || !latest ? (
            <RequestForm onDone={() => setAsking(false)} />
          ) : waiting ? (
            <Reveal>
              <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 26 }}>
                <Float amplitude={6}><Hourglass size={56} color={C.primary} /></Float>
                <T v="body" center>{t('planner.waiting')}</T>
              </Card>
            </Reveal>
          ) : null}

          {sent?.plan && !asking ? <PlanView plan={sent.plan} /> : null}
          {latest && !asking && !waiting ? <View style={{ marginTop: 16 }}><Button title={t('planner.newRequest')} variant="soft" onPress={() => setAsking(true)} /></View> : null}
        </>
      )}
    </Screen>
  );
}
