// =============================================================================
// SiteScout — centralized environment & configuration registry
// =============================================================================
// Every external dependency and tunable lives here so the rest of the app never
// reads process.env / secrets inline. Frontend code cannot read app secrets
// directly (they are server-side only); this module documents them and exposes
// the non-secret flags the UI needs to render honest "configuration required"
// states.
//
// --- App secrets (set in the dashboard → Secrets page; server-side only) ---
// OVERPASS_ENDPOINT   Optional. Public Overpass is used if unset.
// SEARXNG_URL         Optional. Self-hosted SearXNG base URL. Web research is
//                     disabled until this is set.
// URLPIPE_API_KEY     Optional. Free tier (no card). Enables real Lighthouse
//                     audits via URLpipe. Heuristic audits run without it.
// OLLAMA_URL          Optional. Self-hosted Ollama base URL. Deterministic
//                     templates are used otherwise (no AI cost).
// OLLAMA_MODEL        Optional. Defaults to 'llama3.2'.
// =============================================================================

// Confirmed restriction: backend functions (discoverBusinesses, auditWebsite,
// generateOutreach, generateConcept, verifyBusiness, startResearch,
// checkSources, selfTest, geocodeLocation) are NOT available on the current
// subscription plan. Flip this to `true` after upgrading to Builder+ so the UI
// stops gating these features. Until then, pages show an honest notice and a
// free fallback instead of attempting (and silently failing) the call.
export const BACKEND_FUNCTIONS_AVAILABLE = false;

export const SECRETS = [
  { key: 'OVERPASS_ENDPOINT', label: 'Overpass endpoint', required: false, free: true, description: 'Public Overpass is used by default. Set this only to point at your own self-hosted Overpass instance.' },
  { key: 'SEARXNG_URL', label: 'SearXNG URL', required: false, free: true, description: 'Base URL of a self-hosted SearXNG instance. Web research stays disabled until this is set.' },
  { key: 'URLPIPE_API_KEY', label: 'URLpipe API key', required: false, free: true, description: 'Free tier (no card needed). Enables real Lighthouse audits. Heuristic audits run without it.' },
  { key: 'OLLAMA_URL', label: 'Ollama URL', required: false, free: true, description: 'Base URL of a self-hosted Ollama instance. Deterministic templates are used otherwise.' },
  { key: 'OLLAMA_MODEL', label: 'Ollama model', required: false, free: true, description: 'Local model name. Defaults to llama3.2.' },
];

// Self-hosted / free-first defaults (no paid provider).
export const DEFAULTS = {
  OVERPASS_ENDPOINT: 'https://overpass-api.de/api/interpreter',
  OLLAMA_MODEL: 'llama3.2',
  OLLAMA_TIMEOUT_MS: 60000,
  SEARXNG_TIMEOUT_MS: 15000,
  OVERPASS_TIMEOUT_MS: 30000,
};