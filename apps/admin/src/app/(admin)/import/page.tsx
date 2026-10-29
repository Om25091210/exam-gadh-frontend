'use client';
import type { ImportCommitResult, ImportPreview } from '@eg/api';
import { Alert, Button, Card, Checkbox, PageHeader, Section, Table, useToast } from '@eg/ui';
import { Download, Upload } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { useAdmin } from '@/lib/auth';
import { saveBlob } from '@/lib/download';
import { adminErrorText } from '@/lib/errors';

export default function ImportPage() {
  const { api, can } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [done, setDone] = useState<ImportCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const jobs = useQuery({ queryKey: ['import-jobs'], queryFn: () => api.importJobs() });

  const dryRun = useMutation({
    mutationFn: () => api.importPreview(file!, allowDuplicates),
    onSuccess: (r) => { setPreview(r); setDone(null); setError(null); void qc.invalidateQueries({ queryKey: ['import-jobs'] }); },
    onError: (e) => { setPreview(null); setError(adminErrorText(e)); },
  });
  const commit = useMutation({
    mutationFn: () => api.importCommit(preview!.jobId, skipInvalid),
    onSuccess: (r) => { setDone(r); setPreview(null); setFile(null); void qc.invalidateQueries({ queryKey: ['import-jobs'] }); void qc.invalidateQueries({ queryKey: ['questions'] }); },
    onError: (e) => setError(adminErrorText(e)),
  });
  const download = async (kind: 'template' | 'export') => {
    try {
      const d = kind === 'template' ? await api.importTemplate('csv') : await api.exportQuestions({}, 'csv');
      saveBlob(d.blob, d.filename);
    } catch (e) {
      toast.show(adminErrorText(e), 'danger');
    }
  };
  const canCommit = !!preview && preview.rowsOk > 0 && (preview.rowsFailed === 0 || skipInvalid);

  return (
    <>
      <PageHeader title="Import and export questions" subtitle="Add or update many questions from a spreadsheet. Nothing is saved until you check the preview and confirm." />

      <Section title="1. Get the template">
        <Card className="space-y-2">
          <p className="text-ink-700">The template has every column with an example row. Use one row per question. A row with an existing <b>code</b> updates that question; a new code creates one.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void download('template')}><Download className="size-4" aria-hidden />Download template (CSV)</Button>
            {can('content:read') ? <Button variant="ghost" onClick={() => void download('export')}><Download className="size-4" aria-hidden />Export all questions (CSV)</Button> : null}
          </div>
        </Card>
      </Section>

      <Section title="2. Upload and check">
        <Card className="space-y-3">
          <input ref={fileInput} type="file" accept=".csv,.xlsx,text/csv" className="sr-only" tabIndex={-1} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setDone(null); setError(null); }} />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => fileInput.current?.click()}><Upload className="size-4" aria-hidden />Choose file</Button>
            <span className="text-ink-700">{file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : 'No file chosen (CSV or XLSX, up to 5 MB)'}</span>
          </div>
          <Checkbox checked={allowDuplicates} onChange={(e) => setAllowDuplicates(e.target.checked)} label="Allow rows whose text matches an existing question" />
          <Button disabled={!file} loading={dryRun.isPending} onClick={() => dryRun.mutate()}>Check file (no changes yet)</Button>
          {error ? <Alert tone="danger">{error}</Alert> : null}
        </Card>
      </Section>

      {preview ? (
        <Section title="3. Review the preview">
          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><p className="text-sm text-ink-500">Rows</p><p className="text-2xl font-bold">{preview.rowsTotal}</p></div>
              <div><p className="text-sm text-ink-500">Ready</p><p className="text-2xl font-bold text-success-600">{preview.rowsOk}</p></div>
              <div><p className="text-sm text-ink-500">Problems</p><p className={`text-2xl font-bold ${preview.rowsFailed ? 'text-danger-600' : ''}`}>{preview.rowsFailed}</p></div>
              <div><p className="text-sm text-ink-500">Will create / update</p><p className="text-2xl font-bold">{preview.willCreate} / {preview.willUpdate}</p></div>
            </div>
            {preview.ignoredColumns.length ? <Alert tone="info" live={false}>These columns were not recognised and are ignored: {preview.ignoredColumns.join(', ')}</Alert> : null}
            {preview.errors.length ? (
              <div>
                <h3 className="mb-1 font-semibold">Problems to fix</h3>
                <Table caption="Import problems" columns={[{ key: 'row', header: 'Row' }, { key: 'field', header: 'Column' }, { key: 'message', header: 'Problem' }]} rows={preview.errors.map((e, i) => ({ key: String(i), cells: { row: e.row, field: e.field ?? '', message: e.message } }))} />
                {preview.errorsTruncated ? <p className="mt-1 text-sm text-ink-500">Only the first 200 problems are shown.</p> : null}
              </div>
            ) : null}
            {preview.sample.length ? (
              <div>
                <h3 className="mb-1 font-semibold">First rows that are ready</h3>
                <Table caption="Sample rows" columns={[{ key: 'row', header: 'Row' }, { key: 'action', header: 'Action' }, { key: 'code', header: 'Code' }, { key: 'type', header: 'Type' }, { key: 'topic', header: 'Topic' }, { key: 'lang', header: 'Languages' }]} rows={preview.sample.map((s) => ({ key: String(s.row), cells: { row: s.row, action: s.action, code: s.code ?? '(new)', type: s.type, topic: s.topic, lang: s.languages.join(', ') } }))} />
              </div>
            ) : null}
            {preview.rowsFailed > 0 ? <Checkbox checked={skipInvalid} onChange={(e) => setSkipInvalid(e.target.checked)} label={`Import the ${preview.rowsOk} good rows and skip the ${preview.rowsFailed} with problems`} /> : null}
            <Button disabled={!canCommit} loading={commit.isPending} onClick={() => commit.mutate()}>Import {preview.rowsOk} question(s)</Button>
            {preview.rowsFailed > 0 && !skipInvalid ? <p className="text-sm text-ink-500">Fix the file and check it again, or tick the box above to skip the bad rows.</p> : null}
          </Card>
        </Section>
      ) : null}

      {done ? <Alert tone="success" title="Import finished" className="mb-6">Created {done.created}, updated {done.updated}, skipped {done.skippedRows}. New questions start as drafts.</Alert> : null}

      <Section title="Recent imports">
        <Table
          caption="Recent imports"
          empty={<p className="text-ink-500">No imports yet.</p>}
          columns={[{ key: 'file', header: 'File' }, { key: 'status', header: 'Status' }, { key: 'rows', header: 'Rows (ok / failed)' }, { key: 'when', header: 'When' }]}
          rows={(jobs.data ?? []).map((j) => ({ key: j.id, cells: { file: j.fileName, status: <StatusBadge status={j.status === 'dry_run' ? 'draft' : j.status} />, rows: `${j.rowsTotal} (${j.rowsOk} / ${j.rowsFailed})`, when: new Date(j.committedAt ?? j.createdAt).toLocaleString('en-IN') } }))}
        />
      </Section>
    </>
  );
}
