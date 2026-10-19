// URLpipe Lighthouse API integration — replaces the self-hosted Lighthouse worker.
// Server-side only: the API key is never returned, logged, or sent to the client.
// Docs: https://urlpipe.dev/docs/lighthouse
//
// Free tier: 1,000 credits/month, 2 credits per audit (≈500 audits). Cache hits
// and failed requests cost nothing. We send max_age: "7 days" so a repeat audit
// of the same URL inside that window is served from URLpipe's cache for free.

const URLPIPE_ENDPOINT = 'https://urlpipe.dev/lighthouse';
const URLPIPE_RESULT_ENDPOINT = 'https://urlpipe.dev/result/';

export interface MetricInfo {
  displayValue: string;
  numericValue: number | null;
  score: number | null; // 0-1
}

export interface UrlpipeAuditResult {
  available: boolean;
  scores: {
    performance: number | null;
    accessibility: number | null;
    seo: number | null;
    bestPractices: number | null;
  } | null; // 0-100
  metrics: {
    lcp: MetricInfo | null;
    fcp: MetricInfo | null;
    cls: MetricInfo | null;
    tbt: MetricInfo | null;
    speedIndex: MetricInfo | null;
  } | null;
  fromCache: boolean;
  quotaExhausted: boolean;
  error?: string;
}

function normalizeTo100(v: any): number | null {
  if (v == null) return null;
  const n = typeof v === 'object' ? v.score : v;
  if (n == null || typeof n !== 'number' || isNaN(n)) return null;
  // URLpipe category scores are 0-1; tolerate an already-0-100 value.
  return Math.round(n <= 1 ? n * 100 : n);
}

function metricInfo(m: any): MetricInfo | null {
  if (!m || typeof m !== 'object') return null;
  return {
    displayValue: typeof m.displayValue === 'string' ? m.displayValue : '',
    numericValue: typeof m.numericValue === 'number' ? m.numericValue : null,
    score: typeof m.score === 'number' ? m.score : null,
  };
}

function parseResult(data: any) {
  const cats = (data && data.categories) || {};
  const m = (data && data.metrics) || {};
  return {
    scores: {
      performance: normalizeTo100(cats.performance),
      accessibility: normalizeTo100(cats.accessibility),
      seo: normalizeTo100(cats.seo),
      bestPractices: normalizeTo100(cats['best-practices']),
    },
    metrics: {
      lcp: metricInfo(m['largest-contentful-paint']),
      fcp: metricInfo(m['first-contentful-paint']),
      cls: metricInfo(m['cumulative-layout-shift']),
      tbt: metricInfo(m['total-blocking-time']),
      speedIndex: metricInfo(m['speed-index']),
    },
  };
}

function cacheHit(r: Response): boolean {
  return (r.headers.get('X-Cache') || '').toLowerCase() === 'hit';
}

// A sync request that times out (504) keeps running — poll GET /result/:token.
async function pollResult(token: string, apiKey: string): Promise<UrlpipeAuditResult> {
  const maxPolls = 5;
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((res) => setTimeout(res, 3000));
    try {
      const r = await fetch(URLPIPE_RESULT_ENDPOINT + token, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15000),
      });
      const fromCache = cacheHit(r);
      if (r.status === 200) {
        const data = await r.json();
        const parsed = parseResult(data);
        return { available: true, ...parsed, fromCache, quotaExhausted: false };
      }
      if (r.status === 202) continue; // still processing
      if (r.status === 422) {
        const body = await r.json().catch(() => ({}));
        return { available: false, scores: null, metrics: null, fromCache, quotaExhausted: false, error: 'URLpipe audit failed: ' + (body.error || 'analysis error') };
      }
      if (r.status === 401) return { available: false, scores: null, metrics: null, fromCache, quotaExhausted: false, error: 'URLpipe API key invalid' };
      return { available: false, scores: null, metrics: null, fromCache, quotaExhausted: false, error: `URLpipe result unavailable (${r.status})` };
    } catch {
      // transient network error — keep polling
    }
  }
  return { available: false, scores: null, metrics: null, fromCache: false, quotaExhausted: false, error: 'Lighthouse audit still processing' };
}

export async function urlpipeLighthouseAudit(
  url: string,
  apiKey: string | undefined
): Promise<UrlpipeAuditResult> {
  if (!apiKey) {
    return { available: false, scores: null, metrics: null, fromCache: false, quotaExhausted: false, error: 'No URLpipe API key configured' };
  }
  try {
    const r = await fetch(URLPIPE_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, device: 'mobile', sync: true, max_age: '7 days' }),
      signal: AbortSignal.timeout(90000),
    });
    const fromCache = cacheHit(r);

    if (r.status === 504) {
      const body = await r.json().catch(() => ({}));
      if (body.token) {
        const polled = await pollResult(body.token, apiKey);
        return polled.available ? { ...polled, fromCache: polled.fromCache || fromCache } : polled;
      }
      return { available: false, scores: null, metrics: null, fromCache, quotaExhausted: false, error: 'Lighthouse audit timed out' };
    }

    if (r.status === 429) {
      const body = await r.json().catch(() => ({}));
      const quotaExhausted = body.error === 'quota_exceeded';
      return {
        available: false, scores: null, metrics: null, fromCache, quotaExhausted,
        error: quotaExhausted
          ? 'URLpipe free-tier quota exhausted'
          : `URLpipe rate limited${body.retry_after ? ' (retry in ' + body.retry_after + 's)' : ''}`,
      };
    }

    if (r.status === 401) {
      return { available: false, scores: null, metrics: null, fromCache, quotaExhausted: false, error: 'URLpipe API key invalid' };
    }

    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      return { available: false, scores: null, metrics: null, fromCache, quotaExhausted: false, error: `URLpipe error: ${body.error || r.status}` };
    }

    const data = await r.json();
    const parsed = parseResult(data);
    return { available: true, ...parsed, fromCache, quotaExhausted: false };
  } catch (e: any) {
    return { available: false, scores: null, metrics: null, fromCache: false, quotaExhausted: false, error: 'URLpipe request failed: ' + (e?.message || e) };
  }
}