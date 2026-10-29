import { Badge, type Tone } from '@eg/ui';

const TONES: Record<string, Tone> = { draft: 'neutral', in_review: 'warning', published: 'success', archived: 'danger', open: 'warning', resolved: 'success', dismissed: 'neutral', answered: 'success', closed: 'neutral', active: 'success', suspended: 'danger', paid: 'success', created: 'neutral', failed: 'danger', refunded: 'warning', captured: 'success', sent: 'success' };
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={TONES[status] ?? 'neutral'}>{status.replace('_', ' ')}</Badge>;
}
