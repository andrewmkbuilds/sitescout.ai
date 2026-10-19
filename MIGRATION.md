# SiteScout — Open-source migration guide

This document specifies how to move SiteScout off the Base44 platform onto a
fully self-hostable, free-first open-source stack without losing features or
data. It is a plan, not a claim: the app is **not** independently self-hostable
until every item in §6 is verified.

## Target stack
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SSR, route handlers replace backend functions, same React/Tailwind UI |
| Database | **PostgreSQL** (or SQLite for single-user) | Maps 1:1 to Base44 entities; JSONB for nested fields |
| ORM | **Prisma** | Schema-first, migrations, typed queries |
| Auth | **Auth.js (NextAuth) v5** or **Lucia** | Open-source; email/password + Google OAuth; session in Postgres |
| AI | **Ollama** (local) | Free; deterministic templates remain the default fallback |
| Web search | **SearXNG** (self-hosted) | Open-source metasearch; no API key |
| Business discovery | **OpenStreetMap / Overpass** | Free, open data; client already in `base44/shared/freeSources.ts` |
| Website audit | **Self-hosted Lighthouse worker** (or URLpipe free tier) | Open-source Lighthouse in headless Chromium |
| Geocoding | **OSM Nominatim** | Free |
| File storage | **MinIO** (S3-compatible) | Self-hosted; presigned URLs replace Base44 signed URLs |
| Email | **Postal** (self-hosted SMTP) or free-tier Resend | Outreach is logged manually; no paid sending today |
| Container | **Docker Compose** | One command to run app + Postgres + Ollama + SearXNG + MinIO + Lighthouse worker |
| Analytics | **PostHog** (self-hosted) or local `analytics_events` table | Open-source |

## 1. Entity → table mapping
See `docs/base44-dependencies.md` §2 for the full table list. Prisma schema
sketch:

```prisma
model Business {
  id              String   @id @default(cuid())
  createdDate     DateTime @default(now()) @map("created_date")
  updatedDate     DateTime @updatedAt @map("updated_date")
  createdById     String   @map("created_by_id")
  name            String
  industry        String?
  city            String?
  websiteUrl      String?  @map("website_url")
  websiteStatus   String?  @map("website_status")
  websiteQualityScore Float? @map("website_quality_score")
  opportunityScore Float?  @map("opportunity_score")
  confidence      Float?
  prospectScores  Json?    @map("prospect_scores")
  verificationChecks Json? @map("verification_checks")
  candidateDomains  Json?  @map("candidate_domains")
  // ...remaining fields
  @@map("businesses")
}
```
Recreate built-in attributes: `id`, `created_date`, `updated_date`,
`created_by_id`. Seed the 53 outreach templates from
`src/lib/builtinTemplates.js` via a Prisma seed script.

## 2. Backend function → route handler mapping
See `docs/base44-dependencies.md` §3. Each `base44/functions/<name>/entry.ts`
becomes `app/api/<name>/route.ts`. The free-first logic already exists in
`base44/shared/` (`freeSources.ts`, `verification.ts`, `urlpipeAudit.ts`) and
moves verbatim — only the SDK calls (`base44.entities.*`,
`base44.integrations.*`) change to Prisma + fetch.

Example:
```ts
// app/api/discover/route.ts
import { overpassSearch } from '@/lib/freeSources';
export async function POST(req: Request) {
  const params = await req.json();
  const { rows, error, endpoint } = await overpassSearch(params);
  return Response.json({ rows, error, endpoint });
}
```

## 3. Auth flow mapping
| Base44 | Replacement |
|---|---|
| `loginViaEmailPassword` | Auth.js credentials provider |
| `loginWithProvider('google')` | Auth.js Google provider |
| `register` + `verifyOtp` | credentials provider + e-mail verification (Resend/Postal) |
| `resetPasswordRequest` / `resetPassword` | Auth.js `forgotPassword` flow + token table |
| `base44.auth.me()` | `auth()` server helper / `useSession()` client |
| `ProtectedRoute` | Next.js middleware `matcher` |
| `AUTH_ENABLED` demo flag | remove; restore RLS in §4 |
| `inviteUser` | `users` insert + invite e-mail |

