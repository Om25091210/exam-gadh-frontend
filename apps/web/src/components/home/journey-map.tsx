'use client';
import { useI18n } from '@eg/i18n';
import { Button, cn, Modal } from '@eg/ui';
import { ClipboardCheck, Lock, NotebookPen } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

const W = 360;
const H = 560;
const x = (f: number) => +(f * W).toFixed(1);
const y = (f: number) => +(f * H).toFixed(1);

/** The road as cubic Bezier segments (fractions of the canvas): start, control 1, control 2, end. */
const ROAD: number[][] = [
  [-0.05, 0.31, 0.15, 0.28, 0.4, 0.3, 0.58, 0.335],
  [0.58, 0.335, 0.9, 0.39, 0.92, 0.5, 0.62, 0.525],
  [0.62, 0.525, 0.42, 0.54, 0.28, 0.56, 0.2, 0.64],
  [0.2, 0.64, 0.12, 0.72, 0.18, 0.79, 0.38, 0.805],
  [0.38, 0.805, 0.62, 0.82, 0.85, 0.8, 1.06, 0.84],
];
const roadD = `M ${x(ROAD[0][0])} ${y(ROAD[0][1])} ` + ROAD.map((s) => `C ${x(s[2])} ${y(s[3])}, ${x(s[4])} ${y(s[5])}, ${x(s[6])} ${y(s[7])}`).join(' ');
const MILESTONES: Array<[number, number]> = [[0.42, 0.305], [0.85, 0.43], [0.22, 0.615], [0.56, 0.81]];

export type StopId = 'ca' | 'tests' | 'mock' | 'notes' | 'pyq' | 'answers';
const POS: Record<StopId, [number, number]> = { ca: [0.24, 0.235], tests: [0.78, 0.25], mock: [0.6, 0.515], notes: [0.19, 0.465], pyq: [0.2, 0.745], answers: [0.82, 0.735] };

function Scenery() {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d5e9fa" />
          <stop offset=".55" stopColor="#eaf4fc" />
          <stop offset="1" stopColor="#f5fafe" />
        </linearGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4def4" />
          <stop offset="1" stopColor="#dcedfa" />
        </linearGradient>
        <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe4f6" />
          <stop offset="1" stopColor="#e6f1fb" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky)" />
      {/* soft clouds */}
      <g fill="#fff" opacity=".85">
        <ellipse cx="70" cy="40" rx="34" ry="10" />
        <ellipse cx="92" cy="34" rx="22" ry="9" />
        <ellipse cx="288" cy="64" rx="30" ry="9" />
        <ellipse cx="306" cy="58" rx="18" ry="8" />
      </g>
      <g fill="#7fa6c6" opacity=".6">
        {[[30, 18], [120, 52], [200, 24], [250, 90], [330, 20], [160, 14]].map(([a, b]) => (
          <circle key={`${a}${b}`} cx={a} cy={b} r="1.4" />
        ))}
      </g>
      <path d={`M0 ${y(0.2)} C 60 ${y(0.13)}, 110 ${y(0.19)}, 170 ${y(0.15)} S 290 ${y(0.1)}, 360 ${y(0.17)} L 360 ${y(0.3)} L 0 ${y(0.3)} Z`} fill="url(#hill1)" stroke="#7fa6c6" strokeWidth="1.2" strokeOpacity=".5" />
      <path d={`M0 ${y(0.93)} C 70 ${y(0.89)}, 130 ${y(0.95)}, 200 ${y(0.915)} S 320 ${y(0.9)}, 360 ${y(0.93)} L 360 ${H} L 0 ${H} Z`} fill="url(#hill2)" stroke="#7fa6c6" strokeWidth="1.2" strokeOpacity=".5" />
      {/* the road: edge, fill, dashes */}
      <path d={roadD} fill="none" stroke="#b9d6ee" strokeWidth="30" strokeLinecap="round" />
      <path d={roadD} fill="none" stroke="#f7fbff" strokeWidth="25" strokeLinecap="round" />
      <path d={roadD} fill="none" stroke="#9cc3e4" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="10 10" />
      {MILESTONES.map(([a, b]) => (
        <g key={`${a}${b}`}>
          <circle cx={x(a)} cy={y(b)} r="7" fill="#fff" />
          <circle cx={x(a)} cy={y(b)} r="4.6" fill="#e0782f" />
        </g>
      ))}
      {/* grass tufts */}
      <g stroke="#6e93b3" strokeWidth="1.4" strokeLinecap="round" fill="none">
        {[[0.6, 0.27], [0.14, 0.555], [0.66, 0.43], [0.44, 0.665], [0.92, 0.79], [0.08, 0.82], [0.62, 0.73]].map(([a, b]) => (
          <path key={`${a}${b}`} d={`M${x(a) - 4} ${y(b)} q-1 -5 -4 -8 M${x(a)} ${y(b)} q1 -7 -1 -11 M${x(a) + 4} ${y(b)} q1 -6 4 -9`} />
        ))}
      </g>
      <ellipse cx={x(0.86)} cy={y(0.545)} rx="11" ry="6" fill="#c3dcef" />
    </svg>
  );
}

