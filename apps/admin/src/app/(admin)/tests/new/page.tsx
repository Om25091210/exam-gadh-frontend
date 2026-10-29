'use client';
import type { TestKindName, VersionConfig } from '@eg/api';
import { Alert, Button, Card, Field, Input, PageHeader, Select } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfigFields } from '@/components/tests/config-fields';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const KINDS: Array<[TestKindName, string]> = [['mock', 'Full mock'], ['topic', 'Topic test'], ['subject', 'Subject test'], ['pyq', 'Previous year paper'], ['csat', 'CSAT'], ['sectional', 'Sectional'], ['daily', 'Daily quiz'], ['live', 'Live test'], ['diagnostic', 'Diagnostic']];

export default function NewTestPage() {
  const { api } = useAdmin();
  const router = useRouter();
  const qc = useQueryClient();
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });
  const [examId, setExamId] = useState('');
  const [paperId, setPaperId] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [kind, setKind] = useState<TestKindName>('mock');
  const [access, setAccess] = useState<'free' | 'paid'>('free');
  const [topicCode, setTopicCode] = useState('');
  const [pyqYear, setPyqYear] = useState('');
  const [config, setConfig] = useState<Partial<VersionConfig>>({ shuffleQuestions: true, countsTowardMerit: true });

  const exam = tree.data?.exams.find((e) => e.id === examId);
  const paper = exam?.papers.find((p) => p.id === paperId);
  const live = kind === 'live';

  const pickPaper = (id: string) => {
    setPaperId(id);
    const p = exam?.papers.find((x) => x.id === id);
    if (p) setConfig((c) => ({ ...c, durationMin: p.durationMin, correctMarks: p.correctMarks, negativeFraction: Math.round(p.negativeFraction * 100) / 100, qualifyingPct: p.qualifyingPct, qualifyingPctReserved: p.qualifyingPctReserved, countsTowardMerit: p.countsTowardMerit }));
  };

  const create = useMutation({
    mutationFn: () => api.createTest({ examId, paperId: paperId || undefined, titleEn: titleEn.trim(), titleHi: titleHi.trim(), kind, mode: live ? 'live' : 'static', access, topicCode: topicCode || undefined, pyqYear: kind === 'pyq' && pyqYear ? Number(pyqYear) : undefined, config }),
    onSuccess: (r) => { void qc.invalidateQueries({ queryKey: ['admin-tests'] }); router.replace(`/tests/${r.test.id}`); },
  });

  const ready = examId && titleEn.trim() && titleHi.trim() && (paperId || config.durationMin) && (!live || config.startsAt);
  return (
    <>
      <PageHeader title="New test" subtitle="Start from an exam paper pattern; you can change everything before publishing. You add the questions next." />
      <div className="space-y-4">
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Exam *">{(p) => <Select {...p} value={examId} onChange={(e) => { setExamId(e.target.value); setPaperId(''); }}><option value="">Choose an exam</option>{tree.data?.exams.map((e) => <option key={e.id} value={e.id}>{e.nameEn}</option>)}</Select>}</Field>
          <Field label="Paper pattern" hint={paper && !exam?.patternVerified ? 'Pattern not yet verified against the official notification.' : 'Fills in the duration and marking below.'}>{(p) => <Select {...p} value={paperId} onChange={(e) => pickPaper(e.target.value)} disabled={!exam}><option value="">None (set by hand)</option>{exam?.papers.map((x) => <option key={x.id} value={x.id}>{x.nameEn} ({x.questionCount} q, {x.durationMin} min)</option>)}</Select>}</Field>
          <Field label="Title (Hindi) *">{(p) => <Input {...p} lang="hi" value={titleHi} onChange={(e) => setTitleHi(e.target.value)} maxLength={200} />}</Field>
          <Field label="Title (English) *">{(p) => <Input {...p} lang="en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} maxLength={200} />}</Field>
          <Field label="Type">{(p) => <Select {...p} value={kind} onChange={(e) => setKind(e.target.value as TestKindName)}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>}</Field>
          <Field label="Access">{(p) => <Select {...p} value={access} onChange={(e) => setAccess(e.target.value as 'free' | 'paid')}><option value="free">Free</option><option value="paid">Paid</option></Select>}</Field>
          {kind === 'topic' || kind === 'subject' ? <Field label="Topic">{(p) => <Select {...p} value={topicCode} onChange={(e) => setTopicCode(e.target.value)}><option value="">—</option>{tree.data?.subjects.flatMap((s) => s.topics).map((t) => <option key={t.code} value={t.code}>{t.nameEn}</option>)}</Select>}</Field> : null}
          {kind === 'pyq' ? <Field label="Year">{(p) => <Input {...p} type="number" min={1950} max={2100} value={pyqYear} onChange={(e) => setPyqYear(e.target.value)} />}</Field> : null}
        </Card>
        <Card><h2 className="mb-3 font-semibold">Timing and marking</h2><ConfigFields value={config} onChange={setConfig} live={live} /></Card>
        {create.isError ? <Alert tone="danger">{adminErrorText(create.error)}</Alert> : null}
        <Button size="lg" disabled={!ready} loading={create.isPending} onClick={() => create.mutate()}>Create test and add questions</Button>
      </div>
    </>
  );
}
