'use client';
import { useI18n } from '@eg/i18n';
import { Alert, Button, Card, Checkbox, Field, Input, Modal, PageHeader, Section, Select, useToast } from '@eg/ui';
import { CalendarCheck, CreditCard, HelpCircle, LogOut, MessageCircleQuestion, ReceiptText, type LucideIcon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { MessageKey } from '@eg/i18n';
import { useApi, useAuth } from '@/lib/auth';
import { errorKey } from '@/lib/errors';

const SHORTCUTS: Array<{ href: string; label: MessageKey; icon: LucideIcon }> = [
  { href: '/plans', label: 'nav.plans', icon: CreditCard },
  { href: '/me/orders', label: 'me.orders', icon: ReceiptText },
  { href: '/doubts', label: 'nav.doubts', icon: MessageCircleQuestion },
  { href: '/planner', label: 'nav.planner', icon: CalendarCheck },
  { href: '/learn/faqs', label: 'nav.faqs', icon: HelpCircle },
];

export default function MePage() {
  const { t, b, lang, setLang, fmt } = useI18n();
  const api = useApi();
  const { user, setUser, signOut } = useAuth();
  const toast = useToast();
  const exams = useQuery({ queryKey: ['exams'], queryFn: () => api.exams(), staleTime: 10 * 60_000 });
  const ents = useQuery({ queryKey: ['entitlements'], queryFn: () => api.entitlements() });
  const [name, setName] = useState(user?.name ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [exam, setExam] = useState(user?.targetExam ?? '');
  const [showBoard, setShowBoard] = useState(user?.showOnLeaderboard ?? true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const save = useMutation({
    mutationFn: () => api.updateMe({ name: name.trim(), district: district.trim() || undefined, targetExam: exam || undefined, language: lang, showOnLeaderboard: showBoard }),
    onSuccess: (u) => { setUser(u); toast.show(t('profile.saved'), 'success'); },
    onError: (e) => toast.show(t(errorKey(e)), 'danger'),
  });
  const exportData = useMutation({
    mutationFn: async () => {
      const data = await api.exportData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'examgadh-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.show(t('profile.export.done'), 'success'),
    onError: (e) => toast.show(t(errorKey(e)), 'danger'),
  });
  const del = useMutation({ mutationFn: () => api.deleteAccount(), onSuccess: () => void signOut(), onError: (e) => toast.show(t(errorKey(e)), 'danger') });

  if (!user) return null;
  return (
    <>
      <PageHeader title={t('me.title')} subtitle={user.email} />

      <Section title={t('me.shortcuts')}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SHORTCUTS.map((s) => (
            <li key={s.href}><Link href={s.href} className="flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface p-3 font-semibold shadow-card hover:border-primary-500"><s.icon className="size-6 text-primary-700" aria-hidden />{t(s.label)}</Link></li>
          ))}
        </ul>
      </Section>

      <Section title={t('me.plan')}>
        {ents.data && ents.data.length > 0 ? <ul className="space-y-1">{ents.data.map((e) => <li key={e.id}>{e.planId} · {t('plans.current', { date: fmt.date(e.endsAt) })}</li>)}</ul> : <p className="text-ink-500">{t('me.noPlan')}</p>}
      </Section>

      <Section title={t('profile.title')}>
        <Card className="space-y-4">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <Field label={t('profile.name')}>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />}</Field>
            <Field label={t('profile.email')}>{(p) => <Input {...p} value={user.email} readOnly />}</Field>
            <Field label={t('profile.district')}>{(p) => <Input {...p} value={district} onChange={(e) => setDistrict(e.target.value)} maxLength={60} placeholder={t('profile.district.placeholder')} />}</Field>
            <Field label={t('profile.targetExam')}>{(p) => <Select {...p} value={exam} onChange={(e) => setExam(e.target.value)}><option value="">—</option>{exams.data?.map((x) => <option key={x.id} value={x.id}>{b(x.nameEn, x.nameHi)}</option>)}</Select>}</Field>
            <Field label={t('profile.language')}>{(p) => <Select {...p} value={lang} onChange={(e) => setLang(e.target.value as 'hi' | 'en')}><option value="hi">हिन्दी</option><option value="en">English</option></Select>}</Field>
            <Checkbox checked={showBoard} onChange={(e) => setShowBoard(e.target.checked)} label={t('profile.leaderboard')} />
            <Button type="submit" loading={save.isPending}>{t('common.save')}</Button>
          </form>
        </Card>
      </Section>

      <Section title={t('profile.data')}>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={exportData.isPending} onClick={() => exportData.mutate()}>{t('profile.export')}</Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>{t('profile.delete')}</Button>
          <Button variant="ghost" onClick={() => void signOut()}><LogOut className="size-4" aria-hidden />{t('nav.signOut')}</Button>
        </div>
      </Section>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('profile.delete')} footer={<><Button variant="secondary" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="danger" disabled={confirmText !== 'DELETE'} loading={del.isPending} onClick={() => del.mutate()}>{t('profile.delete.final')}</Button></>}>
        <Alert tone="danger" className="mb-3">{t('profile.delete.confirm')}</Alert>
        <Field label={t('profile.delete.type')}>{(p) => <Input {...p} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />}</Field>
      </Modal>
    </>
  );
}
