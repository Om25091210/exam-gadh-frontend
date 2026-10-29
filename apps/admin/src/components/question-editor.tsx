'use client';
import type { ContentStatus, QuestionInput, QuestionType } from '@eg/api';
import { ApiError } from '@eg/api';
import { Alert, Button, Card, ErrorState, Field, Input, Modal, Options, PageHeader, QuestionBody, Select, Skeleton, Tabs, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { adminErrorText, fieldProblems } from '@/lib/errors';
import { completeness, emptyLang, fromBody, FIELDS, LIST_LIMITS, toBody, type Lang, type LangForm } from '@/lib/question-form';
import { ConfirmDialog } from './confirm';
import { RichField } from './rich-field';
import { StatusBadge } from './status-badge';

const TYPES: Array<{ id: QuestionType; label: string }> = [
  { id: 'single', label: 'Single best answer' },
  { id: 'multi_statement', label: 'Multiple statements' },
  { id: 'match', label: 'Match the following' },
  { id: 'assertion_reason', label: 'Assertion and reason' },
  { id: 'chronology', label: 'Chronological order' },
  { id: 'passage', label: 'Passage based' },
];
const LANG_NAME: Record<Lang, string> = { hi: 'Hindi', en: 'English' };

function ListEditor({ label, values, onChange, min, max }: { label: string; values: string[]; onChange: (v: string[]) => void; min: number; max: number }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink-700">{label}</legend>
      {values.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2.5 w-6 text-right text-sm font-semibold text-ink-500">{i + 1}.</span>
          <div className="flex-1"><RichField label={`${label} ${i + 1}`} value={v} onChange={(x) => onChange(values.map((o, j) => (j === i ? x : o)))} /></div>
          {values.length > min ? <Button variant="ghost" size="sm" aria-label={`Remove ${label} ${i + 1}`} onClick={() => onChange(values.filter((_, j) => j !== i))}>✕</Button> : null}
        </div>
      ))}
      {values.length < max ? <Button variant="secondary" size="sm" onClick={() => onChange([...values, ''])}>Add</Button> : null}
    </fieldset>
  );
}

