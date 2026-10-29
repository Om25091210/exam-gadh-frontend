import { cn } from '@eg/ui';

/**
 * A small line chart of recent test scores (percent). Pure SVG, with a text summary for screen readers.
 * Points are labelled by value so colour is never the only signal.
 */
export function TrendChart({ points, summary, className }: { points: Array<{ label: string; pct: number }>; summary: string; className?: string }) {
  const w = 300;
  const h = 100;
  const pad = 14;
  if (points.length === 0) return null;
  const x = (i: number) => (points.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (points.length - 1));
  const y = (v: number) => h - pad - (Math.min(100, Math.max(0, v)) / 100) * (h - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(' ');
  return (
    <figure className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={summary} className="h-28 w-full">
        {[0, 50, 100].map((g) => (
          <line key={g} x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke="currentColor" className="text-line" strokeDasharray={g === 50 ? '3 3' : undefined} />
        ))}
        {points.length > 1 ? <path d={path} fill="none" stroke="currentColor" className="text-primary-600" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" /> : null}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.pct)} r={4} className="fill-primary-700" />
            <text x={x(i)} y={y(p.pct) - 8} textAnchor="middle" className="fill-ink-700 text-[10px] font-semibold">
              {Math.round(p.pct)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
