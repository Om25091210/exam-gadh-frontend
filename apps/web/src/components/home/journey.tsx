'use client';
import { useI18n, type MessageKey } from '@eg/i18n';
import { Button, cn, Modal } from '@eg/ui';
import { Award, BarChart3, BookOpenText, Flag, GraduationCap, Layers, Lock, Mic, Newspaper, PenLine, Radio, ScrollText, Swords, Target, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type Soon = 'battle' | 'mains';
interface Stop {
  key: string;
  label: MessageKey;
  icon: LucideIcon;
  /** gradient classes for the badge */
  tone: string;
  href?: string;
  soon?: Soon;
}
interface Stage {
  title: MessageKey;
  stops: Stop[];
}

const STAGES: Stage[] = [
  {
    title: 'journey.stage.foundation',
    stops: [
      { key: 'notes', label: 'journey.node.notes', icon: BookOpenText, tone: 'from-[#2fb596] to-[#0e6350]', href: '/learn/materials' },
      { key: 'ca', label: 'journey.node.ca', icon: Newspaper, tone: 'from-[#f5a53a] to-[#c9650a]', href: '/learn/ca' },
    ],
  },
  {
    title: 'journey.stage.practice',
    stops: [
      { key: 'practice', label: 'journey.node.practice', icon: Target, tone: 'from-[#4f8cf0] to-[#1d4ed8]', href: '/practice' },
      { key: 'pyq', label: 'journey.node.pyq', icon: ScrollText, tone: 'from-[#9b7bf0] to-[#6d3fd6]', href: '/learn/pyq' },
    ],
  },
  {
    title: 'journey.stage.prelims',
    stops: [
      { key: 'series', label: 'journey.node.series', icon: Layers, tone: 'from-[#2fb596] to-[#137c66]', href: '/series' },
      { key: 'live', label: 'journey.node.live', icon: Radio, tone: 'from-[#f26b6b] to-[#b91c1c]', href: '/tests' },
      { key: 'battle', label: 'journey.node.battle', icon: Swords, tone: 'from-[#f5a53a] to-[#b45309]', soon: 'battle' },
      { key: 'analytics', label: 'journey.node.analytics', icon: BarChart3, tone: 'from-[#38bdf8] to-[#0369a1]', href: '/practice/analytics' },
    ],
  },
  {
    title: 'journey.stage.mains',
    stops: [{ key: 'mains', label: 'journey.node.mains', icon: PenLine, tone: 'from-[#94a3b8] to-[#475569]', soon: 'mains' }],
  },
  {
    title: 'journey.stage.interview',
    stops: [{ key: 'interview', label: 'journey.node.interview', icon: Mic, tone: 'from-[#e879a8] to-[#be185d]', href: '/learn/interview' }],
  },
];

/** x position (% of width) for each stop, winding left and right like a trail */
const X = [50, 74, 50, 26];
const ROW = 150;

function Badge({ stop, live, index }: { stop: Stop; live: boolean; index: number }) {
  const { t } = useI18n();
  const Icon = stop.icon;
  const locked = Boolean(stop.soon);
  return (
    <span className="relative flex w-28 flex-col items-center gap-2 text-center">
      <span className="relative grid size-20 place-items-center">
        {live ? <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-danger-600/30" /> : null}
        <span aria-hidden className="absolute -inset-1.5 rounded-full bg-white/70 shadow-[0_6px_18px_-6px_rgb(14_99_80/0.35)] ring-1 ring-line" />
        <span className={cn('relative grid size-20 place-items-center rounded-full bg-gradient-to-br text-white shadow-[inset_0_-6px_10px_rgb(0_0_0/0.18),inset_0_4px_8px_rgb(255_255_255/0.35)] transition-transform duration-200 group-hover:scale-105 group-active:scale-95', stop.tone, locked && 'saturate-50')}>
          <Icon className="size-9 drop-shadow" aria-hidden />
        </span>
        <span aria-hidden className="absolute -left-1 -top-1 grid size-6 place-items-center rounded-full bg-surface text-xs font-bold text-primary-800 shadow ring-1 ring-line">
          {index}
        </span>
        {locked ? (
          <span aria-hidden className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-ink-700 text-white shadow ring-2 ring-white">
            <Lock className="size-3.5" />
          </span>
        ) : null}
        {live ? <span className="absolute -right-3 -top-2 rounded-full bg-danger-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow">{t('journey.live')}</span> : null}
      </span>
      <span className="rounded-full bg-surface/90 px-3 py-1 text-sm font-bold leading-tight text-ink-900 shadow-sm ring-1 ring-line">{t(stop.label)}</span>
      {locked ? <span className="text-xs font-semibold text-ink-500">{t('journey.soon')}</span> : null}
    </span>
  );
}

export function JourneyMap({ liveOpen }: { liveOpen: boolean }) {
  const { t } = useI18n();
  const [soon, setSoon] = useState<Soon | null>(null);

  // flatten into rows: a stage banner row, then one row per stop
  const rows = useMemo(() => {
    const out: Array<{ kind: 'banner'; title: MessageKey; n: number } | { kind: 'stop'; stop: Stop; n: number; x: number }> = [];
    let n = 0;
    STAGES.forEach((st, si) => {
      out.push({ kind: 'banner', title: st.title, n: si + 1 });
      st.stops.forEach((stop) => {
        out.push({ kind: 'stop', stop, n: ++n, x: X[(n - 1) % X.length] });
      });
    });
    return out;
  }, []);

  // geometry for the connecting trail
  const BANNER = 64;
  let y = 0;
  const centres: Array<{ x: number; y: number }> = [{ x: 50, y: 0 }];
  const tops: number[] = [];
  rows.forEach((r) => {
    tops.push(y);
    if (r.kind === 'banner') y += BANNER;
    else {
      centres.push({ x: r.x, y: y + ROW / 2 });
      y += ROW;
    }
  });
  const total = y + 90;
  let d = `M ${centres[0].x} 24`;
  for (let i = 1; i < centres.length; i++) {
    const a = i === 1 ? { x: 50, y: 24 } : centres[i - 1];
    const b = centres[i];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
  }
  const last = centres[centres.length - 1];
  d += ` C ${last.x} ${last.y + 40}, 50 ${last.y + 40}, 50 ${total - 40}`;

  return (
    <section aria-labelledby="journey-h" className="relative mb-8">
      <div className="mb-3 text-center">
        <h2 id="journey-h" className="text-2xl font-bold tracking-tight">
          {t('journey.title')}
        </h2>
        <p className="text-ink-500">{t('journey.sub')}</p>
      </div>

      <div className="relative mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-line/80 bg-gradient-to-b from-primary-50 via-paper to-accent-50 px-2 shadow-card" style={{ height: total + 70 }}>
        <div aria-hidden className="absolute -left-10 top-40 size-40 rounded-full bg-primary-100/60 blur-2xl" />
        <div aria-hidden className="absolute -right-10 top-[55%] size-44 rounded-full bg-accent-100/70 blur-2xl" />

        <div className="relative mx-auto" style={{ height: total + 70, paddingTop: 20 }}>
          <svg aria-hidden className="absolute inset-x-0 top-5 h-[var(--h)] w-full" style={{ ['--h' as string]: `${total}px` }} viewBox={`0 0 100 ${total}`} preserveAspectRatio="none" fill="none">
            <path d={d} stroke="white" strokeWidth="14" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity=".9" />
            <path d={d} stroke="var(--color-primary-500)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 11" vectorEffect="non-scaling-stroke" />
          </svg>

          <div aria-hidden className="absolute left-1/2 top-5 -translate-x-1/2 text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-700 px-3 py-1 text-xs font-bold text-white shadow">
              <Flag className="size-3.5" /> {t('journey.start')}
            </span>
          </div>

          <ol className="relative">
            {rows.map((r, i) =>
              r.kind === 'banner' ? (
                <li key={`b${r.n}`} className="flex items-end justify-center" style={{ height: BANNER, paddingTop: i === 0 ? 30 : 0 }}>
                  <span className="relative z-10 inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                    <span className="grid size-5 place-items-center rounded-full bg-accent-500 text-[11px] text-ink-900">{r.n}</span>
                    {t(r.title)}
                  </span>
                </li>
              ) : (
                <li key={r.stop.key} className="relative animate-fade-up" style={{ height: ROW, animationDelay: `${Math.min(i, 10) * 60}ms` }}>
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${r.x}%` }}>
                    {r.stop.href ? (
                      <Link href={r.stop.href} className="group block rounded-3xl focus-visible:outline-offset-4" aria-label={t(r.stop.label)}>
                        <Badge stop={r.stop} live={r.stop.key === 'live' && liveOpen} index={r.n} />
                      </Link>
                    ) : (
                      <button type="button" onClick={() => setSoon(r.stop.soon ?? null)} className="group block rounded-3xl" aria-label={`${t(r.stop.label)} · ${t('journey.soon')}`}>
                        <Badge stop={r.stop} live={false} index={r.n} />
                      </button>
                    )}
                  </div>
                </li>
              ),
            )}
          </ol>

          <div aria-hidden className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-[#f5a53a] to-[#c9650a] text-white shadow-[var(--shadow-glow)]">
              <Award className="size-8" />
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-accent-700">
              <GraduationCap className="size-4" /> {t('journey.finish')}
            </span>
          </div>
        </div>
      </div>

      <Modal open={soon !== null} onClose={() => setSoon(null)} title={soon ? t(soon === 'battle' ? 'journey.node.battle' : 'journey.node.mains') : ''} footer={<Button onClick={() => setSoon(null)}>{t('common.close')}</Button>}>
        <p>{soon ? t(soon === 'battle' ? 'journey.soon.battle' : 'journey.soon.mains') : ''}</p>
      </Modal>
    </section>
  );
}
