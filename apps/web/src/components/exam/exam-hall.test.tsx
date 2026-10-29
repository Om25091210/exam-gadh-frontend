import type { AttemptView } from '@eg/api';
import { I18nProvider } from '@eg/i18n';
import { ToastProvider } from '@eg/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
const api = { openAttempt: vi.fn(), saveState: vi.fn(), submit: vi.fn(), advanceSection: vi.fn() };
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock('@/lib/auth', () => ({ useApi: () => api }));
vi.mock('@/lib/exam/persistence', () => ({ idbStore: { load: vi.fn().mockResolvedValue(null), save: vi.fn().mockResolvedValue(undefined), clear: vi.fn().mockResolvedValue(undefined) } }));

import { ExamHall } from './exam-hall';

const q = (n: number) => ({
  qid: `00000000-0000-4000-8000-00000000000${n}`,
  position: n,
  sectionPos: 0,
  marks: 2,
  type: 'single' as const,
  passage: null,
  en: { stem: `English question ${n}`, options: ['alpha', 'bravo', 'charlie', 'delta'] },
  hi: { stem: `हिन्दी प्रश्न ${n}`, options: ['अ', 'ब', 'स', 'द'] },
});

const view = (over: Partial<AttemptView> = {}): AttemptView => ({
  attemptId: 'a1', testId: 't1', versionId: 'v1', title: { en: 'Mock test', hi: 'मॉक टेस्ट' }, status: 'in_progress', isRanked: true, isPractice: false,
  serverTime: new Date().toISOString(), startedAt: new Date().toISOString(), deadlineAt: new Date(Date.now() + 600_000).toISOString(), remainingSec: 600,
  scheme: { correctMarks: 2, negativeFraction: 1 / 3, sectionalTimers: false }, instructions: { en: null, hi: null }, sections: [], sectionWindows: null, openSection: null,
  state: { currentIndex: 0, currentSection: 0, language: 'en', seq: 0, answers: [] }, questions: [q(1), q(2), q(3)], ...over,
});

function renderHall() {
  const qc = new QueryClient();
  return render(
    <I18nProvider initial="en">
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <ExamHall attemptId="a1" />
        </ToastProvider>
      </QueryClientProvider>
    </I18nProvider>,
  );
}
const ok = { saved: 1, rejected: [], serverTime: new Date().toISOString(), deadlineAt: '', remainingSec: 590, openSection: null, sectionWindows: null };

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  api.openAttempt.mockResolvedValue(view());
  api.saveState.mockResolvedValue(ok);
  api.submit.mockResolvedValue({ released: true });
});

describe('ExamHall', () => {
  it('shows the first question, the timer and the palette; answers never appear before submit', async () => {
    renderHall();
    expect(await screen.findByText('English question 1')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent(/^(9|10):\d\d$/);
    const palette = screen.getAllByRole('list', { name: /palette/i })[0];
    expect(within(palette).getAllByRole('button')).toHaveLength(3);
    expect(document.body.textContent).not.toMatch(/explanation|correctOption/i);
  });

  it('choosing an option updates the palette and is saved to the server', async () => {
    const user = userEvent.setup();
    renderHall();
    await screen.findByText('English question 1');
    await user.click(screen.getByRole('radio', { name: /Option B/i }));
    const palette = screen.getAllByRole('list', { name: /palette/i })[0];
    expect(within(palette).getByRole('button', { name: /Question 1: Answered/i })).toBeInTheDocument();
    await waitFor(() => expect(api.saveState).toHaveBeenCalled(), { timeout: 4000 });
    const body = api.saveState.mock.calls.at(-1)![1];
    expect(body.answers).toEqual(expect.arrayContaining([expect.objectContaining({ qid: q(1).qid, selected: 1 })]));
  });

  it('Save & Next moves on, Mark & Next marks for review, Clear removes the answer', async () => {
    const user = userEvent.setup();
    renderHall();
    await screen.findByText('English question 1');
    await user.click(screen.getByRole('radio', { name: /Option A/i }));
    await user.click(screen.getByRole('button', { name: 'Save & Next' }));
    expect(await screen.findByText('English question 2')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Option C/i }));
    await user.click(screen.getByRole('button', { name: /Mark for review & Next/i }));
    expect(await screen.findByText('English question 3')).toBeInTheDocument();
    const palette = screen.getAllByRole('list', { name: /palette/i })[0];
    expect(within(palette).getByRole('button', { name: /Question 2: Answered & marked/i })).toBeInTheDocument();
    await user.click(within(palette).getByRole('button', { name: /Question 1/i }));
    await user.click(screen.getByRole('button', { name: 'Clear response' }));
    expect(within(palette).getByRole('button', { name: /Question 1: Not answered/i })).toBeInTheDocument();
  });

  it('keyboard: a number key selects, N moves on', async () => {
    const user = userEvent.setup();
    renderHall();
    await screen.findByText('English question 1');
    await user.keyboard('3');
    expect(screen.getByRole('radio', { name: /Option C/i })).toBeChecked();
    await user.keyboard('n');
    expect(await screen.findByText('English question 2')).toBeInTheDocument();
  });

  it('shows the question in the other language when asked', async () => {
    const user = userEvent.setup();
    renderHall();
    await screen.findByText('English question 1');
    await user.click(screen.getAllByRole('button', { name: 'हिन्दी' })[0]);
    expect(await screen.findByText('हिन्दी प्रश्न 1')).toBeInTheDocument();
  });

  it('submit asks for confirmation with a summary, then sends the answers once and opens the result', async () => {
    const user = userEvent.setup();
    renderHall();
    await screen.findByText('English question 1');
    await user.click(screen.getByRole('radio', { name: /Option D/i }));
    await user.click(screen.getByRole('button', { name: 'Submit test' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/cannot change answers/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /Yes, submit/i }));
    await waitFor(() => expect(api.submit).toHaveBeenCalledTimes(1), { timeout: 4000 });
    const [id, body] = api.submit.mock.calls[0];
    expect(id).toBe('a1');
    expect(body.submitKey).toBeTruthy();
    expect(body.answers).toEqual(expect.arrayContaining([expect.objectContaining({ qid: q(1).qid, selected: 3 })]));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/results/a1'));
  });

  it('a network failure on submit keeps retrying with the same key, so nothing is lost', async () => {
    const { ApiError } = await import('@eg/api');
    api.submit.mockRejectedValueOnce(new ApiError(0, 'NETWORK', 'x')).mockResolvedValue({ released: true });
    const user = userEvent.setup();
    renderHall();
    await screen.findByText('English question 1');
    await user.click(screen.getByRole('button', { name: 'Submit test' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Yes, submit/i }));
    await waitFor(() => expect(api.submit).toHaveBeenCalledTimes(2), { timeout: 8000 });
    expect(api.submit.mock.calls[0][1].submitKey).toBe(api.submit.mock.calls[1][1].submitKey);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/results/a1'));
  }, 12000);

  it('opening a finished attempt goes straight to its result', async () => {
    const { ApiError } = await import('@eg/api');
    api.openAttempt.mockRejectedValue(new ApiError(409, 'ATTEMPT_CLOSED', 'x'));
    renderHall();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/results/a1'));
  });

  it('when time is already up the test is submitted automatically', async () => {
    api.openAttempt.mockResolvedValue(view({ remainingSec: 0 }));
    renderHall();
    await waitFor(() => expect(api.submit).toHaveBeenCalled(), { timeout: 4000 });
  });
});
