import { cn } from './cn';

/** Decorative line-art in the brand colours: a book, a target and sparkles. Purely decorative (aria-hidden). */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" fill="none" aria-hidden className={cn('w-full', className)}>
      <defs>
        <linearGradient id="eg-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a8bd3" />
          <stop offset="1" stopColor="#165a96" />
        </linearGradient>
        <linearGradient id="eg-g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f08f4c" />
          <stop offset="1" stopColor="#e0782f" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="112" r="92" fill="#dceefb" opacity=".55" />
      <circle cx="160" cy="112" r="62" fill="#f3f9fe" />
      <path d="M64 150c36-12 64-8 96 8 32-16 60-20 96-8v-84c-36-12-64-8-96 8-32-16-60-20-96-8z" fill="url(#eg-g1)" />
      <path d="M160 74v84" stroke="#f3f9fe" strokeWidth="3" />
      <path d="M82 92c22-5 40-3 62 6M82 110c22-5 40-3 62 6M178 98c22-9 40-11 62-6M178 116c22-9 40-11 62-6" stroke="#dceefb" strokeWidth="3" strokeLinecap="round" />
      <g className="animate-float">
        <circle cx="244" cy="52" r="26" fill="url(#eg-g2)" />
        <circle cx="244" cy="52" r="16" fill="#fff" opacity=".9" />
        <circle cx="244" cy="52" r="7" fill="#e0782f" />
      </g>
      <path d="M72 44l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#f08f4c" />
      <path d="M268 150l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#3a8bd3" />
      <circle cx="96" cy="176" r="5" fill="#f08f4c" opacity=".7" />
      <circle cx="226" cy="186" r="4" fill="#3a8bd3" opacity=".6" />
    </svg>
  );
}
