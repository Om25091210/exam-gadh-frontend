import type { Http } from './client';
import type { Subject, Analytics, BillingPlan, CaItem, CaMonth, CreatedOrder, DoubtCreateBody, DoubtListItem, DoubtQuota, DoubtStatus, DoubtThread, Entitlement, Faq, InterviewQuestion, MaterialDetail, MaterialItem, MentorRequestView, NotificationPage, OrderRow, OverallLeaderboard, PlanToday, PracticeBody, PresignedPost, PyqFrequency, PyqYears, Receipt, Revision, SeriesDetail, SeriesSummary, BookmarkBody, Bookmarks, QuestionNote, ReportReason, AttemptResultView, Home, Updates, AttemptView, Exam, LeaderboardEntry, Me, Page, Review, SaveStateBody, SaveStateResult, TestDetail, TestKind, TestListItem, User } from './types';

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

export interface CaFilters {
  page?: number;
  pageSize?: number;
  category?: 'CG' | 'NAT';
  topic?: string;
  date?: string;
  from?: string;
  to?: string;
  q?: string;
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
    subjects: () => http.get<Subject[]>('/subjects'),
    home: () => http.get<Home>('/home'),
    updates: (examId?: string) => http.get<Updates>('/updates', { examId }),
    unreadCount: () => http.get<{ unread: number }>('/notifications/unread-count'),

    tests: (f: TestFilters = {}) => http.get<Page<TestListItem>>('/tests', { ...f }),
    test: (id: string) => http.get<TestDetail>(`/tests/${id}`),
    testLeaderboard: (id: string, limit = 50) => http.get<TestLeaderboard>(`/tests/${id}/leaderboard`, { limit }),

