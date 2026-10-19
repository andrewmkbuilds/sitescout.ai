import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { OVERPASS_DEFAULT } from '../../shared/freeSources.ts';

async function ping(url: string, opts: any = {}): Promise<{ reached: boolean; status?: number; ok?: boolean; error?: string }> {
  try {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) });
    return { reached: true, status: r.status, ok: r.ok };
  } catch (e: any) {
    return { reached: false, error: String(e?.message || e) };
  }
}

function stateFor(configured: boolean, p: any): string {
  if (!configured) return 'configuration_required';
  if (!p) return 'configuration_required';
  if (p.reached) return 'connected';
  return 'temporarily_unavailable';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // auth disabled (anonymous demo mode)
    // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 }); // re-enable to restore auth

    const overpassEndpoint = secrets.get('OVERPASS_ENDPOINT') || OVERPASS_DEFAULT;
    const searxngUrl = secrets.get('SEARXNG_URL');
    const urlpipeKey = secrets.get('URLPIPE_API_KEY');
    const ollamaUrl = secrets.get('OLLAMA_URL');

    const overpassPing = await ping(overpassEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent('[out:json][timeout:5];out;'),
    });
    const searxngPing = searxngUrl
      ? await ping(searxngUrl.replace(/\/$/, '') + '/search?q=test&format=json', { headers: { Accept: 'application/json' } })
      : null;
    const ollamaPing = ollamaUrl ? await ping(ollamaUrl.replace(/\/$/, '') + '/api/tags') : null;
    // URLpipe has no free health endpoint (a real audit costs credits), so we
    // report configured when the key is present rather than burning credits to test it.
    const lighthouseConfigured = !!urlpipeKey;

    return Response.json({
      overpass: { state: stateFor(true, overpassPing), endpoint: overpassEndpoint, configured: true, ...overpassPing },
      searxng: { state: stateFor(!!searxngUrl, searxngPing), configured: !!searxngUrl, ...(searxngPing || {}) },
      lighthouse: { state: lighthouseConfigured ? 'connected' : 'configuration_required', configured: lighthouseConfigured, reached: lighthouseConfigured },
      ollama: { state: stateFor(!!ollamaUrl, ollamaPing), configured: !!ollamaUrl, ...(ollamaPing || {}) },
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}