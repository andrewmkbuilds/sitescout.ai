import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { logUsage } from '../../shared/freeSources.ts';
import { urlpipeLighthouseAudit } from '../../shared/urlpipeAudit.ts';

const BLOCKED_HOSTS = ['localhost', '0.0.0.0', 'metadata.google.internal', '169.254.169.254'];
function isBlockedHost(host: string) {
  const h = host.toLowerCase();
  if (BLOCKED_HOSTS.includes(h)) return true;
  if (h === '127.0.0.1' || h.startsWith('127.')) return true;
  if (h.startsWith('10.') || h.startsWith('192.168.')) return true;
  if (h.startsWith('172.')) {
    const n = parseInt(h.split('.')[1], 10);
    if (n >= 16 && n <= 31) return true;
  }
  if (h.endsWith('.internal') || h.endsWith('.local')) return true;
  return false;
}
function normalizeUrl(raw: string) {
  if (!raw) return null;
  let u = String(raw).trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const url = new URL(u);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (isBlockedHost(url.hostname)) return null;
    return url;
  } catch { return null; }
}
function scoreFrom(passed: number, total: number) {
  if (!total) return 0;
  return Math.round((passed / total) * 100);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // auth disabled (anonymous demo mode)
    // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 }); // re-enable to restore auth

    const body = await req.json().catch(() => ({}));
    const url = normalizeUrl(body.url);
    if (!url) return Response.json({ error: 'Invalid or blocked URL' }, { status: 400 });

    const findings = [];
    let html = '';
    let fetchOk = false;
    let finalUrl = url;
    let redirectNote = '';

    // Heuristic server-side fetch (always runs — free, no external dependency)
    try {
      const r = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15000),
        redirect: 'manual',
        headers: { 'User-Agent': 'SiteScoutAI-Audit/1.0' },
      });
      const status = r.status;
      if (status >= 300 && status < 400 && r.headers.get('location')) {
        const loc = new URL(r.headers.get('location'), url);
        if (isBlockedHost(loc.hostname)) {
          findings.push({ category: 'Security', check: 'Redirect target', status: 'fail', severity: 'high', message: 'Redirects to a blocked/internal host', recommendation: 'Fix redirect destination' });
        } else {
          redirectNote = `Redirects to ${loc.hostname}`;
          finalUrl = loc;
          const r2 = await fetch(loc.toString(), { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'SiteScoutAI-Audit/1.0' } });
          html = await r2.text();
          fetchOk = r2.ok;
        }
      } else if (status >= 400) {
        findings.push({ category: 'Performance', check: 'HTTP status', status: 'fail', severity: 'high', message: `Server returned HTTP ${status}`, recommendation: 'Fix server errors' });
      } else {
        html = await r.text();
        fetchOk = r.ok;
      }
    } catch (e: any) {
      findings.push({ category: 'Performance', check: 'Reachability', status: 'fail', severity: 'high', message: 'Could not reach the website: ' + e.message, recommendation: 'Verify the site is online' });
    }

    const https = finalUrl.protocol === 'https:';
    if (!https) findings.push({ category: 'Security', check: 'HTTPS', status: 'fail', severity: 'high', message: 'Site is not served over HTTPS', recommendation: 'Install an SSL certificate and enforce HTTPS' });
    else findings.push({ category: 'Security', check: 'HTTPS', status: 'pass', severity: 'low', message: 'Site is served over HTTPS', recommendation: '' });
    if (redirectNote) findings.push({ category: 'Performance', check: 'Redirects', status: 'warning', severity: 'medium', message: redirectNote, recommendation: 'Minimize redirects for performance' });

    if (fetchOk && html) {
      const lower = html.toLowerCase();
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      if (!title) findings.push({ category: 'SEO', check: 'Page title', status: 'fail', severity: 'high', message: 'Missing page title', recommendation: 'Add a descriptive <title> tag' });
      else if (title.length < 10) findings.push({ category: 'SEO', check: 'Page title', status: 'warning', severity: 'medium', message: `Short title: "${title}"`, recommendation: 'Use a title of 30-60 characters' });
      else findings.push({ category: 'SEO', check: 'Page title', status: 'pass', severity: 'low', message: `Title present: "${title}"`, recommendation: '' });

      const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
      if (!metaDesc) findings.push({ category: 'SEO', check: 'Meta description', status: 'fail', severity: 'medium', message: 'Missing meta description', recommendation: 'Add a meta description of 120-160 characters' });
      else findings.push({ category: 'SEO', check: 'Meta description', status: 'pass', severity: 'low', message: 'Meta description present', recommendation: '' });

      const h1Count = (html.match(/<h1[^>]*>/ig) || []).length;
      if (h1Count === 0) findings.push({ category: 'SEO', check: 'Heading structure', status: 'warning', severity: 'medium', message: 'No H1 heading found', recommendation: 'Add a single descriptive H1' });
      else if (h1Count > 1) findings.push({ category: 'SEO', check: 'Heading structure', status: 'warning', severity: 'low', message: `${h1Count} H1 headings found`, recommendation: 'Use one H1 per page' });
      else findings.push({ category: 'SEO', check: 'Heading structure', status: 'pass', severity: 'low', message: 'Single H1 present', recommendation: '' });

      const canonical = /<link[^>]+rel=["']canonical["']/i.test(html);
      if (!canonical) findings.push({ category: 'SEO', check: 'Canonical URL', status: 'warning', severity: 'low', message: 'No canonical link tag', recommendation: 'Add a canonical link to avoid duplicate-content issues' });
      else findings.push({ category: 'SEO', check: 'Canonical URL', status: 'pass', severity: 'low', message: 'Canonical tag present', recommendation: '' });

      const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
      if (!viewport) findings.push({ category: 'Mobile', check: 'Viewport config', status: 'fail', severity: 'high', message: 'Missing viewport meta tag — not mobile-friendly', recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">' });
      else findings.push({ category: 'Mobile', check: 'Viewport config', status: 'pass', severity: 'low', message: 'Viewport meta tag present', recommendation: '' });

      const imgs = html.match(/<img[^>]*>/ig) || [];
      const imgsNoAlt = imgs.filter((t) => !/\salt=/i.test(t));
      if (imgs.length && imgsNoAlt.length) findings.push({ category: 'Accessibility', check: 'Image alt text', status: 'warning', severity: 'medium', message: `${imgsNoAlt.length} of ${imgs.length} images missing alt text`, recommendation: 'Add descriptive alt text to all meaningful images' });
      else if (imgs.length) findings.push({ category: 'Accessibility', check: 'Image alt text', status: 'pass', severity: 'low', message: 'All images have alt text', recommendation: '' });

      const hasContact = /(contact|call|phone|tel:|email|@)/i.test(lower);
      if (!hasContact) findings.push({ category: 'Conversion', check: 'Contact details', status: 'warning', severity: 'medium', message: 'No visible contact details detected', recommendation: 'Add clear contact information' });
      else findings.push({ category: 'Conversion', check: 'Contact details', status: 'pass', severity: 'low', message: 'Contact details detected', recommendation: '' });

      const ctaTerms = /(book now|book online|get started|contact us|request|appointment|schedule|free consultation|sign up|buy now)/i;
      if (!ctaTerms.test(lower)) findings.push({ category: 'Conversion', check: 'Call to action', status: 'warning', severity: 'medium', message: 'No clear call-to-action detected', recommendation: 'Add prominent CTAs (e.g. Book Now, Get a Quote)' });
      else findings.push({ category: 'Conversion', check: 'Call to action', status: 'pass', severity: 'low', message: 'Call-to-action detected', recommendation: '' });

      if (html.length > 2 * 1024 * 1024) findings.push({ category: 'Performance', check: 'Page weight', status: 'warning', severity: 'medium', message: 'Large page size (~' + Math.round(html.length / 1024) + ' KB)', recommendation: 'Reduce page weight; optimize images and assets' });
      else findings.push({ category: 'Performance', check: 'Page weight', status: 'pass', severity: 'low', message: 'Reasonable page size', recommendation: '' });
    }

    // URLpipe Lighthouse API (optional, free tier — real lab scores).
    // Replaces the self-hosted Lighthouse worker. API key stays server-side.
    const urlpipeKey = secrets.get('URLPIPE_API_KEY');
    let lighthouseAvailable = false;
    let lighthouseSource = '';
    let perfScore: number | null = null;
    let a11yScore: number | null = null;
    let seoScoreLh: number | null = null;
    let bpScore: number | null = null;
    if (urlpipeKey) {
      const lh = await urlpipeLighthouseAudit(finalUrl.toString(), urlpipeKey);
      if (lh.available && lh.scores) {
        lighthouseAvailable = true;
        lighthouseSource = lh.fromCache ? 'URLpipe Lighthouse API (cached)' : 'URLpipe Lighthouse API';
        await logUsage(base44, 'lighthouse_audit');
        const s = lh.scores;
        perfScore = s.performance;
        a11yScore = s.accessibility;
        seoScoreLh = s.seo;
        bpScore = s.bestPractices;
        findings.push({ category: 'Performance', check: 'Lighthouse performance', status: perfScore >= 90 ? 'pass' : perfScore >= 50 ? 'warning' : 'fail', severity: perfScore >= 90 ? 'low' : 'medium', message: `Lighthouse performance: ${perfScore ?? '—'}/100 (lab data)`, recommendation: 'Optimize LCP, CLS, TBT; see Lighthouse report' });
        findings.push({ category: 'Accessibility', check: 'Lighthouse accessibility', status: a11yScore >= 90 ? 'pass' : 'warning', severity: 'low', message: `Lighthouse accessibility: ${a11yScore ?? '—'}/100`, recommendation: 'Resolve axe-core violations' });
        findings.push({ category: 'SEO', check: 'Lighthouse SEO', status: seoScoreLh >= 90 ? 'pass' : 'warning', severity: 'low', message: `Lighthouse SEO: ${seoScoreLh ?? '—'}/100`, recommendation: '' });
        findings.push({ category: 'Performance', check: 'Lighthouse best practices', status: bpScore >= 90 ? 'pass' : 'warning', severity: 'low', message: `Lighthouse best practices: ${bpScore ?? '—'}/100`, recommendation: '' });
        if (lh.metrics) {
          const addMetric = (label: string, m: any) => {
            if (!m || !m.displayValue) return;
            const sc = m.score;
            const status = sc == null ? 'warning' : sc >= 0.9 ? 'pass' : sc >= 0.5 ? 'warning' : 'fail';
            findings.push({ category: 'Performance', check: label, status, severity: status === 'fail' ? 'medium' : 'low', message: `${label}: ${m.displayValue}`, recommendation: '' });
          };
          addMetric('Largest Contentful Paint (LCP)', lh.metrics.lcp);
          addMetric('First Contentful Paint (FCP)', lh.metrics.fcp);
          addMetric('Cumulative Layout Shift (CLS)', lh.metrics.cls);
          addMetric('Total Blocking Time (TBT)', lh.metrics.tbt);
        }
      } else if (lh.quotaExhausted) {
        findings.push({ category: 'Performance', check: 'Lighthouse audit', status: 'warning', severity: 'low', message: 'URLpipe free-tier quota exhausted — showing heuristic estimates', recommendation: 'Wait for the monthly quota to reset or add billing in URLpipe' });
      } else {
        findings.push({ category: 'Performance', check: 'Lighthouse audit', status: 'warning', severity: 'low', message: 'URLpipe Lighthouse request failed — showing heuristic estimates' + (lh.error ? ': ' + lh.error : ''), recommendation: 'Check the URLPIPE_API_KEY secret and your URLpipe quota' });
      }
    } else {
      findings.push({ category: 'Performance', check: 'Lighthouse audit', status: 'warning', severity: 'low', message: 'No URLpipe API key configured — performance score is a heuristic estimate', recommendation: 'Set the URLPIPE_API_KEY secret for real Lighthouse lab audits' });
    }

    const cats = ['Performance', 'Mobile', 'SEO', 'Security', 'Conversion', 'Accessibility'];
    const scores: any = {};
    cats.forEach((c) => {
      const cf = findings.filter((f) => f.category === c);
      if (!cf.length) { scores[c] = null; return; }
      const passed = cf.filter((f) => f.status === 'pass').length;
      scores[c] = scoreFrom(passed, cf.length);
    });
    if (perfScore != null) scores.Performance = perfScore;
    if (a11yScore != null) scores.Accessibility = a11yScore;
    if (seoScoreLh != null) scores.SEO = seoScoreLh;

    const validScores = Object.values(scores).filter((v) => v != null);
    const overall = validScores.length ? Math.round((validScores as number[]).reduce((a, b) => a + b, 0) / validScores.length) : 0;

    const suggested = [];
    if (scores.Security != null && scores.Security < 100) suggested.push('SSL / HTTPS migration');
    if (scores.Mobile != null && scores.Mobile < 80) suggested.push('Mobile-responsive redesign');
    if (scores.SEO != null && scores.SEO < 80) suggested.push('SEO optimization');
    if (scores.Conversion != null && scores.Conversion < 80) suggested.push('Landing page & CTA design');
    if (scores.Performance != null && scores.Performance < 80) suggested.push('Performance optimization');
    if (scores.Accessibility != null && scores.Accessibility < 80) suggested.push('Accessibility remediation');
    if (!suggested.length) suggested.push('Ongoing maintenance & monitoring');

    return Response.json({
      website_url: finalUrl.toString(),
      overall_score: overall,
      performance_score: scores.Performance,
      mobile_score: scores.Mobile,
      seo_score: scores.SEO,
      security_score: scores.Security,
      conversion_score: scores.Conversion,
      accessibility_score: scores.Accessibility,
      findings,
      suggested_services: suggested,
      audit_source: lighthouseAvailable ? `${lighthouseSource} + server-side checks` : 'server-side heuristic checks (no Lighthouse API configured)',
      audit_timestamp: new Date().toISOString(),
      note: lighthouseAvailable
        ? 'Real Lighthouse lab scores via URLpipe (simulated mobile). Lab data, not real-user Core Web Vitals field data.'
        : 'Heuristic estimate only. Set the URLPIPE_API_KEY secret for real Lighthouse lab audits. No paid service used.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}