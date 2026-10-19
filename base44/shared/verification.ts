// Shared multi-source website-verification logic for SiteScout AI.
// Open-source crawler with SSRF protection, robots.txt awareness, and
// metadata/social-link extraction. Imported by startResearch and verifyBusiness.

const BLOCKED_HOSTS = ['localhost', '0.0.0.0', 'metadata.google.internal', '169.254.169.254'];

export function isBlockedHost(host: string): boolean {
  const h = (host || '').toLowerCase();
  if (!h) return true;
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

export function normalizeUrl(raw: string): URL | null {
  if (!raw) return null;
  let u = String(raw).trim();
  if (!u) return null;
  // Reject explicit non-http schemes (ftp:, javascript:, file:, …) before prepending.
  const schemeMatch = u.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(.*)$/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') return null;
  } else {
    u = 'https://' + u;
  }
  try {
    const url = new URL(u);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (isBlockedHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function normalizeDomain(raw: string): string {
  const u = normalizeUrl(raw);
  if (!u) return '';
  return u.hostname.toLowerCase().replace(/^www\./, '');
}

const SOCIAL_HOSTS = ['instagram.com', 'facebook.com', 'fb.com', 'linkedin.com', 'x.com', 'twitter.com', 'tiktok.com', 'youtube.com', 'pinterest.com', 'snapchat.com'];
const AGGREGATOR_HOSTS = ['linktr.ee', 'lnk.bio', 'beacons.ai', 'tap.bio', 'bio.site', 'shor.by', 'campsite.bio', 'solo.to'];
const DIRECTORY_HOSTS = ['yelp.com', 'foursquare.com', 'tripadvisor.com', 'zomato.com', 'google.com', 'maps.google.com', 'yellowpages.com', 'hotfrog.com', 'dubizzle.com', 'gulfstay.com'];
const BUILDER_HOSTS = ['wixsite.com', 'weebly.com', 'wordpress.com', 'blogspot.com', 'godaddysites.com', 'square.site', 'carrd.co', 'sites.google.com', 'webflow.io', 'shopify.com', 'myshopify.com'];
const BOOKING_HOSTS = ['booking.com', 'opentable.com', 'resy.com', 'talabat.com', 'deliveroo.com', 'ubereats.com', 'careem.com', 'zomato.com', 'foursquare.com'];

export type DestinationType = 'official' | 'social' | 'aggregator' | 'directory' | 'builder' | 'booking' | 'parked' | 'unknown';

export function classifyHost(hostname: string): DestinationType {
  const h = (hostname || '').toLowerCase().replace(/^www\./, '');
  if (SOCIAL_HOSTS.some((s) => h === s || h.endsWith('.' + s))) return 'social';
  if (AGGREGATOR_HOSTS.some((s) => h === s || h.endsWith('.' + s))) return 'aggregator';
  if (BOOKING_HOSTS.some((s) => h === s || h.endsWith('.' + s))) return 'booking';
  if (DIRECTORY_HOSTS.some((s) => h === s || h.endsWith('.' + s))) return 'directory';
  if (BUILDER_HOSTS.some((s) => h === s || h.endsWith('.' + s))) return 'builder';
  return 'unknown';
}

export const SOCIAL_HOST_LIST = SOCIAL_HOSTS;

export interface DestinationResult {
  status: 'reachable' | 'broken' | 'redirecting' | 'inaccessible' | 'error' | 'timeout';
  finalUrl: string;
  hostname: string;
  https: boolean;
  destinationType: DestinationType;
  redirectChain: string[];
  relevant: boolean;
  evidence: string;
  confidence: number;
  title: string;
  metaDescription: string;
  socialLinks: string[];
  sitemapUrls: string[];
  robotsPresent: boolean;
  robotsAllowed: boolean;
}

function extractSocialLinks(html: string): string[] {
  const out: string[] = [];
  const re = /href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(html)) !== null) {
    let href = m[1];
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;
    try {
      const abs = new URL(href, 'https://example.com');
      const host = abs.hostname.toLowerCase().replace(/^www\./, '');
      if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith('.' + s))) {
        const key = abs.origin + abs.pathname;
        if (!seen.has(key)) { seen.add(key); out.push(abs.href); }
      }
    } catch {}
  }
  return out.slice(0, 12);
}

