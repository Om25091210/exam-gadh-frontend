import type { Page, QuestionLang } from './types';

export type StaffRole = 'SUPER_ADMIN' | 'ADMIN' | 'CONTENT_EDITOR' | 'TEACHER' | 'SUPPORT';

export interface AdminMe {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  permissions: string[];
  csrfToken: string;
  mustChangePassword: boolean;
}
export interface AdminLoginResult {
  mfaRequired: boolean;
  mfaEnrolled: boolean;
  mustChangePassword: boolean;
  csrfToken: string;
}

export interface DashboardAlert {
  key: string;
  level: 'info' | 'warning' | 'critical';
  count: number;
  text: string;
}
export interface Dashboard {
  range: { from: string; to: string };
  generatedAt: string;
  students: { total: number; new: number; suspended: number; paid: number; dau: number; wau: number; mau: number; stickiness: number | null };
  enrollments: { seriesEnrollments: number; accessGrants: Array<{ source: string; count: number }> };
  revenue: { grossPaise: number; refundedPaise: number; netPaise: number; payments: number };
  attempts: { started: number; submitted: number; autoSubmitted: number; avgScorePct: number | null; avgAccuracyPct: number | null };
  series: Array<{ day: string; signups: number; active: number; attempts: number; revenuePaise: number }>;
  alerts: DashboardAlert[];
}

// ---------------------------------------------------------------- taxonomy
export interface TaxExamPaper {
  id: string;
  examId: string;
  code: string;
  stage: string;
  nameEn: string;
  nameHi: string;
  questionCount: number;
  totalMarks: number;
  durationMin: number;
  correctMarks: number;
  negativeFraction: number;
  qualifyingPct: number | null;
  qualifyingPctReserved: number | null;
  countsTowardMerit: boolean;
  sort: number;
  active: boolean;
  subjects: Array<{ subjectCode: string; sort: number }>;
}
export interface TaxExam {
  id: string;
  nameEn: string;
  nameHi: string;
  shortEn: string;
  shortHi: string;
  hasMains: boolean;
  active: boolean;
  sort: number;
  patternVerified: boolean;
  patternSourceUrl: string | null;
  patternNote: string | null;
  papers: TaxExamPaper[];
}
export interface TaxSubject {
  code: string;
  nameEn: string;
  nameHi: string;
  sort: number;
  topics: Array<{ code: string; subjectCode: string; nameEn: string; nameHi: string; sort: number; weight: number; subtopics: Array<{ code: string; topicCode: string; nameEn: string; nameHi: string; sort: number }> }>;
}
export interface TaxonomyTree {
  exams: TaxExam[];
  subjects: TaxSubject[];
}

// ---------------------------------------------------------------- questions
export type QuestionType = 'single' | 'multi_statement' | 'match' | 'assertion_reason' | 'chronology' | 'passage';
export type ContentStatus = 'draft' | 'in_review' | 'published' | 'archived';
export interface QuestionBodyInput {
  en?: QuestionLang & Record<string, unknown>;
  hi?: QuestionLang & Record<string, unknown>;
}
export interface QuestionRow {
  id: string;
  code: string | null;
  type: QuestionType;
  topicCode: string;
  subtopicCode: string | null;
  difficulty: number;
  status: ContentStatus;
  answer: number;
  source: 'original' | 'pyq';
  pyqYear: number | null;
  tags: string[];
  hasEn: boolean;
  hasHi: boolean;
  reportedCount: number;
  version: number;
  preview: string;
  updatedAt: string;
}
export interface QuestionDetail extends Omit<QuestionRow, 'preview'> {
  body: QuestionBodyInput;
  passage: { id: string; body: { en?: string; hi?: string } } | null;
  passageId: string | null;
  imageKey: string | null;
  pyqExamId: string | null;
  pyqPaperCode: string | null;
  history: Array<{ version: number; changedBy: string | null; changedAt: string }>;
  usedIn: unknown[];
}
export interface QuestionInput {
  code?: string;
  type: QuestionType;
  topicCode: string;
  subtopicCode?: string | null;
  difficulty: number;
  answer: number;
  body: QuestionBodyInput;
  passage?: { en?: string; hi?: string };
  passageId?: string;
  imageKey?: string | null;
  source: 'original' | 'pyq';
  pyqYear?: number | null;
  pyqExamId?: string | null;
  pyqPaperCode?: string | null;
  tags: string[];
}
export interface QuestionListFilter {
  page?: number;
  pageSize?: number;
  status?: ContentStatus;
  type?: QuestionType;
  topicCode?: string;
  difficulty?: number;
  source?: 'original' | 'pyq';
  missing?: 'hi' | 'en' | 'any';
  reported?: boolean;
  q?: string;
  tag?: string;
}
export interface QuestionReportRow {
  id: string;
  questionId: string;
  userId: string;
  reason: string;
  note: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  question?: { id: string; code: string | null; topicCode: string; body: QuestionBodyInput; answer: number };
}
export type AdminPage<T> = Page<T>;

