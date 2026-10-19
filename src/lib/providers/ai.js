// =============================================================================
// AI provider interface
// =============================================================================
// Outreach generation, concept generation, and general LLM calls. The
// deterministic fallback (rule-based templates) is always available and never
// invents evidence. Ollama (self-hosted) is used when configured. The Base44
// backend wrappers (generateOutreach, generateConcept) and InvokeLLM are used
// only when available on the plan.
// =============================================================================

import { base44 } from '@/api/base44Client';
import { BACKEND_FUNCTIONS_AVAILABLE } from '@/lib/env';

export const aiProvider = {
  // Server-side outreach generation. Null when the backend is unavailable —
  // callers fall back to the client-side template engine (src/lib/pitchTemplates.js).
  generateOutreach: async (ctx) => {
    if (!BACKEND_FUNCTIONS_AVAILABLE) return null;
    const res = await base44.functions.invoke('generateOutreach', ctx);
    return res.data || res;
  },

  // Server-side website concept generation. Null when unavailable.
  generateConcept: async (ctx) => {
    if (!BACKEND_FUNCTIONS_AVAILABLE) return null;
    const res = await base44.functions.invoke('generateConcept', ctx);
    return res.data || res;
  },

  // General LLM call via the platform integration. Throws when unavailable.
  invokeLLM: async (prompt, opts) => {
    if (!BACKEND_FUNCTIONS_AVAILABLE) {
      throw new Error('LLM calls require a Builder+ plan. Use the deterministic fallback instead.');
    }
    return base44.integrations.Core.InvokeLLM({ prompt, ...opts });
  },
};