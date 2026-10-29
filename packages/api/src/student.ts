import type { Http } from './client';
import type { AttemptResultView, Home, Updates, AttemptView, Exam, LeaderboardEntry, Me, Page, Review, SaveStateBody, SaveStateResult, TestDetail, TestKind, TestListItem, User } from './types';

export interface TestFilters {
  examId?: string;
  kind?: TestKind;
  subjectCode?: string;
  topicCode?: string;
  access?: 'free' | 'paid';
  seriesId?: string;
  pyqYear?: number;
  page?: number;
  pageSize?: number;
}

export interface TestLeaderboard {
  released: boolean;
  resultReleaseAt?: string;
  entries: LeaderboardEntry[];
  me: { rank: number; score: number; percentile: number } | null;
  total: number;
}

/** Student-facing endpoints. Each function returns the typed JSON body; errors are thrown as `ApiError`. */
export function createStudentApi(http: Http) {
  return {
    me: () => http.get<Me>('/me'),
    updateMe: (b: Partial<Pick<User, 'name' | 'language' | 'district' | 'targetExam' | 'showOnLeaderboard'>>) => http.patch<User>('/me', b),
    logout: () => http.post<void>('/auth/logout'),
    exams: () => http.get<Exam[]>('/exams'),
    home: () => http.get<Home>('/home'),
    updates: (examId?: string) => http.get<Updates>('/updates', { examId }),
    unreadCount: () => http.get<{ unread: number }>('/notifications/unread-count'),

    tests: (f: TestFilters = {}) => http.get<Page<TestListItem>>('/tests', { ...f }),
    test: (id: string) => http.get<TestDetail>(`/tests/${id}`),
    testLeaderboard: (id: string, limit = 50) => http.get<TestLeaderboard>(`/tests/${id}/leaderboard`, { limit }),

    startAttempt: (testId: string, b: { practice?: boolean; language?: 'hi' | 'en' } = {}) => http.post<AttemptView>(`/tests/${testId}/attempts`, b),
    saveState: (attemptId: string, b: SaveStateBody, o?: { keepalive?: boolean }) => http.put<SaveStateResult>(`/attempts/${attemptId}/state`, b, { keepalive: o?.keepalive }),
    advanceSection: (attemptId: string) => http.post<{ openSection: number; sectionWindows: AttemptView['sectionWindows']; serverTime: string }>(`/attempts/${attemptId}/sections/advance`),
    submit: (attemptId: string, b: { submitKey: string; answers?: SaveStateBody['answers'] }) => http.post<AttemptResultView>(`/attempts/${attemptId}/submit`, b),
    result: (attemptId: string) => http.get<AttemptResultView>(`/attempts/${attemptId}/result`),
    review: (attemptId: string) => http.get<Review>(`/attempts/${attemptId}/review`),
  };
}
export type StudentApi = ReturnType<typeof createStudentApi>;