async function fetchRobotsAndSitemap(origin: string, homepagePath: string): Promise<{ sitemapUrls: string[]; robotsPresent: boolean; robotsAllowed: boolean }> {
  let sitemapUrls: string[] = [];
  let robotsPresent = false;
  let robotsAllowed = true;
  try {
    const r = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'SiteScoutAI-Verify/1.0 (website research)' },
    });
    if (r.ok) {
      robotsPresent = true;
      const text = await r.text();
      const lines = text.split(/\r?\n/);
      let inAgent = false;
      let inOurAgent = false;
      for (const line of lines) {
        const l = line.trim().toLowerCase();
        if (l.startsWith('user-agent:')) {
          const ag = l.slice('user-agent:'.length).trim();
          inOurAgent = (ag === '*' || ag.includes('sitescout'));
          inAgent = true;
          continue;
        }
        if (l.startsWith('sitemap:')) {
          const s = line.trim().slice('sitemap:'.length).trim();
          if (s) sitemapUrls.push(s);
          continue;
        }
        if (inOurAgent && l.startsWith('disallow:')) {
          const path = l.slice('disallow:'.length).trim();
          if (path === '/' || path === homepagePath) robotsAllowed = false;
        }
      }
    }
  } catch {}
  return { sitemapUrls, robotsPresent, robotsAllowed };
}

