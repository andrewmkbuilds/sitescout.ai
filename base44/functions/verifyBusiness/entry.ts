import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import {
  verifyDestination, classifyVerification, normalizeDomain, classifyHost,
  type CheckResult, type DestinationResult,
} from '../../shared/verification.ts';
import { searxngSearch, extractWebCandidates, logUsage, computeProspectScores } from '../../shared/freeSources.ts';

function listingCheck(business) {
  const url = business.confirmed_website_url || business.website_url || '';
  const d = normalizeDomain(url);
  const candidates = d ? [{ domain: d, url, note: 'Listed in business listing' }] : [];
  const srcLabel = business.provider === 'openstreetmap' ? 'OpenStreetMap' : business.provider === 'demo' ? 'Demo listing' : business.provider || 'listing';
  return {
    name: 'Business listing',
    source: srcLabel,
    sourceType: 'listing',
    sourceUrl: business.listing_url || '',
    timestamp: new Date().toISOString(),
    status: d ? 'passed' : 'negative',
    evidence: d ? `Listing provides a website field: ${url}` : 'Listing does not provide a website field. A missing field does not mean the business has no website.',
    confidence: d ? 70 : 30,
    candidateDomains: candidates,
    notes: d ? 'Candidate from listing.' : 'No website in listing — must be corroborated by other sources.',
  } as CheckResult;
}

async function searxngWebCheck(kind: 'general' | 'instagram' | 'x', business, searxngUrl): Promise<CheckResult> {
  const name = business.name;
  const loc = [business.city, business.country].filter(Boolean).join(', ');
  const ind = business.industry || '';
  let query = '';
  let sourceType = '';
  let sourceLabel = '';
  let socialHosts: string[] = [];
  if (kind === 'general') {
    query = `"${name}" ${loc} ${ind} official website`.trim();
    sourceType = 'web_search';
    sourceLabel = 'General web search (SearXNG)';
  } else if (kind === 'instagram') {
    query = `"${name}" ${loc} instagram`;
    sourceType = 'instagram_web';
    sourceLabel = 'Web research — Instagram profile (SearXNG)';
    socialHosts = ['instagram.com'];
  } else {
    query = `"${name}" ${loc} site:x.com OR site:linkedin.com OR site:facebook.com`;
    sourceType = 'x_web';
    sourceLabel = 'Web research — X / social profiles (SearXNG)';
    socialHosts = ['x.com', 'twitter.com', 'linkedin.com', 'facebook.com'];
  }

  const checkName = kind === 'general' ? 'General web search' : kind === 'instagram' ? 'Instagram profile' : 'X / social profiles';
  const { results, available, error } = await searxngSearch(query, searxngUrl);
  if (!available) {
    const evidence = !searxngUrl
      ? 'SearXNG is not configured. Web research is disabled — no fabricated results. Configure SEARXNG_URL (self-hosted SearXNG) to enable this check.'
      : `SearXNG is configured but unreachable${error ? ': ' + error : ''}. No fabricated results — check your self-hosted instance.`;
    return {
      name: checkName, source: sourceLabel, sourceType, query, sourceUrl: '', timestamp: new Date().toISOString(),
      status: 'unavailable',
      evidence,
      confidence: 0, candidateDomains: [], notes: 'Unavailable — does not count as a completed check.',
    } as CheckResult;
  }
  const { candidates, profileUrls, resultCount } = extractWebCandidates(results, {
    socialHosts, classifyHost, normalizeDomain,
  });
  const found = candidates.length > 0;
  const evidence = found
    ? `SearXNG returned ${resultCount} result(s); candidate website(s): ${candidates.map((c) => c.domain).join(', ')}.`
    : profileUrls.length
      ? `SearXNG returned ${resultCount} result(s); social profile found (${profileUrls.length}) but no official website link.`
      : `SearXNG returned ${resultCount} result(s); no qualifying official website found. A missing result is not proof no website exists.`;
  return {
    name: checkName, source: sourceLabel, sourceType, query,
    sourceUrl: profileUrls[0] || (found ? candidates[0].url : ''),
    timestamp: new Date().toISOString(),
    status: found ? 'passed' : 'negative',
    evidence, confidence: found ? 55 : 25,
    candidateDomains: candidates,
    notes: found ? `Candidate: ${candidates.map((c) => c.domain).join(', ')}` : 'Completed search; no qualifying official website found.',
  } as CheckResult;
}

function opportunityScore(classification, business, qualityScore) {
  let score = 50;
  if (classification === 'verified_no_website') score += 25;
  else if (classification === 'broken_inaccessible') score += 18;
  else if (classification === 'needs_improvement' && qualityScore != null) score += Math.round((100 - qualityScore) * 0.25);
  else if (classification === 'needs_checking') score -= 5;
  if (business.email || business.phone) score += 7; else score -= 6;
  if (business.rating && business.rating >= 4.0) score += 5;
  else if (business.rating && business.rating < 3.5) score -= 6;
  return Math.max(0, Math.min(100, score));
}

