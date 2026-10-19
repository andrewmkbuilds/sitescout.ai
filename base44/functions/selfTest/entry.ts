// Server-side automated self-test for the verification + scoring logic.
// Runnable via the Base44 test runner (test_backend_function('selfTest')).
// Covers the Phase 9 scenarios that are pure-logic (no live network):
// SSRF blocking, host classification, dedup, the five-check classifier across
// every classification, Overpass query/parsing, web-candidate extraction, and
// multi-dimensional prospect scoring.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  normalizeDomain, normalizeUrl, classifyHost, dedupKey, classifyVerification,
  type CheckResult, type DestinationResult,
} from '../../shared/verification.ts';
import { buildOverpassQuery, parseOverpass, extractWebCandidates, computeProspectScores } from '../../shared/freeSources.ts';

function check(partial: Partial<CheckResult>): CheckResult {
  return {
    name: partial.name || 'check', source: partial.source || 'src', sourceType: partial.sourceType || 'web_search',
    sourceUrl: partial.sourceUrl || '', timestamp: partial.timestamp || new Date().toISOString(),
    status: partial.status || 'negative', evidence: partial.evidence || '', confidence: partial.confidence ?? 30,
    candidateDomains: partial.candidateDomains || [], notes: partial.notes || '',
  } as CheckResult;
}

function confirmedDest(over: Partial<DestinationResult> = {}): DestinationResult {
  return {
    status: 'reachable', finalUrl: 'https://example.com', hostname: 'example.com', https: true,
    destinationType: 'unknown', redirectChain: [], relevant: true, evidence: '', confidence: 70,
    title: '', metaDescription: '', socialLinks: [], sitemapUrls: [], robotsPresent: false, robotsAllowed: true,
    ...over,
  } as DestinationResult;
}

function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

