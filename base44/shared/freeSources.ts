// Free, open-source data-source clients for SiteScout AI.
// No paid APIs are used anywhere in this module. External endpoints are
// either public free services (OpenStreetMap/Overpass) or user-configured
// self-hosted instances (SearXNG, Lighthouse worker, Ollama). Configuration
// is passed in by the caller (read from app secrets) so this module has no
// direct dependency on paid credentials.

export const OSM_ATTRIBUTION =
  '© OpenStreetMap contributors — data licensed under the Open Database License (ODbL). https://www.openstreetmap.org/copyright';
export const OVERPASS_DEFAULT = 'https://overpass-api.de/api/interpreter';

const INDUSTRY_TAGS: Record<string, string[]> = {
  'Restaurants and cafes': ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food'],
  'Dental clinics and healthcare': ['amenity=dentist', 'amenity=clinic', 'amenity=doctors', 'healthcare=dentist'],
  'Beauty salons and spas': ['shop=hairdresser', 'shop=beauty', 'leisure=spa'],
  'Gyms and fitness studios': ['leisure=fitness_centre', 'leisure=sports_centre'],
  'Automotive garages and dealerships': ['shop=car_repair', 'shop=car', 'amenity=car_wash'],
  'Real estate agencies': ['office=estate_agent'],
  'Retail stores': ['shop=convenience', 'shop=clothes', 'shop=supermarket', 'shop=bakery'],
  'Home service providers': ['craft=plumber', 'craft=electrician', 'craft=carpenter'],
  'Professional service firms': ['office=lawyer', 'office=accountant', 'office=company'],
  'Education and tutoring centers': ['amenity=school', 'amenity=college', 'amenity=training'],
  'Hotels and tourism businesses': ['tourism=hotel', 'tourism=guest_house', 'tourism=apartment'],
  'Other local businesses': ['shop', 'office', 'amenity', 'craft', 'tourism', 'healthcare'],
};

export function industryTags(industry: string): string[] {
  return INDUSTRY_TAGS[industry] || INDUSTRY_TAGS['Other local businesses'];
}

export function inferIndustryFromTags(tags: any): string {
  const t = tags || {};
  if (['restaurant', 'cafe', 'fast_food'].includes(t.amenity)) return 'Restaurants and cafes';
  if (['dentist', 'clinic', 'doctors'].includes(t.amenity) || t.healthcare) return 'Dental clinics and healthcare';
  if (['hairdresser', 'beauty'].includes(t.shop) || t.leisure === 'spa') return 'Beauty salons and spas';
  if (['fitness_centre', 'sports_centre'].includes(t.leisure)) return 'Gyms and fitness studios';
  if (['car_repair', 'car'].includes(t.shop) || t.amenity === 'car_wash') return 'Automotive garages and dealerships';
  if (t.office === 'estate_agent') return 'Real estate agencies';
  if (['convenience', 'clothes', 'supermarket', 'bakery'].includes(t.shop)) return 'Retail stores';
  if (['plumber', 'electrician', 'carpenter'].includes(t.craft)) return 'Home service providers';
  if (['lawyer', 'accountant', 'company'].includes(t.office)) return 'Professional service firms';
  if (['school', 'college', 'training'].includes(t.amenity)) return 'Education and tutoring centers';
  if (['hotel', 'guest_house', 'apartment'].includes(t.tourism)) return 'Hotels and tourism businesses';
  return 'Other local businesses';
}

