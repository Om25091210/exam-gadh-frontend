import { cn } from './cn';

/** Decorative line-art in the brand colours: a book, a target and sparkles. Purely decorative (aria-hidden). */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" fill="none" aria-hidden className={cn('w-full', className)}>
      <defs>
        <linearGradient id="eg-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f9a7f" />
          <stop offset="1" stopColor="#0b4e40" />
        </linearGradient>
        <linearGradient id="eg-g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5961f" />
          <stop offset="1" stopColor="#e07a10" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="112" r="92" fill="#d1efe5" opacity=".55" />
      <circle cx="160" cy="112" r="62" fill="#ecf8f4" />
      <path d="M64 150c36-12 64-8 96 8 32-16 60-20 96-8v-84c-36-12-64-8-96 8-32-16-60-20-96-8z" fill="url(#eg-g1)" />
      <path d="M160 74v84" stroke="#ecf8f4" strokeWidth="3" />
      <path d="M82 92c22-5 40-3 62 6M82 110c22-5 40-3 62 6M178 98c22-9 40-11 62-6M178 116c22-9 40-11 62-6" stroke="#d1efe5" strokeWidth="3" strokeLinecap="round" />
      <g className="animate-float">
        <circle cx="244" cy="52" r="26" fill="url(#eg-g2)" />
        <circle cx="244" cy="52" r="16" fill="#fff" opacity=".9" />
        <circle cx="244" cy="52" r="7" fill="#e07a10" />
      </g>
      <path d="M72 44l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#f5961f" />
      <path d="M268 150l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#1f9a7f" />
      <circle cx="96" cy="176" r="5" fill="#f5961f" opacity=".7" />
      <circle cx="226" cy="186" r="4" fill="#1f9a7f" opacity=".6" />
    </svg>
  );
}
