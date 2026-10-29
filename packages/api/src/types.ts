export type Lang = 'hi' | 'en';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  language: Lang;
  district: string | null;
  targetExam: string | null;
  showOnLeaderboard: boolean;
}
export interface Me extends User {
  entitlements: Array<{ id: string; planId: string; endsAt: string }>;
}
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  endedOtherSession: boolean;
}
export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ExamPaper {
  id: string;
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
}
export interface Exam {
  id: string;
  nameEn: string;
  nameHi: string;
  shortEn: string;
  shortHi: string;
  hasMains: boolean;
  patternVerified: boolean;
  papers: ExamPaper[];
}

export type TestKind = 'diagnostic' | 'mock' | 'topic' | 'subject' | 'pyq' | 'csat' | 'sectional' | 'daily' | 'live';

export interface TestListItem {
  id: string;
  titleEn: string;
  titleHi: string;
  examId: string;
  kind: TestKind;
  mode: 'static' | 'live';
  access: 'free' | 'paid';
  subjectCode: string | null;
  topicCode: string | null;
  pyqYear: number | null;
  durationMin: number;
  questionCount: number;
  maxScore: number;
  sectionalTimers: boolean;
  startsAt: string | null;
  endsAt: string | null;
  resultReleaseAt: string | null;
  live: boolean;
  locked: boolean;
  mine: { attempts: number; inProgressAttemptId: string | null; bestScore: number | null };
}
export interface Page<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}
export interface TestDetail {
  id: string;
  titleEn: string;
  titleHi: string;
  examId: string;
  kind: TestKind;
  mode: 'static' | 'live';
  access: 'free' | 'paid';
  locked: boolean;
  version: number;
  durationMin: number;
  questionCount: number;
  maxScore: number;
  scheme: { correctMarks: number; negativeFraction: number; qualifyingPct: number | null; qualifyingPctReserved: number | null; countsTowardMerit: boolean };
  sectionalTimers: boolean;
  sections: Array<{ position: number; nameEn: string; nameHi: string; durationMin: number | null; count: number }>;
  attemptLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  resultReleaseAt: string | null;
  instructions: { en: string | null; hi: string | null };
  myAttempts: Array<{ id: string; status: string; attemptNo: number; isRanked: boolean; startedAt: string; submittedAt: string | null }>;
}

/** One language of a question as served during an attempt (no explanation, never the answer). */
export interface QuestionLang {
  stem?: string;
  options: string[];
  statements?: string[];
  prompt?: string;
  listA?: string[];
  listB?: string[];
  items?: string[];
  assertion?: string;
  reason?: string;
  /** only present in review (after the result is released) */
  explanation?: string;
}
export interface AttemptQuestion {
  qid: string;
  position: number;
  sectionPos: number;
  marks: number;
  type: 'single' | 'multi_statement' | 'match' | 'assertion_reason' | 'chronology' | 'passage';
  en?: QuestionLang;
  hi?: QuestionLang;
  passage: { en?: string; hi?: string } | null;
}
export interface AnswerState {
  qid: string;
  selected: number | null;
  visited: boolean;
  marked: boolean;
  timeSpentSec: number;
  seq: number;
}
export interface SectionWindow {
  position: number;
  start: string;
  end: string;
}
export interface AttemptView {
  attemptId: string;
  testId: string;
  versionId: string;
  title: { en: string; hi: string };
  status: 'in_progress' | 'submitted' | 'auto_submitted';
  isRanked: boolean;
  isPractice: boolean;
  serverTime: string;
  startedAt: string;
  deadlineAt: string;
  remainingSec: number;
  scheme: { correctMarks: number; negativeFraction: number; sectionalTimers: boolean };
  instructions: { en: string | null; hi: string | null };
  sections: Array<{ position: number; nameEn: string; nameHi: string; durationMin: number | null; count: number }>;
  sectionWindows: SectionWindow[] | null;
  openSection: number | null;
  state: { currentIndex: number; currentSection: number; language: Lang; seq: number; answers: AnswerState[] };
  questions: AttemptQuestion[];
}
export interface AnswerWrite {
  qid: string;
  selected?: number | null;
  visited?: boolean;
  marked?: boolean;
  timeSpentSec?: number;
  seq: number;
}
export interface SaveStateBody {
  seq: number;
  currentIndex?: number;
  currentSection?: number;
  language?: Lang;
  answers: AnswerWrite[];
}
export interface SaveStateResult {
  saved: number;
  rejected: Array<{ qid: string; reason: string }>;
  serverTime: string;
  deadlineAt: string;
  remainingSec: number;
  openSection: number | null;
  sectionWindows: SectionWindow[] | null;
}

