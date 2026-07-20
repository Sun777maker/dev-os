# ContractIQ — Security Plan
**Version:** 1.0 · 2026-07-19

---

## Issues Found and Fixed

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | No rate limiting on any endpoint | Critical | Supabase sliding-window rate limiter via `rate_limit_events` table + service-role client |
| 2 | No prompt injection protection | Critical | `sanitizeForLLM()` in `lib/security/promptInjectionGuard.ts` — blocks 20 patterns before AI call |
| 3 | File upload: no extension blocklist or MIME/extension agreement check | High | `validateFileUpload()` in `lib/security/inputValidator.ts` — blocklist → allowlist → MIME → size |
| 4 | Chat allowed on non-`processed` contracts | High | `verifyContractForChat()` checks status === 'processed' before any DB/AI work |
| 5 | No request body schema validation (Zod) | High | Zod schemas on all mutating routes; invalid requests rejected 422 before business logic |
| 6 | UUID path params not validated | Medium | `isValidUUID()` guard at top of every route that takes `params.id` / `params.termId` |
| 7 | Chat message length unbounded | Medium | `chatMessageSchema` enforces max 5,000 characters |
| 8 | Feedback comment length unbounded | Medium | `feedbackSchema` enforces max 1,000 characters |
| 9 | No server-side auth routes | Medium | `POST /api/auth/login` and `POST /api/auth/logout` — cookies set server-side via `createClient()` |
| 10 | No `createAdminClient` (service role) | Medium | `lib/supabase/admin.ts` — used exclusively by rate limiter |
| 11 | `pdf.worker.min.mjs` ran through session middleware | Low | Added `.mjs` to middleware matcher exclusion list |
| 12 | No `.env.example` | Low | `.env.example` created with all variables documented and grouped by visibility |
| 13 | `MAX_CHAT_HISTORY` hardcoded | Low | Configurable via `MAX_CHAT_HISTORY` env var; constant in `tokenLimiter.ts` |

---

## Controls Implemented

### Authentication & Protected Routes
Supabase Auth with email/password. All protected routes are covered by `middleware.ts` → `updateSession()` from `@supabase/ssr`, which:
- Refreshes the session on every request
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` and `/signup` to `/dashboard`

`requireAuth()` in `lib/security/authGuard.ts` provides a single-call pattern for API routes that returns either the verified `User` or a 401 `NextResponse`.

### Rate Limiting
Sliding-window rate limiting using Supabase. All reads/writes use `createAdminClient()` (service role) so users cannot manipulate their own event counts.

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/contracts/upload` | 20 requests | 24 hours |
| `POST /api/contracts/[id]/process` | 5 requests | 1 hour |
| `POST /api/contracts/[id]/chat` | 30 requests | 1 minute |

Returns `429 RATE_LIMITED` with `Retry-After` header.

SQL to run: `supabase/rls-policies.sql` (creates `rate_limit_events` table).

### Prompt Injection Protection
`sanitizeForLLM()` in `lib/security/promptInjectionGuard.ts` tests every user chat message against 20 regex patterns covering:
- Instruction overrides ("ignore previous instructions", "override your rules")
- System prompt extraction ("reveal system prompt", "print your instructions")
- Credential exposure ("expose env variables", "show API keys")
- Role hijacking ("you are now a", "act as", "pretend you are")
- Jailbreak modes ("DAN mode", "developer mode", "sudo mode")

Returns `400 PROMPT_INJECTION` if any pattern matches. The AI is never called.

### Zod Request Validation
All mutating API routes validate request bodies with Zod before touching any business logic or database. Invalid requests return `422 VALIDATION_ERROR` with the first failing field message.

| Schema | Used by |
|---|---|
| `chatMessageSchema` | `POST /api/contracts/[id]/chat` |
| `termUpdateSchema` | `PATCH /api/contracts/[id]/terms/[termId]` |
| `feedbackSchema` | `POST /api/feedback` |
| `loginSchema` (inline) | `POST /api/auth/login` |

### File Upload Security
`validateFileUpload()` in `lib/security/inputValidator.ts` enforces three layers before the buffer is read:

