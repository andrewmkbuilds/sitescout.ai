import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { overpassSearch, demoBusinesses, logUsage, OSM_ATTRIBUTION } from '../../shared/freeSources.ts';

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
      lat: body.lat != null && body.lat !== '' ? Number(body.lat) : undefined,
      lon: body.lon != null && body.lon !== '' ? Number(body.lon) : undefined,
      radius: body.radius != null && body.radius !== '' ? Number(body.radius) : undefined,
    };
    const limit = Math.min(parseInt(body.limit, 10) || 20, 60);
    const endpoint = secrets.get('OVERPASS_ENDPOINT');

    // OpenStreetMap / Overpass — free, open data. No paid API.
    const { rows, error, endpoint: usedEndpoint } = await overpassSearch(
      { ...query, limit }, endpoint
    );

    if (rows.length === 0 && error) {
      // Free source unreachable — fall back to clearly-labelled demo data.
      const items = demoBusinesses(query, limit);
      return Response.json({
        items,
        source: 'demo',
        demo_mode: true,
        attribution: OSM_ATTRIBUTION,
        coverage_note: 'OpenStreetMap/Overpass was unreachable (' + error + '). Showing labelled sample data. Retry, or configure a self-hosted Overpass endpoint (OVERPASS_ENDPOINT) for higher reliability.',
        message: 'Demo mode — OpenStreetMap source unavailable.',
      });
    }

    await logUsage(base44, 'overpass_request');
    return Response.json({
      items: rows,
      source: 'openstreetmap',
      demo_mode: false,
      attribution: OSM_ATTRIBUTION,
      coverage_note: 'Businesses mapped in OpenStreetMap only. Not every business appears in OSM — coverage varies by region. No paid API used.',
      endpoint: usedEndpoint,
      message: rows.length ? `${rows.length} businesses found in OpenStreetMap.` : 'No businesses found in OpenStreetMap for this area/category. Try a broader search.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}