export function buildOverpassQuery(params: { city?: string; country?: string; industry?: string; limit: number; lat?: number; lon?: number; radius?: number }): string {
  const tags = industryTags(params.industry || '');
  const parts: string[] = [];
  const useAround = typeof params.lat === 'number' && typeof params.lon === 'number' && isFinite(params.lat) && isFinite(params.lon);
  const radius = Math.min(Math.max(params.radius || 2000, 500), 50000); // metres, capped 0.5–50 km
  for (const t of tags) {
    if (t.includes('=')) {
      const [k, v] = t.split('=');
      if (useAround) {
        parts.push(`node["${k}"="${v}"](around:${radius},${params.lat},${params.lon});`);
        parts.push(`way["${k}"="${v}"](around:${radius},${params.lat},${params.lon});`);
      } else {
        parts.push(`node["${k}"="${v}"](area.a);`);
        parts.push(`way["${k}"="${v}"](area.a);`);
      }
    } else {
      if (useAround) {
        parts.push(`node["${t}"](around:${radius},${params.lat},${params.lon});`);
        parts.push(`way["${t}"](around:${radius},${params.lat},${params.lon});`);
      } else {
        parts.push(`node["${t}"](area.a);`);
        parts.push(`way["${t}"](area.a);`);
      }
    }
  }
  const limit = Math.min(Math.max(params.limit || 20, 1), 60);
  if (useAround) {
    return `[out:json][timeout:25];(${parts.join('')});out center ${limit};`;
  }
  const areaName = (params.city || params.country || '').replace(/["\\]/g, '');
  return `[out:json][timeout:25];area[name="${areaName}"]->.a;(${parts.join('')});out center ${limit};`;
}

export interface OverpassRow {
  name: string; industry: string; category: string; country: string; city: string;
  address: string; website_url: string; phone: string; email: string; listing_url: string;
  provider: string; provider_id: string; rating: number | null; review_count: number | null;
  website_status: string; retrieved_at: string; is_demo: boolean; lat: number | null; lon: number | null; opening_hours: string;
}

export function parseOverpass(elements: any[], industry: string, city: string, country: string): OverpassRow[] {
  const seen = new Set<string>();
  const rows: OverpassRow[] = [];
  for (const el of elements || []) {
    const t = el.tags || {};
    if (!t.name) continue;
    const lat = el.lat ?? (el.center && el.center.lat) ?? null;
    const lon = el.lon ?? (el.center && el.center.lon) ?? null;
    const website = (t.website || t['contact:website'] || t.url || '').trim();
    const phone = (t.phone || t['contact:phone'] || '').trim();
    const email = (t.email || t['contact:email'] || '').trim();
    const openingHours = (t.opening_hours || '').trim();
    const addrParts = [t['addr:housenumber'], t['addr:street'], t['addr:suburb'], t['addr:city'], t['addr:country']].filter(Boolean);
    const address = addrParts.join(' ').trim();
    const key = (t.name + '|' + (address || `${lat},${lon}`)).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      name: t.name,
      industry: industry || inferIndustryFromTags(t),
      category: '',
      country: country || '',
      city: city || '',
      address,
      website_url: website,
      phone, email,
      listing_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      provider: 'openstreetmap',
      provider_id: `osm-${el.type}-${el.id}`,
      rating: null, review_count: null,
      website_status: website ? 'unverified' : 'no_website_listed',
      retrieved_at: new Date().toISOString(),
      is_demo: false, lat, lon, opening_hours: openingHours,
    });
  }
  return rows;
}

export async function overpassSearch(
  params: { city?: string; country?: string; industry?: string; name?: string; limit: number; lat?: number; lon?: number; radius?: number },
  endpoint?: string
): Promise<{ rows: OverpassRow[]; error?: string; endpoint: string }> {
  const url = (endpoint || OVERPASS_DEFAULT).replace(/\/$/, '');
  const query = buildOverpassQuery(params);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'SiteScoutAI-Discovery/1.0 (open-source business research)' },
      body: 'data=' + encodeURIComponent(query),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return { rows: [], error: `Overpass HTTP ${r.status}`, endpoint: url };
    const data = await r.json();
    let rows = parseOverpass(data.elements || [], params.industry || '', params.city || '', params.country || '');
    if (params.name) {
      const n = params.name.toLowerCase();
      rows = rows.filter((x) => x.name.toLowerCase().includes(n));
    }
    return { rows, endpoint: url };
  } catch (e: any) {
    return { rows: [], error: 'Overpass request failed: ' + (e?.message || e), endpoint: url };
  }
}

// --- SearXNG (self-hosted open-source metasearch) ---
export interface SearXNGResult { url: string; title: string; content: string; engine: string; }

