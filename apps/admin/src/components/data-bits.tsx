'use client';
import { Select } from '@eg/ui';
import { useRouter, useSearchParams } from 'next/navigation';

/** Filters live in the URL so a filtered list can be bookmarked or shared. */
export function useUrlFilters<T extends Record<string, string | undefined>>() {
  const router = useRouter();
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) ?? '';
  const set = (patch: Record<string, string | undefined>, path: string) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`${path}?${next.toString()}`);
  };
  return { get, set, page: Number(sp.get('page') ?? 1) || 1 } as { get: (k: keyof T & string) => string; set: (p: Partial<T> & { page?: string }, path: string) => void; page: number };
}

export function FilterSelect({ label, value, onChange, options, id }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]>; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{label}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </div>
  );
}
