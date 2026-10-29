'use client';
import { ApiError } from '@eg/api';
import { Alert, Button, Checkbox, Field, Input, Modal, Select, Textarea } from '@eg/ui';
import { useState, type ReactNode } from 'react';
import { useAdmin } from '@/lib/auth';
import { adminErrorText, fieldProblems } from '@/lib/errors';
import { fromLocalInput, toLocalInput } from '@/lib/datetime';
import { RichField } from './rich-field';

export type FieldType = 'text' | 'textarea' | 'rich' | 'number' | 'checkbox' | 'select' | 'datetime' | 'date' | 'tags' | 'upload' | 'url';
export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: Array<[string, string]>;
  /** only when creating (ids, codes) */
  createOnly?: boolean;
  /** select with an empty choice stored as null */
  nullable?: boolean;
  rows?: number;
  lang?: 'hi' | 'en';
  /** `upload`: which presigned upload purpose to use */
  purpose?: 'ca-image' | 'material-pdf' | 'question-image';
  accept?: string;
  min?: number;
  max?: number;
  step?: number;
  /** show only when this returns true for the current values */
  when?: (v: Record<string, unknown>) => boolean;
  span?: 1 | 2;
}

type Values = Record<string, unknown>;

function UploadField({ spec, value, onChange }: { spec: FieldSpec; value: string; onChange: (v: string | null) => void }) {
  const { api } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const post = await api.presignUpload(spec.purpose!, file.type);
      const fd = new FormData();
      Object.entries(post.fields).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', file);
      const res = await fetch(post.url, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('upload');
      onChange(post.key);
    } catch (e) {
      setError(e instanceof ApiError ? adminErrorText(e) : 'Upload failed. Check the file type and size.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Field label={spec.required ? `${spec.label} *` : spec.label} hint={spec.hint} error={error}>
      {(p) => (
        <div className="space-y-1">
          {value ? <p className="break-all text-sm text-ink-700">Uploaded: {value} <button type="button" className="ml-2 text-primary-700 underline" onClick={() => onChange(null)}>Remove</button></p> : null}
          <input id={p.id} type="file" accept={spec.accept} disabled={busy} className="text-sm" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} />
          {busy ? <p className="text-sm text-ink-500">Uploading…</p> : null}
        </div>
      )}
    </Field>
  );
}

