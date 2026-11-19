import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

export type StickerTone = 'indigo' | 'mint' | 'pink' | 'sky' | 'peach' | 'lilac' | 'gold';

/** Pastel backdrop + the glossy "3D" glyph colours for each tone (all inside the app palette). */
const TONES: Record<StickerTone, { bg: string; glyph: string; dot: string }> = {
  indigo: { bg: 'from-[#e7e3ff] to-[#d4ccff]', glyph: 'from-[#8a76ff] to-[#4a2fd1]', dot: '#6c55f5' },
  mint: { bg: 'from-[#d4f8f0] to-[#b4efe3]', glyph: 'from-[#5eead4] to-[#0b9d89]', dot: '#2fd6bf' },
  pink: { bg: 'from-[#ffe1e8] to-[#ffc9d6]', glyph: 'from-[#ff9db0] to-[#e5486c]', dot: '#ff7d95' },
  sky: { bg: 'from-[#dcf3fb] to-[#bfe8f7]', glyph: 'from-[#6fd3f2] to-[#1b94c4]', dot: '#4fc3e8' },
  peach: { bg: 'from-[#ffeadd] to-[#ffd6bd]', glyph: 'from-[#ffb184] to-[#ee6a2f]', dot: '#ff9a62' },
  lilac: { bg: 'from-[#ece5ff] to-[#dccfff]', glyph: 'from-[#b49bff] to-[#7b4ee0]', dot: '#9b78f5' },
  gold: { bg: 'from-[#fff2cc] to-[#ffe29a]', glyph: 'from-[#ffd36b] to-[#e89a0c]', dot: '#ffc14d' },
};

/** A small illustration: soft tile, floating confetti and a glossy rounded glyph. Decorative. */
export function Sticker({ icon: Icon, tone = 'indigo', size = 72, className }: { icon: LucideIcon; tone?: StickerTone; size?: number; className?: string }) {
  const t = TONES[tone];
  const g = size * 0.56;
  return (
    <span aria-hidden className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-[1.4rem] bg-gradient-to-br', t.bg, className)} style={{ width: size, height: size }}>
      <span className="absolute -right-2 -top-2 rounded-full bg-white/50" style={{ width: size * 0.42, height: size * 0.42 }} />
      <span className="absolute rounded-full" style={{ width: size * 0.1, height: size * 0.1, left: size * 0.14, top: size * 0.2, background: t.dot, opacity: 0.55 }} />
      <span className="absolute rotate-45 rounded-[2px]" style={{ width: size * 0.09, height: size * 0.09, right: size * 0.16, bottom: size * 0.16, background: t.dot, opacity: 0.45 }} />
      <span className={cn('relative grid place-items-center rounded-[1.1rem] bg-gradient-to-br text-white shadow-[0_8px_14px_-4px_rgb(40_30_120/0.4),inset_0_2px_3px_rgb(255_255_255/0.55),inset_0_-4px_6px_rgb(0_0_0/0.14)]', t.glyph)} style={{ width: g, height: g }}>
        <Icon style={{ width: g * 0.5, height: g * 0.5 }} strokeWidth={2.2} />
      </span>
    </span>
  );
}

/** Subject-style card (as in the reference): sticker on top, title and a small caption below. */
export function TileLabel({ title, caption }: { title: string; caption?: string }) {
  return (
    <span className="block min-w-0">
      <span className="block truncate text-[15px] font-bold leading-tight text-ink-900">{title}</span>
      {caption ? <span className="mt-0.5 block truncate text-xs text-ink-500">{caption}</span> : null}
    </span>
  );
}