// ---------------------------------------------------------------- import / export
export interface ImportPreview {
  jobId: string;
  status: string;
  rowsTotal: number;
  rowsOk: number;
  rowsFailed: number;
  willCreate: number;
  willUpdate: number;
  ignoredColumns: string[];
  errors: Array<{ row: number; field?: string; message: string }>;
  errorsTruncated: boolean;
  sample: Array<{ row: number; action: 'create' | 'update'; code: string | null; type: string; topic: string; languages: string[] }>;
}
export interface ImportCommitResult {
  jobId: string;
  status: string;
  created: number;
  updated: number;
  skippedRows: number;
}
export interface ImportJobRow {
  id: string;
  fileName: string;
  status: 'dry_run' | 'committed' | 'failed';
  rowsTotal: number;
  rowsOk: number;
  rowsFailed: number;
  createdAt: string;
  committedAt: string | null;
}

// ---------------------------------------------------------------- tests and series
export type TestKindName = 'diagnostic' | 'mock' | 'topic' | 'subject' | 'pyq' | 'csat' | 'sectional' | 'daily' | 'live';
export interface AdminTestRow {
  id: string;
  titleEn: string;
  titleHi: string;
  examId: string;
  kind: TestKindName;
  mode: 'static' | 'live';
  access: 'free' | 'paid';
  archived: boolean;
  published: boolean;
  latestVersion: { id: string; version: number; status: 'draft' | 'published' | 'archived'; questionCount: number | null; startsAt: string | null } | null;
  versionCount: number;
  createdAt: string;
}
export interface VersionConfig {
  durationMin: number;
  correctMarks: number;
  negativeFraction: number;
  qualifyingPct: number | null;
  qualifyingPctReserved: number | null;
  countsTowardMerit: boolean;
  shuffleQuestions: boolean;
  sectionalTimers: boolean;
  attemptLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  resultReleaseAt: string | null;
  instructionsEn: string | null;
  instructionsHi: string | null;
}
export interface AdminTestVersionSummary extends VersionConfig {
  id: string;
  testId: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  maxScore: number | null;
  questionCount: number | null;
  publishedAt: string | null;
  sections: Array<{ id: string; position: number; nameEn: string; nameHi: string; durationMin: number | null }>;
  _count: { questions: number; attempts: number };
}
export interface AdminTestDetail {
  id: string;
  titleEn: string;
  titleHi: string;
  examId: string;
  paperId: string | null;
  kind: TestKindName;
  mode: 'static' | 'live';
  access: 'free' | 'paid';
  subjectCode: string | null;
  topicCode: string | null;
  pyqYear: number | null;
  archived: boolean;
  publishedVersionId: string | null;
  versions: AdminTestVersionSummary[];
}
export interface BuilderItem {
  tvqId: string;
  position: number;
  sectionPos: number | null;
  marks: number | null;
  questionId: string;
  code: string | null;
  type: QuestionType;
  topicCode: string;
  difficulty: number;
  status: ContentStatus;
  hasEn: boolean;
  hasHi: boolean;
  preview: string;
}
export interface BuilderVersion extends VersionConfig {
  id: string;
  testId: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  sections: Array<{ id: string; position: number; nameEn: string; nameHi: string; durationMin: number | null }>;
  items: BuilderItem[];
  totalMarks: number;
  readiness: { ready: boolean; problems: string[] };
}
export interface PickRule {
  topicCode: string;
  difficulty?: number;
  type?: QuestionType;
  count: number;
  sectionPos?: number;
  source?: 'original' | 'pyq';
}
export interface PickResult {
  preview: boolean;
  seed: string;
  picked: number;
  shortages: Array<{ rule: number; requested: number; available: number }>;
  questionIds?: string[];
}
export interface CreateTestInput {
  examId: string;
  paperId?: string;
  titleEn: string;
  titleHi: string;
  kind: TestKindName;
  mode: 'static' | 'live';
  access: 'free' | 'paid';
  subjectCode?: string;
  topicCode?: string;
  pyqYear?: number;
  config: Partial<VersionConfig>;
}
export interface TestAnalytics {
  test: { id: string; titleEn: string; versionId: string; version: number; maxScore: number | null };
  attempts: { rankedResults: number; practiceResults: number; byStatus: Array<{ status: string; finalizedBy: string | null; count: number }> };
  scores: { mean: number; median: number; min: number | null; max: number | null; stdDev: number; avgAccuracyPct: number | null; avgTimeSec: number | null };
  distribution: Array<{ label: string; count: number }>;
  questions: AnalyticsQuestion[];
  mostWrong: AnalyticsQuestion[];
}
export interface AnalyticsQuestion {
  tvqId: string;
  position: number;
  code: string | null;
  topic: string;
  preview: string;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  difficultyIndex: number | null;
  pCorrectOfAttempted: number | null;
  markedForReview: number;
  avgTimeSec: number | null;
}
export interface SeriesRow {
  id: string;
  examId: string;
  titleEn: string;
  titleHi: string;
  descEn: string | null;
  descHi: string | null;
  access: 'free' | 'paid';
  status: 'draft' | 'published' | 'archived';
  sort: number;
  items?: Array<{ testId: string; position: number }>;
  _count?: { items: number; enrollments: number };
}

