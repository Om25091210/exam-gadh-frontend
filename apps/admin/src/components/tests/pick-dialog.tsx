'use client';
import type { PickResult, PickRule, QuestionType } from '@eg/api';
import { Alert, Button, Checkbox, Field, Input, Modal, Select } from '@eg/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { adminErrorText } from '@/lib/errors';

const blank = (): PickRule => ({ topicCode: '', count: 5 });

/** Random selection by rules ("5 easy Polity, 3 hard History"). Preview first, then apply. */
export function PickDialog({ open, onClose, testId, versionId, sections, onApplied }: { open: boolean; onClose: () => void; testId: string; versionId: string; sections: Array<{ position: number; nameEn: string }>; onApplied: () => void }) {
  const { api } = useAdmin();
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000, enabled: open });
  const [rules, setRules] = useState<PickRule[]>([blank()]);
  const [excludeUsed, setExcludeUsed] = useState(false);
  const [bothOnly, setBothOnly] = useState(false);
  const [allowPartial, setAllowPartial] = useState(false);
  const [preview, setPreview] = useState<PickResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const topics = tree.data?.subjects.flatMap((s) => s.topics) ?? [];
  const set = (i: number, patch: Partial<PickRule>) => { setRules((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x))); setPreview(null); };
  const valid = rules.every((r) => r.topicCode && r.count >= 1 && (sections.length === 0 || r.sectionPos !== undefined));

  const run = useMutation({
    mutationFn: (previewOnly: boolean) => api.pickQuestions(testId, versionId, { rules: rules.map((r) => ({ ...r, difficulty: r.difficulty || undefined, type: r.type || undefined })), preview: previewOnly, excludeUsedInTests: excludeUsed, bothLanguagesOnly: bothOnly, allowPartial, seed: preview?.seed }),
    onSuccess: (r, previewOnly) => { setError(null); if (previewOnly) setPreview(r); else { onApplied(); onClose(); } },
    onError: (e) => setError(adminErrorText(e) + ((e as { details?: { shortages?: Array<{ rule: number; requested: number; available: number }> } }).details?.shortages?.map((s) => ` Rule ${s.rule + 1}: wanted ${s.requested}, only ${s.available} available.`).join('') ?? '')),
  });

  return (
    <Modal open={open} onClose={onClose} title="Pick questions by rules" footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button variant="secondary" disabled={!valid} loading={run.isPending && run.variables === true} onClick={() => run.mutate(true)}>Preview</Button><Button disabled={!valid || !preview} loading={run.isPending && run.variables === false} onClick={() => run.mutate(false)}>Add {preview?.picked ?? ''} questions</Button></>}>
      <div className="space-y-3">
        {rules.map((r, i) => (
          <div key={i} className="grid items-end gap-2 rounded-xl border border-line p-3 sm:grid-cols-2">
            <Field label="Topic *">{(p) => <Select {...p} value={r.topicCode} onChange={(e) => set(i, { topicCode: e.target.value })}><option value="">Choose</option>{topics.map((t) => <option key={t.code} value={t.code}>{t.nameEn}</option>)}</Select>}</Field>
            <Field label="How many *">{(p) => <Input {...p} type="number" min={1} max={200} value={r.count} onChange={(e) => set(i, { count: Number(e.target.value) })} />}</Field>
            <Field label="Difficulty">{(p) => <Select {...p} value={r.difficulty ?? ''} onChange={(e) => set(i, { difficulty: e.target.value ? Number(e.target.value) : undefined })}><option value="">Any</option><option value={1}>Easy</option><option value={2}>Medium</option><option value={3}>Hard</option></Select>}</Field>
            <Field label="Type">{(p) => <Select {...p} value={r.type ?? ''} onChange={(e) => set(i, { type: (e.target.value || undefined) as QuestionType | undefined })}><option value="">Any</option><option value="single">Single</option><option value="multi_statement">Statements</option><option value="match">Match</option><option value="assertion_reason">Assertion</option><option value="chronology">Order</option><option value="passage">Passage</option></Select>}</Field>
            {sections.length > 0 ? <Field label="Into section *">{(p) => <Select {...p} value={r.sectionPos ?? ''} onChange={(e) => set(i, { sectionPos: e.target.value === '' ? undefined : Number(e.target.value) })}><option value="">Choose</option>{sections.map((s) => <option key={s.position} value={s.position}>{s.nameEn}</option>)}</Select>}</Field> : null}
            {rules.length > 1 ? <Button variant="ghost" size="sm" onClick={() => { setRules((x) => x.filter((_, j) => j !== i)); setPreview(null); }}>Remove rule</Button> : null}
          </div>
        ))}
        <Button variant="secondary" size="sm" disabled={rules.length >= 30} onClick={() => setRules((r) => [...r, blank()])}>Add rule</Button>
        <div className="space-y-1">
          <Checkbox checked={excludeUsed} onChange={(e) => { setExcludeUsed(e.target.checked); setPreview(null); }} label="Skip questions already used in other published tests" />
          <Checkbox checked={bothOnly} onChange={(e) => { setBothOnly(e.target.checked); setPreview(null); }} label="Only questions that exist in both Hindi and English" />
          <Checkbox checked={allowPartial} onChange={(e) => { setAllowPartial(e.target.checked); setPreview(null); }} label="Add what is available if a rule cannot be fully met" />
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {preview ? <Alert tone={preview.shortages.length ? 'warning' : 'success'} live={false}>{preview.picked} questions would be added.{preview.shortages.map((s) => ` Rule ${s.rule + 1}: wanted ${s.requested}, only ${s.available} available.`).join('')}</Alert> : null}
      </div>
    </Modal>
  );
}