export interface ResultNotReleased {
  attemptId: string;
  testId: string;
  status: string;
  released: false;
  resultReleaseAt: string;
  isRanked: boolean;
  submittedAt: string | null;
}
export interface ResultReleased {
  attemptId: string;
  testId: string;
  status: string;
  finalizedBy: string | null;
  submittedAt: string | null;
  isRanked: boolean;
  released: true;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
  attempted: number;
  negativeDeducted: number;
  accuracyPct: number;
  timeSpentSec: number;
  qualifying: { requiredPct: number; requiredPctReserved: number | null; general: boolean | null; reserved: boolean | null; countsTowardMerit: boolean } | null;
  rank: number | null;
  percentile: number | null;
  rankedAttempters: number;
  comparison: { topperScore: number | null; averageScore: number | null; averageAccuracyPct: number | null };
  sections: Array<{ position: number; nameEn: string; nameHi: string; score: number; maxScore: number; correct: number; wrong: number; skipped: number }>;
  topics: Array<{ code: string; nameEn: string; nameHi: string; attempted: number; correct: number; wrong: number; marks: number; timeSec: number; accuracyPct: number | null }>;
  questionTimes: Array<{ qid: string; position: number; timeSpentSec: number }>;
}
export type AttemptResultView = ResultNotReleased | ResultReleased;