const Book = () => (
  <svg viewBox="0 0 96 96" className="size-full drop-shadow-md" aria-hidden>
    <g transform="rotate(-12 48 48)">
      <rect x="12" y="14" width="72" height="68" rx="7" fill="#fff" />
      <rect x="10" y="12" width="68" height="68" rx="7" fill="#e0782f" stroke="#16324a" strokeWidth="2" />
      <rect x="10" y="12" width="10" height="68" rx="4" fill="#b85f20" />
      <rect x="28" y="22" width="42" height="18" rx="3" fill="#fdebdc" />
      <path d="M33 29h30M33 35h20M30 52h38M30 60h38M30 68h26" stroke="#16324a" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  </svg>
);
const Tent = () => (
  <svg viewBox="0 0 96 96" className="size-full drop-shadow-md" aria-hidden>
    <path d="M48 12 12 80h72z" fill="#5aa9e6" stroke="#16324a" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M48 12 64 80H84z" fill="#2e7fc1" />
    <path d="M48 44 34 80h28z" fill="#16324a" opacity=".9" />
    <path d="M48 12v-6M48 6l9 3-9 3" stroke="#16324a" strokeWidth="2.4" fill="#e0782f" strokeLinejoin="round" />
  </svg>
);
const Tree = () => (
  <svg viewBox="0 0 96 96" className="size-full drop-shadow-md" aria-hidden>
    <rect x="42" y="56" width="12" height="28" rx="3" fill="#9a6b47" stroke="#16324a" strokeWidth="2" />
    <circle cx="48" cy="36" r="26" fill="#2a9d8f" stroke="#16324a" strokeWidth="2.4" />
    <circle cx="36" cy="40" r="14" fill="#1f7a6f" opacity=".55" />
    <path d="M36 30l5 5M58 28l-6 7M48 46l0 9" stroke="#e6fbf7" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="58" cy="44" r="3" fill="#ffd166" />
  </svg>
);

function Bubble({ children }: { children: ReactNode }) {
  return <span className="grid size-full place-items-center rounded-full border-2 border-ink-900 bg-white text-primary-700 shadow-[0_6px_14px_-4px_rgb(22_50_74/0.35)]">{children}</span>;
}

export interface MapProps {
  avatarUrl: string | null;
  initial: string;
  mockHref: string;
  mockNumber: number;
  /** a live test is open right now: the Tests stop pulses */
  liveOpen: boolean;
}

export function JourneyMap({ avatarUrl, initial, mockHref, mockNumber, liveOpen }: MapProps) {
  const { t } = useI18n();
  const [soon, setSoon] = useState(false);

  const Stop = ({ id, href, size, label, children, locked, className }: { id: StopId; href?: string; size: number; label: ReactNode; children: ReactNode; locked?: boolean; className?: string }) => {
    const [fx, fy] = POS[id];
    const inner = (
      <span className="group flex flex-col items-center gap-1 text-center transition-transform duration-200 active:scale-95">
        <span className="relative block transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-105" style={{ width: size, height: size }}>
          {children}
          {locked ? (
            <span aria-hidden className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-ink-700 text-white ring-2 ring-white">
              <Lock className="size-3" />
            </span>
          ) : null}
        </span>
        <span className={cn('whitespace-pre-line text-[13px] font-bold leading-tight text-ink-900', className)}>{label}</span>
      </span>
    );
    const style = { left: `${fx * 100}%`, top: `${fy * 100}%` };
    const cls = 'absolute -translate-x-1/2 -translate-y-[42%] rounded-2xl p-1 focus-visible:outline-offset-2';
    return href ? (
      <Link href={href} style={style} className={cls}>
        {inner}
      </Link>
    ) : (
      <button type="button" style={style} className={cls} onClick={() => setSoon(true)}>
        {inner}
      </button>
    );
  };

  return (
    <section aria-label={t('map.label')} className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-[2rem] border border-line bg-white shadow-card" style={{ aspectRatio: `${W} / ${H}` }}>
      <Scenery />
      <ol className="contents">
        <li>
          <Stop id="ca" href="/learn/ca" size={84} label={t('map.ca').replace(' ', '\n')}>
            <Book />
          </Stop>
        </li>
        <li>
          <Stop id="tests" href="/tests" size={70} label={t('map.tests')}>
            <span className="relative block size-full">
              {liveOpen ? <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-danger-600/30" /> : null}
              <Bubble>
                <ClipboardCheck className="size-8" aria-hidden />
              </Bubble>
              {liveOpen ? <span className="absolute -right-2 -top-2 rounded-full bg-danger-600 px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span> : null}
            </span>
          </Stop>
        </li>
        <li>
          <Stop
            id="mock"
            href={mockHref}
            size={92}
            label={
              <>
                <span className="block text-[12px] font-medium text-ink-700">{t('map.mock')}</span>
                <span className="block text-[14px]">{t('map.mock.n', { n: mockNumber })}</span>
              </>
            }
          >
            <span className="relative block size-full">
              <span aria-hidden className="absolute -inset-2 animate-pulse rounded-full bg-primary-500/20" />
              <span className="relative grid size-full place-items-center overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-br from-primary-500 to-primary-800 text-3xl font-bold text-white shadow-[0_10px_22px_-6px_rgb(30_111_184/0.7)] ring-2 ring-primary-600">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  initial
                )}
              </span>
            </span>
          </Stop>
        </li>
        <li>
          <Stop id="notes" href="/learn/materials" size={70} label={t('map.notes')}>
            <Bubble>
              <NotebookPen className="size-8" aria-hidden />
            </Bubble>
          </Stop>
        </li>
        <li>
          <Stop id="pyq" href="/learn/pyq" size={84} label={t('map.pyq')}>
            <Tent />
          </Stop>
        </li>
        <li>
          <Stop id="answers" size={84} locked label={t('map.answers').replace(' ', '\n')}>
            <Tree />
          </Stop>
        </li>
      </ol>
      <Modal open={soon} onClose={() => setSoon(false)} title={t('map.answers')} footer={<Button onClick={() => setSoon(false)}>{t('common.close')}</Button>}>
        <p>{t('journey.soon.mains')}</p>
      </Modal>
    </section>
  );
}
