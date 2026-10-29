import { BarChart3, BookOpen, ClipboardList, Home, User, type LucideIcon } from 'lucide-react';
import type { MessageKey } from '@eg/i18n';

export interface NavItem {
  href: string;
  label: MessageKey;
  icon: LucideIcon;
  /** pathname prefixes that count as "inside" this item */
  match: string[];
}

/** The five places a student goes most. Everything else is reached from these hubs. */
export const NAV: NavItem[] = [
  { href: '/', label: 'nav.home', icon: Home, match: [] },
  { href: '/tests', label: 'nav.tests', icon: ClipboardList, match: ['/tests', '/series', '/results'] },
  { href: '/learn', label: 'nav.learn', icon: BookOpen, match: ['/learn'] },
  { href: '/practice', label: 'nav.practice', icon: BarChart3, match: ['/practice', '/leaderboard', '/planner'] },
  { href: '/me', label: 'nav.me', icon: User, match: ['/me', '/plans', '/doubts', '/notifications'] },
];

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === '/') return pathname === '/';
  return [item.href, ...item.match].some((m) => pathname === m || pathname.startsWith(`${m}/`));
}
