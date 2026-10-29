# exam-gadh-frontend — project map for Claude

pnpm monorepo (Node 22, pnpm pinned by `packageManager`). Student web app + admin web app on Next.js 15 (App Router),
Tailwind v4, TanStack Query. Backend: `exam-gadh-backend` (NestJS; contract in its `openapi.json` + `src/modules/**`).
Requirements and decisions: `exam-gadh-docs/docs` (REQUIREMENTS_CHECKLIST, DECISIONS, BLOCKERS).

## Commands
```
pnpm install
pnpm dev:web      # student app on :3000 (needs API_URL, default http://localhost:4000)
pnpm dev:admin    # admin app on :3001
pnpm verify       # lint + typecheck + test + build (run before every commit)
```

## Layout
```
packages/i18n   Hindi/English dictionaries (same keys enforced by a test), I18nProvider, bi() for bilingual backend fields
packages/api    typed fetch client (refresh-on-401, error codes), student + admin endpoint functions and response types
packages/ui     design tokens (theme.css), accessible components, RichText ([b][i][sub][sup] -> elements, never HTML)
apps/web        student app: src/app/(public)/login, src/app/(app)/* (shell), src/app/(exam)/attempt/[id] (exam hall)
apps/admin      admin app
```

## Rules that matter
- Hindi is the default language; every user-visible string goes through `t()` / `b()`; add keys to BOTH `en.ts` and `hi.ts`.
- The browser only talks to its own origin: `next.config.ts` rewrites `/v1/*` to `API_URL` (no CORS).
- Student auth: the refresh token is an httpOnly cookie set by `app/api/session/*`; JS holds only the 15-min access token in memory
  (`lib/session-client.ts`). Tabs refresh one at a time (Web Lock + BroadcastChannel): a refresh token is single-use.
- Answer keys never reach the client before the result is released; do not cache or log attempt payloads.
- Question text uses `<RichText>`; `dangerouslySetInnerHTML` is banned by lint.
- Server time is authoritative in the exam hall; the client clock is only used for display between syncs.
- Backend error `code` strings are the contract; never match on `message`.
