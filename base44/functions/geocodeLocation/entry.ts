// OpenStreetMap Nominatim geocoding — free, open data. No paid API.
// Reverse: lat/lon -> city/region/country (zoom=10 returns a city-level
// centroid, NOT the user's exact GPS point, so it is safe to use as a search
// centre). Forward: query -> suggested places with centroids.
//
// Usage policy: a descriptive User-Agent, low request volume, and a single
// request per user action. The public endpoint is used by default; to use a
// self-hosted Nominatim, change NOMINATIM_ENDPOINT below (or wire it to an app
// secret). https://wiki.openstreetmap.org/wiki/Usage_policy

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SiteScoutAI-Geocoder/1.0 (open-source business research)';
const ATTRIBUTION = '© OpenStreetMap contributors — Nominatim. https://nominatim.openstreetmap.org/';

function pickAddressFields(address: any) {
  const a = address || {};
  const city = a.city || a.town || a.village || a.hamlet || a.municipality || a.county || '';
  const region = a.state || a.region || a.province || '';
  const country = a.country || '';
  const countryCode = a.country_code || '';
  return { city, region, country, countryCode };
}

function coords(v: any): number | null {
  const n = Number(v);
  return isFinite(n) ? n : null;
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // auth disabled (anonymous demo mode)
    // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 }); // re-enable to restore auth

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'reverse';
    const base = (NOMINATIM_ENDPOINT || '').replace(/\/$/, '');

    if (mode === 'reverse') {
      const lat = Number(body.lat);
      const lon = Number(body.lon);
      if (!isFinite(lat) || !isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return Response.json({ error: 'Invalid coordinates' }, { status: 400 });
      }
      const url = `${base}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=en`;
      try {
        const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(12000) });
        if (!r.ok) return Response.json({ error: `Geocoding service returned HTTP ${r.status}` }, { status: 502 });
        const data = await r.json();
        if (!data || (!data.address && !data.display_name)) {
          return Response.json({ error: 'No address found for these coordinates' }, { status: 404 });
        }
        const f = pickAddressFields(data.address);
        const label = [f.city, f.region, f.country].filter(Boolean).join(', ') || data.display_name || '';
        return Response.json({
          mode: 'reverse',
          display_name: data.display_name || label,
          city: f.city, region: f.region, country: f.country, country_code: f.countryCode,
          lat: coords(data.lat) ?? lat, lon: coords(data.lon) ?? lon,
          label, attribution: ATTRIBUTION,
        });
      } catch (e: any) {
        return Response.json({ error: 'Reverse geocoding failed: ' + (e?.message || e) }, { status: 502 });
      }
    }

    // forward search (suggestions for manual entry)
    const q = String(body.query || '').trim();
    if (q.length < 2) return Response.json({ mode: 'search', items: [], attribution: ATTRIBUTION });
    const url = `${base}/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=6&accept-language=en`;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(12000) });
      if (!r.ok) return Response.json({ error: `Geocoding service returned HTTP ${r.status}` }, { status: 502 });
      const data = await r.json();
      const items = (Array.isArray(data) ? data : []).map((d: any) => {
        const f = pickAddressFields(d.address);
        const label = [f.city, f.region, f.country].filter(Boolean).join(', ') || d.display_name || '';
        return {
          display_name: d.display_name || label,
          city: f.city, region: f.region, country: f.country, country_code: f.countryCode,
          lat: coords(d.lat), lon: coords(d.lon), label, attribution: ATTRIBUTION,
        };
      });
      return Response.json({ mode: 'search', items, attribution: ATTRIBUTION });
    } catch (e: any) {
      return Response.json({ error: 'Location search failed: ' + (e?.message || e) }, { status: 502 });
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}