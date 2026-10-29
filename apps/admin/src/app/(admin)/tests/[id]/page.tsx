'use client';
import type { BuilderItem, VersionConfig } from '@eg/api';
import { ApiError } from '@eg/api';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Input, PageHeader, Select, Skeleton, Table, Tabs, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm';
import { StatusBadge } from '@/components/status-badge';
import { AddQuestionsDialog, type PickedQuestion } from '@/components/tests/add-questions';
import { ConfigFields } from '@/components/tests/config-fields';
import { PickDialog } from '@/components/tests/pick-dialog';
import { ResultsPanel } from '@/components/tests/results-panel';
import { SectionsEditor } from '@/components/tests/sections-editor';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';
import { fmtDateTime } from '@/lib/datetime';

type Tab = 'build' | 'results' | 'versions';

interface Row {
  questionId: string;
  code: string | null;
  preview: string;
  topicCode: string;
  type: string;
  status: string;
  hasEn: boolean;
  hasHi: boolean;
  sectionPos: number | null;
  marks: number | null;
}
const fromItem = (i: BuilderItem): Row => ({ questionId: i.questionId, code: i.code, preview: i.preview, topicCode: i.topicCode, type: i.type, status: i.status, hasEn: i.hasEn, hasHi: i.hasHi, sectionPos: i.sectionPos, marks: i.marks });

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const { api, can } = useAdmin();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const test = useQuery({ queryKey: ['admin-test', id], queryFn: () => api.adminTest(id) });
  const versions = test.data?.versions ?? [];
  const draft = versions.find((v) => v.status === 'draft');
  const [chosenVersion, setChosenVersion] = useState<string | null>(null);
  const versionId = chosenVersion ?? draft?.id ?? versions[0]?.id ?? null;
  const version = useQuery({ queryKey: ['admin-version', id, versionId], queryFn: () => api.testVersion(id, versionId!), enabled: !!versionId });
  const v = version.data;
  const editable = v?.status === 'draft' && can('test:write');

  const [tab, setTab] = useState<Tab>('build');
  const [rows, setRows] = useState<Row[]>([]);
  const [config, setConfig] = useState<Partial<VersionConfig>>({});
  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirm, setConfirm] = useState<'publish' | 'archive' | 'delete' | 'discard' | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  useEffect(() => {
    if (!v) return;
    setRows(v.items.map(fromItem));
    setConfig({ durationMin: v.durationMin, correctMarks: v.correctMarks, negativeFraction: v.negativeFraction, qualifyingPct: v.qualifyingPct, qualifyingPctReserved: v.qualifyingPctReserved, countsTowardMerit: v.countsTowardMerit, shuffleQuestions: v.shuffleQuestions, sectionalTimers: v.sectionalTimers, attemptLimit: v.attemptLimit, startsAt: v.startsAt, endsAt: v.endsAt, resultReleaseAt: v.resultReleaseAt, instructionsEn: v.instructionsEn, instructionsHi: v.instructionsHi });
  }, [v]);

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['admin-test', id] }), qc.invalidateQueries({ queryKey: ['admin-version', id] }), qc.invalidateQueries({ queryKey: ['admin-tests'] })]);
  const fail = (e: unknown) => {
    const details = e instanceof ApiError && Array.isArray(e.details) ? (e.details as Array<{ field?: string; message?: string }>).map((d) => `${d.field ?? ''} ${d.message ?? ''}`.trim()) : [];
    setProblems(details);
    toast.show(adminErrorText(e), 'danger');
  };

  const saveConfig = useMutation({ mutationFn: () => api.updateVersion(id, versionId!, config), onSuccess: () => { toast.show('Settings saved', 'success'); void refresh(); }, onError: fail });
  const saveSections = useMutation({ mutationFn: (s: Array<{ nameEn: string; nameHi: string; durationMin: number | null }>) => api.setSections(id, versionId!, s), onSuccess: () => { toast.show('Sections saved. Assign questions to sections again.', 'success'); void refresh(); }, onError: fail });
  const saveQuestions = useMutation({
    mutationFn: () => api.setTestQuestions(id, versionId!, rows.map((r) => ({ questionId: r.questionId, ...(r.sectionPos !== null ? { sectionPos: r.sectionPos } : {}), ...(r.marks ? { marks: r.marks } : {}) }))),
    onSuccess: () => { toast.show('Question list saved', 'success'); void refresh(); },
    onError: fail,
  });
  const publish = useMutation({ mutationFn: () => api.publishVersion(id, versionId!), onSuccess: () => { setConfirm(null); setProblems([]); toast.show('Published', 'success'); void refresh(); }, onError: (e) => { setConfirm(null); fail(e); } });
  const newDraft = useMutation({ mutationFn: () => api.newTestDraft(id), onSuccess: (d) => { setChosenVersion(d.id); setTab('build'); void refresh(); }, onError: fail });
  const discard = useMutation({ mutationFn: () => api.discardDraft(id, versionId!), onSuccess: () => { setConfirm(null); setChosenVersion(null); void refresh(); }, onError: (e) => { setConfirm(null); fail(e); } });
  const archive = useMutation({ mutationFn: (a: boolean) => api.archiveTest(id, a), onSuccess: () => { setConfirm(null); void refresh(); }, onError: (e) => { setConfirm(null); fail(e); } });
  const remove = useMutation({ mutationFn: () => api.deleteTest(id), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin-tests'] }); router.replace('/tests'); }, onError: (e) => { setConfirm(null); fail(e); } });

  const dirtyList = useMemo(() => !!v && JSON.stringify(rows.map((r) => [r.questionId, r.sectionPos, r.marks])) !== JSON.stringify(v.items.map((i) => [i.questionId, i.sectionPos, i.marks])), [rows, v]);
  const dirtyConfig = useMemo(() => !!v && (['durationMin', 'correctMarks', 'negativeFraction', 'qualifyingPct', 'qualifyingPctReserved', 'countsTowardMerit', 'shuffleQuestions', 'sectionalTimers', 'attemptLimit', 'startsAt', 'endsAt', 'resultReleaseAt', 'instructionsEn', 'instructionsHi'] as const).some((k) => (config[k] ?? null) !== (v[k] ?? null)), [config, v]);
  const move = (i: number, d: -1 | 1) => setRows((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n; });

  if (test.isLoading) return <Skeleton className="h-64" />;
  if (test.isError || !test.data) return <ErrorState message={adminErrorText(test.error)} onRetry={() => test.refetch()} />;
  const t = test.data;
  const sections = v?.sections ?? [];
  const totalMarks = rows.reduce((n, r) => n + (r.marks ?? config.correctMarks ?? 0), 0);

  return (
    <>
      <PageHeader
        title={t.titleEn}
        subtitle={t.titleHi}
        actions={
          <>
            {t.archived ? <Badge tone="danger">archived</Badge> : t.publishedVersionId ? <Badge tone="success">published</Badge> : <Badge>draft</Badge>}
            {can('test:publish') ? <Button variant="secondary" size="sm" onClick={() => (t.archived ? archive.mutate(false) : setConfirm('archive'))}>{t.archived ? 'Restore' : 'Archive'}</Button> : null}
            {can('test:write') && !t.publishedVersionId ? <Button variant="ghost" size="sm" onClick={() => setConfirm('delete')}>Delete</Button> : null}
          </>
        }
      />
      <p className="mb-3 text-sm text-ink-500">{t.examId} · {t.kind}{t.mode === 'live' ? ' (live)' : ''} · {t.access}</p>
      <Tabs label="Test" value={tab} onChange={(x) => setTab(x as Tab)} items={[{ id: 'build', label: v?.status === 'draft' ? 'Builder' : 'Version' }, { id: 'results', label: 'Results' }, { id: 'versions', label: 'Versions', count: versions.length }]} />

      <div className="mt-4 space-y-4">
        {tab === 'versions' ? (
          <Card className="space-y-3">
            <Table
              caption="Versions"
              columns={[{ key: 'v', header: 'Version' }, { key: 's', header: 'Status' }, { key: 'q', header: 'Questions' }, { key: 'a', header: 'Attempts' }, { key: 'p', header: 'Published' }, { key: 'open', header: '' }]}
              rows={versions.map((x) => ({ key: x.id, cells: { v: `v${x.version}`, s: <StatusBadge status={x.status} />, q: x._count.questions, a: x._count.attempts, p: fmtDateTime(x.publishedAt), open: <Button size="sm" variant="ghost" onClick={() => { setChosenVersion(x.id); setTab('build'); }}>Open</Button> } }))}
            />
            {!draft && can('test:write') ? <Button onClick={() => newDraft.mutate()} loading={newDraft.isPending}>Create a new draft to edit</Button> : null}
            <p className="text-sm text-ink-500">Published versions never change. To edit, create a new draft from the latest version and publish it; students who already started keep the version they began with.</p>
          </Card>
        ) : null}

        {tab === 'results' ? (v && v.status !== 'draft' ? <ResultsPanel testId={id} versionId={v.id} /> : <EmptyState title="Publish a version to see results" />) : null}

        {tab === 'build' && v ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={v.status} /><span className="text-ink-700">Version {v.version}</span>
              {versions.length > 1 ? <Select aria-label="Choose version" value={versionId ?? ''} onChange={(e) => setChosenVersion(e.target.value)} className="w-auto">{versions.map((x) => <option key={x.id} value={x.id}>v{x.version} ({x.status})</option>)}</Select> : null}
              {v.status !== 'draft' && can('test:write') && !draft ? <Button size="sm" onClick={() => newDraft.mutate()} loading={newDraft.isPending}>Edit (new draft)</Button> : null}
            </div>

            {v.status === 'draft' ? (
              <Card className="space-y-2">
                <h2 className="font-semibold">Ready to publish?</h2>
                {v.readiness.ready ? <Alert tone="success" live={false}>No problems found.</Alert> : <Alert tone="warning" live={false}><ul className="list-disc pl-4">{v.readiness.problems.map((p) => <li key={p}>{p}</li>)}</ul></Alert>}
                {problems.length ? <Alert tone="danger"><p className="font-semibold">Publishing was refused:</p><ul className="list-disc pl-4">{problems.map((p) => <li key={p}>{p}</li>)}</ul></Alert> : null}
                <div className="flex flex-wrap gap-2">
                  {can('test:publish') ? <Button disabled={!v.readiness.ready || dirtyList || dirtyConfig} onClick={() => setConfirm('publish')}>Publish this version</Button> : <p className="text-sm text-ink-500">Someone who can publish must do this step.</p>}
                  {can('test:write') && versions.length > 1 ? <Button variant="ghost" onClick={() => setConfirm('discard')}>Discard draft</Button> : null}
                </div>
                {dirtyList || dirtyConfig ? <p className="text-sm text-warning-700">Save your changes before publishing.</p> : null}
              </Card>
            ) : null}

            <Card className="space-y-3">
              <h2 className="font-semibold">Settings</h2>
              <ConfigFields value={config} onChange={setConfig} disabled={!editable} live={t.mode === 'live'} />
              {editable ? <Button disabled={!dirtyConfig} loading={saveConfig.isPending} onClick={() => saveConfig.mutate()}>Save settings</Button> : null}
            </Card>

            <SectionsEditor initial={sections.map((s) => ({ nameEn: s.nameEn, nameHi: s.nameHi, durationMin: s.durationMin }))} sectionalTimers={!!config.sectionalTimers} onSave={(s) => saveSections.mutate(s)} saving={saveSections.isPending} disabled={!editable} />

            <Card className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Questions ({rows.length}) · {totalMarks} marks</h2>
                {editable ? <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => setAdding(true)}>Add from bank</Button><Button variant="secondary" size="sm" onClick={() => setPicking(true)} disabled={dirtyList}>Pick by rules</Button></div> : null}
              </div>
              {dirtyList && sections.length > 0 && rows.some((r) => r.sectionPos === null) ? <Alert tone="warning" live={false}>Choose a section for every question.</Alert> : null}
              {rows.length === 0 ? <EmptyState title="No questions yet" /> : (
                <ol className="divide-y divide-line rounded-xl border border-line">
                  {rows.map((r, i) => (
                    <li key={r.questionId} className="flex flex-wrap items-start gap-2 p-2">
                      <span className="w-8 pt-2 text-right text-sm font-semibold tabular-nums text-ink-500">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2">{r.preview || '—'}</p>
                        <p className="text-xs text-ink-500">{r.code ?? ''} · {r.topicCode} · {r.hasHi ? 'हि ' : ''}{r.hasEn ? 'EN' : ''}{r.status !== 'published' ? ` · ${r.status}` : ''}</p>
                      </div>
                      {sections.length > 0 ? <Select aria-label={`Section for question ${i + 1}`} className="w-40!" disabled={!editable} value={r.sectionPos ?? ''} onChange={(e) => setRows((x) => x.map((y, j) => (j === i ? { ...y, sectionPos: e.target.value === '' ? null : Number(e.target.value) } : y)))}><option value="">Section…</option>{sections.map((s) => <option key={s.position} value={s.position}>{s.nameEn}</option>)}</Select> : null}
                      <Input aria-label={`Marks for question ${i + 1}`} type="number" min={0.25} step={0.25} placeholder={String(config.correctMarks ?? '')} className="w-24!" disabled={!editable} value={r.marks ?? ''} onChange={(e) => setRows((x) => x.map((y, j) => (j === i ? { ...y, marks: e.target.value === '' ? null : Number(e.target.value) } : y)))} />
                      {editable ? (
                        <div className="flex">
                          <Button variant="ghost" size="sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" aria-hidden /></Button>
                          <Button variant="ghost" size="sm" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" aria-hidden /></Button>
                          <Button variant="ghost" size="sm" aria-label="Remove" onClick={() => setRows((x) => x.filter((_, j) => j !== i))}>✕</Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
              {editable ? <Button disabled={!dirtyList} loading={saveQuestions.isPending} onClick={() => saveQuestions.mutate()}>Save question list</Button> : null}
            </Card>

            {editable ? (
              <>
                <AddQuestionsDialog open={adding} onClose={() => setAdding(false)} existing={new Set(rows.map((r) => r.questionId))} onAdd={(qs: PickedQuestion[]) => setRows((x) => [...x, ...qs.map((q) => ({ questionId: q.id, code: q.code, preview: q.preview, topicCode: q.topicCode, type: q.type, status: 'published', hasEn: q.hasEn, hasHi: q.hasHi, sectionPos: sections.length ? 0 : null, marks: null }))])} />
                <PickDialog open={picking} onClose={() => setPicking(false)} testId={id} versionId={v.id} sections={sections} onApplied={() => { toast.show('Questions added', 'success'); void refresh(); }} />
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <ConfirmDialog open={confirm === 'publish'} title="Publish this version?" confirmLabel="Publish" busy={publish.isPending} onConfirm={() => publish.mutate()} onClose={() => setConfirm(null)}>Students will see it right away. A published version can no longer be edited; you can create a new draft later.</ConfirmDialog>
      <ConfirmDialog open={confirm === 'archive'} title="Archive this test?" confirmLabel="Archive" busy={archive.isPending} onConfirm={() => archive.mutate(true)} onClose={() => setConfirm(null)}>It disappears from the student catalogue. Results and attempts are kept, and you can restore it.</ConfirmDialog>
      <ConfirmDialog open={confirm === 'delete'} title="Delete this test?" danger confirmLabel="Delete" busy={remove.isPending} onConfirm={() => remove.mutate()} onClose={() => setConfirm(null)}>This removes the unpublished test and its drafts. It cannot be undone.</ConfirmDialog>
      <ConfirmDialog open={confirm === 'discard'} title="Discard this draft?" danger confirmLabel="Discard" busy={discard.isPending} onConfirm={() => discard.mutate()} onClose={() => setConfirm(null)}>The draft and its question list are removed. The published version is not affected.</ConfirmDialog>
    </>
  );
}
