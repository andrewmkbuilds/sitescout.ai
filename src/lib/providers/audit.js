// =============================================================================
// Audit provider interface
// =============================================================================
// Website auditing. The Base44 backend wrapper (auditWebsite, backed by the
// URLpipe Lighthouse API or a heuristic crawler) is used when available on the
// plan. Otherwise callers fall back to the client-side heuristic audit
// (base44/shared/urlpipeAudit.ts contains the shared scoring logic).
//
//   auditWebsite(url): Promise<auditResult> | null
// =============================================================================

import { base44 } from '@/api/base44Client';
import { BACKEND_FUNCTIONS_AVAILABLE } from '@/lib/env';

export const auditProvider = {
  auditWebsite: async (url) => {
    if (!BACKEND_FUNCTIONS_AVAILABLE) return null;
    const res = await base44.functions.invoke('auditWebsite', { url });
    return res.data || res;
  },
};