const results: { name: string; pass: boolean; error?: string }[] = [];
function test(name, fn) {
  try { fn(); results.push({ name, pass: true }); }
  catch (e) { results.push({ name, pass: false, error: String(e?.message || e) }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

test('SSRF blocks private/loopback/metadata hosts', () => {
  for (const bad of ['localhost', '127.0.0.1', 'https://10.0.0.1', 'https://192.168.1.1', 'https://172.16.0.1', 'https://172.31.0.1', 'https://metadata.google.internal', 'https://foo.internal', 'https://foo.local']) {
    assert(normalizeDomain(bad) === '', `expected blocked for ${bad}`);
  }
});
test('normalizeDomain allows public + strips www', () => {
  assert(normalizeDomain('https://example.com') === 'example.com');
  assert(normalizeDomain('https://www.example.com/path?q=1') === 'example.com');
  assert(normalizeDomain('example.com') === 'example.com');
});
test('rejects non-http schemes', () => {
  assert(normalizeUrl('ftp://example.com') === null);
  assert(normalizeUrl('javascript:alert(1)') === null);
});
test('host classification', () => {
  assert(classifyHost('instagram.com') === 'social');
  assert(classifyHost('www.instagram.com') === 'social');
  assert(classifyHost('linktr.ee') === 'aggregator');
  assert(classifyHost('yelp.com') === 'directory');
  assert(classifyHost('my.wixsite.com') === 'builder');
  assert(classifyHost('booking.com') === 'booking');
  assert(classifyHost('example.com') === 'unknown');
});
test('dedup normalizes name+city, distinguishes cities', () => {
  assert(eq(dedupKey('Cafe Lo!', 'Dubai'), dedupKey('cafe lo', 'dubai')));
  assert(dedupKey('A', 'Dubai') !== dedupKey('A', 'Sharjah'));
});
test('classify: website_found on confirmed official destination', () => {
  const r = classifyVerification([check({ sourceType: 'listing', status: 'passed' }), check({ sourceType: 'web_search' })], confirmedDest());
  assert(r.classification === 'website_found', r.classification);
});
test('classify: broken_inaccessible on broken/parked candidate', () => {
  const r = classifyVerification([check({ sourceType: 'listing', status: 'passed', candidateDomains: [{ domain: 'x.com', url: 'https://x.com', note: '' }] })], confirmedDest({ status: 'broken', relevant: false, destinationType: 'parked', confidence: 55 }));
  assert(r.classification === 'broken_inaccessible', r.classification);
});
test('classify: needs_checking when candidates unconfirmed', () => {
  const r = classifyVerification([check({ sourceType: 'listing', status: 'passed', candidateDomains: [{ domain: 'x.com', url: 'https://x.com', note: '' }] })], null);
  assert(r.classification === 'needs_checking', r.classification);
});
test('classify: needs_checking when <5 checks completed', () => {
  const r = classifyVerification([check({ sourceType: 'listing' }), check({ sourceType: 'web_search' }), check({ sourceType: 'domain_fetch' })], null);
  assert(r.classification === 'needs_checking', r.classification);
});
test('classify: verified_no_website needs 5 negative checks + 2 mechanisms', () => {
  const checks: CheckResult[] = [check({ sourceType: 'listing' }), check({ sourceType: 'web_search' }), check({ sourceType: 'instagram_web' }), check({ sourceType: 'x_web' }), check({ sourceType: 'domain_fetch' })];
  const r = classifyVerification(checks, null);
  assert(r.classification === 'verified_no_website', r.classification);
  assert(r.independentMechanisms >= 2);
});
test('classify: single mechanism never confirms no-website', () => {
  const checks: CheckResult[] = Array.from({ length: 5 }, () => check({ sourceType: 'web_search' }));
  const r = classifyVerification(checks, null);
  assert(r.classification === 'needs_checking', r.classification);
});
test('classify: timeout is never no-website', () => {
  const r = classifyVerification([check({ sourceType: 'listing', status: 'passed', candidateDomains: [{ domain: 'x.com', url: 'https://x.com', note: '' }] })], confirmedDest({ status: 'timeout', relevant: false, confidence: 20 }));
  assert(r.classification === 'needs_checking', r.classification);
});
test('Overpass query is bounded with area + tags + limit', () => {
  const q = buildOverpassQuery({ city: 'Dubai', industry: 'Restaurants and cafes', limit: 5 });
  assert(q.includes('area[name="Dubai"]'));
  assert(q.includes('"amenity"="restaurant"'));
  assert(q.includes('out center 5'));
  assert(q.includes('[timeout:25]'));
});
test('parseOverpass extracts fields and dedups', () => {
  const el = { type: 'node', id: 1, lat: 1, lon: 2, tags: { name: 'Cafe A', website: 'https://a.com', phone: '+1', 'contact:email': 'x@a.com', opening_hours: 'Mo-Fr 09:00-17:00', 'addr:street': 'Main St' } };
  const rows = parseOverpass([el, el], 'Restaurants and cafes', 'Dubai', 'AE');
  assert(rows.length === 1, `len ${rows.length}`);
  assert(rows[0].name === 'Cafe A');
  assert(rows[0].website_url === 'https://a.com');
  assert(rows[0].opening_hours === 'Mo-Fr 09:00-17:00');
  assert(rows[0].provider === 'openstreetmap');
});
test('extractWebCandidates separates social from official', () => {
  const results = [
    { url: 'https://instagram.com/glowbeauty', title: 'Glow', content: '', engine: 'google' },
    { url: 'https://example.com', title: 'Glow Beauty', content: '', engine: 'bing' },
    { url: 'https://yelp.com/biz/glow', title: 'Glow', content: '', engine: 'google' },
  ];
  const { candidates, profileUrls, resultCount } = extractWebCandidates(results, { socialHosts: ['instagram.com'], classifyHost, normalizeDomain });
  assert(resultCount === 3);
  assert(eq(candidates.map((c) => c.domain), ['example.com']));
  assert(profileUrls[0].includes('instagram.com'));
});
test('prospect scoring: separate dimensions, clamped, confidence != opportunity', () => {
  const biz = { website_classification: 'verified_no_website', email: 'a@b.com', phone: '', rating: 4.5, provider: 'openstreetmap', address: 'x' };
  const checks: CheckResult[] = Array.from({ length: 5 }, (_, i) => check({ sourceType: ['listing', 'web_search', 'instagram_web', 'x_web', 'domain_fetch'][i] }));
  const s = computeProspectScores(biz, checks, null);
  assert(s.website_opportunity >= 80, `wo ${s.website_opportunity}`);
  for (const v of [s.website_opportunity, s.identity_confidence, s.contactability, s.data_freshness, s.overall_opportunity]) {
    assert(v >= 0 && v <= 100, `out of range ${v}`);
  }
  assert(s.confidence === s.identity_confidence);
});
test('Overpass: around query when lat/lon present', () => {
  const q = buildOverpassQuery({ city: 'Dubai', industry: 'Restaurants and cafes', limit: 10, lat: 25.2, lon: 55.27, radius: 3000 });
  assert(q.includes('around:3000,25.2,55.27'), q);
  assert(!q.includes('area[name='), 'around query must not use area filter');
});
test('Overpass: area query when no coords', () => {
  const q = buildOverpassQuery({ city: 'Dubai', industry: 'Restaurants and cafes', limit: 10 });
  assert(q.includes('area[name="Dubai"]'), q);
  assert(!q.includes('around:'), 'area query must not use around filter');
});
test('Overpass: radius clamped to 500m–50km', () => {
  const lo = buildOverpassQuery({ city: 'X', industry: 'Retail stores', limit: 5, lat: 1, lon: 2, radius: 100 });
  assert(lo.includes('around:500,1,2'), lo);
  const hi = buildOverpassQuery({ city: 'X', industry: 'Retail stores', limit: 5, lat: 1, lon: 2, radius: 999999 });
  assert(hi.includes('around:50000,1,2'), hi);
  const def = buildOverpassQuery({ city: 'X', industry: 'Retail stores', limit: 5, lat: 1, lon: 2 });
  assert(def.includes('around:2000,1,2'), def);
});

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // auth disabled (anonymous demo mode)
    // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 }); // re-enable to restore auth
    const passed = results.filter((r) => r.pass).length;
    const failed = results.length - passed;
    return Response.json({
      total: results.length,
      passed,
      failed,
      all_passed: failed === 0,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}