1. **Extension blocklist** — `.exe`, `.js`, `.mjs`, `.cjs`, `.php`, `.zip`, `.sh`, `.bat`, `.cmd`, `.py`, `.rb`, `.ps1` are rejected immediately
2. **Extension allowlist** — only `.pdf` and `.docx` pass
3. **MIME type agreement** — must be `application/pdf` or the DOCX MIME type
4. **Size limit** — 10 MB (matches storage bucket)

The Supabase storage bucket is private. Signed URLs are generated server-side with a 1-hour expiry. Public URLs are never returned.

### Chat Security
`verifyContractForChat()` in `lib/security/chatSecurity.ts` performs three checks in a single DB round-trip:
1. Contract exists
2. `contract.user_id === auth.uid()`
3. `contract.status === 'processed'`

Returns `404 CONTRACT_NOT_FOUND` or `422 INVALID_STATUS` on failure.

### Token & Usage Limits
Constants in `lib/security/tokenLimiter.ts`:

| Limit | Value | Configured by |
|---|---|---|
| Max file size | 10 MB | Hardcoded (matches bucket) |
| Max page count | 200 | Hardcoded |
| Max message length | 5,000 chars | Zod schema |
| Max chat history to model | 100 messages | `MAX_CHAT_HISTORY` env var |

### Environment Variable Security
| Variable | Visibility | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser) | Supabase client, SSR client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser) | Supabase client, SSR client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | `createAdminClient()` only |
| `OPENAI_API_KEY` | Server-only | `extraction-client.ts`, `chat-client.ts` |
| `MAX_CHAT_HISTORY` | Server-only | `tokenLimiter.ts` |

---

## Files Created

| File | Purpose |
|---|---|
| `lib/security/authGuard.ts` | `requireAuth()` — verifies session, returns user or 401 |
| `lib/security/rateLimiter.ts` | Sliding-window rate limiting via Supabase |
| `lib/security/promptInjectionGuard.ts` | `sanitizeForLLM()` — 20-pattern injection detector |
| `lib/security/tokenLimiter.ts` | Limits constants + validators |
| `lib/security/chatSecurity.ts` | `verifyContractForChat()` and `verifySessionOwnership()` |
| `lib/security/inputValidator.ts` | `validateFileUpload()`, `isValidUUID()`, Zod schemas |
| `lib/supabase/admin.ts` | `createAdminClient()` — service-role Supabase client |
| `app/api/auth/login/route.ts` | Server-side login (sets cookies correctly) |
| `app/api/auth/logout/route.ts` | Server-side logout |
| `supabase/rls-policies.sql` | `rate_limit_events` table + all RLS policies |
| `.env.example` | All environment variables documented |

## Files Modified

| File | Change |
|---|---|
| `app/api/contracts/upload/route.ts` | Added `requireAuth`, rate limit, `validateFileUpload` |
| `app/api/contracts/[id]/process/route.ts` | Added `requireAuth`, UUID check, rate limit |
| `app/api/contracts/[id]/route.ts` | Added `requireAuth`, UUID check |
| `app/api/contracts/[id]/chat/route.ts` | Added `requireAuth`, UUID check, rate limit, Zod, injection guard, status check |
| `app/api/contracts/[id]/terms/[termId]/route.ts` | Added `requireAuth`, UUID checks, Zod |
| `app/api/feedback/route.ts` | Added `requireAuth`, Zod (comment length capped at 1,000 chars) |
| `lib/utils/error-codes.ts` | Added `RATE_LIMITED`, `PROMPT_INJECTION`, `VALIDATION_ERROR`, `INVALID_STATUS` |
| `middleware.ts` | Excluded `.mjs` files from session middleware |

---

## SQL to Run in Supabase

Run `supabase/rls-policies.sql` in the Supabase SQL Editor. This creates:
- `rate_limit_events` table with index and RLS enabled (no user-facing policies)
- Idempotent RLS policies for all 6 application tables

## Environment Variables to Add to `.env.local`

All variables are already in `.env.example`. Ensure these are set before running the app:
- `SUPABASE_SERVICE_ROLE_KEY` — required for rate limiting
- `MAX_CHAT_HISTORY` — optional, defaults to 100