## 4. Row-level security
Re-enable the ownership rules currently disabled for anonymous demo
(`src/lib/authMode.js`). In Prisma, enforce via a `whereCreatedById`
middleware/extension that appends `createdById: session.user.id` to every
list/filter/update/delete, plus a tenant column if multi-tenant.

## 5. Frontend portability
- `src/lib/providers/*` already defines the swap surface. Re-implement each
  provider against Prisma/Auth.js/MinIO/Ollama; pages keep their imports.
- Replace `@/api/base44Client` imports with `@/lib/providers` throughout.
- `react-router-dom` routes in `src/App.jsx` → Next.js `app/` file routes.
- `tailwind.config.js`, `src/index.css`, `src/components/ui/*` move unchanged.

## 6. Docker Compose
```yaml
version: "3.9"
services:
  app:        { build: ., env_file: .env, ports: ["3000:3000"], depends_on: [postgres, ollama, searxng, minio] }
  postgres:   { image: postgres:16, volumes: ["pgdata:/var/lib/postgresql/data"], env: { POSTGRES_PASSWORD: sitescout } }
  ollama:     { image: ollama/ollama, ports: ["11434:11434"], volumes: ["ollama:/root/.ollama"] }
  searxng:    { image: searxng/searxng, ports: ["8080:8080"] }
  minio:      { image: minio/minio, command: server /data --console-address ":9001", ports: ["9000:9000","9001:9001"], volumes: ["minio:/data"] }
  lighthouse: { image: sitespeed/node:latest, ... } # or a custom Lighthouse worker
volumes: { pgdata: {}, ollama: {}, minio: {} }
```
Environment (all free / self-hosted — see `src/lib/env.js`):
```
OVERPASS_ENDPOINT=https://overpass-api.de/api/interpreter
SEARXNG_URL=http://searxng:8080
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2
URLPIPE_API_KEY=        # optional; leave blank to use the self-hosted Lighthouse worker
DATABASE_URL=postgresql://postgres:sitescout@postgres:5432/sitescout
AUTH_SECRET=<generate>
```

## 7. Verification checklist (must all pass before claiming self-hosted)
- [ ] `docker compose up` starts app + Postgres + Ollama + SearXNG + Minio.
- [ ] Prisma migrate + seed (53 templates) succeeds.
- [ ] Register → verify e-mail → login works (Auth.js).
- [ ] Discover returns real OSM businesses for a city + a lat/lon radius.
- [ ] Five-check verification classifies a no-website and a live business.
- [ ] Audit runs via the self-hosted Lighthouse worker and saves a report.
- [ ] Outreach draft generated from the deterministic engine (no AI cost).
- [ ] Ollama outreach generation works when `OLLAMA_URL` is set.
- [ ] RLS: user A cannot read user B's leads.
- [ ] CSV import + export round-trips.
- [ ] No paid API key is required for any default workflow.

## 8. Remaining costs & blockers (current state)
- **Backend functions** (discover, audit, outreach, concept, verify, research,
  checkSources, geocode, selfTest) require a Base44 **Builder+** plan to run
  from this app today. Confirmed restriction, not assumed.
- **App visibility** is currently anonymous-demo; restoring auth requires
  flipping `AUTH_ENABLED` in `src/lib/authMode.js` and re-adding RLS.
- **Live discovery/audits** from the in-app UI are unavailable until the plan
  upgrade; the free client functions in `base44/shared/freeSources.ts` still
  work from the server sandbox and after migration.
- **No paid API is required** anywhere in the default stack; URLpipe is an
  optional free-tier convenience, replaced by the self-hosted Lighthouse worker.