'use client';
import type { QuestionType } from '@eg/api';
import { Button, Input, Modal, Pagination, Spinner } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAdmin } from '@/lib/auth';
import { FilterSelect } from '../data-bits';

export interface PickedQuestion {
  id: string;
  code: string | null;
  type: QuestionType;
  topicCode: string;
  difficulty: number;
  preview: string;
  hasEn: boolean;
  hasHi: boolean;
}

/** Search published questions and tick the ones to add. Questions already in the test are shown but cannot be ticked. */
export function AddQuestionsDialog({ open, onClose, existing, onAdd }: { open: boolean; onClose: () => void; existing: Set<string>; onAdd: (q: PickedQuestion[]) => void }) {
  const { api } = useAdmin();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [chosen, setChosen] = useState<Map<string, PickedQuestion>>(new Map());
  const tree = useQuery({ queryKey: ['taxonomy'], queryFn: () => api.taxonomy(), staleTime: 60_000, enabled: open });
  const res = useQuery({ queryKey: ['pick-questions', q, topic, type, page], queryFn: () => api.questions({ status: 'published', q: q.trim().length >= 2 ? q.trim() : undefined, topicCode: topic || undefined, type: (type || undefined) as QuestionType | undefined, page, pageSize: 10 }), enabled: open });
  const toggle = (x: PickedQuestion) => setChosen((m) => { const n = new Map(m); if (n.has(x.id)) n.delete(x.id); else n.set(x.id, x); return n; });
  return (
    <Modal open={open} onClose={onClose} title="Add questions from the bank" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={chosen.size === 0} onClick={() => { onAdd([...chosen.values()]); setChosen(new Map()); onClose(); }}>Add {chosen.size || ''} selected</Button></>}>
      <div className="space-y-3">
        <p className="text-sm text-ink-500">Only published questions can be used in a test.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="sm:col-span-3"><label className="sr-only" htmlFor="aq-q">Search</label><Input id="aq-q" type="search" placeholder="Search question text" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
          <FilterSelect id="aq-topic" label="Any topic" value={topic} onChange={(v) => { setTopic(v); setPage(1); }} options={(tree.data?.subjects.flatMap((s) => s.topics) ?? []).map((t) => [t.code, t.nameEn])} />
          <FilterSelect id="aq-type" label="Any type" value={type} onChange={(v) => { setType(v); setPage(1); }} options={[['single', 'Single'], ['multi_statement', 'Statements'], ['match', 'Match'], ['assertion_reason', 'Assertion'], ['chronology', 'Order'], ['passage', 'Passage']]} />
        </div>
        {res.isLoading ? <Spinner /> : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {res.data?.items.map((x) => {
              const inTest = existing.has(x.id);
              return (
                <li key={x.id}>
                  <label className={`flex items-start gap-3 p-3 ${inTest ? 'opacity-50' : 'cursor-pointer hover:bg-primary-50'}`}>
                    <input type="checkbox" className="mt-1 size-4 accent-primary-700" disabled={inTest} checked={chosen.has(x.id)} onChange={() => toggle({ id: x.id, code: x.code, type: x.type, topicCode: x.topicCode, difficulty: x.difficulty, preview: x.preview, hasEn: x.hasEn, hasHi: x.hasHi })} />
                    <span className="min-w-0 flex-1"><span className="block line-clamp-2">{x.preview}</span><span className="text-xs text-ink-500">{x.code ?? x.id.slice(0, 8)} · {x.topicCode} · {['', 'easy', 'medium', 'hard'][x.difficulty]} · {x.hasHi ? 'हि ' : ''}{x.hasEn ? 'EN' : ''}{inTest ? ' · already in this test' : ''}</span></span>
                  </label>
                </li>
              );
            })}
            {res.data?.items.length === 0 ? <li className="p-3 text-ink-500">No published questions match.</li> : null}
          </ul>
        )}
        {res.data ? <Pagination page={res.data.page} pageSize={res.data.pageSize} total={res.data.total} onPage={setPage} /> : null}
      </div>
    </Modal>
  );
}
