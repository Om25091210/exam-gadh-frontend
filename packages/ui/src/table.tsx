import type { ReactNode } from 'react';
import { cn } from './cn';

/** Horizontally scrollable on phones; header cells are real <th scope="col"> for screen readers. */
export function Table({ columns, rows, caption, empty }: { columns: Array<{ key: string; header: ReactNode; className?: string }>; rows: Array<{ key: string; cells: Record<string, ReactNode> }>; caption?: string; empty?: ReactNode }) {
  if (!rows.length && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-max text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="border-b border-line bg-black/[0.03] text-ink-700">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn('px-3 py-2 font-semibold', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line last:border-0">
              {columns.map((c) => (
                <td key={c.key} className={cn('px-3 py-2 align-top', c.className)}>
                  {r.cells[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
