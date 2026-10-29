'use client';
import { Button, Modal } from '@eg/ui';
import type { ReactNode } from 'react';

/** "Are you sure?" dialog for destructive or hard-to-undo actions. */
export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }: { open: boolean; title: string; children: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>{confirmLabel}</Button></>}>
      {children}
    </Modal>
  );
}
