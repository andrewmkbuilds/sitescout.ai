import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { overpassSearch, demoBusinesses, logUsage, OSM_ATTRIBUTION } from '../../shared/freeSources.ts';
import { dedupKey } from '../../shared/verification.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // auth disabled (anonymous demo mode)
    // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 }); // re-enable to restore auth

    const body = await req.json().catch(() => ({}));
    const query = {
      country: body.country || '',
      city: body.city || '',
      industry: body.industry || '',
      category: body.category || '',
      name: body.name || '',
      keywords: body.keywords || '',
    };
    const geo = {
      lat: body.lat != null && body.lat !== '' ? Number(body.lat) : undefined,
      lon: body.lon != null && body.lon !== '' ? Number(body.lon) : undefined,
      radius: body.radius != null && body.radius !== '' ? Number(body.radius) : undefined,
    };
    const locationLabel = body.location_label || '';
    const maxRecords = Math.min(parseInt(body.max_records, 10) || 20, 60);
    const sources = Array.isArray(body.sources) && body.sources.length ? body.sources : ['listing', 'web_search', 'instagram', 'x_social', 'directory'];
    const verificationDepth = body.verification_depth || 'standard';
    const minConfidence = parseInt(body.min_confidence, 10) || 0;
    const includeNeedsImprovement = body.include_needs_improvement !== false;
    const includeUnresolved = body.include_unresolved !== false;

    const overpassEndpoint = secrets.get('OVERPASS_ENDPOINT');
    const searxngUrl = secrets.get('SEARXNG_URL');

    let items = [];
    let demoMode = false;
    let sourceInfo = 'openstreetmap';
    let coverageNote = '';

    if (sources.includes('listing')) {
      const { rows, error } = await overpassSearch({ ...query, ...geo, limit: maxRecords }, overpassEndpoint);
      if (rows.length === 0 && error) {
        items = demoBusinesses(query, maxRecords);
        demoMode = true;
        sourceInfo = 'demo (overpass unreachable)';
        coverageNote = 'OpenStreetMap/Overpass unreachable (' + error + '). Showing labelled sample data.';
      } else {
        items = rows;
        await logUsage(base44, 'overpass_request');
        coverageNote = 'Businesses mapped in OpenStreetMap only — coverage varies by region. No paid API used.';
      }
    } else {
      sourceInfo = 'listing source not selected';
    }

    // Dedup against existing businesses by provider_id and name+city.
    const providerIds = items.map((b) => b.provider_id).filter(Boolean);
    const existingByPid = new Set();
    const existingByKeys = new Set();
    if (providerIds.length) {
      const page = await base44.entities.Business.filter({ provider_id: { $in: providerIds } }, { limit: 200, fields: ['provider_id', 'name', 'city'] });
      (page.items || []).forEach((b) => {
        if (b.provider_id) existingByPid.add(b.provider_id);
        existingByKeys.add(dedupKey(b.name, b.city));
      });
    }
    const seen = new Set();
    const newRecords = [];
    items.forEach((b) => {
      const pid = b.provider_id;
      const key = dedupKey(b.name, b.city);
      if (pid && existingByPid.has(pid)) return;
      if (existingByKeys.has(key)) return;
      if (seen.has(pid) || seen.has(key)) return;
      seen.add(pid); seen.add(key);
      newRecords.push({
        name: b.name, industry: b.industry, category: b.category, country: b.country,
        city: b.city, address: b.address, website_url: b.website_url, phone: b.phone, email: b.email,
        listing_url: b.listing_url, provider: b.provider, provider_id: b.provider_id,
        rating: b.rating, review_count: b.review_count,
        website_status: b.website_status || (b.website_url ? 'unverified' : 'no_website_listed'),
        is_demo: !!b.is_demo, last_verified: b.retrieved_at || new Date().toISOString(),
        website_classification: 'needs_checking',
        confirmed_website_url: '', verification_confidence: 0, checks_completed: 0,
        verification_checks: [], candidate_domains: [], source_coverage: {}, manual_overrides: [],
      });
    });

    let savedBusinesses = [];
    if (newRecords.length) {
      savedBusinesses = await base44.entities.Business.bulkCreate(newRecords);
    }

    const counts = {
      discovered: items.length,
      deduped: items.length - newRecords.length,
      saved: savedBusinesses.length,
      verified: 0, found: 0, no_website: 0, needs_review: 0, broken: 0, needs_improvement: 0, failed: 0,
    };

    const searxngAvailable = !!searxngUrl;
    const job = await base44.entities.ResearchJob.create({
      query: { ...query, location_label: locationLabel, radius: geo.radius || null },
      status: 'running',
      sources,
      max_records: maxRecords,
      verification_depth: verificationDepth,
      min_confidence: minConfidence,
      include_needs_improvement: includeNeedsImprovement,
      include_unresolved: includeUnresolved,
      counts,
      source_usage: {
        listing: sourceInfo,
        web_search: searxngAvailable ? 'searxng' : 'unconfigured',
        instagram: searxngAvailable ? 'searxng' : 'unconfigured',
        x_social: searxngAvailable ? 'searxng' : 'unconfigured',
        directory: searxngAvailable ? 'searxng' : 'unconfigured',
      },
      business_ids: savedBusinesses.map((b) => b.id),
      demo_mode: demoMode,
      started_at: new Date().toISOString(),
    });

    if (savedBusinesses.length) {
      await base44.entities.Business.bulkUpdate(savedBusinesses.map((b) => ({ id: b.id, research_job_id: job.id })));
    }

    return Response.json({
      job_id: job.id,
      business_ids: savedBusinesses.map((b) => b.id),
      counts,
      demo_mode: demoMode,
      source_info: sourceInfo,
      attribution: OSM_ATTRIBUTION,
      coverage_note: coverageNote,
      searxng_configured: searxngAvailable,
      message: demoMode
        ? `Demo mode — OpenStreetMap source unavailable. Web research is ${searxngAvailable ? 'enabled via SearXNG' : 'disabled (configure SEARXNG_URL)'}.`
        : 'Discovery complete via OpenStreetMap (free, open data). Verification ready.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}