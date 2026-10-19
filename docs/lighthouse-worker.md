# SiteScout AI — Lighthouse Audits via URLpipe

Real Lighthouse lab audits are provided by the [URLpipe Lighthouse API](https://urlpipe.dev/lighthouse-api).
SiteScout calls it server-side from the `auditWebsite` / `checkSources` backend
functions; the API key never reaches the browser, logs, or user-visible responses.

## 1. Configuration

Set the app secret `URLPIPE_API_KEY` to your URLpipe bearer token
(create one at <https://urlpipe.dev/auth/sign-up/new> — free, no card).

- **Free tier:** 1,000 credits/month, 2 credits per audit (≈500 audits/month).
  Cache hits and failed requests cost nothing.
- Until the key is set, audits use heuristic server-side checks and are labelled
  as estimates — never as real Lighthouse scores.

## 2. Request (server-side, from `auditWebsite`)

```
POST https://urlpipe.dev/lighthouse
Authorization: Bearer <URLPIPE_API_KEY>
Content-Type: application/json

{ "url": "https://example.com", "device": "mobile", "sync": true, "max_age": "7 days" }
```

- `device: "mobile"` — 360×640 viewport, 4× CPU slowdown, slow 4G.
- `sync: true` — result returned inline (within the 60s sync window).
- `max_age: "7 days"` — repeat audits of the same URL inside 7 days are served
  from URLpipe's cache for **free**, so re-running an audit doesn't burn credits.

If the sync call times out (`504`), the audit keeps running and we poll
`GET /result/:token` (also bearer-authenticated) until it completes.

## 3. Response → SiteScout schema

URLpipe returns category scores (0–1) and lab metrics. `base44/shared/urlpipeAudit.ts`
normalizes categories to 0–100 and maps them to the existing audit schema:

| URLpipe category      | SiteScout field           |
|-----------------------|---------------------------|
| `performance`         | `performance_score`        |
| `accessibility`       | `accessibility_score`      |
| `seo`                 | `seo_score`               |
| `best-practices`      | (best-practices finding)   |

Lab metrics — `largest-contentful-paint` (LCP), `first-contentful-paint` (FCP),
`cumulative-layout-shift` (CLS), `total-blocking-time` (TBT) — are added as
Performance findings with their display values (e.g. "LCP: 3.9 s").

Missing categories/metrics are left `null`, never fabricated.

## 4. Quota & error handling

- **429 `quota_exceeded`** (free tier only): the audit falls back to heuristic
  estimates and a finding notes the quota is exhausted. No error is raised.
- **429 `rate_limited` / `concurrency_limit`**: treated as unavailable → heuristic fallback.
- **401**: invalid key → heuristic fallback with a clear finding.
- **422 / 504-unresolved / network failure**: heuristic fallback.
- The `audit_source` field reports `URLpipe Lighthouse API + server-side checks`
  on success, or `server-side heuristic checks (no Lighthouse API configured)` otherwise.

## 5. Health check (`checkSources`)

URLpipe has no free health endpoint (a real audit costs credits), so `checkSources`
reports `connected` when `URLPIPE_API_KEY` is present and `configuration_required`
otherwise — it does not spend credits to verify the key.