export interface ReviewQuestion extends Omit<AttemptQuestion, 'en' | 'hi'> {
  questionId: string;
  en?: QuestionLang;
  hi?: QuestionLang;
  correctOption: number;
  selected: number | null;
  marked: boolean;
  timeSpentSec: number;
  outcome: 'correct' | 'wrong' | 'skipped';
  marksAwarded: number;
  topicCode: string;
  difficulty: number;
}
export interface Review {
  attemptId: string;
  questions: ReviewQuestion[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl: string | null;
  score: number;
  maxScore?: number;
  tests?: number;
  timeSpentSec: number;
  isMe: boolean;
}

// ---------------------------------------------------------------- home
export interface Announcement {
  id: string;
  kind: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  examId: string | null;
  linkUrl: string | null;
  pinned: boolean;
  publishedAt: string;
}
export interface CalendarEvent {
  id: string;
  examId: string | null;
  stage: string | null;
  labelEn: string;
  labelHi: string;
  date: string;
  sourceUrl: string | null;
}
export interface Updates {
  announcements: Announcement[];
  calendar: CalendarEvent[];
}
export type DailyQuiz = { date: string; available: false } | { date: string; available: true; test: { id: string; titleEn: string; titleHi: string; questionCount: number | null; durationMin: number; maxScore: number | null }; done: boolean; result: { attemptId: string; score: number; maxScore: number } | null };
export interface WeakTopic {
  topicCode: string;
  nameEn: string;
  nameHi: string;
  attempted: number;
  accuracyPct: number;
  practice: { topicCode: string };
}
export interface Home {
  continue: Array<{ attemptId: string; testId: string; titleEn: string; titleHi: string; deadlineAt: string; remainingSec: number; answered: number; total: number }>;
  live: Array<{ id: string; titleEn: string; titleHi: string; examId: string; startsAt: string | null; endsAt: string | null; state: 'upcoming' | 'open' }>;
  series: Array<{ id: string; titleEn: string; titleHi: string; total: number; attempted: number }>;
  streak: { current: number; activeToday: boolean };
  trend: Array<{ attemptId: string; testId: string; titleEn: string; titleHi: string; pct: number; submittedAt: string }>;
  weakTopics: WeakTopic[];
  dailyQuiz: DailyQuiz;
  announcements: Announcement[];
  unreadNotifications: number;
  plan: { active: Array<{ planId: string; nameEn: string; nameHi: string; endsAt: string; daysLeft: number }>; expiringSoon: boolean };
}

// ---------------------------------------------------------------- learning helpers
export interface BookmarkedQuestion {
  questionId: string;
  type: AttemptQuestion['type'];
  topicCode: string;
  en?: QuestionLang;
  hi?: QuestionLang;
  /** null until the result of a test containing this question is released */
  correctOption: number | null;
}
export interface Bookmarks {
  questions: BookmarkedQuestion[];
  materials: Array<{ id: string; titleEn: string; titleHi: string; kind: string }>;
  currentAffairs: Array<{ id: string; titleEn: string; titleHi: string; date: string }>;
}
export type BookmarkBody = { kind: 'question'; attemptId: string; qid: string } | { kind: 'material' | 'current_affair'; refId: string };
export interface QuestionNote {
  questionId: string;
  text: string;
  updatedAt: string;
  question: BookmarkedQuestion | null;
}
export type ReportReason = 'wrong_answer' | 'typo' | 'unclear' | 'translation' | 'other';

// ---------------------------------------------------------------- learning content
export interface CaItem {
  id: string;
  date: string;
  category: 'CG' | 'NAT';
  titleEn: string;
  titleHi: string;
  topicCode: string | null;
  tags: string[];
  access: 'free' | 'paid';
  locked: boolean;
  imageUrl: string | null;
  /** absent on a locked item: only the headline is shown */
  summaryEn?: string;
  summaryHi?: string;
  angleEn?: string | null;
  angleHi?: string | null;
  sourceUrl?: string | null;
  quizTestId?: string | null;
}
export interface CaMonth {
  month: string;
  total: number;
  days: Array<{ date: string; items: CaItem[] }>;
}
export interface MaterialItem {
  id: string;
  titleEn: string;
  titleHi: string;
  kind: 'pdf' | 'video' | 'link';
  subjectCode: string | null;
  topicCode: string | null;
  examId: string | null;
  access: 'free' | 'paid';
  locked: boolean;
}
export interface MaterialDetail {
  id: string;
  titleEn: string;
  titleHi: string;
  kind: 'pdf' | 'video' | 'link';
  url: string | null;
  downloadUrl: string | null;
}
export interface PyqPaper {
  id: string;
  examId: string;
  titleEn: string;
  titleHi: string;
  year: number | null;
  paper: { code: string; nameEn: string; nameHi: string } | null;
  questionCount: number | null;
  durationMin: number | null;
  maxScore: number | null;
  access: 'free' | 'paid';
  locked: boolean;
}
export interface PyqYears {
  years: Array<{ year: number | null; papers: PyqPaper[] }>;
}
export interface PyqFrequency {
  total: number;
  topics: Array<{ topicCode: string; nameEn?: string; nameHi?: string; questions: number; sharePct: number }>;
}
export interface Faq {
  id: string;
  keywords: string;
  qEn: string;
  qHi: string;
  aEn: string;
  aHi: string;
}
export interface InterviewQuestion {
  id: string;
  examId: string;
  category: string;
  qEn: string;
  qHi: string;
  pointsEn: string;
  pointsHi: string;
}
export interface SeriesSummary {
  id: string;
  examId: string;
  titleEn: string;
  titleHi: string;
  descEn: string | null;
  descHi: string | null;
  access: 'free' | 'paid';
  tests: number;
  enrolled: boolean;
  locked: boolean;
}
export interface SeriesDetail {
  id: string;
  examId: string;
  titleEn: string;
  titleHi: string;
  descEn: string | null;
  descHi: string | null;
  access: 'free' | 'paid';
  enrolled: boolean;
  locked: boolean;
  progress: { total: number; attempted: number };
  tests: Array<{ id: string; titleEn: string; titleHi: string; kind: TestKind; mode: 'static' | 'live'; access: 'free' | 'paid'; locked: boolean; bestPct: number | null }>;
}

// ---------------------------------------------------------------- analytics, revision, practice
export interface TopicStat {
  topicCode: string;
  nameEn: string;
  nameHi: string;
  subjectCode: string | null;
  attempted: number;
  correct: number;
  accuracyPct: number | null;
  avgTimeSec: number | null;
  strength: 'new' | 'weak' | 'ok' | 'strong';
}
export interface Insight {
  kind: 'weak_topic' | 'rushing' | 'negative_marking' | 'get_started' | 'strong';
  topicCode?: string;
  messageEn: string;
  messageHi: string;
  action?: { type: 'practice_topic' | 'take_diagnostic'; topicCode?: string };
}
export interface Analytics {
  rangeDays: number;
  topics: TopicStat[];
  subjects: Array<{ subjectCode: string; nameEn: string; nameHi: string; attempted: number; accuracyPct: number | null }>;
  progress: Array<{ weekStarting: string; avgPct: number; tests: number }>;
  time: { avgSecPerAnswered: number | null; rushedWrongAnswers: number; slowCorrectAnswers: number };
  marks: { testsTaken: number; negativeDeducted: number };
  insights: Insight[];
}
export interface Revision {
  total: number;
  questions: Array<BookmarkedQuestion & { reasons: Array<'wrong' | 'bookmarked'> }>;
}
export type PracticeBody = { source: 'topic'; topicCode: string; count?: number } | { source: 'revision'; count?: number };
export interface OverallLeaderboard {
  period: 'week' | 'month' | 'all';
  total: number;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

// ---------------------------------------------------------------- notifications, doubts, planner
export interface AppNotification {
  id: string;
  kind: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}
export interface NotificationPage {
  items: AppNotification[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
}
export interface DoubtQuota {
  paid: boolean;
  daily: { limit: number; used: number };
  monthly: { limit: number; used: number } | null;
}
export type DoubtStatus = 'open' | 'answered' | 'closed';
export interface DoubtListItem {
  id: string;
  status: DoubtStatus;
  contextType: string;
  topicCode: string | null;
  preview: string;
  messages: number;
  rating: number | null;
  slaDueAt: string;
  answeredAt: string | null;
  createdAt: string;
}
export interface DoubtThread {
  id: string;
  status: DoubtStatus;
  contextType: string;
  contextId: string | null;
  topicCode: string | null;
  rating: number | null;
  reopened: boolean;
  slaDueAt: string;
  firstResponseAt: string | null;
  answeredAt: string | null;
  createdAt: string;
  messages: Array<{ id: string; from: 'student' | 'staff'; text: string; createdAt: string; attachments: Array<{ key: string; url: string }> }>;
}
export interface DoubtCreateBody {
  contextType?: 'question' | 'note' | 'current_affair' | 'free';
  contextId?: string;
  examId?: string;
  topicCode?: string;
  text: string;
  attachmentKeys?: string[];
}
export interface PresignedPost {
  key: string;
  url: string;
  fields: Record<string, string>;
  maxBytes: number;
  expiresInSec: number;
}
export interface PlanTask {
  type: 'study' | 'practice' | 'revision' | 'mock' | 'rest';
  topicCode?: string;
  minutes: number;
  titleEn: string;
  titleHi: string;
}
export interface PlanDay {
  date: string;
  minutes: number;
  tasks: PlanTask[];
}
export interface StudyPlan {
  version: 1;
  generatedAt: string;
  examId: string;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  weeks: Array<{ week: number; startDate: string; phase: 'learn' | 'revise'; focus: Array<{ topicCode: string; nameEn: string; nameHi: string }>; days: PlanDay[]; noteEn?: string; noteHi?: string }>;
  summary: { weeks: number; studyMinutes: number };
}
export interface MentorRequestView {
  id: string;
  examId: string;
  hoursPerDay: number;
  examDate: string | null;
  status: 'open' | 'sent';
  createdAt: string;
  sentAt: string | null;
  /** null until the mentor sends it */
  plan: StudyPlan | null;
}
export interface PlanToday {
  plan: { requestId: string; startDate: string; endDate: string } | null;
  date: string;
  day: PlanDay | null;
}

// ---------------------------------------------------------------- billing
export interface BillingPlan {
  id: string;
  nameEn: string;
  nameHi: string;
  /** rupees per duration in months, e.g. { "3": 399, "12": 999 } */
  prices: Record<string, number>;
  trialDays: number;
  topTier: boolean;
  examIds: string[];
}
export interface Entitlement {
  id: string;
  planId: string;
  startsAt: string;
  endsAt: string;
  source: string;
}
export interface CreatedOrder {
  orderId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
}
export interface OrderRow {
  id: string;
  planId: string;
  planNameEn: string;
  planNameHi: string;
  months: number;
  amountPaise: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  couponCode: string | null;
  createdAt: string;
  paymentStatus: string | null;
  invoiceNumber: string | null;
}
export interface Receipt {
  number: string;
  issuedAt: string;
  customer: { name: string; email: string };
  plan: { id: string; nameEn: string; nameHi: string };
  months: number;
  amountPaise: number;
  currency: string;
  couponCode: string | null;
  paymentId: string | null;
  method: string | null;
  status: string;
}

export interface Subject {
  code: string;
  nameEn: string;
  nameHi: string;
  topics: Array<{ code: string; nameEn: string; nameHi: string; subjectCode: string }>;
}
