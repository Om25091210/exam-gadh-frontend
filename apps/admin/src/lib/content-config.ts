import type { FieldSpec } from '@/components/schema-form';

export interface RefOptions {
  exams: Array<[string, string]>;
  subjects: Array<[string, string]>;
  topics: Array<[string, string]>;
}

export interface EntityUi {
  /** API path segment and URL segment */
  path: string;
  title: string;
  singular: string;
  intro?: string;
  idField: 'id' | 'key';
  writePermission: string;
  /** how drafts/publishing work: a status column, a published flag, or none */
  workflow: 'status' | 'published' | null;
  defaults: Record<string, unknown>;
  /** columns in the list (the first links to the editor) */
  columns: Array<{ key: string; header: string }>;
  searchHint: string;
  fields: (r: RefOptions) => FieldSpec[];
}

const status = (): FieldSpec => ({ key: 'status', label: 'Status', type: 'select', required: true, options: [['draft', 'Draft'], ['in_review', 'In review'], ['published', 'Published'], ['archived', 'Archived']], hint: 'Publishing needs publish permission' });
const access = (): FieldSpec => ({ key: 'access', label: 'Access', type: 'select', required: true, options: [['free', 'Free'], ['paid', 'Paid']] });
const publishAt = (): FieldSpec => ({ key: 'publishAt', label: 'Publish at', type: 'datetime', hint: 'Empty = as soon as it is published' });
const exam = (r: RefOptions, required = false): FieldSpec => ({ key: 'examId', label: 'Exam', type: 'select', required, nullable: !required, options: r.exams });

