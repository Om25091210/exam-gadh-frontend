import { cn } from './cn';

/** Round profile picture, or the first letter of the name on a blue gradient when there is none. */
export function Avatar({ name, src, size = 40, className }: { name: string; src: string | null; size?: number; className?: string }) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-800 font-bold text-white', className)} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  );
}