/** Renders a form from field specs: one place for every simple create/edit screen. */
export function SchemaForm({ fields, value, onChange, editing, errors }: { fields: FieldSpec[]; value: Values; onChange: (v: Values) => void; editing: boolean; errors?: Record<string, string> }) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.filter((f) => (!f.createOnly || !editing) && (!f.when || f.when(value))).map((f) => {
        const err = errors?.[f.key] ?? null;
        const label = f.required ? `${f.label} *` : f.label;
        const cell = (node: ReactNode) => <div key={f.key} className={f.span === 2 || f.type === 'textarea' || f.type === 'rich' || f.type === 'upload' ? 'sm:col-span-2' : undefined}>{node}</div>;
        const v = value[f.key];
        switch (f.type) {
          case 'checkbox':
            return cell(<Checkbox checked={!!v} onChange={(e) => set(f.key, e.target.checked)} label={f.label} />);
          case 'rich':
            return cell(<RichField label={f.label} value={String(v ?? '')} onChange={(x) => set(f.key, x)} rows={f.rows ?? 3} lang={f.lang} hint={f.hint} error={err} required={f.required} />);
          case 'textarea':
            return cell(<Field label={label} hint={f.hint} error={err}>{(p) => <Textarea {...p} rows={f.rows ?? 4} lang={f.lang} value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />}</Field>);
          case 'select':
            return cell(<Field label={label} hint={f.hint} error={err}>{(p) => <Select {...p} value={v == null ? '' : String(v)} onChange={(e) => set(f.key, e.target.value === '' && f.nullable ? null : e.target.value)}>{f.nullable || !f.required ? <option value="">{f.nullable ? 'None' : 'Choose'}</option> : null}{f.options?.map(([o, l]) => <option key={o} value={o}>{l}</option>)}</Select>}</Field>);
          case 'number':
            return cell(<Field label={label} hint={f.hint} error={err}>{(p) => <Input {...p} type="number" min={f.min} max={f.max} step={f.step} value={v == null ? '' : String(v)} onChange={(e) => set(f.key, e.target.value === '' ? (f.required ? undefined : null) : Number(e.target.value))} />}</Field>);
          case 'datetime':
            return cell(<Field label={`${label} (India time)`} hint={f.hint} error={err}>{(p) => <Input {...p} type="datetime-local" value={toLocalInput(v as string | null)} onChange={(e) => set(f.key, fromLocalInput(e.target.value))} />}</Field>);
          case 'date':
            return cell(<Field label={label} hint={f.hint} error={err}>{(p) => <Input {...p} type="date" value={typeof v === 'string' ? v.slice(0, 10) : ''} onChange={(e) => set(f.key, e.target.value || null)} />}</Field>);
          case 'tags':
            return cell(<Field label={label} hint={f.hint ?? 'Comma separated'} error={err}>{(p) => <Input {...p} value={Array.isArray(v) ? (v as string[]).join(', ') : ''} onChange={(e) => set(f.key, e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} />}</Field>);
          case 'upload':
            return cell(<UploadField spec={f} value={typeof v === 'string' ? v : ''} onChange={(x) => set(f.key, x)} />);
          default:
            return cell(<Field label={label} hint={f.hint} error={err}>{(p) => <Input {...p} type={f.type === 'url' ? 'url' : 'text'} lang={f.lang} value={v == null ? '' : String(v)} onChange={(e) => set(f.key, e.target.value === '' && !f.required ? null : e.target.value)} />}</Field>);
        }
      })}
    </div>
  );
}

/** Maps the backend's `[{ field, problems }]` to per-field messages, plus a leftover summary. */
export function errorMap(e: unknown): { map: Record<string, string>; summary: string | null } {
  const p = fieldProblems(e);
  if (!p.length) return { map: {}, summary: adminErrorText(e) };
  const map: Record<string, string> = {};
  for (const x of p) map[x.field.split('.')[0]] = x.problems.join(', ');
  return { map, summary: null };
}

/** A modal with a SchemaForm and Save / Cancel. `onSave` throws on failure; field problems appear beside the fields. */
export function EditDialog({ open, recordKey, title, fields, initial, editing, onSave, onClose, saveLabel = 'Save', extra }: { open: boolean; /** changes when a different record is opened, so the form restarts from its values */ recordKey: string; title: string; fields: FieldSpec[]; initial: Values; editing: boolean; onSave: (v: Values) => Promise<unknown>; onClose: () => void; saveLabel?: string; extra?: ReactNode }) {
  const [value, setValue] = useState<Values>(initial);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<{ map: Record<string, string>; summary: string | null }>({ map: {}, summary: null });
  const [seen, setSeen] = useState(recordKey);
  if (seen !== recordKey) {
    setSeen(recordKey);
    setValue(initial);
    setErrs({ map: {}, summary: null });
  }
  const submit = async () => {
    setBusy(true);
    setErrs({ map: {}, summary: null });
    try {
      await onSave(value);
    } catch (e) {
      setErrs(errorMap(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={() => void submit()}>{saveLabel}</Button></>}>
      <div className="space-y-4">
        <SchemaForm fields={fields} value={value} onChange={setValue} editing={editing} errors={errs.map} />
        {extra}
        {errs.summary ? <Alert tone="danger">{errs.summary}</Alert> : Object.keys(errs.map).length ? <Alert tone="danger">Please fix the fields marked above.</Alert> : null}
      </div>
    </Modal>
  );
}
