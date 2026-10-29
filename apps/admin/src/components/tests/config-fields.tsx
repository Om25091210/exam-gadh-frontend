'use client';
import type { VersionConfig } from '@eg/api';
import { Checkbox, Field, Input } from '@eg/ui';
import { fromLocalInput, toLocalInput } from '@/lib/datetime';
import { RichField } from '../rich-field';

const num = (v: string): number | null => (v === '' ? null : Number(v));

/** All the settings of a test version. `disabled` shows them read-only for published versions. */
export function ConfigFields({ value, onChange, disabled, live }: { value: Partial<VersionConfig>; onChange: (v: Partial<VersionConfig>) => void; disabled?: boolean; live?: boolean }) {
  const set = <K extends keyof VersionConfig>(k: K, v: VersionConfig[K] | undefined) => onChange({ ...value, [k]: v });
  return (
    <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
      <Field label="Duration (minutes)">{(p) => <Input {...p} type="number" min={1} max={600} value={value.durationMin ?? ''} onChange={(e) => set('durationMin', num(e.target.value) ?? undefined)} />}</Field>
      <Field label="Marks per correct answer">{(p) => <Input {...p} type="number" min={0.25} step={0.25} value={value.correctMarks ?? ''} onChange={(e) => set('correctMarks', num(e.target.value) ?? undefined)} />}</Field>
      <Field label="Negative marking (fraction of marks)" hint="0.33 means a third of the marks is deducted for a wrong answer. 0 = none.">{(p) => <Input {...p} type="number" min={0} max={1} step={0.01} value={value.negativeFraction ?? ''} onChange={(e) => set('negativeFraction', num(e.target.value) ?? undefined)} />}</Field>
      <Field label="Attempts allowed" hint="Empty = unlimited. Extra attempts are practice and are never ranked.">{(p) => <Input {...p} type="number" min={1} max={50} value={value.attemptLimit ?? ''} onChange={(e) => set('attemptLimit', num(e.target.value))} />}</Field>
      <Field label="Qualifying % (general)" hint="Only for qualifying papers like CSAT.">{(p) => <Input {...p} type="number" min={0} max={100} value={value.qualifyingPct ?? ''} onChange={(e) => set('qualifyingPct', num(e.target.value))} />}</Field>
      <Field label="Qualifying % (reserved categories)">{(p) => <Input {...p} type="number" min={0} max={100} value={value.qualifyingPctReserved ?? ''} onChange={(e) => set('qualifyingPctReserved', num(e.target.value))} />}</Field>
      <Field label={live ? 'Live start * (India time)' : 'Opens at (India time)'}>{(p) => <Input {...p} type="datetime-local" value={toLocalInput(value.startsAt)} onChange={(e) => set('startsAt', fromLocalInput(e.target.value))} />}</Field>
      <Field label="Entry closes (India time)">{(p) => <Input {...p} type="datetime-local" value={toLocalInput(value.endsAt)} onChange={(e) => set('endsAt', fromLocalInput(e.target.value))} />}</Field>
      <Field label="Result release (India time)" hint="Empty = results and solutions are visible right after submitting.">{(p) => <Input {...p} type="datetime-local" value={toLocalInput(value.resultReleaseAt)} onChange={(e) => set('resultReleaseAt', fromLocalInput(e.target.value))} />}</Field>
      <div className="space-y-1 sm:col-span-2">
        <Checkbox checked={value.shuffleQuestions ?? false} onChange={(e) => set('shuffleQuestions', e.target.checked)} label="Shuffle question order for each student" />
        <Checkbox checked={value.sectionalTimers ?? false} onChange={(e) => set('sectionalTimers', e.target.checked)} label="Each section has its own timer (students cannot go back)" />
        <Checkbox checked={value.countsTowardMerit ?? true} onChange={(e) => set('countsTowardMerit', e.target.checked)} label="Marks count toward merit (untick for qualifying-only papers)" />
      </div>
      <div className="sm:col-span-2"><RichField label="Instructions (Hindi)" value={value.instructionsHi ?? ''} onChange={(v) => set('instructionsHi', v || null)} rows={4} lang="hi" /></div>
      <div className="sm:col-span-2"><RichField label="Instructions (English)" value={value.instructionsEn ?? ''} onChange={(v) => set('instructionsEn', v || null)} rows={4} lang="en" /></div>
    </fieldset>
  );
}