export async function searxngSearch(
  query: string,
  searxngUrl: string | undefined,
  opts?: { categories?: string }
): Promise<{ results: SearXNGResult[]; available: boolean; error?: string }> {
  if (!searxngUrl) return { results: [], available: false };
  try {
    const base = searxngUrl.replace(/\/$/, '');
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('format', 'json');
    if (opts?.categories) params.set('categories', opts.categories);
    const r = await fetch(`${base}/search?${params.toString()}`, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'SiteScoutAI-Research/1.0', 'Accept': 'application/json' },
    });
    if (!r.ok) return { results: [], available: false, error: `SearXNG HTTP ${r.status}` };
    const data = await r.json();
    return { results: (data.results || []) as SearXNGResult[], available: true };
  } catch (e: any) {
    return { results: [], available: false, error: 'SearXNG request failed: ' + (e?.message || e) };
  }
}

// Extract candidate website domains + profile evidence from SearXNG results.
// `socialHosts` restricts which result hosts count as profile evidence.
export function extractWebCandidates(
  results: SearXNGResult[],
  opts: { socialHosts?: string[]; classifyHost: (h: string) => string; normalizeDomain: (u: string) => string }
) {
  const socialHosts = opts.socialHosts || [];
  const candidates: { domain: string; url: string; note: string }[] = [];
  const profileUrls: string[] = [];
  const seenDom = new Set<string>();
  for (const res of results.slice(0, 20)) {
    if (!res.url) continue;
    let host = '';
    try { host = new URL(res.url).hostname.toLowerCase().replace(/^www\./, ''); } catch { continue; }
    const isSocial = socialHosts.some((s) => host === s || host.endsWith('.' + s));
    if (isSocial) {
      if (!profileUrls.includes(res.url)) profileUrls.push(res.url);
      continue;
    }
    const type = opts.classifyHost(host);
    // Accept official (unknown) and builder-hosted sites as real websites.
    if (type !== 'unknown' && type !== 'builder') continue;
    const dom = opts.normalizeDomain(res.url);
    if (!dom || seenDom.has(dom)) continue;
    seenDom.add(dom);
    candidates.push({ domain: dom, url: res.url, note: `Discovered via SearXNG (${res.engine || 'search'})` });
  }
  return { candidates, profileUrls, resultCount: results.length };
}

// --- Ollama (self-hosted local LLM) ---
export async function ollamaGenerate(
  prompt: string,
  ollamaUrl: string | undefined,
  opts?: { model?: string; json?: boolean; timeoutMs?: number }
): Promise<{ text: string; available: boolean; error?: string }> {
  if (!ollamaUrl) return { text: '', available: false };
  try {
    const base = ollamaUrl.replace(/\/$/, '');
    const body: any = { prompt, stream: false, model: opts?.model || 'llama3.2' };
    if (opts?.json) body.format = 'json';
    const r = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts?.timeoutMs || 60000),
    });
    if (!r.ok) return { text: '', available: false, error: `Ollama HTTP ${r.status}` };
    const data = await r.json();
    return { text: data.response || '', available: true };
  } catch (e: any) {
    return { text: '', available: false, error: 'Ollama request failed: ' + (e?.message || e) };
  }
}

// --- Local usage tracking (no external cost) ---
export async function logUsage(base44: any, metric: string): Promise<void> {
  try {
    const period = new Date().toISOString().slice(0, 10);
    await base44.entities.UsageRecord.create({ metric, period, count: 1 });
  } catch {}
}

