import type { Http } from './client';
import type { AdminLoginResult, AdminMe, ContentStatus, Dashboard, QuestionDetail, QuestionInput, QuestionListFilter, QuestionReportRow, QuestionRow, TaxonomyTree } from './admin-types';
import type { Page } from './types';
import type { AdminCoupon, AdminDoubtRow, AdminDoubtThread, AdminMentorDetail, AdminMentorRow, AdminOrderDetail, AdminOrderRow, AdminPlan, AdminTestDetail, AdminTestRow, AdminUserDetail, AdminUserRow, AuditRow, BuilderVersion, ContentRow, ContentStatusName, CreateTestInput, DoubtStats, ImportCommitResult, ImportJobRow, ImportPreview, PickResult, PickRule, ReconcileReport, SeriesRow, SettingsView, StaffRole, StaffRow, TestAnalytics, TestKindName, VersionConfig } from './admin-types';

/** Admin endpoints. The session is the httpOnly `eg_admin` cookie; writes carry the CSRF token the client was given at sign-in. */
export function createAdminApi(http: Http) {
  return {
    // auth
    login: (email: string, password: string) => http.post<AdminLoginResult>('/admin/auth/login', { email, password }, { noAuth: true }),
    totpSetup: () => http.post<{ secret: string; otpauthUri: string }>('/admin/auth/totp/setup'),
    totpEnable: (code: string) => http.post<{ csrfToken: string; recoveryCodes: string[] }>('/admin/auth/totp/enable', { code }),
    mfa: (b: { code?: string; recoveryCode?: string }) => http.post<{ csrfToken: string }>('/admin/auth/mfa', b),
    me: () => http.get<AdminMe>('/admin/auth/me'),
    logout: () => http.post<void>('/admin/auth/logout'),
    changePassword: (currentPassword: string, newPassword: string) => http.post<void>('/admin/auth/password', { currentPassword, newPassword }),

    dashboard: (range: { from?: string; to?: string } = {}) => http.get<Dashboard>('/admin/dashboard', { ...range }),
    taxonomy: () => http.get<TaxonomyTree>('/admin/taxonomy/tree'),

    // question bank
    questions: (f: QuestionListFilter = {}) => http.get<Page<QuestionRow>>('/admin/questions', { ...f, reported: f.reported === undefined ? undefined : String(f.reported) }),
    question: (id: string) => http.get<QuestionDetail>(`/admin/questions/${id}`),
    createQuestion: (b: QuestionInput, allowDuplicate = false) => http.request<{ id: string }>('POST', '/admin/questions', { body: b, query: { allowDuplicate: allowDuplicate ? 'true' : undefined } }),
    updateQuestion: (id: string, b: QuestionInput, allowDuplicate = false) => http.request<{ id: string }>('PUT', `/admin/questions/${id}`, { body: b, query: { allowDuplicate: allowDuplicate ? 'true' : undefined } }),
    setQuestionStatus: (id: string, to: ContentStatus) => http.post<unknown>(`/admin/questions/${id}/status`, { to }),
    bulkQuestionStatus: (ids: string[], to: ContentStatus) => http.post<unknown>('/admin/questions/bulk-status', { ids, to }),
    deleteQuestion: (id: string) => http.delete<void>(`/admin/questions/${id}`),
    checkDuplicate: (type: string, body: unknown) => http.post<{ duplicates: Array<{ id: string; code: string | null; status: string }> }>('/admin/questions/check-duplicate', { type, body }),
    questionReports: (f: { page?: number; status?: 'open' | 'resolved' | 'dismissed' } = {}) => http.get<Page<QuestionReportRow>>('/admin/question-reports', { ...f }),
    resolveReport: (id: string, status: 'resolved' | 'dismissed', note?: string) => http.patch<unknown>(`/admin/question-reports/${id}`, { status, note }),
    // taxonomy
    createExam: (b: Record<string, unknown>) => http.post<unknown>('/admin/taxonomy/exams', b),
    patchExam: (id: string, b: Record<string, unknown>) => http.patch<unknown>(`/admin/taxonomy/exams/${id}`, b),
    deleteExam: (id: string) => http.delete<void>(`/admin/taxonomy/exams/${id}`),
    verifyPattern: (id: string, b: { sourceUrl: string; note?: string }) => http.post<unknown>(`/admin/taxonomy/exams/${id}/verify-pattern`, b),
    createPaper: (examId: string, b: Record<string, unknown>) => http.post<unknown>(`/admin/taxonomy/exams/${examId}/papers`, b),
    updatePaper: (id: string, b: Record<string, unknown>) => http.put<unknown>(`/admin/taxonomy/papers/${id}`, b),
    deletePaper: (id: string) => http.delete<void>(`/admin/taxonomy/papers/${id}`),
    setPaperSubjects: (id: string, subjectCodes: string[]) => http.put<void>(`/admin/taxonomy/papers/${id}/subjects`, { subjectCodes }),
    taxCreate: (kind: 'subjects' | 'topics' | 'subtopics', b: Record<string, unknown>) => http.post<unknown>(`/admin/taxonomy/${kind}`, b),
    taxPatch: (kind: 'subjects' | 'topics' | 'subtopics', code: string, b: Record<string, unknown>) => http.patch<unknown>(`/admin/taxonomy/${kind}/${code}`, b),
    taxDelete: (kind: 'subjects' | 'topics' | 'subtopics', code: string) => http.delete<void>(`/admin/taxonomy/${kind}/${code}`),

    // import / export
    importPreview: (file: File, allowDuplicates: boolean) => {
      const f = new FormData();
      f.append('file', file);
      return http.postForm<ImportPreview>('/admin/import/questions/preview', f, { allowDuplicates: allowDuplicates ? 'true' : undefined });
    },
    importCommit: (jobId: string, skipInvalid: boolean) => http.post<ImportCommitResult>(`/admin/import/jobs/${jobId}/commit`, { skipInvalid }),
    importJobs: () => http.get<ImportJobRow[]>('/admin/import/jobs'),
    importTemplate: (format: 'csv' | 'xlsx' = 'csv') => http.download('/admin/import/questions/template', { format }),
    exportQuestions: (f: QuestionListFilter = {}, format: 'csv' | 'xlsx' = 'csv') => http.download('/admin/export/questions', { ...f, format, reported: f.reported === undefined ? undefined : String(f.reported), page: undefined, pageSize: undefined }),
    // tests
    adminTests: (f: { page?: number; pageSize?: number; examId?: string; kind?: TestKindName; state?: 'draft' | 'published' | 'archived'; q?: string } = {}) => http.get<Page<AdminTestRow>>('/admin/tests', { ...f }),
    createTest: (b: CreateTestInput) => http.post<{ test: { id: string }; version: { id: string } }>('/admin/tests', b),
    adminTest: (id: string) => http.get<AdminTestDetail>(`/admin/tests/${id}`),
    patchTest: (id: string, b: Partial<{ titleEn: string; titleHi: string; access: 'free' | 'paid' }>) => http.patch<unknown>(`/admin/tests/${id}`, b),
    deleteTest: (id: string) => http.delete<void>(`/admin/tests/${id}`),
    archiveTest: (id: string, archived: boolean) => http.post<void>(`/admin/tests/${id}/${archived ? 'archive' : 'unarchive'}`),
    newTestDraft: (id: string) => http.post<{ id: string }>(`/admin/tests/${id}/versions`),
    testVersion: (id: string, vid: string) => http.get<BuilderVersion>(`/admin/tests/${id}/versions/${vid}`),
    updateVersion: (id: string, vid: string, b: Partial<VersionConfig>) => http.put<unknown>(`/admin/tests/${id}/versions/${vid}`, b),
    discardDraft: (id: string, vid: string) => http.delete<void>(`/admin/tests/${id}/versions/${vid}`),
    setSections: (id: string, vid: string, sections: Array<{ nameEn: string; nameHi: string; durationMin: number | null }>) => http.put<unknown>(`/admin/tests/${id}/versions/${vid}/sections`, { sections }),
    setTestQuestions: (id: string, vid: string, items: Array<{ questionId: string; sectionPos?: number; marks?: number }>) => http.put<unknown>(`/admin/tests/${id}/versions/${vid}/questions`, { items }),
    pickQuestions: (id: string, vid: string, b: { rules: PickRule[]; preview?: boolean; allowPartial?: boolean; excludeUsedInTests?: boolean; bothLanguagesOnly?: boolean; seed?: string }) => http.post<PickResult>(`/admin/tests/${id}/versions/${vid}/pick`, b),
    publishVersion: (id: string, vid: string) => http.post<unknown>(`/admin/tests/${id}/versions/${vid}/publish`),
    correctKey: (id: string, vid: string, b: { tvqId: string; newAnswer: number; reason: string; updateQuestionBank: boolean }) => http.post<unknown>(`/admin/tests/${id}/versions/${vid}/correct-key`, b),
    testAnalytics: (id: string, versionId?: string) => http.get<TestAnalytics>(`/admin/tests/${id}/analytics`, { versionId }),
    testResultsCsv: (id: string, versionId?: string) => http.download(`/admin/tests/${id}/results.csv`, { versionId }),
    adminSeries: () => http.get<SeriesRow[]>('/admin/series'),
    createSeries: (b: Partial<SeriesRow>) => http.post<SeriesRow>('/admin/series', b),
    adminSeriesOne: (id: string) => http.get<Omit<SeriesRow, 'items'> & { items: Array<{ testId: string; position: number; test?: { titleEn: string; titleHi: string } }> }>(`/admin/series/${id}`),
    patchSeries: (id: string, b: Partial<SeriesRow>) => http.patch<SeriesRow>(`/admin/series/${id}`, b),
    setSeriesItems: (id: string, testIds: string[]) => http.put<unknown>(`/admin/series/${id}/items`, { testIds }),

    // generic content (materials, current affairs, FAQs …)
    contentList: (entity: string, f: Record<string, string | number | undefined> = {}) => http.get<Page<ContentRow>>(`/admin/${entity}`, { ...f }),
    contentGet: (entity: string, id: string) => http.get<ContentRow>(`/admin/${entity}/${encodeURIComponent(id)}`),
    contentCreate: (entity: string, b: Record<string, unknown>) => http.post<ContentRow>(`/admin/${entity}`, b),
    contentUpdate: (entity: string, id: string, b: Record<string, unknown>) => http.patch<ContentRow>(`/admin/${entity}/${encodeURIComponent(id)}`, b),
    contentStatus: (entity: string, id: string, to: ContentStatusName) => http.post<ContentRow>(`/admin/${entity}/${encodeURIComponent(id)}/status`, { to }),
    contentDelete: (entity: string, id: string) => http.delete<void>(`/admin/${entity}/${encodeURIComponent(id)}`),
    dailyQuizList: () => http.get<Array<{ date: string; testId: string; test?: { titleEn: string } }>>('/admin/daily-quiz'),
    setDailyQuiz: (date: string, testId: string) => http.put<unknown>(`/admin/daily-quiz/${date}`, { testId }),

    // students
    users: (f: { page?: number; pageSize?: number; q?: string; status?: string; paid?: string; targetExam?: string; district?: string; sort?: string } = {}) => http.get<Page<AdminUserRow>>('/admin/users', { ...f }),
    user: (id: string) => http.get<AdminUserDetail>(`/admin/users/${id}`),
    suspendUser: (id: string, reason: string) => http.post<void>(`/admin/users/${id}/suspend`, { reason }),
    activateUser: (id: string) => http.post<void>(`/admin/users/${id}/activate`),
    revokeUserSessions: (id: string) => http.post<void>(`/admin/users/${id}/revoke-sessions`),
    grantAccess: (id: string, b: { planId: string; days: number; note?: string }) => http.post<unknown>(`/admin/users/${id}/grant-access`, b),
    revokeEntitlement: (eid: string, reason: string) => http.post<unknown>(`/admin/users/entitlements/${eid}/revoke`, { reason }),

    // doubts and study plans
    adminDoubts: (f: { page?: number; status?: string; sla?: string; abuse?: string; q?: string } = {}) => http.get<Page<AdminDoubtRow>>('/admin/doubts', { ...f }),
    adminDoubtStats: (days = 30) => http.get<DoubtStats>('/admin/doubts/stats', { days }),
    adminDoubt: (id: string) => http.get<AdminDoubtThread>(`/admin/doubts/${id}`),
    replyDoubt: (id: string, b: { text: string; close?: boolean }) => http.post<void>(`/admin/doubts/${id}/reply`, b),
    closeDoubtAdmin: (id: string) => http.post<void>(`/admin/doubts/${id}/close`),
    flagDoubt: (id: string, abuse: boolean) => http.post<void>(`/admin/doubts/${id}/abuse`, { abuse }),
    mentorRequests: (f: { page?: number; status?: 'open' | 'sent' } = {}) => http.get<Page<AdminMentorRow>>('/admin/mentor/requests', { ...f }),
    mentorRequest: (id: string) => http.get<AdminMentorDetail>(`/admin/mentor/requests/${id}`),
    saveMentorPlan: (id: string, plan: unknown) => http.put<void>(`/admin/mentor/requests/${id}/plan`, plan),
    regenerateMentorPlan: (id: string) => http.post<unknown>(`/admin/mentor/requests/${id}/regenerate`),
    sendMentorPlan: (id: string) => http.post<void>(`/admin/mentor/requests/${id}/send`),

    // commerce
    plans: () => http.get<AdminPlan[]>('/admin/plans'),
    createPlan: (b: Record<string, unknown>) => http.post<AdminPlan>('/admin/plans', b),
    updatePlan: (id: string, b: Record<string, unknown>) => http.patch<AdminPlan>(`/admin/plans/${id}`, b),
    deletePlan: (id: string) => http.delete<void>(`/admin/plans/${id}`),
    coupons: () => http.get<AdminCoupon[]>('/admin/coupons'),
    createCoupon: (b: Record<string, unknown>) => http.post<AdminCoupon>('/admin/coupons', b),
    updateCoupon: (code: string, b: Record<string, unknown>) => http.patch<AdminCoupon>(`/admin/coupons/${encodeURIComponent(code)}`, b),
    orders: (f: { page?: number; status?: string; q?: string; planId?: string; from?: string; to?: string } = {}) => http.get<Page<AdminOrderRow> & { totalAmountPaise: number }>('/admin/orders', { ...f }),
    order: (id: string) => http.get<AdminOrderDetail>(`/admin/orders/${id}`),
    refundOrder: (id: string, b: { amountPaise?: number; reason: string }) => http.post<unknown>(`/admin/orders/${id}/refund`, b),
    reconcile: (from: string, to: string) => http.post<ReconcileReport>('/admin/orders/reconcile', { from, to }),
    repairPayment: (razorpayPaymentId: string, from: string, to: string) => http.post<unknown>('/admin/orders/reconcile/repair', { razorpayPaymentId, from, to }),

    // system
    audit: (f: { page?: number; pageSize?: number; actor?: string; actorType?: string; action?: string; targetType?: string; target?: string; from?: string; to?: string } = {}) => http.get<Page<AuditRow>>('/admin/audit', { ...f }),
    settings: () => http.get<SettingsView>('/admin/settings'),
    setSetting: (key: string, value: unknown) => http.put<unknown>(`/admin/settings/${encodeURIComponent(key)}`, { value }),
    staff: () => http.get<StaffRow[]>('/admin/staff'),
    createStaff: (b: { email: string; name: string; role: StaffRole }) => http.post<StaffRow & { temporaryPassword: string }>('/admin/staff', b),
    updateStaff: (id: string, b: { role?: StaffRole; disabled?: boolean; name?: string }) => http.patch<StaffRow>(`/admin/staff/${id}`, b),
    resetStaffMfa: (id: string) => http.post<void>(`/admin/staff/${id}/reset-mfa`),
    resetStaffPassword: (id: string) => http.post<{ temporaryPassword: string }>(`/admin/staff/${id}/reset-password`),
    revokeStaffSessions: (id: string) => http.post<void>(`/admin/staff/${id}/revoke-sessions`),
    presignUpload: (purpose: 'question-image' | 'ca-image' | 'material-pdf', contentType: string) => http.post<{ key: string; url: string; fields: Record<string, string>; maxBytes: number }>('/admin/uploads/presign', { purpose, contentType }),
  };
}
export type AdminApi = ReturnType<typeof createAdminApi>;