// ---------------------------------------------------------------- content (generic)
export interface ContentRow {
  [k: string]: unknown;
  state?: string;
}
export type ContentStatusName = 'draft' | 'in_review' | 'published' | 'archived';

// ---------------------------------------------------------------- students
export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  district: string | null;
  targetExam: string | null;
  status: 'active' | 'suspended';
  createdAt: string;
  lastSeenAt: string | null;
  paid: boolean;
  attempts: number;
}
export interface AdminUserDetail {
  profile: { id: string; name: string; email: string; district: string | null; targetExam: string | null; status: string; suspendReason: string | null; createdAt: string; lastSeenAt: string | null; language: string; showOnLeaderboard: boolean };
  entitlements: Array<{ id: string; planId: string; startsAt: string; endsAt: string; source: string; revokedAt: string | null; plan: { id: string; nameEn: string } }>;
  attempts: Array<{ id: string; status: string; isRanked: boolean; startedAt: string; submittedAt: string | null; version: { version: number; test: { id: string; titleEn: string } }; result: { score: number; maxScore: number; accuracyPct: number } | null }>;
  orders: Array<{ id: string; planId: string; months: number; amountPaise: number; status: string; createdAt: string }>;
  doubts: number;
  activeSessions: Array<{ id: string; platform: string; deviceName: string | null; createdAt: string; lastSeenAt: string; ip: string | null }>;
  topicStats: Array<{ topicCode: string; attempted: number; correct: number; accuracyPct: number | null }>;
}

// ---------------------------------------------------------------- doubts (staff side)
export interface AdminDoubtRow {
  id: string;
  status: 'open' | 'answered' | 'closed';
  student: { id: string; name: string; email: string };
  contextType: string;
  topicCode: string | null;
  preview: string;
  slaDueAt: string;
  overdue: boolean;
  abuse: boolean;
  reopened: boolean;
  rating: number | null;
  createdAt: string;
}
export interface AdminDoubtThread {
  id: string;
  status: 'open' | 'answered' | 'closed';
  contextType: string;
  contextId: string | null;
  topicCode: string | null;
  rating: number | null;
  reopened: boolean;
  abuse: boolean;
  slaDueAt: string;
  firstResponseAt: string | null;
  answeredAt: string | null;
  createdAt: string;
  student: { id: string; name: string; email: string; targetExam: string | null };
  question: { id: string; code: string | null; type: string; body: QuestionBodyInput; answer: number; topicCode: string } | null;
  messages: Array<{ id: string; from: 'student' | 'staff'; text: string; createdAt: string; attachments: Array<{ key: string; url: string }> }>;
}
export interface DoubtStats {
  rangeDays: number;
  byStatus: Record<string, number>;
  overdue: number;
  dueSoon: number;
  abuseFlagged: number;
  asked: number;
  medianFirstResponseHours: number | null;
  medianAnsweredHours: number | null;
  withinSlaPct: number | null;
  avgRating: number | null;
  ratings: number;
}
export interface AdminMentorRow {
  id: string;
  status: 'open' | 'sent';
  student: { id: string; name: string; email: string } | null;
  examId: string;
  hoursPerDay: number;
  examDate: string | null;
  createdAt: string;
  sentAt: string | null;
}
export interface AdminMentorDetail {
  id: string;
  status: 'open' | 'sent';
  examId: string;
  hoursPerDay: number;
  examDate: string | null;
  createdAt: string;
  sentAt: string | null;
  student: { id: string; name: string; email: string; district: string | null } | null;
  plan: unknown;
  topicAccuracy: Array<{ topicCode: string; nameEn: string; accuracyPct: number | null }>;
}

// ---------------------------------------------------------------- commerce
export interface AdminPlan {
  id: string;
  nameEn: string;
  nameHi: string;
  prices: Record<string, number>;
  trialDays: number;
  topTier: boolean;
  active: boolean;
  exams?: Array<{ examId: string }>;
  examIds?: string[];
}
export interface AdminCoupon {
  code: string;
  planId: string;
  days: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}
export interface AdminOrderRow {
  id: string;
  planId: string;
  months: number;
  amountPaise: number;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId: string;
  couponCode: string | null;
  createdAt: string;
  user: { id: string; name: string };
  plan: { id: string; nameEn: string };
}
export interface AdminOrderDetail extends Omit<AdminOrderRow, 'user'> {
  user: { id: string; name: string; email: string };
  payments: Array<{ id: string; razorpayPaymentId: string; amountPaise: number; status: string; method: string | null; createdAt: string }>;
  invoice: { number: string; issuedAt: string } | null;
}
export interface ReconcileReport {
  [k: string]: unknown;
}

// ---------------------------------------------------------------- system
export interface AuditRow {
  id: string;
  actor: string;
  actorType: string;
  action: string;
  target: string | null;
  targetType: string | null;
  before: unknown;
  after: unknown;
  meta: unknown;
  ip: string | null;
  createdAt: string;
}
export interface SettingsView {
  values: Record<string, unknown>;
  defaults: Record<string, unknown>;
}
export interface StaffRow {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  disabled: boolean;
  mfaEnrolled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  [k: string]: unknown;
}
