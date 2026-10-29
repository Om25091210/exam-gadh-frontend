import { BookOpen, ClipboardList, FileQuestion, FileUp, Flag, Gauge, HelpCircle, LayoutList, Layers, Megaphone, MessageCircleQuestion, NotebookText, Receipt, ScrollText, Settings, Shield, Tag, Ticket, Users, Wallet, CalendarDays, Newspaper, Mic, BellRing, MessagesSquare, CalendarCheck, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** needs this permission */
  permission: string;
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  { title: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', icon: Gauge, permission: 'dashboard:read' }] },
  {
    title: 'Question bank',
    items: [
      { href: '/questions', label: 'Questions', icon: FileQuestion, permission: 'content:read' },
      { href: '/reports', label: 'Reported issues', icon: Flag, permission: 'reports:read' },
      { href: '/import', label: 'Import / export', icon: FileUp, permission: 'import:run' },
      { href: '/taxonomy', label: 'Exams & topics', icon: Layers, permission: 'content:read' },
    ],
  },
  {
    title: 'Tests',
    items: [
      { href: '/tests', label: 'Tests', icon: ClipboardList, permission: 'content:read' },
      { href: '/series', label: 'Test series', icon: LayoutList, permission: 'content:read' },
      { href: '/daily-quiz', label: 'Daily quiz', icon: Tag, permission: 'content:read' },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/content/materials', label: 'Study material', icon: BookOpen, permission: 'content:read' },
      { href: '/content/current-affairs', label: 'Current affairs', icon: Newspaper, permission: 'content:read' },
      { href: '/content/notes', label: 'Notes', icon: NotebookText, permission: 'content:read' },
      { href: '/content/announcements', label: 'Announcements', icon: Megaphone, permission: 'announcements:write' },
      { href: '/content/calendar', label: 'Exam calendar', icon: CalendarDays, permission: 'content:read' },
      { href: '/content/faqs', label: 'FAQs', icon: HelpCircle, permission: 'content:read' },
      { href: '/content/interview', label: 'Interview questions', icon: Mic, permission: 'content:read' },
    ],
  },
  {
    title: 'Students',
    items: [
      { href: '/users', label: 'Students', icon: Users, permission: 'users:read' },
      { href: '/doubts', label: 'Doubts', icon: MessageCircleQuestion, permission: 'doubts:read' },
      { href: '/content/canned-replies', label: 'Canned replies', icon: MessagesSquare, permission: 'doubts:read' },
      { href: '/mentor', label: 'Study plans', icon: CalendarCheck, permission: 'mentor:manage' },
      { href: '/content/notification-templates', label: 'Notification templates', icon: BellRing, permission: 'settings:write' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { href: '/commerce/plans', label: 'Plans', icon: Wallet, permission: 'orders:read' },
      { href: '/commerce/coupons', label: 'Coupons', icon: Ticket, permission: 'orders:read' },
      { href: '/commerce/orders', label: 'Orders & refunds', icon: Receipt, permission: 'orders:read' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/audit', label: 'Audit log', icon: ScrollText, permission: 'audit:read' },
      { href: '/settings', label: 'Settings', icon: Settings, permission: 'settings:write' },
      { href: '/staff', label: 'Staff', icon: Shield, permission: 'staff:manage' },
    ],
  },
];

/** Groups with only the items this person may open; empty groups disappear. */
export function visibleNav(can: (p: string) => boolean): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => can(i.permission)) })).filter((g) => g.items.length > 0);
}

export function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
