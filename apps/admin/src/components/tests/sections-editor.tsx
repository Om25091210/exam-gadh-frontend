'use client';
import { Alert, Button, Card, Input } from '@eg/ui';
import { useEffect, useState } from 'react';

export interface SectionDraft {
  nameEn: string;
  nameHi: string;
  durationMin: number | null;
}

/** Sections of a draft version. Saving them detaches every question from its section, so they are assigned again afterwards. */
export function SectionsEditor({ initial, sectionalTimers, onSave, saving, disabled }: { initial: SectionDraft[]; sectionalTimers: boolean; onSave: (s: SectionDraft[]) => void; saving: boolean; disabled?: boolean }) {
  const [rows, setRows] = useState<SectionDraft[]>(initial);
  useEffect(() => setRows(initial), [initial]);
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);
  const set = (i: number, patch: Partial<SectionDraft>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Sections</h2>
      {rows.length === 0 ? <p className="text-ink-500">No sections: all questions are in one list.</p> : null}
      {rows.map((s, i) => (
        <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
          <label className="text-sm font-medium">Name (Hindi)<Input lang="hi" value={s.nameHi} disabled={disabled} onChange={(e) => set(i, { nameHi: e.target.value })} /></label>
          <label className="text-sm font-medium">Name (English)<Input lang="en" value={s.nameEn} disabled={disabled} onChange={(e) => set(i, { nameEn: e.target.value })} /></label>
          <label className="text-sm font-medium">Minutes{sectionalTimers ? ' *' : ''}<Input type="number" min={1} max={600} value={s.durationMin ?? ''} disabled={disabled} onChange={(e) => set(i, { durationMin: e.target.value === '' ? null : Number(e.target.value) })} /></label>
          {!disabled ? <Button variant="ghost" size="sm" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} aria-label={`Remove section ${i + 1}`}>Remove</Button> : <span />}
        </div>
      ))}
      {!disabled ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={rows.length >= 12} onClick={() => setRows((r) => [...r, { nameEn: `Section ${r.length + 1}`, nameHi: `खंड ${r.length + 1}`, durationMin: null }])}>Add section</Button>
          <Button size="sm" disabled={!dirty || rows.some((r) => !r.nameEn.trim() || !r.nameHi.trim())} loading={saving} onClick={() => onSave(rows)}>Save sections</Button>
        </div>
      ) : null}
      {dirty ? <Alert tone="warning" live={false}>Saving sections removes every question from its section. Assign sections to questions again after saving.</Alert> : null}
    </Card>
  );
}
