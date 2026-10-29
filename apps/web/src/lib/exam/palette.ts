export type PaletteStatus = 'notVisited' | 'notAnswered' | 'answered' | 'marked' | 'answeredMarked';

export interface PaletteInput {
  selected: number | null;
  visited: boolean;
  marked: boolean;
}

/** The five states of the exam-hall question palette. */
export function paletteStatus(a: PaletteInput | undefined): PaletteStatus {
  if (!a || !a.visited) return 'notVisited';
  const answered = a.selected !== null && a.selected !== undefined;
  if (answered && a.marked) return 'answeredMarked';
  if (a.marked) return 'marked';
  return answered ? 'answered' : 'notAnswered';
}

export function countStatuses(qids: string[], answers: Record<string, PaletteInput | undefined>): Record<PaletteStatus, number> {
  const out: Record<PaletteStatus, number> = { notVisited: 0, notAnswered: 0, answered: 0, marked: 0, answeredMarked: 0 };
  for (const id of qids) out[paletteStatus(answers[id])]++;
  return out;
}
