'use client';
import { useI18n } from '@eg/i18n';
import { Button, Modal } from '@eg/ui';
import { Swords, Zap } from 'lucide-react';
import { useState } from 'react';

/** The flashy 1-v-1 entry card. The battle itself needs the realtime service, which is not live yet, so the card says so. */
export function BattleCard() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff8a00] via-[#e52e4d] to-[#7b2ff7] p-5 text-left text-white shadow-[0_14px_30px_-10px_rgb(229_46_77/0.65)] transition-transform duration-200 active:scale-[0.98]">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 animate-[sheen_3.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <span aria-hidden className="absolute -right-4 -top-4 size-28 rounded-full bg-white/10" />
        <span className="relative flex items-center gap-4">
          <span className="min-w-0 flex-1">
            <span className="mb-1 inline-flex items-center gap-2 rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wider">
              <span className="size-2 animate-pulse rounded-full bg-[#7cff8a]" /> LIVE · {t('battle.soon')}
            </span>
            <span className="block text-2xl font-extrabold">{t('battle.title')}</span>
            <span className="block text-sm text-white/90">{t('battle.sub')}</span>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[#e52e4d] shadow">
              {t('battle.cta')} <Zap className="size-4" aria-hidden />
            </span>
          </span>
          <span aria-hidden className="grid size-20 shrink-0 place-items-center rounded-3xl bg-white/15 ring-1 ring-white/30 transition-transform duration-300 group-hover:rotate-6">
            <Swords className="size-11" />
          </span>
        </span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('battle.title')} footer={<Button onClick={() => setOpen(false)}>{t('common.close')}</Button>}>
        <p>{t('journey.soon.battle')}</p>
      </Modal>
    </>
  );
}