// Check 5: investigate a candidate URL server-side with SSRF protection,
// redirect validation, metadata extraction, and robots.txt awareness.
export async function verifyDestination(rawUrl: string, businessName: string): Promise<DestinationResult> {
  const start = normalizeUrl(rawUrl);
  const empty: DestinationResult = {
    status: 'error', finalUrl: '', hostname: '', https: false, destinationType: 'unknown',
    redirectChain: [], relevant: false, evidence: 'Invalid or blocked URL', confidence: 10,
    title: '', metaDescription: '', socialLinks: [], sitemapUrls: [], robotsPresent: false, robotsAllowed: true,
  };
  if (!start) return empty;

  const chain: string[] = [start.toString()];
  let current = start;
  let finalUrl = start.toString();
  let hostname = start.hostname;
  let https = start.protocol === 'https:';
  let destinationType = classifyHost(start.hostname);
  let html = '';

  for (let i = 0; i < 4; i++) {
    let r: Response;
    try {
      r = await fetch(current.toString(), {
        signal: AbortSignal.timeout(12000),
        redirect: 'manual',
        headers: { 'User-Agent': 'SiteScoutAI-Verify/1.0 (website research)' },
      });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/timeout|abort/i.test(msg)) {
        return { ...empty, status: 'timeout', finalUrl: current.toString(), hostname: current.hostname, https: current.protocol === 'https:', destinationType, redirectChain: chain, evidence: 'Request timed out — site may be temporarily slow, not necessarily absent', confidence: 20 };
      }
      return { ...empty, status: 'inaccessible', finalUrl: current.toString(), hostname: current.hostname, https: current.protocol === 'https:', destinationType, redirectChain: chain, evidence: 'Could not reach host: ' + msg, confidence: 25 };
    }
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      const loc = new URL(r.headers.get('location')!, current);
      if (isBlockedHost(loc.hostname)) {
        return { ...empty, status: 'error', finalUrl: loc.toString(), hostname: loc.hostname, https: loc.protocol === 'https:', destinationType: 'unknown', redirectChain: chain, evidence: 'Redirects to a blocked/internal host', confidence: 5 };
      }
      current = loc;
      finalUrl = loc.toString();
      hostname = loc.hostname;
      https = loc.protocol === 'https:';
      destinationType = classifyHost(loc.hostname);
      chain.push(loc.toString());
      continue;
    }
    if (r.status >= 500) {
      return { ...empty, status: 'broken', finalUrl: current.toString(), hostname, https, destinationType, redirectChain: chain, evidence: `Server error HTTP ${r.status}`, confidence: 45 };
    }
    if (r.status >= 400) {
      return { ...empty, status: 'broken', finalUrl: current.toString(), hostname, https, destinationType, redirectChain: chain, evidence: `HTTP ${r.status} — page not reachable`, confidence: 45 };
    }
    try {
      html = await r.text();
    } catch (e: any) {
      return { ...empty, status: 'inaccessible', finalUrl: current.toString(), hostname, https, destinationType, redirectChain: chain, evidence: 'Could not read response: ' + String(e?.message || e), confidence: 25 };
    }
    break;
  }

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
  const socialLinks = extractSocialLinks(html);

  const nameLow = (businessName || '').toLowerCase();
  const nameToken = nameLow.split(/\s+/).filter((w) => w.length > 3)[0] || nameLow;
  const relevant = !!(nameToken && (title.toLowerCase().includes(nameToken) || html.toLowerCase().includes(nameToken)));

  const parkedSignals = /parked|domain is for sale|buy this domain|registrar|godaddy\.com|namecheap/i;
  const isParked = parkedSignals.test(html) || parkedSignals.test(title);

  // robots.txt + sitemap (best-effort, informational)
  const origin = `${current.protocol}//${current.hostname}`;
  const rs = await fetchRobotsAndSitemap(origin, current.pathname || '/');

  let status: DestinationResult['status'] = 'reachable';
  let evidence = 'Reachable, served over ' + (https ? 'HTTPS' : 'HTTP') + '.';
  let confidence = 60;
  if (chain.length > 1) {
    status = 'redirecting';
    evidence = `Redirected ${chain.length - 1} time(s) to ${hostname}.`;
    confidence = 50;
  }
  if (isParked) {
    return { ...empty, status: 'broken', finalUrl, hostname, https, destinationType: 'parked', redirectChain: chain, relevant: false, evidence: 'Domain appears parked or for sale', confidence: 55, title, metaDescription, socialLinks, sitemapUrls: rs.sitemapUrls, robotsPresent: rs.robotsPresent, robotsAllowed: rs.robotsAllowed };
  }
  if (destinationType !== 'unknown' && destinationType !== 'official') {
    evidence += ` Destination is a ${destinationType} page, not an independent business website.`;
    confidence = 40;
  }
  if (relevant) {
    evidence += ' Page content references the business name — domain association likely.';
    confidence = Math.min(95, confidence + 25);
  } else {
    evidence += ' Page content does not clearly reference the business — association unconfirmed.';
    confidence = Math.max(20, confidence - 15);
  }
  return {
    status, finalUrl, hostname, https, destinationType, redirectChain: chain, relevant, evidence, confidence,
    title, metaDescription, socialLinks, sitemapUrls: rs.sitemapUrls, robotsPresent: rs.robotsPresent, robotsAllowed: rs.robotsAllowed,
  };
}

export interface CheckResult {
  name: string;
  source: string;
  sourceType: string;
  sourceUrl: string;
  timestamp: string;
  status: 'passed' | 'negative' | 'failed' | 'unavailable';
  evidence: string;
  confidence: number;
  candidateDomains: { domain: string; url: string; note: string }[];
  notes: string;
  query?: string;
}

export type Classification = 'verified_no_website' | 'website_found' | 'needs_checking' | 'broken_inaccessible' | 'needs_improvement';

export interface ClassificationResult {
  classification: Classification;
  confidence: number;
  confirmedUrl: string;
  notes: string;
  checksCompleted: number;
  independentMechanisms: number;
}

