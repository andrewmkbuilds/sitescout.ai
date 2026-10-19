// =============================================================================
// Search / discovery provider interface
// =============================================================================
// Business discovery + web research. The free-first implementation logic lives
// in base44/shared/freeSources.ts (OpenStreetMap/Overpass + SearXNG) and runs
// server-side inside the Base44 backend wrappers. On the current plan those
// wrappers (discoverBusinesses, checkSources) are unavailable, so this provider
// exposes a flag and returns null instead of attempting a call that cannot run.
//
// After migration, re-implement these against the free client functions directly
// (Overpass + SearXNG) inside Next.js route handlers — see MIGRATION.md.
//
//   discoverBusinesses(params): Promise<result> | null
//   checkSources(): Promise<status> | null
// =============================================================================

import { base44 } from '@/api/base44Client';
import { BACKEND_FUNCTIONS_AVAILABLE } from '@/lib/env';

export const searchProvider = {
  // Server-side OSM/Overpass discovery. Null when the backend function is
  // unavailable on the current plan. Migration target: call overpassSearch()
  // (base44/shared/freeSources.ts) directly from a route handler.
  discoverBusinesses: async (params) => {
    if (!BACKEND_FUNCTIONS_AVAILABLE) return null;
    const res = await base44.functions.invoke('discoverBusinesses', params);
    return res.data || res;
  },

  // Server-side source health check. Null when unavailable (honest state).
  checkSources: async () => {
    if (!BACKEND_FUNCTIONS_AVAILABLE) return null;
    const res = await base44.functions.invoke('checkSources', {});
    return res.data || res;
  },
};