function LangEditor({ lang, type, value, onChange }: { lang: Lang; type: QuestionType; value: LangForm; onChange: (v: LangForm) => void }) {
  const set = <K extends keyof LangForm>(k: K, v: LangForm[K]) => onChange({ ...value, [k]: v });
  const f = FIELDS[type];
  return (
    <div className="space-y-4" lang={lang}>
      {f.includes('stem') ? <RichField label={type === 'assertion_reason' ? 'Introduction (optional)' : 'Question'} value={value.stem} onChange={(v) => set('stem', v)} rows={3} lang={lang} /> : null}
      {f.includes('assertion') ? <RichField label="Assertion (A)" value={value.assertion} onChange={(v) => set('assertion', v)} rows={2} lang={lang} /> : null}
      {f.includes('reason') ? <RichField label="Reason (R)" value={value.reason} onChange={(v) => set('reason', v)} rows={2} lang={lang} /> : null}
      {f.includes('statements') ? <ListEditor label="Statements" values={value.statements} onChange={(v) => set('statements', v)} min={LIST_LIMITS.statements[0]} max={LIST_LIMITS.statements[1]} /> : null}
      {f.includes('prompt') ? <RichField label="Question after the statements (optional)" value={value.prompt} onChange={(v) => set('prompt', v)} lang={lang} hint="For example: Which of the statements given above is/are correct?" /> : null}
      {f.includes('listA') ? <ListEditor label="List I" values={value.listA} onChange={(v) => set('listA', v)} min={LIST_LIMITS.listA[0]} max={LIST_LIMITS.listA[1]} /> : null}
      {f.includes('listB') ? <ListEditor label="List II" values={value.listB} onChange={(v) => set('listB', v)} min={LIST_LIMITS.listB[0]} max={LIST_LIMITS.listB[1]} /> : null}
      {f.includes('items') ? <ListEditor label="Items to arrange" values={value.items} onChange={(v) => set('items', v)} min={LIST_LIMITS.items[0]} max={LIST_LIMITS.items[1]} /> : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink-700">Options</legend>
        {value.options.map((o, i) => (
          <RichField key={i} label={`Option ${'ABCD'[i]}`} value={o} onChange={(v) => { const next = [...value.options] as LangForm['options']; next[i] = v; set('options', next); }} lang={lang} />
        ))}
      </fieldset>
      <RichField label="Explanation (shown after the result)" value={value.explanation} onChange={(v) => set('explanation', v)} rows={3} lang={lang} />
    </div>
  );
}

const NEXT_MOVES: Record<ContentStatus, Array<{ to: ContentStatus; label: string; needs?: string }>> = {
  draft: [{ to: 'in_review', label: 'Submit for review' }, { to: 'published', label: 'Publish', needs: 'content:publish' }],
  in_review: [{ to: 'published', label: 'Publish', needs: 'content:publish' }, { to: 'draft', label: 'Send back to draft' }],
  published: [{ to: 'draft', label: 'Unpublish (back to draft)', needs: 'content:publish' }, { to: 'archived', label: 'Archive', needs: 'content:publish' }],
  archived: [{ to: 'draft', label: 'Restore as draft' }],
};

export function QuestionEditor({ id }: { id?: string }) {
  const { api, can } = useAdmin();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const loaded = useQuery({ queryKey: ['question', id], queryFn: () => api.question(id!), enabled: !!id });
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });

  const [type, setType] = useState<QuestionType>('single');
  const [topicCode, setTopicCode] = useState('');
  const [subtopicCode, setSubtopicCode] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  const [answer, setAnswer] = useState(0);
  const [source, setSource] = useState<'original' | 'pyq'>('original');
  const [pyqYear, setPyqYear] = useState('');
  const [pyqExamId, setPyqExamId] = useState('');
  const [pyqPaperCode, setPyqPaperCode] = useState('');
  const [tags, setTags] = useState('');
  const [code, setCode] = useState('');
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [passage, setPassage] = useState({ en: '', hi: '' });
  const [form, setForm] = useState<Record<Lang, LangForm>>({ en: emptyLang(), hi: emptyLang() });
  const [tab, setTab] = useState<'hi' | 'en' | 'preview'>('hi');
  const [errors, setErrors] = useState<string[]>([]);
  const [dups, setDups] = useState<Array<{ id: string; code: string | null; status: string }> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const q = loaded.data;
    if (!q || hydrated.current) return;
    hydrated.current = true;
    setType(q.type);
    setTopicCode(q.topicCode);
    setSubtopicCode(q.subtopicCode ?? '');
    setDifficulty(q.difficulty);
    setAnswer(q.answer);
    setSource(q.source);
    setPyqYear(q.pyqYear ? String(q.pyqYear) : '');
    setPyqExamId(q.pyqExamId ?? '');
    setPyqPaperCode(q.pyqPaperCode ?? '');
    setTags(q.tags.join(', '));
    setCode(q.code ?? '');
    setImageKey(q.imageKey);
    setPassage({ en: q.passage?.body.en ?? '', hi: q.passage?.body.hi ?? '' });
    setForm(fromBody(q.type, q.body));
  }, [loaded.data]);

  const topics = useMemo(() => tree.data?.subjects.flatMap((s) => s.topics.map((t) => ({ ...t, subject: s.nameEn }))) ?? [], [tree.data]);
  const subtopics = topics.find((t) => t.code === topicCode)?.subtopics ?? [];
  const status = loaded.data?.status;
  const check = completeness(type, form);

  const buildInput = (): QuestionInput => ({
    code: code.trim() || undefined,
    type,
    topicCode,
    subtopicCode: subtopicCode || null,
    difficulty,
    answer,
    body: toBody(type, form),
    ...(type === 'passage' ? { passage: { ...(passage.en.trim() ? { en: passage.en.trim() } : {}), ...(passage.hi.trim() ? { hi: passage.hi.trim() } : {}) } } : {}),
    imageKey,
    source,
    pyqYear: source === 'pyq' && pyqYear ? Number(pyqYear) : null,
    pyqExamId: source === 'pyq' ? pyqExamId || null : null,
    pyqPaperCode: source === 'pyq' ? pyqPaperCode || null : null,
    tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
  });

  const save = useMutation({
    mutationFn: async (allowDuplicate: boolean) => (id ? api.updateQuestion(id, buildInput(), allowDuplicate) : api.createQuestion(buildInput(), allowDuplicate)),
    onSuccess: (r) => {
      setErrors([]);
      setDups(null);
      toast.show('Saved', 'success');
      void qc.invalidateQueries({ queryKey: ['questions'] });
      void qc.invalidateQueries({ queryKey: ['question', id] });
      if (!id) router.replace(`/questions/${r.id}`);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === 'DUPLICATE_QUESTION') {
        setDups(((e.details as { duplicates?: Array<{ id: string; code: string | null; status: string }> } | undefined)?.duplicates) ?? []);
        return;
      }
      const p = fieldProblems(e);
      setErrors(p.length ? p.map((x) => `${x.field}: ${x.problems.join(', ')}`) : [adminErrorText(e)]);
    },
  });

  const move = useMutation({
    mutationFn: (to: ContentStatus) => api.setQuestionStatus(id!, to),
    onSuccess: () => { toast.show('Status updated', 'success'); void qc.invalidateQueries({ queryKey: ['question', id] }); void qc.invalidateQueries({ queryKey: ['questions'] }); },
    onError: (e) => toast.show(adminErrorText(e), 'danger'),
  });
  const del = useMutation({ mutationFn: () => api.deleteQuestion(id!), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['questions'] }); router.replace('/questions'); }, onError: (e) => { setConfirmDelete(false); toast.show(adminErrorText(e), 'danger'); } });

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const post = await api.presignUpload('question-image', file.type);
      const fd = new FormData();
      Object.entries(post.fields).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', file);
      const res = await fetch(post.url, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('upload');
      setImageKey(post.key);
    } catch (e) {
      toast.show(e instanceof ApiError ? adminErrorText(e) : 'Upload failed. Use a PNG, JPEG or WebP under 1 MB.', 'danger');
    } finally {
      setUploading(false);
    }
  };

  if (id && loaded.isLoading) return <Skeleton className="h-96" />;
  if (id && (loaded.isError || !loaded.data)) return <ErrorState message={adminErrorText(loaded.error)} onRetry={() => loaded.refetch()} />;

  const canSave = can('content:write') && check.missing.length === 0 && !!topicCode;
  const body = toBody(type, form);
  const like = { type, en: body.en as never, hi: body.hi as never, passage: type === 'passage' ? { en: passage.en, hi: passage.hi } : null };

  return (
    <>
      <PageHeader title={id ? `Question ${loaded.data?.code ?? ''}` : 'New question'} subtitle={id ? `Version ${loaded.data?.version}` : undefined} actions={status ? <StatusBadge status={status} /> : undefined} />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">{(p) => <Select {...p} value={type} onChange={(e) => setType(e.target.value as QuestionType)}>{TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</Select>}</Field>
            <Field label="Code (optional)" hint="Used to update this question from a spreadsheet later.">{(p) => <Input {...p} value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} />}</Field>
            <Field label="Topic *">
              {(p) => (
                <Select {...p} value={topicCode} onChange={(e) => { setTopicCode(e.target.value); setSubtopicCode(''); }}>
                  <option value="">Choose a topic</option>
                  {tree.data?.subjects.map((s) => <optgroup key={s.code} label={s.nameEn}>{s.topics.map((t) => <option key={t.code} value={t.code}>{t.nameEn}</option>)}</optgroup>)}
                </Select>
              )}
            </Field>
            <Field label="Subtopic">{(p) => <Select {...p} value={subtopicCode} onChange={(e) => setSubtopicCode(e.target.value)} disabled={!subtopics.length}><option value="">None</option>{subtopics.map((s) => <option key={s.code} value={s.code}>{s.nameEn}</option>)}</Select>}</Field>
            <Field label="Difficulty">{(p) => <Select {...p} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}><option value={1}>Easy</option><option value={2}>Medium</option><option value={3}>Hard</option></Select>}</Field>
            <Field label="Tags" hint="Comma separated">{(p) => <Input {...p} value={tags} onChange={(e) => setTags(e.target.value)} />}</Field>
            <Field label="Source">{(p) => <Select {...p} value={source} onChange={(e) => setSource(e.target.value as 'original' | 'pyq')}><option value="original">Original</option><option value="pyq">Previous year question</option></Select>}</Field>
            {source === 'pyq' ? (
              <>
                <Field label="Year *">{(p) => <Input {...p} type="number" min={1950} max={2100} value={pyqYear} onChange={(e) => setPyqYear(e.target.value)} />}</Field>
                <Field label="Exam">{(p) => <Select {...p} value={pyqExamId} onChange={(e) => setPyqExamId(e.target.value)}><option value="">—</option>{tree.data?.exams.map((x) => <option key={x.id} value={x.id}>{x.shortEn}</option>)}</Select>}</Field>
                <Field label="Paper code">{(p) => <Input {...p} value={pyqPaperCode} onChange={(e) => setPyqPaperCode(e.target.value)} placeholder="PRE_GS" />}</Field>
              </>
            ) : null}
          </Card>

          {type === 'passage' ? (
            <Card className="space-y-3">
              <h2 className="font-semibold">Passage</h2>
              <RichField label="Passage (Hindi)" value={passage.hi} onChange={(v) => setPassage((p) => ({ ...p, hi: v }))} rows={6} lang="hi" />
              <RichField label="Passage (English)" value={passage.en} onChange={(v) => setPassage((p) => ({ ...p, en: v }))} rows={6} lang="en" />
            </Card>
          ) : null}

          <Tabs label="Language" value={tab} onChange={(v) => setTab(v as typeof tab)} items={[{ id: 'hi', label: 'Hindi' }, { id: 'en', label: 'English' }, { id: 'preview', label: 'Preview' }]} />

          {tab !== 'preview' ? (
            <Card><LangEditor lang={tab} type={type} value={form[tab]} onChange={(v) => setForm((f) => ({ ...f, [tab]: v }))} /></Card>
          ) : (
            <Card className="space-y-6">
              {(['hi', 'en'] as const).map((l) => (
                <section key={l} aria-label={`${LANG_NAME[l]} preview`}>
                  <h2 className="mb-2 font-semibold">{LANG_NAME[l]}</h2>
                  {body[l] ? (
                    <div className="space-y-3">
                      <QuestionBody q={like} lang={l} />
                      <Options q={like} lang={l} name={`prev-${l}`} selected={answer} disabled correct={answer} />
                    </div>
                  ) : <p className="text-ink-500">Nothing entered in {LANG_NAME[l]}.</p>}
                </section>
              ))}
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="space-y-3">
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-ink-700">Correct option *</legend>
              <div className="grid grid-cols-4 gap-2">
                {'ABCD'.split('').map((l, i) => (
                  <label key={l} className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-2 border-line font-bold has-[:checked]:border-success-600 has-[:checked]:bg-success-50 has-[:checked]:text-success-600">
                    <input type="radio" name="answer" className="sr-only" checked={answer === i} onChange={() => setAnswer(i)} />{l}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <p className="mb-1 text-sm font-medium text-ink-700">Image (optional)</p>
              {imageKey ? <p className="break-all text-xs text-ink-500">{imageKey}</p> : null}
              <input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} className="text-sm" />
              {imageKey ? <Button variant="ghost" size="sm" onClick={() => setImageKey(null)}>Remove image</Button> : null}
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className={body.hi ? 'text-success-600' : 'text-ink-500'}>● Hindi {body.hi ? 'ready' : 'empty'}</span>
              <span className={body.en ? 'text-success-600' : 'text-ink-500'}>● English {body.en ? 'ready' : 'empty'}</span>
            </div>
            {check.missing.length ? <Alert tone="warning" live={false}><ul className="list-disc pl-4">{check.missing.map((m) => <li key={m}>{m}</li>)}</ul></Alert> : body.en && body.hi ? <Alert tone="success" live={false}>Both languages are complete.</Alert> : null}
            {errors.length ? <Alert tone="danger"><ul className="list-disc pl-4">{errors.map((m) => <li key={m}>{m}</li>)}</ul></Alert> : null}
            <Button className="w-full" disabled={!canSave} loading={save.isPending} onClick={() => save.mutate(false)}>{id ? 'Save changes' : 'Create question'}</Button>
            {!can('content:write') ? <p className="text-sm text-ink-500">You have read-only access.</p> : null}
          </Card>

          {id && status ? (
            <Card className="space-y-2">
              <h2 className="font-semibold">Workflow</h2>
              {NEXT_MOVES[status].filter((m) => !m.needs || can(m.needs)).map((m) => (
                <Button key={m.to} variant={m.to === 'published' ? 'primary' : 'secondary'} className="w-full" loading={move.isPending && move.variables === m.to} onClick={() => move.mutate(m.to)}>{m.label}</Button>
              ))}
              {status === 'draft' && can('content:write') ? <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>Delete draft</Button> : null}
              {loaded.data?.usedIn.length ? <p className="text-sm text-ink-500">Used in {loaded.data.usedIn.length} test version(s).</p> : null}
              {(loaded.data?.reportedCount ?? 0) > 0 ? <Alert tone="warning" live={false}>{loaded.data!.reportedCount} student report(s). See Reported issues.</Alert> : null}
            </Card>
          ) : null}

          {loaded.data?.history.length ? (
            <Card>
              <h2 className="mb-1 font-semibold">History</h2>
              <ul className="space-y-1 text-sm text-ink-700">{loaded.data.history.map((h) => <li key={h.version}>v{h.version} · {new Date(h.changedAt).toLocaleString('en-IN')}</li>)}</ul>
            </Card>
          ) : null}
        </aside>
      </div>

      <Modal open={!!dups} onClose={() => setDups(null)} title="Looks like a duplicate" footer={<><Button variant="secondary" onClick={() => setDups(null)}>Go back and edit</Button><Button variant="danger" onClick={() => save.mutate(true)} loading={save.isPending}>Save anyway</Button></>}>
        <p className="mb-2">A question with the same text and options already exists:</p>
        <ul className="list-disc pl-5">{dups?.map((d) => <li key={d.id}><a className="text-primary-700 underline" href={`/questions/${d.id}`} target="_blank" rel="noreferrer">{d.code ?? d.id.slice(0, 8)}</a> ({d.status})</li>)}</ul>
      </Modal>
      <ConfirmDialog open={confirmDelete} title="Delete this draft?" danger confirmLabel="Delete" busy={del.isPending} onConfirm={() => del.mutate()} onClose={() => setConfirmDelete(false)}>This cannot be undone. Published questions cannot be deleted, only archived.</ConfirmDialog>
    </>
  );
}