function mechanismOf(sourceType: string): string {
  if (sourceType === 'listing') return 'business_listing';
  if (sourceType === 'manual') return 'manual_submission';
  if (sourceType === 'domain_fetch') return 'direct_fetch';
  return 'web_search';
}

export function classifyVerification(checks: CheckResult[], confirmedDest: DestinationResult | null): ClassificationResult {
  const completed = checks.filter((c) => c.status === 'passed' || c.status === 'negative');
  const failed = checks.filter((c) => c.status === 'failed');
  const unavailable = checks.filter((c) => c.status === 'unavailable');
  const allCandidates = checks.flatMap((c) => c.candidateDomains || []);
  const mechanisms = new Set(completed.map((c) => mechanismOf(c.sourceType)));

  if (confirmedDest && (confirmedDest.status === 'reachable' || confirmedDest.status === 'redirecting') && confirmedDest.relevant && (confirmedDest.destinationType === 'official' || confirmedDest.destinationType === 'unknown' || confirmedDest.destinationType === 'builder')) {
    const conf = Math.min(95, confirmedDest.confidence + 10);
    return { classification: 'website_found', confidence: conf, confirmedUrl: confirmedDest.finalUrl, notes: 'Official website confirmed via direct destination verification.', checksCompleted: completed.length, independentMechanisms: mechanisms.size };
  }

  if (confirmedDest && (confirmedDest.status === 'broken' || confirmedDest.status === 'inaccessible' || confirmedDest.destinationType === 'parked')) {
    return { classification: 'broken_inaccessible', confidence: confirmedDest.confidence, confirmedUrl: confirmedDest.finalUrl, notes: 'Candidate website exists but is broken, parked, or inaccessible: ' + confirmedDest.evidence, checksCompleted: completed.length, independentMechanisms: mechanisms.size };
  }

  if (allCandidates.length > 0 && !confirmedDest) {
    return { classification: 'needs_checking', confidence: 35, confirmedUrl: '', notes: `${allCandidates.length} candidate domain(s) found but not yet verified. Resume verification to investigate.`, checksCompleted: completed.length, independentMechanisms: mechanisms.size };
  }
  if (confirmedDest && confirmedDest.status === 'timeout') {
    return { classification: 'needs_checking', confidence: 30, confirmedUrl: confirmedDest.finalUrl, notes: 'Destination verification timed out — site may be temporarily unavailable. Not classified as no-website.', checksCompleted: completed.length, independentMechanisms: mechanisms.size };
  }

  if (completed.length < 5) {
    return { classification: 'needs_checking', confidence: 30, confirmedUrl: '', notes: `Only ${completed.length} of 5 checks completed (${unavailable.length} unavailable, ${failed.length} failed). Insufficient evidence to confirm no website.`, checksCompleted: completed.length, independentMechanisms: mechanisms.size };
  }
  if (mechanisms.size < 2) {
    return { classification: 'needs_checking', confidence: 30, confirmedUrl: '', notes: 'Completed checks share a single source — insufficient independence to confirm no website.', checksCompleted: completed.length, independentMechanisms: mechanisms.size };
  }

  const anyPassed = completed.some((c) => c.status === 'passed');
  if (!anyPassed && allCandidates.length === 0) {
    const avgConf = Math.round(completed.reduce((a, c) => a + c.confidence, 0) / completed.length);
    return { classification: 'verified_no_website', confidence: Math.min(85, avgConf), confirmedUrl: '', notes: `All ${completed.length} checks completed with negative findings across ${mechanisms.size} independent source mechanisms. No credible website found. Conclusion is evidence-based, not mathematically certain.`, checksCompleted: completed.length, independentMechanisms: mechanisms.size };
  }

  return { classification: 'needs_checking', confidence: 35, confirmedUrl: '', notes: 'Conflicting or inconclusive evidence — manual review recommended.', checksCompleted: completed.length, independentMechanisms: mechanisms.size };
}

export function dedupKey(name: string, city: string): string {
  const n = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const c = (city || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${n}|${c}`;
}