    openAttempt: (attemptId: string) => http.get<AttemptView>(`/attempts/${attemptId}`),
    startAttempt: (testId: string, b: { practice?: boolean; language?: 'hi' | 'en' } = {}) => http.post<AttemptView>(`/tests/${testId}/attempts`, b),
    saveState: (attemptId: string, b: SaveStateBody, o?: { keepalive?: boolean }) => http.put<SaveStateResult>(`/attempts/${attemptId}/state`, b, { keepalive: o?.keepalive }),
    advanceSection: (attemptId: string) => http.post<{ openSection: number; sectionWindows: AttemptView['sectionWindows']; serverTime: string }>(`/attempts/${attemptId}/sections/advance`),
    submit: (attemptId: string, b: { submitKey: string; answers?: SaveStateBody['answers'] }) => http.post<AttemptResultView>(`/attempts/${attemptId}/submit`, b),
    result: (attemptId: string) => http.get<AttemptResultView>(`/attempts/${attemptId}/result`),
    bookmarks: (kind?: 'question' | 'material' | 'current_affair') => http.get<Bookmarks>('/me/bookmarks', { kind }),
    addBookmark: (b: BookmarkBody) => http.post<{ kind: string; refId: string }>('/me/bookmarks', b),
    removeBookmark: (kind: 'question' | 'material' | 'current_affair', refId: string) => http.delete<void>(`/me/bookmarks/${kind}/${refId}`),
    notes: () => http.get<QuestionNote[]>('/me/notes'),
    saveNote: (b: { attemptId: string; qid: string; text: string }) => http.put<{ questionId: string; text: string; updatedAt: string }>('/me/notes', b),
    deleteNote: (questionId: string) => http.delete<void>(`/me/notes/${questionId}`),
    reportQuestion: (b: { attemptId: string; qid: string; reason: ReportReason; note?: string }) => http.post<{ reported: boolean }>('/me/question-reports', b),
    // learning content
    ca: (f: CaFilters = {}) => http.get<Page<CaItem>>('/ca', { ...f }),
    caMonth: (month: string) => http.get<CaMonth>('/ca/monthly', { month }),
    caItem: (id: string) => http.get<CaItem>(`/ca/${id}`),
    faqs: (q?: string) => http.get<Faq[]>('/faqs', { q }),
    interview: (f: { examId?: string; category?: string } = {}) => http.get<InterviewQuestion[]>('/interview', { ...f }),
    materials: (f: { examId?: string; subjectCode?: string; kind?: string; page?: number; pageSize?: number } = {}) => http.get<Page<MaterialItem>>('/materials', { ...f }),
    material: (id: string) => http.get<MaterialDetail>(`/materials/${id}`),
    pyq: (f: { examId?: string; year?: number } = {}) => http.get<PyqYears>('/pyq', { ...f }),
    pyqFrequency: (examId?: string) => http.get<PyqFrequency>('/pyq/frequency', { examId }),
    series: (examId?: string) => http.get<SeriesSummary[]>('/series', { examId }),
    seriesDetail: (id: string) => http.get<SeriesDetail>(`/series/${id}`),
    enroll: (id: string) => http.post<unknown>(`/series/${id}/enroll`),
    unenroll: (id: string) => http.delete<void>(`/series/${id}/enroll`),
    // practice and analytics
    analytics: (days = 90) => http.get<Analytics>('/me/analytics', { days }),
    revision: (f: { topicCode?: string; limit?: number } = {}) => http.get<Revision>('/me/revision', { ...f }),
    practice: (b: PracticeBody) => http.post<{ testId: string; questions: number; durationMin: number }>('/practice', b),
    overallLeaderboard: (period: 'week' | 'month' | 'all', limit = 50) => http.get<OverallLeaderboard>('/leaderboard', { period, limit }),
    // notifications
    notifications: (f: { page?: number; pageSize?: number; unread?: boolean } = {}) => http.get<NotificationPage>('/notifications', { page: f.page, pageSize: f.pageSize, unread: f.unread ? 'true' : undefined }),
    markRead: (id: string) => http.post<void>(`/notifications/${id}/read`),
    markAllRead: () => http.post<{ updated: number }>('/notifications/read-all'),
    // doubts
    doubtQuota: () => http.get<DoubtQuota>('/doubts/quota'),
    similarFaqs: (q: string) => http.get<Faq[]>('/doubts/similar', { q }),
    doubtUpload: (b: { purpose: 'doubt-image' | 'doubt-audio'; contentType: string }) => http.post<PresignedPost>('/doubts/uploads/presign', b),
    createDoubt: (b: DoubtCreateBody) => http.post<{ id: string; status: DoubtStatus; slaDueAt: string }>('/doubts', b),
    doubts: (f: { page?: number; status?: DoubtStatus } = {}) => http.get<Page<DoubtListItem>>('/doubts', { ...f }),
    doubt: (id: string) => http.get<DoubtThread>(`/doubts/${id}`),
    replyDoubt: (id: string, b: { text: string; attachmentKeys?: string[] }) => http.post<DoubtThread>(`/doubts/${id}/messages`, b),
    rateDoubt: (id: string, rating: number) => http.post<void>(`/doubts/${id}/rating`, { rating }),
    closeDoubt: (id: string) => http.post<void>(`/doubts/${id}/close`),
    // study planner
    mentor: () => http.get<{ requests: MentorRequestView[] }>('/mentor'),
    mentorToday: () => http.get<PlanToday>('/mentor/today'),
    requestPlan: (b: { examId: string; hoursPerDay: number; examDate?: string }) => http.post<MentorRequestView>('/mentor/requests', b),
    // billing
    plans: () => http.get<BillingPlan[]>('/plans'),
    entitlements: () => http.get<Entitlement[]>('/entitlements'),
    createOrder: (b: { planId: string; months: 3 | 6 | 12 }) => http.post<CreatedOrder>('/billing/orders', b),
    verifyPayment: (b: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => http.post<Entitlement[]>('/billing/verify', b),
    redeemCoupon: (code: string) => http.post<unknown>('/coupons/redeem', { code }),
    orders: () => http.get<OrderRow[]>('/me/orders'),
    receipt: (orderId: string) => http.get<Receipt>(`/me/orders/${orderId}/receipt`),
    exportData: () => http.get<Record<string, unknown>>('/me/export'),
    deleteAccount: () => http.delete<void>('/me', { confirm: 'DELETE' }),
    review: (attemptId: string) => http.get<Review>(`/attempts/${attemptId}/review`),
  };
}
export type StudentApi = ReturnType<typeof createStudentApi>;
