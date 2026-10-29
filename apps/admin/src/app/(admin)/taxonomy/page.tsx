'use client';
import type { TaxExam, TaxExamPaper } from '@eg/api';
import { Alert, Badge, Button, Card, Checkbox, ErrorState, Modal, PageHeader, Skeleton, Tabs, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm';
import { EditDialog, type FieldSpec } from '@/components/schema-form';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const examFields: FieldSpec[] = [
  { key: 'id', label: 'Id', type: 'text', required: true, createOnly: true, hint: 'Short and permanent, e.g. cgpsc' },
  { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
  { key: 'nameHi', label: 'Name (Hindi)', type: 'text', required: true, lang: 'hi' },
  { key: 'shortEn', label: 'Short name (English)', type: 'text', required: true },
  { key: 'shortHi', label: 'Short name (Hindi)', type: 'text', required: true, lang: 'hi' },
  { key: 'sort', label: 'Order', type: 'number' },
  { key: 'hasMains', label: 'Has a mains stage', type: 'checkbox' },
  { key: 'active', label: 'Active (visible to students)', type: 'checkbox' },
];
const paperFields: FieldSpec[] = [
  { key: 'code', label: 'Code', type: 'text', required: true, hint: 'e.g. PRE_GS' },
  { key: 'stage', label: 'Stage', type: 'select', required: true, options: [['prelims', 'Prelims'], ['mains', 'Mains'], ['interview', 'Interview']] },
  { key: 'nameEn', label: 'Name (English)', type: 'text', required: true },
  { key: 'nameHi', label: 'Name (Hindi)', type: 'text', required: true, lang: 'hi' },
  { key: 'questionCount', label: 'Number of questions', type: 'number', required: true, min: 1 },
  { key: 'totalMarks', label: 'Total marks', type: 'number', required: true, min: 1 },
  { key: 'durationMin', label: 'Duration (minutes)', type: 'number', required: true, min: 1 },
  { key: 'correctMarks', label: 'Marks per correct answer', type: 'number', required: true, step: 0.25 },
  { key: 'negativeFraction', label: 'Negative marking (fraction)', type: 'number', required: true, step: 0.01, min: 0, max: 1, hint: '0.33 = one third of the marks' },
  { key: 'qualifyingPct', label: 'Qualifying % (general)', type: 'number', hint: 'Only for qualifying-only papers' },
  { key: 'qualifyingPctReserved', label: 'Qualifying % (reserved)', type: 'number' },
  { key: 'countsTowardMerit', label: 'Counts toward merit', type: 'checkbox' },
  { key: 'active', label: 'Active', type: 'checkbox' },
  { key: 'sort', label: 'Order', type: 'number' },
];
const verifyFields: FieldSpec[] = [
  { key: 'sourceUrl', label: 'Link to the official notification', type: 'url', required: true, hint: 'The page you checked the numbers against' },
  { key: 'note', label: 'Note (optional)', type: 'text' },
];
const subjectFields: FieldSpec[] = [{ key: 'code', label: 'Code', type: 'text', required: true, createOnly: true, hint: 'Capital letters and underscores, e.g. POLITY' }, { key: 'nameEn', label: 'Name (English)', type: 'text', required: true }, { key: 'nameHi', label: 'Name (Hindi)', type: 'text', required: true, lang: 'hi' }, { key: 'sort', label: 'Order', type: 'number' }];
const topicFields: FieldSpec[] = [...subjectFields, { key: 'weight', label: 'Weight', type: 'number', step: 0.1, min: 0.1, max: 10, hint: 'How much this topic counts in study plans (1 = normal)' }];
const subtopicFields: FieldSpec[] = subjectFields;

type Dlg = { kind: 'exam'; exam?: TaxExam } | { kind: 'paper'; examId: string; paper?: TaxExamPaper } | { kind: 'verify'; exam: TaxExam } | { kind: 'subjects'; paper: TaxExamPaper } | { kind: 'tax'; level: 'subjects' | 'topics' | 'subtopics'; parent?: string; row?: Record<string, unknown> } | { kind: 'delete'; label: string; run: () => Promise<unknown> } | null;

export default function TaxonomyPage() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<'exams' | 'topics'>('exams');
  const [dlg, setDlg] = useState<Dlg>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy() });
  const done = (msg: string) => { toast.show(msg, 'success'); setDlg(null); void qc.invalidateQueries({ queryKey: ['taxonomy'] }); };
  const del = useMutation({ mutationFn: (run: () => Promise<unknown>) => run(), onSuccess: () => done('Deleted'), onError: (e) => { setDlg(null); toast.show(adminErrorText(e), 'danger'); } });
  const saveSubjects = useMutation({ mutationFn: (v: { id: string; codes: string[] }) => api.setPaperSubjects(v.id, v.codes), onSuccess: () => done('Subjects updated'), onError: (e) => toast.show(adminErrorText(e), 'danger') });

  if (tree.isLoading) return <Skeleton className="h-64" />;
  if (tree.isError || !tree.data) return <ErrorState message={adminErrorText(tree.error)} onRetry={() => tree.refetch()} />;
  const canExam = can('exam-config:write');
  const canTax = can('taxonomy:write');

  return (
    <>
      <PageHeader title="Exams and topics" subtitle="Exam patterns (marks, timing, negative marking) are data you can edit here. Confirm each pattern against the official notification." actions={tab === 'exams' && canExam ? <Button onClick={() => setDlg({ kind: 'exam' })}>Add exam</Button> : tab === 'topics' && canTax ? <Button onClick={() => setDlg({ kind: 'tax', level: 'subjects' })}>Add subject</Button> : undefined} />
      <Tabs label="Section" value={tab} onChange={(v) => setTab(v as typeof tab)} items={[{ id: 'exams', label: 'Exams and papers' }, { id: 'topics', label: 'Subjects and topics' }]} />
      <div className="mt-4 space-y-4">
        {tab === 'exams' ? tree.data.exams.map((e) => (
          <Card key={e.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h2 className="text-lg font-bold">{e.nameEn} <span className="font-normal text-ink-500">({e.id})</span></h2><p lang="hi" className="text-ink-700">{e.nameHi}</p></div>
              <div className="flex flex-wrap items-center gap-2">
                {e.patternVerified ? <Badge tone="success">pattern verified</Badge> : <Badge tone="warning">pattern not verified</Badge>}
                {!e.active ? <Badge tone="danger">inactive</Badge> : null}
                {canExam ? <><Button size="sm" variant="secondary" onClick={() => setDlg({ kind: 'verify', exam: e })}>Mark verified</Button><Button size="sm" variant="secondary" onClick={() => setDlg({ kind: 'exam', exam: e })}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'delete', label: `exam ${e.id}`, run: () => api.deleteExam(e.id) })}>Delete</Button></> : null}
              </div>
            </div>
            {e.patternNote ? <p className="text-sm text-ink-500">{e.patternNote}</p> : null}
            {e.patternSourceUrl ? <a href={e.patternSourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-700 underline">Verified against</a> : null}
            <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-sm"><thead className="text-ink-500"><tr><th className="py-1 pr-3">Paper</th><th className="pr-3">Questions</th><th className="pr-3">Marks</th><th className="pr-3">Minutes</th><th className="pr-3">Negative</th><th className="pr-3">Qualifying</th><th /></tr></thead><tbody>
              {e.papers.map((p) => (
                <tr key={p.id} className="border-t border-line"><td className="py-2 pr-3"><span className="font-semibold">{p.nameEn}</span> <span className="text-ink-500">{p.code} · {p.stage}</span>{!p.active ? <Badge tone="danger" className="ml-1">inactive</Badge> : null}</td><td className="pr-3">{p.questionCount}</td><td className="pr-3">{p.totalMarks}</td><td className="pr-3">{p.durationMin}</td><td className="pr-3">{p.negativeFraction > 0 ? p.negativeFraction.toFixed(2) : 'none'}</td><td className="pr-3">{p.qualifyingPct != null ? `${p.qualifyingPct}%${p.qualifyingPctReserved != null ? ` / ${p.qualifyingPctReserved}%` : ''}` : '—'}</td>
                  <td className="whitespace-nowrap py-2 text-right">{canExam ? <><Button size="sm" variant="ghost" onClick={() => { setPicked(new Set(p.subjects.map((s) => s.subjectCode))); setDlg({ kind: 'subjects', paper: p }); }}>Subjects ({p.subjects.length})</Button><Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'paper', examId: e.id, paper: p })}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'delete', label: `paper ${p.code}`, run: () => api.deletePaper(p.id) })}>Delete</Button></> : null}</td></tr>
              ))}
            </tbody></table></div>
            {canExam ? <Button size="sm" variant="secondary" onClick={() => setDlg({ kind: 'paper', examId: e.id })}>Add paper</Button> : null}
          </Card>
        )) : tree.data.subjects.map((s) => (
          <Card key={s.code} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{s.nameEn} <span lang="hi" className="font-normal text-ink-700">· {s.nameHi}</span> <span className="text-sm font-normal text-ink-500">{s.code}</span></h2>
              {canTax ? <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setDlg({ kind: 'tax', level: 'topics', parent: s.code })}>Add topic</Button><Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'tax', level: 'subjects', row: s as unknown as Record<string, unknown> })}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'delete', label: `subject ${s.code}`, run: () => api.taxDelete('subjects', s.code) })}>Delete</Button></div> : null}
            </div>
            <ul className="space-y-2">
              {s.topics.map((t) => (
                <li key={t.code} className="rounded-xl border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{t.nameEn} <span lang="hi" className="font-normal text-ink-700">· {t.nameHi}</span> <span className="text-xs font-normal text-ink-500">{t.code} · weight {t.weight}</span></p>
                    {canTax ? <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'tax', level: 'subtopics', parent: t.code })}>Add subtopic</Button><Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'tax', level: 'topics', parent: s.code, row: t as unknown as Record<string, unknown> })}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDlg({ kind: 'delete', label: `topic ${t.code}`, run: () => api.taxDelete('topics', t.code) })}>Delete</Button></div> : null}</div>
                  {t.subtopics.length ? <ul className="mt-2 flex flex-wrap gap-2">{t.subtopics.map((st) => <li key={st.code} className="flex items-center gap-1 rounded-full bg-black/5 py-1 pl-3 pr-1 text-sm">{st.nameEn}{canTax ? <><button type="button" className="rounded px-1 text-primary-700 underline" onClick={() => setDlg({ kind: 'tax', level: 'subtopics', parent: t.code, row: st as unknown as Record<string, unknown> })}>edit</button><button type="button" aria-label={`Delete ${st.nameEn}`} className="rounded px-1.5 text-danger-600" onClick={() => setDlg({ kind: 'delete', label: `subtopic ${st.code}`, run: () => api.taxDelete('subtopics', st.code) })}>✕</button></> : null}</li>)}</ul> : null}
                </li>
              ))}
              {s.topics.length === 0 ? <li className="text-ink-500">No topics yet.</li> : null}
            </ul>
          </Card>
        ))}
      </div>

      {dlg?.kind === 'exam' ? <EditDialog open recordKey={dlg.exam?.id ?? 'new'} title={dlg.exam ? `Edit ${dlg.exam.id}` : 'Add exam'} fields={examFields} editing={!!dlg.exam} initial={dlg.exam ? { ...dlg.exam } : { active: true, hasMains: false, sort: 0 }} onClose={() => setDlg(null)} onSave={async (v) => { if (dlg.exam) { const { id: _i, papers: _p, patternVerified: _pv, patternSourceUrl: _u, patternNote: _n, ...rest } = v as Record<string, unknown>; void [_i, _p, _pv, _u, _n]; await api.patchExam(dlg.exam.id, rest); } else await api.createExam(v); done('Saved'); }} /> : null}
      {dlg?.kind === 'paper' ? <EditDialog open recordKey={dlg.paper?.id ?? `new-${dlg.examId}`} title={dlg.paper ? `Edit ${dlg.paper.code}` : 'Add paper'} fields={paperFields} editing={!!dlg.paper} initial={dlg.paper ? { ...dlg.paper } : { stage: 'prelims', questionCount: 100, totalMarks: 200, durationMin: 120, correctMarks: 2, negativeFraction: 0.33, countsTowardMerit: true, active: true, sort: 0 }} onClose={() => setDlg(null)} onSave={async (v) => { const { id: _i, examId: _e, subjects: _s, ...rest } = v as Record<string, unknown>; void [_i, _e, _s]; if (dlg.paper) await api.updatePaper(dlg.paper.id, rest); else await api.createPaper(dlg.examId, rest); done('Saved'); }} /> : null}
      {dlg?.kind === 'verify' ? <EditDialog open recordKey={dlg.exam.id} title={`Mark ${dlg.exam.shortEn} pattern as verified`} fields={verifyFields} editing={false} initial={{}} saveLabel="Mark verified" onClose={() => setDlg(null)} onSave={async (v) => { await api.verifyPattern(dlg.exam.id, v as { sourceUrl: string; note?: string }); done('Pattern marked as verified'); }} extra={<Alert tone="info" live={false}>Only confirm after you have compared marks, timing and negative marking with the current official notification.</Alert>} /> : null}
      {dlg?.kind === 'tax' ? <EditDialog open recordKey={`${dlg.level}-${String(dlg.row?.code ?? 'new')}-${dlg.parent ?? ''}`} title={dlg.row ? `Edit ${dlg.level.slice(0, -1)}` : `Add ${dlg.level.slice(0, -1)}`} fields={dlg.level === 'subjects' ? subjectFields : dlg.level === 'topics' ? topicFields : subtopicFields} editing={!!dlg.row} initial={dlg.row ? { ...dlg.row } : { sort: 0, weight: 1 }} onClose={() => setDlg(null)} onSave={async (v) => {
        const { subtopics: _a, topics: _b, subjectCode: _c, topicCode: _d, ...rest } = v as Record<string, unknown>; void [_a, _b, _c, _d];
        if (dlg.row) await api.taxPatch(dlg.level, String(dlg.row.code), (({ code: _x, ...r }) => (void _x, r))(rest));
        else await api.taxCreate(dlg.level, { ...rest, ...(dlg.level === 'topics' ? { subjectCode: dlg.parent } : {}), ...(dlg.level === 'subtopics' ? { topicCode: dlg.parent } : {}) });
        done('Saved');
      }} /> : null}
      <Modal open={dlg?.kind === 'subjects'} onClose={() => setDlg(null)} title={dlg?.kind === 'subjects' ? `Subjects in ${dlg.paper.nameEn}` : ''} footer={<><Button variant="secondary" onClick={() => setDlg(null)}>Cancel</Button><Button loading={saveSubjects.isPending} onClick={() => dlg?.kind === 'subjects' && saveSubjects.mutate({ id: dlg.paper.id, codes: [...picked] })}>Save</Button></>}>
        <p className="mb-2 text-sm text-ink-500">These decide which topics a student&apos;s study plan covers for this paper.</p>
        <div className="grid gap-1">{tree.data.subjects.map((s) => <Checkbox key={s.code} checked={picked.has(s.code)} onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(s.code); else n.delete(s.code); return n; })} label={s.nameEn} />)}</div>
      </Modal>
      <ConfirmDialog open={dlg?.kind === 'delete'} title={`Delete ${dlg?.kind === 'delete' ? dlg.label : ''}?`} danger confirmLabel="Delete" busy={del.isPending} onConfirm={() => dlg?.kind === 'delete' && del.mutate(dlg.run)} onClose={() => setDlg(null)}>Anything still in use cannot be deleted; you will be told what depends on it.</ConfirmDialog>
    </>
  );
}