function statusFromClassification(c) {
  switch (c) {
    case 'verified_no_website': return 'no_website_listed';
    case 'broken_inaccessible': return 'inaccessible';
    case 'needs_improvement': return 'reachable';
    case 'website_found': return 'reachable';
    default: return 'unverified';
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // auth disabled (anonymous demo mode)
    // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 }); // re-enable to restore auth

    const body = await req.json().catch(() => ({}));
    const businessId = body.business_id;
    if (!businessId) return Response.json({ error: 'business_id required' }, { status: 400 });
    const runSources = Array.isArray(body.sources) && body.sources.length ? body.sources : ['listing', 'web_search', 'instagram', 'x_social', 'directory'];
    const autoAudit = body.auto_audit !== false;
    const manualUrls: string[] = Array.isArray(body.manual_urls) ? body.manual_urls.filter(Boolean) : [];

    const business = await base44.entities.Business.get(businessId);
    if (!business) return Response.json({ error: 'Business not found' }, { status: 404 });

    const searxngUrl = secrets.get('SEARXNG_URL');
    const checks: CheckResult[] = [];

    // Check 1: listing (OpenStreetMap / CSV / demo)
    checks.push(listingCheck(business));

    // Manual URL submission fallback (adds candidates, recorded as its own check)
    if (manualUrls.length) {
      const mcands = [];
      for (const u of manualUrls) {
        const d = normalizeDomain(u);
        if (d) mcands.push({ domain: d, url: u, note: 'Manually submitted URL' });
      }
      checks.push({
        name: 'Manual URL submission', source: 'User-submitted', sourceType: 'manual',
        sourceUrl: manualUrls[0] || '', timestamp: new Date().toISOString(),
        status: mcands.length ? 'passed' : 'negative',
        evidence: mcands.length ? `User submitted ${mcands.length} candidate URL(s): ${mcands.map((c) => c.domain).join(', ')}` : 'Manual URL was invalid or blocked.',
        confidence: mcands.length ? 50 : 10, candidateDomains: mcands,
        notes: 'Manual submission — to be verified by destination check.',
      } as CheckResult);
    }

    // Checks 2,3,4 via SearXNG (free, self-hosted). 'directory' folds into general web search.
    const webKinds: ('general' | 'instagram' | 'x')[] = [];
    if (runSources.includes('web_search') || runSources.includes('directory')) webKinds.push('general');
    if (runSources.includes('instagram')) webKinds.push('instagram');
    if (runSources.includes('x_social')) webKinds.push('x');
    const webResults = await Promise.allSettled(webKinds.map((k) => searxngWebCheck(k, business, searxngUrl)));
    webResults.forEach((r) => { if (r.status === 'fulfilled') checks.push(r.value); });
    if (searxngUrl) await logUsage(base44, 'searxng_search');

    // Gather candidate domains (dedup, prefer non-social).
    const candMap = new Map();
    checks.forEach((c) => (c.candidateDomains || []).forEach((cd) => {
      if (!candMap.has(cd.domain)) candMap.set(cd.domain, cd);
    }));
    const candidates = Array.from(candMap.values());
    candidates.sort((a, b) => {
      const rank = (t) => (t === 'unknown' ? 0 : t === 'builder' ? 1 : t === 'aggregator' ? 2 : t === 'booking' ? 3 : t === 'directory' ? 4 : 5);
      return rank(classifyHost(a.domain)) - rank(classifyHost(b.domain));
    });

    // Check 5: custom crawler — destination verification (SSRF-protected, robots-aware).
    let confirmedDest: DestinationResult | null = null;
    let destCheck: CheckResult;
    if (candidates.length === 0) {
      destCheck = {
        name: 'Domain & destination verification', source: 'Open-source crawler (server-side fetch)', sourceType: 'domain_fetch',
        sourceUrl: '', timestamp: new Date().toISOString(), status: 'negative',
        evidence: 'No candidate domains discovered by the other checks — nothing to verify.',
        confidence: 40, candidateDomains: [], notes: 'No candidates to verify.',
      } as CheckResult;
    } else {
      const top = candidates.slice(0, 3);
      const destResults = await Promise.allSettled(top.map((c) => verifyDestination(c.url, business.name)));
      let best: DestinationResult | null = null;
      const tried: string[] = [];
      destResults.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          tried.push(`${top[i].domain} → ${r.value.status}/${r.value.destinationType}`);
          if (!best) best = r.value;
          else {
            const better = (r.value.relevant && (r.value.status === 'reachable' || r.value.status === 'redirecting') && ['official', 'unknown', 'builder'].includes(r.value.destinationType));
            const bestGood = (best.relevant && (best.status === 'reachable' || best.status === 'redirecting'));
            if (better && !bestGood) best = r.value;
          }
        }
      });
      confirmedDest = best;
      const hasConfirmed = best && (best.status === 'reachable' || best.status === 'redirecting') && best.relevant && ['official', 'unknown', 'builder'].includes(best.destinationType);
      const hasBroken = best && (best.status === 'broken' || best.status === 'inaccessible' || best.destinationType === 'parked');
      destCheck = {
        name: 'Domain & destination verification', source: 'Open-source crawler (server-side fetch)', sourceType: 'domain_fetch',
        sourceUrl: best ? best.finalUrl : '', timestamp: new Date().toISOString(),
        status: hasConfirmed ? 'passed' : (hasBroken ? 'negative' : (best ? 'negative' : 'failed')),
        evidence: best ? best.evidence + ' Tried: ' + tried.join('; ') : 'All candidate fetches failed.',
        confidence: best ? best.confidence : 10,
        candidateDomains: candidates.map((c) => ({ domain: c.domain, url: c.url, note: c.note })),
        notes: hasConfirmed ? `Confirmed destination: ${best.finalUrl}` : hasBroken ? `Candidate broken: ${best.finalUrl}` : best && best.status === 'timeout' ? 'Verification timed out — not classified as no-website.' : 'Candidates not confirmed.',
      } as CheckResult;
    }
    checks.push(destCheck);

    const result = classifyVerification(checks, confirmedDest);
    let classification = result.classification;
    let qualityScore = business.website_quality_score;

    // Auto-audit confirmed websites (free Lighthouse worker if configured, else heuristic).
    if (autoAudit && classification === 'website_found' && confirmedDest && confirmedDest.finalUrl) {
      try {
        const auditRes: any = await Promise.race([
          base44.functions.invoke('auditWebsite', { url: confirmedDest.finalUrl }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('audit timeout')), 30000)),
        ]);
        const audit = auditRes?.data || auditRes;
        if (audit && audit.overall_score != null) {
          qualityScore = audit.overall_score;
          if (audit.overall_score < 60) {
            classification = 'needs_improvement';
            result.notes = `Website confirmed but quality score ${audit.overall_score}/100 indicates improvement opportunities. ` + result.notes;
          }
          await base44.entities.WebsiteAudit.create({
            business_id: business.id, business_name: business.name, website_url: confirmedDest.finalUrl,
            overall_score: audit.overall_score, performance_score: audit.performance_score,
            mobile_score: audit.mobile_score, seo_score: audit.seo_score, security_score: audit.security_score,
            conversion_score: audit.conversion_score, accessibility_score: audit.accessibility_score,
            findings: audit.findings || [], suggested_services: audit.suggested_services || [],
            audit_source: audit.audit_source, audit_timestamp: new Date().toISOString(),
            is_demo: !!business.is_demo,
          }).catch(() => {});
        }
      } catch (e) {}
    }

    const scores = computeProspectScores({ ...business, website_classification: classification }, checks, qualityScore);
    const opp = scores.overall_opportunity;
    const sourceCoverage = {};
    checks.forEach((c) => { sourceCoverage[c.sourceType] = c.status; });

    const updated = await base44.entities.Business.update(businessId, {
      verification_checks: checks,
      candidate_domains: candidates,
      website_classification: classification,
      confirmed_website_url: result.confirmedUrl,
      verification_confidence: result.confidence,
      checks_completed: checks.filter((c) => c.status === 'passed' || c.status === 'negative').length,
      source_coverage: sourceCoverage,
      website_status: statusFromClassification(classification),
      website_quality_score: qualityScore,
      opportunity_score: opp,
      prospect_scores: scores,
      last_verified: new Date().toISOString(),
    });

    if (business.research_job_id) {
      try {
        const job = await base44.entities.ResearchJob.get(business.research_job_id);
        if (job) {
          const c = job.counts || {};
          c.verified = (c.verified || 0) + 1;
          if (classification === 'website_found') c.found = (c.found || 0) + 1;
          else if (classification === 'verified_no_website') c.no_website = (c.no_website || 0) + 1;
          else if (classification === 'broken_inaccessible') c.broken = (c.broken || 0) + 1;
          else if (classification === 'needs_improvement') c.needs_improvement = (c.needs_improvement || 0) + 1;
          else c.needs_review = (c.needs_review || 0) + 1;
          const allVerified = c.verified >= (c.saved || 0);
          await base44.entities.ResearchJob.update(job.id, {
            counts: c,
            status: allVerified ? 'completed' : 'running',
            finished_at: allVerified ? new Date().toISOString() : job.finished_at,
          });
        }
      } catch (e) {}
    }

    return Response.json({
      business_id: businessId,
      classification,
      confidence: result.confidence,
      confirmed_url: result.confirmedUrl,
      checks_completed: result.checksCompleted,
      independent_mechanisms: result.independentMechanisms,
      notes: result.notes,
      checks,
      opportunity_score: opp,
      business: updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}