export const ENTITIES: Record<string, EntityUi> = {
  materials: {
    path: 'materials', title: 'Study material', singular: 'material', idField: 'id', writePermission: 'content:write', workflow: 'status',
    defaults: { kind: 'pdf', access: 'free', status: 'draft', sort: 0 },
    columns: [{ key: 'titleEn', header: 'Title' }, { key: 'kind', header: 'Kind' }, { key: 'access', header: 'Access' }, { key: 'state', header: 'State' }],
    searchHint: 'Search by title',
    fields: (r) => [
      { key: 'titleEn', label: 'Title (English)', type: 'text', required: true },
      { key: 'titleHi', label: 'Title (Hindi)', type: 'text', required: true, lang: 'hi' },
      { key: 'kind', label: 'Kind', type: 'select', required: true, options: [['pdf', 'PDF file'], ['video', 'Video link'], ['link', 'Web link']] },
      { key: 'fileKey', label: 'PDF file', type: 'upload', purpose: 'material-pdf', accept: 'application/pdf', required: true, when: (v) => v.kind === 'pdf', hint: 'PDF up to 25 MB. Students get a private, expiring link.' },
      { key: 'url', label: 'Address (https://…)', type: 'url', required: true, when: (v) => v.kind !== 'pdf' },
      exam(r), { key: 'subjectCode', label: 'Subject', type: 'select', nullable: true, options: r.subjects }, { key: 'topicCode', label: 'Topic', type: 'select', nullable: true, options: r.topics },
      access(), status(), publishAt(), { key: 'sort', label: 'Order', type: 'number' },
    ],
  },
  'current-affairs': {
    path: 'current-affairs', title: 'Current affairs', singular: 'item', idField: 'id', writePermission: 'content:write', workflow: 'status',
    defaults: { category: 'CG', access: 'free', status: 'draft', tags: [] },
    columns: [{ key: 'date', header: 'Date' }, { key: 'titleEn', header: 'Headline' }, { key: 'category', header: 'Category' }, { key: 'state', header: 'State' }],
    searchHint: 'Search by headline',
    fields: (r) => [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'category', label: 'Category', type: 'select', required: true, options: [['CG', 'Chhattisgarh'], ['NAT', 'National']] },
      { key: 'titleEn', label: 'Headline (English)', type: 'text', required: true },
      { key: 'titleHi', label: 'Headline (Hindi)', type: 'text', required: true, lang: 'hi' },
      { key: 'summaryEn', label: 'Summary (English)', type: 'rich', required: true, rows: 5, lang: 'en' },
      { key: 'summaryHi', label: 'Summary (Hindi)', type: 'rich', required: true, rows: 5, lang: 'hi' },
      { key: 'angleEn', label: 'Exam angle (English)', type: 'rich', rows: 3, lang: 'en', hint: 'Why this matters for the exam' },
      { key: 'angleHi', label: 'Exam angle (Hindi)', type: 'rich', rows: 3, lang: 'hi' },
      { key: 'topicCode', label: 'Topic', type: 'select', nullable: true, options: r.topics },
      { key: 'tags', label: 'Tags', type: 'tags' },
      { key: 'sourceUrl', label: 'Source link (https://…)', type: 'url' },
      { key: 'imageKey', label: 'Image', type: 'upload', purpose: 'ca-image', accept: 'image/png,image/jpeg,image/webp' },
      { key: 'quizTestId', label: 'Quiz test id (optional)', type: 'text', hint: 'Paste the id of a published test from its address' },
      access(), status(), publishAt(),
    ],
  },
  announcements: {
    path: 'announcements', title: 'Announcements', singular: 'announcement', idField: 'id', writePermission: 'announcements:write', workflow: 'status',
    defaults: { kind: 'update', pinned: false, status: 'draft' },
    columns: [{ key: 'titleEn', header: 'Title' }, { key: 'kind', header: 'Kind' }, { key: 'pinned', header: 'Pinned' }, { key: 'state', header: 'State' }],
    searchHint: 'Search by title',
    fields: (r) => [
      { key: 'kind', label: 'Kind', type: 'select', required: true, options: [['update', 'Update'], ['banner', 'Banner'], ['alert', 'Alert']] },
      exam(r),
      { key: 'titleEn', label: 'Title (English)', type: 'text', required: true },
      { key: 'titleHi', label: 'Title (Hindi)', type: 'text', required: true, lang: 'hi' },
      { key: 'bodyEn', label: 'Message (English)', type: 'textarea', required: true, rows: 3 },
      { key: 'bodyHi', label: 'Message (Hindi)', type: 'textarea', required: true, rows: 3, lang: 'hi' },
      { key: 'linkUrl', label: 'Link (https://…)', type: 'url' },
      { key: 'pinned', label: 'Pin to the top', type: 'checkbox' },
      status(), publishAt(), { key: 'expiresAt', label: 'Hide after', type: 'datetime' },
    ],
  },
  calendar: {
    path: 'calendar', title: 'Exam calendar', singular: 'date', idField: 'id', writePermission: 'content:write', workflow: null,
    defaults: { stage: 'prelims' },
    columns: [{ key: 'date', header: 'Date' }, { key: 'labelEn', header: 'Event' }, { key: 'examId', header: 'Exam' }, { key: 'stage', header: 'Stage' }],
    searchHint: 'Search by event',
    fields: (r) => [exam(r, true), { key: 'stage', label: 'Stage', type: 'select', required: true, options: [['prelims', 'Prelims'], ['mains', 'Mains'], ['interview', 'Interview']] }, { key: 'labelEn', label: 'Event (English)', type: 'text', required: true }, { key: 'labelHi', label: 'Event (Hindi)', type: 'text', required: true, lang: 'hi' }, { key: 'date', label: 'Date', type: 'date', required: true }, { key: 'sourceUrl', label: 'Official source (https://…)', type: 'url', hint: 'Always link the official notification' }],
  },
  faqs: {
    path: 'faqs', title: 'FAQs', singular: 'FAQ', idField: 'id', writePermission: 'content:write', workflow: null, defaults: {},
    columns: [{ key: 'qEn', header: 'Question' }, { key: 'keywords', header: 'Keywords' }],
    searchHint: 'Search by question or keyword',
    fields: () => [{ key: 'qEn', label: 'Question (English)', type: 'text', required: true }, { key: 'qHi', label: 'Question (Hindi)', type: 'text', required: true, lang: 'hi' }, { key: 'aEn', label: 'Answer (English)', type: 'textarea', required: true, rows: 3 }, { key: 'aHi', label: 'Answer (Hindi)', type: 'textarea', required: true, rows: 3, lang: 'hi' }, { key: 'keywords', label: 'Keywords', type: 'text', required: true, hint: 'Words students might type, used to suggest this answer before they ask a doubt' }],
  },
  interview: {
    path: 'interview', title: 'Interview questions', singular: 'question', idField: 'id', writePermission: 'content:write', workflow: null, defaults: {},
    columns: [{ key: 'qEn', header: 'Question' }, { key: 'category', header: 'Category' }, { key: 'examId', header: 'Exam' }],
    searchHint: 'Search by question',
    fields: (r) => [exam(r, true), { key: 'category', label: 'Category', type: 'text', required: true, hint: 'e.g. Personal, Current affairs, Chhattisgarh' }, { key: 'qEn', label: 'Question (English)', type: 'text', required: true }, { key: 'qHi', label: 'Question (Hindi)', type: 'text', required: true, lang: 'hi' }, { key: 'pointsEn', label: 'Points to cover (English)', type: 'textarea', required: true, rows: 4 }, { key: 'pointsHi', label: 'Points to cover (Hindi)', type: 'textarea', required: true, rows: 4, lang: 'hi' }],
  },
  'canned-replies': {
    path: 'canned-replies', title: 'Canned replies', singular: 'reply', idField: 'id', writePermission: 'doubts:answer', workflow: null, defaults: {},
    intro: 'Ready-made answers teachers can insert when replying to a doubt.',
    columns: [{ key: 'title', header: 'Title' }],
    searchHint: 'Search by title',
    fields: () => [{ key: 'title', label: 'Title', type: 'text', required: true }, { key: 'bodyEn', label: 'Reply (English)', type: 'textarea', required: true, rows: 4 }, { key: 'bodyHi', label: 'Reply (Hindi)', type: 'textarea', required: true, rows: 4, lang: 'hi' }],
  },
  'notification-templates': {
    path: 'notification-templates', title: 'Notification templates', singular: 'template', idField: 'key', writePermission: 'announcements:write', workflow: null, defaults: {},
    intro: 'Wording of in-app notifications. Keys: result_ready, live_test, doubt_answered, announcement, plan_expiring, study_plan_ready. Placeholders look like {{title}}. A template here replaces the built-in wording.',
    columns: [{ key: 'key', header: 'Key' }, { key: 'titleEn', header: 'Title' }],
    searchHint: 'Search by key or title',
    fields: () => [{ key: 'key', label: 'Key', type: 'text', required: true, createOnly: true, hint: 'Lower-case letters, digits, _ and .' }, { key: 'titleEn', label: 'Title (English)', type: 'text', required: true }, { key: 'titleHi', label: 'Title (Hindi)', type: 'text', required: true, lang: 'hi' }, { key: 'bodyEn', label: 'Message (English)', type: 'textarea', required: true, rows: 3 }, { key: 'bodyHi', label: 'Message (Hindi)', type: 'textarea', required: true, rows: 3, lang: 'hi' }],
  },
};

/** Moves a student-facing item can make, given where it stands. */
export function workflowMoves(state: string | undefined, workflow: 'status' | 'published'): Array<{ to: 'draft' | 'in_review' | 'published' | 'archived'; label: string; publisher: boolean }> {
  if (workflow === 'published') return state === 'live' ? [{ to: 'draft', label: 'Unpublish', publisher: true }] : [{ to: 'published', label: 'Publish', publisher: true }];
  switch (state) {
    case 'draft': return [{ to: 'in_review', label: 'Submit for review', publisher: false }, { to: 'published', label: 'Publish', publisher: true }];
    case 'in_review': return [{ to: 'published', label: 'Publish', publisher: true }, { to: 'draft', label: 'Back to draft', publisher: false }];
    case 'live': case 'scheduled': case 'expired': return [{ to: 'draft', label: 'Unpublish', publisher: true }, { to: 'archived', label: 'Archive', publisher: true }];
    case 'archived': return [{ to: 'draft', label: 'Restore as draft', publisher: false }];
    default: return [];
  }
}