// --- Clearly-labelled demo fixtures (fallback only when a free source is unreachable) ---
export function demoBusinesses(query: { city?: string; country?: string; industry?: string; name?: string }, limit: number): OverpassRow[] {
  const city = query.city || 'Dubai';
  const country = query.country || 'United Arab Emirates';
  const seed = [
    { name: 'Bloom Dental Clinic', industry: 'Dental clinics and healthcare', website_url: '' },
    { name: 'Saffron Bistro', industry: 'Restaurants and cafes', website_url: '' },
    { name: 'Glow Beauty Lounge', industry: 'Beauty salons and spas', website_url: '' },
    { name: 'Iron Peak Fitness', industry: 'Gyms and fitness studios', website_url: '' },
    { name: 'Al Mansour Auto Garage', industry: 'Automotive garages and dealerships', website_url: '' },
    { name: 'Skyline Realty', industry: 'Real estate agencies', website_url: '' },
    { name: 'Little Minds Tutoring', industry: 'Education and tutoring centers', website_url: '' },
    { name: 'Desert Bloom Hotel', industry: 'Hotels and tourism businesses', website_url: '' },
    { name: 'Urban Threads Boutique', industry: 'Retail stores', website_url: '' },
    { name: 'QuickFix Home Services', industry: 'Home service providers', website_url: '' },
    { name: 'Horizon Legal Advisors', industry: 'Professional service firms', website_url: '' },
    { name: 'Petals Spa & Wellness', industry: 'Beauty salons and spas', website_url: '' },
  ];
  let rows = seed;
  if (query.industry) rows = rows.filter((b) => b.industry === query.industry);
  if (query.name) rows = rows.filter((b) => b.name.toLowerCase().includes(String(query.name).toLowerCase()));
  return rows.slice(0, limit || 50).map((b, i) => ({
    name: b.name, industry: b.industry, category: '', country, city,
    address: `${city}, ${country}`, website_url: b.website_url, phone: '', email: '',
    listing_url: '', provider: 'demo', provider_id: `demo-${b.name.replace(/\s+/g, '-').toLowerCase()}-${i}`,
    rating: null, review_count: null,
    website_status: b.website_url ? 'unverified' : 'no_website_listed',
    retrieved_at: new Date().toISOString(), is_demo: true, lat: null, lon: null, opening_hours: '',
  }));
}

// Multi-dimensional, explainable prospect scoring (Phase 4). Each dimension is
// kept separate so confidence is never hidden inside the opportunity score.
export function computeProspectScores(business: any, checks: any[], qualityScore: number | null) {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const all = checks || [];
  const completed = all.filter((c) => c.status === 'passed' || c.status === 'negative');
  const unavailable = all.filter((c) => c.status === 'unavailable');
  const classification = business.website_classification || '';

  // Website opportunity — higher means a stronger prospect.
  let wo = 50;
  if (classification === 'verified_no_website') wo += 30;
  else if (classification === 'broken_inaccessible') wo += 22;
  else if (classification === 'needs_improvement' && qualityScore != null) wo += Math.round((100 - qualityScore) * 0.3);
  else if (classification === 'website_found') wo -= 20;
  else if (classification === 'needs_checking') wo -= 5;
  if (business.email || business.phone) wo += 8; else wo -= 6;
  if (business.rating && business.rating >= 4) wo += 5;
  else if (business.rating && business.rating < 3.5) wo -= 6;
  wo = clamp(wo);

  // Identity confidence — how sure we are this is a real, correctly-identified business.
  let ic = 30;
  if (business.provider && business.provider !== 'demo') ic += 20;
  if (business.address) ic += 10;
  if (business.phone || business.email) ic += 10;
  ic += Math.min(25, completed.length * 5);
  ic -= unavailable.length * 5;
  if (business.rating) ic += 5;
  ic = clamp(ic);

  // Contactability — whether a legitimate contact channel exists.
  let ct = 0;
  if (business.email) ct += 50;
  if (business.phone) ct += 30;
  if (business.address) ct += 10;
  if (business.listing_url) ct += 10;
  ct = clamp(ct);

  // Data freshness — newer evidence scores higher.
  let df = 50;
  const lv = business.last_verified || business.retrieved_at || business.created_date;
  if (lv) {
    const days = (Date.now() - new Date(lv).getTime()) / 86400000;
    if (days < 7) df = 95; else if (days < 30) df = 80; else if (days < 90) df = 60; else if (days < 365) df = 40; else df = 20;
  }

  const wq = qualityScore != null ? qualityScore : null;
  const overall = clamp(wo * 0.5 + ic * 0.2 + ct * 0.15 + df * 0.15);
  return { website_opportunity: wo, identity_confidence: ic, contactability: ct, data_freshness: df, website_quality: wq, overall_opportunity: overall, confidence: ic };
}