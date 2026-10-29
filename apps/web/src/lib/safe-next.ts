/** Only same-site paths: an attacker-supplied `next=https://evil` must never become a redirect target. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/';
}
