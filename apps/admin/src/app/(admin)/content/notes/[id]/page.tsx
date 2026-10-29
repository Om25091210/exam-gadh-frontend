'use client';
import { Alert, Button, Card, Checkbox, ErrorState, Field, Input, PageHeader, Select, Skeleton, Textarea, useToast } from '@eg/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { adminErrorText, fieldProblems } from '@/lib/errors';
import { blocksToText, textToBlocks, type Block } from '@/lib/note-blocks';

interface SectionForm {
  anchor: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
}
interface StoredSection {
  anchor: string;
  en?: { title: string; blocks: Block[] };
  hi?: { title: string; blocks: Block[] };
}
const blank = (n: number): SectionForm => ({ anchor: `section-${n}`, titleEn: '', titleHi: '', bodyEn: '', bodyHi: '' });

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const { api, can } = useAdmin();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000 });
  const note = useQuery({ queryKey: ['note', id], queryFn: () => api.contentGet('notes', id), enabled: !isNew });
  const [slug, setSlug] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [access, setAccess] = useState<'free' | 'paid'>('free');
  const [published, setPublished] = useState(false);
  const [sections, setSections] = useState<SectionForm[]>([blank(1)]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const n = note.data;
    if (!n) return;
    setSlug(String(n.id)); setSubjectCode(String(n.subjectCode)); setTitleEn(String(n.titleEn)); setTitleHi(String(n.titleHi)); setAccess(n.access as 'free' | 'paid'); setPublished(!!n.published);
    setSections((n.sections as StoredSection[]).map((s) => ({ anchor: s.anchor, titleEn: s.en?.title ?? '', titleHi: s.hi?.title ?? '', bodyEn: blocksToText(s.en?.blocks), bodyHi: blocksToText(s.hi?.blocks) })));
  }, [note.data]);

  const set = (i: number, patch: Partial<SectionForm>) => setSections((x) => x.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const body = () => ({
    id: slug.trim().toLowerCase(), subjectCode, titleEn: titleEn.trim(), titleHi: titleHi.trim(), access, published,
    sections: sections.map((s) => ({ anchor: s.anchor.trim(), ...(s.bodyEn.trim() ? { en: { title: s.titleEn.trim() || s.anchor, blocks: textToBlocks(s.bodyEn) } } : {}), ...(s.bodyHi.trim() ? { hi: { title: s.titleHi.trim() || s.anchor, blocks: textToBlocks(s.bodyHi) } } : {}) })),
  });
  const save = useMutation({
    mutationFn: () => (isNew ? api.contentCreate('notes', body()) : api.contentUpdate('notes', id, body())),
    onSuccess: () => { setErrors([]); toast.show('Saved', 'success'); void qc.invalidateQueries({ queryKey: ['content', 'notes'] }); void qc.invalidateQueries({ queryKey: ['note', id] }); if (isNew) router.replace(`/content/notes/${slug.trim().toLowerCase()}`); },
    onError: (e) => { const p = fieldProblems(e); setErrors(p.length ? p.map((x) => `${x.field}: ${x.problems.join(', ')}`) : [adminErrorText(e)]); },
  });

  if (!isNew && note.isLoading) return <Skeleton className="h-64" />;
  if (!isNew && (note.isError || !note.data)) return <ErrorState message={adminErrorText(note.error)} onRetry={() => note.refetch()} />;
  const canWrite = can('content:write');
  return (
    <>
      <PageHeader title={isNew ? 'New note' : titleEn || 'Note'} subtitle="Write each section in Hindi, English or both. Start a line with # for a heading or - for a list item; a blank line starts a new paragraph." />
      <div className="space-y-4">
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Id *" hint="Short and permanent, lower-case. It appears in links.">{(p) => <Input {...p} value={slug} onChange={(e) => setSlug(e.target.value)} disabled={!isNew} />}</Field>
          <Field label="Subject *">{(p) => <Select {...p} value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}><option value="">Choose</option>{tree.data?.subjects.map((s) => <option key={s.code} value={s.code}>{s.nameEn}</option>)}</Select>}</Field>
          <Field label="Title (English) *">{(p) => <Input {...p} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />}</Field>
          <Field label="Title (Hindi) *">{(p) => <Input {...p} lang="hi" value={titleHi} onChange={(e) => setTitleHi(e.target.value)} />}</Field>
          <Field label="Access">{(p) => <Select {...p} value={access} onChange={(e) => setAccess(e.target.value as 'free' | 'paid')}><option value="free">Free</option><option value="paid">Paid</option></Select>}</Field>
          {can('content:publish') ? <div className="self-end"><Checkbox checked={published} onChange={(e) => setPublished(e.target.checked)} label="Published (visible to students)" /></div> : null}
        </Card>
        {sections.map((s, i) => (
          <Card key={i} className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Section {i + 1}</h2>{sections.length > 1 ? <Button variant="ghost" size="sm" onClick={() => setSections((x) => x.filter((_, j) => j !== i))}>Remove</Button> : null}</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Anchor *" hint="Lower-case letters, digits, - and _">{(p) => <Input {...p} value={s.anchor} onChange={(e) => set(i, { anchor: e.target.value })} />}</Field>
              <Field label="Heading (English)">{(p) => <Input {...p} value={s.titleEn} onChange={(e) => set(i, { titleEn: e.target.value })} />}</Field>
              <Field label="Heading (Hindi)">{(p) => <Input {...p} lang="hi" value={s.titleHi} onChange={(e) => set(i, { titleHi: e.target.value })} />}</Field>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Text (Hindi)">{(p) => <Textarea {...p} lang="hi" rows={8} value={s.bodyHi} onChange={(e) => set(i, { bodyHi: e.target.value })} />}</Field>
              <Field label="Text (English)">{(p) => <Textarea {...p} lang="en" rows={8} value={s.bodyEn} onChange={(e) => set(i, { bodyEn: e.target.value })} />}</Field>
            </div>
          </Card>
        ))}
        <Button variant="secondary" onClick={() => setSections((x) => [...x, blank(x.length + 1)])} disabled={sections.length >= 100}>Add section</Button>
        {errors.length ? <Alert tone="danger"><ul className="list-disc pl-4">{errors.map((m) => <li key={m}>{m}</li>)}</ul></Alert> : null}
        {canWrite ? <div><Button size="lg" loading={save.isPending} disabled={!slug.trim() || !subjectCode || !titleEn.trim() || !titleHi.trim()} onClick={() => save.mutate()}>Save note</Button></div> : <Alert tone="info" live={false}>You can read this note but not change it.</Alert>}
      </div>
    </>
  );
}
