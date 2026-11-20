import type { QuestionLike } from '@/question';
import { io, type Socket } from 'socket.io-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';
import { useAuth } from '@/lib/auth';

export interface Side {
  name: string;
  rating: number;
  isBot?: boolean;
}
export interface Matched {
  battleId: string;
  total: number;
  roundMs: number;
  countdownMs: number;
  you: Side;
  opponent: Side & { isBot: boolean };
}
export interface RoundQuestion {
  battleId: string;
  index: number;
  total: number;
  roundMs: number;
  endsAt: number;
  serverNow: number;
  question: QuestionLike;
  answered?: boolean;
}
export interface Reveal {
  index: number;
  correctOption: number;
  explanation: { en: string | null; hi: string | null };
  you: { option: number | null; correct: boolean; points: number; ms: number; score: number; streak: number };
  opponent: { option: number | null; correct: boolean; points: number; ms: number; score: number; streak: number };
}
export interface End {
  result: 'win' | 'loss' | 'draw';
  forfeit: boolean;
  you: { score: number; correct: number; pointsDelta: number; rating: number | null; freeLeft: number | null };
  opponent: { name: string; isBot: boolean; score: number; correct: number };
}
export type Phase = 'idle' | 'finding' | 'matched' | 'question' | 'reveal' | 'end';
export interface BattleError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface BattleState {
  phase: Phase;
  connected: boolean;
  matched: Matched | null;
  round: RoundQuestion | null;
  /** local deadline (ms since epoch on this phone) for the open question */
  deadline: number;
  picked: number | null;
  opponentAnswered: boolean;
  reveal: Reveal | null;
  scores: { you: number; opponent: number };
  end: End | null;
  error: BattleError | null;
}
const INITIAL: BattleState = { phase: 'idle', connected: false, matched: null, round: null, deadline: 0, picked: null, opponentAnswered: false, reveal: null, scores: { you: 0, opponent: 0 }, end: null, error: null };

/** One battle at a time: connects the socket, mirrors what the server says, and sends the student's answers. */
export function useBattle() {
  const { token } = useAuth();
  const [state, setState] = useState<BattleState>(INITIAL);
  const sock = useRef<Socket | null>(null);
  const battleId = useRef<string | null>(null);
  const patch = useCallback((p: Partial<BattleState> | ((s: BattleState) => Partial<BattleState>)) => setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })), []);

  const attachRound = useCallback(
    (r: RoundQuestion) => patch({ phase: 'question', round: r, deadline: Date.now() + (r.endsAt - r.serverNow), picked: r.answered ? -1 : null, opponentAnswered: false, reveal: null }),
    [patch],
  );

  const connect = useCallback(() => {
    if (sock.current) return sock.current;
    const s = io(API_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      // a fresh token on every (re)connect, so a long session never fails on an expired one
      auth: (cb) => void token().then((t) => cb({ token: t ?? '' })),
    });
    s.on('connect', () => patch({ connected: true }));
    s.on('disconnect', () => patch({ connected: false }));
    s.on('battle:error', (e: BattleError) => patch({ error: e, phase: e.code === 'BATTLE_LIMIT' ? 'idle' : 'idle' }));
    s.on('battle:matched', (m: Matched) => {
      battleId.current = m.battleId;
      patch({ phase: 'matched', matched: m, scores: { you: 0, opponent: 0 }, end: null, reveal: null, error: null });
    });
    s.on('battle:resumed', (r: Matched & { phase: string; scores: { you: number; opponent: number }; question: RoundQuestion | null }) => {
      battleId.current = r.battleId;
      patch({ matched: r, scores: r.scores, error: null });
      if (r.question) attachRound(r.question);
      else patch({ phase: r.phase === 'countdown' ? 'matched' : 'reveal' });
    });
    s.on('battle:question', (q: RoundQuestion) => attachRound(q));
    s.on('battle:opponentAnswered', () => patch({ opponentAnswered: true }));
    s.on('battle:reveal', (r: Reveal) => patch({ phase: 'reveal', reveal: r, scores: { you: r.you.score, opponent: r.opponent.score } }));
    s.on('battle:end', (e: End) => {
      battleId.current = null;
      patch({ phase: 'end', end: e });
    });
    sock.current = s;
    return s;
  }, [attachRound, patch, token]);

  useEffect(
    () => () => {
      sock.current?.close();
      sock.current = null;
    },
    [],
  );

  const find = useCallback(
    (topicCode?: string) => {
      const s = connect();
      patch({ ...INITIAL, connected: s.connected, phase: 'finding' });
      s.emit('battle:find', { topicCode }, (r: { ok: boolean; code?: string; message?: string; details?: Record<string, unknown> }) => {
        if (!r.ok) patch({ phase: 'idle', error: { code: r.code ?? 'BATTLE_FAILED', message: r.message ?? '', details: r.details } });
      });
    },
    [connect, patch],
  );

  const cancel = useCallback(() => {
    sock.current?.emit('battle:cancel', {}, () => undefined);
    patch({ phase: 'idle' });
  }, [patch]);

  const answer = useCallback(
    (option: number) => {
      const s = state.round;
      if (!s || state.picked !== null || state.phase !== 'question') return;
      patch({ picked: option });
      sock.current?.emit('battle:answer', { battleId: s.battleId, index: s.index, option }, () => undefined);
    },
    [patch, state.phase, state.picked, state.round],
  );

  const reset = useCallback(() => patch({ ...INITIAL, connected: state.connected }), [patch, state.connected]);
  const clearError = useCallback(() => patch({ error: null }), [patch]);

  return { state, find, cancel, answer, reset, clearError };
}
