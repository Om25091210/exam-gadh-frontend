import { GraduationCap, Map as MapIcon, Trophy, User, type LucideIcon } from 'lucide-react';
import type { MessageKey } from '@eg/i18n';

export interface NavItem {
  href: string;
  label: MessageKey;
  icon: LucideIcon;
  /** pathname prefixes that count as "inside" this item */
  match: string[];
}

/** The four tabs. Everything else is reached from the journey map or the profile hub. */
export const NAV: NavItem[] = [
  { href: '/', label: 'tab.journey', icon: MapIcon, match: ['/tests', '/series', '/results', '/learn', '/practice'] },
  { href: '/planner', label: 'tab.mentor', icon: GraduationCap, match: ['/doubts'] },
  { href: '/leaderboard', label: 'nav.leaderboard', icon: Trophy, match: [] },
  { href: '/me', label: 'nav.profile', icon: User, match: ['/plans', '/notifications'] },
];

export function isActive(item: NavItem, pathname: string): boolean {
  const inside = (m: string) => pathname === m || pathname.startsWith(`${m}/`);
  if (item.href === '/' && pathname === '/') return true;
  return (item.href === '/' ? item.match : [item.href, ...item.match]).some(inside);
}
