export type ClassValue = string | false | null | undefined | ClassValue[];

/** Joins class names, skipping falsy values. */
export function cn(...v: ClassValue[]): string {
  return v
    .flat(5)
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join(' ');
}
