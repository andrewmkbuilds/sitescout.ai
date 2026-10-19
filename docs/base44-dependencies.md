# Base44 dependency map

Every place SiteScout currently depends on the Base44 platform. Each entry must
be replaced to run the app independently. This file is the source of truth for
the migration; `MIGRATION.md` describes how to replace each one.

## 1. SDK client
- `src/api/base44Client.js` — `createClient({ appId, token, ... })` from
  `@base44/sdk`. Every page imports `base44` from here.
- Replace with: a typed API client (axios/fetch) talking to your own
  Next.js route handlers / tRPC server.

## 2. Entities (database) — `base44.entities.<Name>`
Each entity maps to one PostgreSQL/SQLite table (Prisma/Drizzle schema).

| Base44 entity | Replacement table | Notes |
|---|---|---|
| Business | `businesses` | JSON fields → JSONB columns; `verification_checks`, `candidate_domains` → JSONB |
| Lead | `leads` | `stage` enum → PG enum |
| WebsiteAudit | `website_audits` | `findings` → JSONB |
| OutreachDraft | `outreach_drafts` | |
| OutreachActivity | `outreach_activities` | |
| WebsiteConcept | `website_concepts` | `structure` → JSONB |
| PitchTemplate | `pitch_templates` | 53 built-ins seeded from `src/lib/builtinTemplates.js` |
| Campaign | `campaigns` | `target_filters` → JSONB |
| FollowUpTask | `follow_up_tasks` | |
| Note | `notes` | |
| ResearchJob | `research_jobs` | `query`, `counts`, `source_usage` → JSONB |
| IntegrationSetting | `integration_settings` | `config` → JSONB |
| VerificationOverride | `verification_overrides` | |
| SuppressionList | `suppression_list` | |
| AuditLog | `audit_logs` | |
| UsageRecord | `usage_records` | |
| User | `users` | Managed by the auth solution, not hand-rolled |

Built-in record attributes to recreate: `id`, `created_date`, `updated_date`,
`created_by_id` (ownership for RLS).

## 3. Backend functions — `base44.functions.invoke('<name>', ...)`
All require Builder+ on Base44; all become server-side route handlers/API routes.

| Function | Replacement | Free-first implementation |
|---|---|---|
| discoverBusinesses | `POST /api/discover` | `base44/shared/freeSources.ts` → Overpass client (already free) |
| checkSources | `GET /api/sources/health` | probe Overpass/SearXNG/Ollama/URLpipe endpoints |
| verifyBusiness | `POST /api/verify` | heuristic crawler in `base44/shared/verification.ts` |
| startResearch | `POST /api/research` | orchestrates discover + verify, writes `research_jobs` |
| auditWebsite | `POST /api/audit` | `base44/shared/urlpipeAudit.ts` (URLpipe) or self-hosted Lighthouse worker |
| generateOutreach | `POST /api/outreach` | client template engine `src/lib/pitchTemplates.js` (deterministic) or Ollama |
| generateConcept | `POST /api/concepts` | deterministic struct + optional Ollama |
| geocodeLocation | `POST /api/geocode` | OSM Nominatim (free) |
| selfTest | `POST /api/selftest` | smoke-test the above |

## 4. Authentication — `base44.auth.*`
- `me()`, `isAuthenticated()`, `updateMe()`, `logout()`, `inviteUser()`,
  `loginViaEmailPassword`, `loginWithProvider`, `register`, `verifyOtp`,
  `resetPasswordRequest`, `resetPassword`.
- Files: `src/lib/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`,
  `src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`,
  `ResetPassword.jsx`, `src/lib/authMode.js` (anonymous demo flag).
- Replace with: **Auth.js (NextAuth)** or **Lucia** + PostgreSQL session store;
  email/password via credentials provider, optional Google. OAuth account
  linking replaces `loginWithProvider`. `updateMe` → `users` table update.

## 5. Integrations — `base44.integrations.Core.*`
| Integration | Replacement |
|---|---|
| `InvokeLLM` | Ollama (`/api/generate`) — see `freeSources.ollamaGenerate` |
| `UploadPrivateFile` / `UploadPublicFile` | S3-compatible (MinIO) or local FS + signed URLs |
| `CreateFileSignedUrl` | MinIO presigned URL or a signed-URL endpoint |
| `SendEmail` | self-hosted SMTP (e.g. Postal) or free-tier Resend; outreach is logged manually today |
| `GenerateImage` / `GenerateSpeech` / `GenerateVideo` | optional; not used by core flows |
| `ExtractDataFromUploadedFile` | CSV/JSON parse in the route handler |
| `TranscribeAudio` | optional; not used |

## 6. Realtime — `base44.entities.<Name>.subscribe`
- Replace with: Postgres LISTEN/NOTIFY, Supabase realtime, or a WebSocket /
  SSE endpoint. Currently unused by any core flow.

## 7. Row-level security
- Base44 `rls` rules in each `base44/entities/*.jsonc` (currently disabled for
  anonymous demo — see `src/lib/authMode.js`).
- Replace with: Prisma/Drizzle row-level policies or middleware that filters by
  `created_by_id = session.user.id` (and tenant id if multi-tenant).

## 8. Hosting / build
- Vite + React SPA served by Base44 → Next.js (App Router) on any Node host or
  Docker. `src/App.jsx` routes → `app/` directory routes. `tailwind.config.js`
  and `src/index.css` move as-is.

## 9. Analytics
- `base44.analytics.track` → PostHog (open-source, self-hostable) or a simple
  `analytics_events` table.

## 10. Secrets
- Dashboard Secrets → `.env` / docker-compose env vars (see `src/lib/env.js`
  for the full registry). All are free or self-hosted; none require payment.