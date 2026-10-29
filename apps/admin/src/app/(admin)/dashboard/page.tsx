'use client';
import type { DashboardAlert } from '@eg/api';
import { Alert, Card, ErrorState, PageHeader, Section, Select, Skeleton, Stat } from '@eg/ui';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useAdmin } from '@/lib/auth';

const ALERT_LINK: Record<string, string> = {
  failed_payments: '/commerce/orders',
  doubts_overdue: '/doubts?sla=overdue',
  doubts_due_soon: '/doubts?sla=due_soon',
  open_reports: '/reports',
  questions_in_review: '/questions?status=in_review',
  failed_imports: '/import',
  plans_expiring: '/users?paid=true',
  live_tests_soon: '/tests?kind=live',
};
const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function LineChart({ points, label }: { points: number[]; label: string }) {
  const w = 280, h = 70, pad = 6;
  const max = Math.max(1, ...points);
  const x = (i: number) => (points.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (points.length - 1));
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label}: ${points.join(', ')}`} className="h-20 w-full">
      <line x1={pad} x2={w - pad} y1={h - pad} y2={h - pad} stroke="currentColor" className="text-line" />
      <path d={d} fill="none" stroke="currentColor" className="text-primary-600" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { api } = useAdmin();
  const [days, setDays] = useState(30);
  const q = useQuery({ queryKey: ['dashboard', days], queryFn: () => api.dashboard({ from: new Date(Date.now() - days * 86_400_000).toISOString(), to: new Date().toISOString() }) });
  if (q.isLoading) return <div className="space-y-3" aria-hidden><Skeleton className="h-10 w-48" /><Skeleton className="h-40" /></div>;
  if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />;
  const d = q.data;
  const tone = (a: DashboardAlert) => (a.level === 'critical' ? 'danger' : a.level === 'warning' ? 'warning' : 'info');
  return (
    <>
      <PageHeader title="Dashboard" actions={<div><label className="sr-only" htmlFor="range">Period</label><Select id="range" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 30, 90].map((n) => <option key={n} value={n}>Last {n} days</option>)}</Select></div>} />

      {d.alerts.length > 0 ? (
        <Section title="Needs attention">
          <ul className="space-y-2">
            {d.alerts.map((a) => (
              <li key={a.key}>
                <Link href={ALERT_LINK[a.key] ?? '#'} className="block"><Alert tone={tone(a)} live={false}><span className="font-bold">{a.count}</span> {a.text}</Alert></Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Students">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total students" value={d.students.total.toLocaleString('en-IN')} />
          <Stat label={`New (${days} days)`} value={d.students.new} />
          <Stat label="Paying" value={d.students.paid} />
          <Stat label="Suspended" value={d.students.suspended} tone={d.students.suspended ? 'bad' : undefined} />
          <Stat label="Daily active" value={d.students.dau} />
          <Stat label="Weekly active" value={d.students.wau} />
          <Stat label="Monthly active" value={d.students.mau} />
          <Stat label="Stickiness (DAU/MAU)" value={d.students.stickiness == null ? '—' : `${d.students.stickiness}%`} />
        </div>
      </Section>

      <Section title="Tests and revenue">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Attempts started" value={d.attempts.started} />
          <Stat label="Submitted" value={d.attempts.submitted} hint={`${d.attempts.autoSubmitted} by timer`} />
          <Stat label="Average score" value={d.attempts.avgScorePct == null ? '—' : `${d.attempts.avgScorePct}%`} />
          <Stat label="Average accuracy" value={d.attempts.avgAccuracyPct == null ? '—' : `${d.attempts.avgAccuracyPct}%`} />
          <Stat label="Gross revenue" value={rupees(d.revenue.grossPaise)} hint={`${d.revenue.payments} payments`} />
          <Stat label="Refunded" value={rupees(d.revenue.refundedPaise)} />
          <Stat label="Net revenue" value={rupees(d.revenue.netPaise)} tone="good" />
          <Stat label="Series enrolments" value={d.enrollments.seriesEnrollments} />
        </div>
      </Section>

      <Section title="Daily trend">
        <div className="grid gap-3 md:grid-cols-2">
          {([['Sign-ups', 'signups'], ['Active students', 'active'], ['Attempts', 'attempts']] as const).map(([label, key]) => (
            <Card key={key}><p className="text-sm text-ink-500">{label}</p><LineChart label={label} points={d.series.map((s) => s[key])} /></Card>
          ))}
          <Card><p className="text-sm text-ink-500">Revenue (₹)</p><LineChart label="Revenue" points={d.series.map((s) => Math.round(s.revenuePaise / 100))} /></Card>
        </div>
      </Section>
    </>
  );
}
