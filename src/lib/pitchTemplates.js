// Evidence-aware outreach template engine: placeholder reference, context
// builder, safe resolution (no broken placeholders, no fabricated claims),
// and template recommendation. All client-side — no credits, no AI calls.

import { PREFERENCE_DEFAULTS } from '@/lib/outreachPreferences';

export const PLACEHOLDERS = [
  { token: '{{business_name}}', label: 'Business name', evidence: false },
  { token: '{{business_category}}', label: 'Business category', evidence: false },
  { token: '{{business_location}}', label: 'Business location', evidence: false },
  { token: '{{city}}', label: 'City', evidence: false },
  { token: '{{website_url}}', label: 'Website URL', evidence: true },
  { token: '{{verified_website_status}}', label: 'Verified website status', evidence: true },
  { token: '{{verified_issue}}', label: 'Verified issue', evidence: true },
  { token: '{{audit_finding}}', label: 'Top audit finding', evidence: true },
  { token: '{{audit_score}}', label: 'Audit score', evidence: true },
  { token: '{{top_issue}}', label: 'Top audit issue', evidence: true },
  { token: '{{recommended_service}}', label: 'Recommended service', evidence: false },
  { token: '{{contact_name_or_business_team}}', label: 'Contact name / team', evidence: false },
  { token: '{{sender_name}}', label: 'Sender name', evidence: false },
  { token: '{{agency_name}}', label: 'Agency name', evidence: false },
  { token: '{{preferred_cta}}', label: 'Preferred CTA', evidence: false },
];

export const GENERATION_METHODS = {
  TEMPLATE: 'Template-generated',
  AI: 'AI-generated',
  HYBRID: 'Template + AI personalized',
};

// Tokens that represent real evidence. If the evidence is missing, the
// sentence that depends on the token is removed rather than fabricated.
const EVIDENCE_TOKENS = new Set([
  'website_url',
  'verified_website_status',
  'verified_issue',
  'audit_finding',
  'audit_score',
  'top_issue',
]);

// Build the placeholder context from a business, its latest audit, and the
// user's outreach preferences. Non-evidence fields get neutral fallbacks so
// they never produce a broken sentence; evidence fields stay empty when the
// underlying fact is absent (so the dependent sentence gets removed).
export function buildContext(business, audit, preferences = {}) {
  const p = { ...PREFERENCE_DEFAULTS, ...preferences };
  const findings = audit && Array.isArray(audit.findings) ? audit.findings : [];
  const topFinding = findings.find((f) => f.status !== 'pass') || null;
  const hasWebsite = !!(business?.confirmed_website_url || business?.website_url);
  const suggested = Array.isArray(business?.suggested_services) && business.suggested_services.length
    ? business.suggested_services[0]
    : (p.services ? p.services.split(',')[0].trim() : 'a new website');

  return {
    business_name: business?.name || '',
    business_category: business?.industry || 'local',
    business_location: business?.city || business?.address || 'your area',
    city: business?.city || 'your area',
    website_url: hasWebsite ? (business?.confirmed_website_url || business?.website_url) : '',
    verified_website_status: business?.website_status || '',
    verified_issue: topFinding ? `${topFinding.check}: ${topFinding.message}` : '',
    audit_finding: topFinding ? topFinding.message : '',
    audit_score: audit?.overall_score != null ? audit.overall_score : '',
    top_issue: topFinding ? `${topFinding.check}: ${topFinding.message}` : '',
    recommended_service: suggested,
    contact_name_or_business_team: business?.contact_name || `the ${business?.name || 'your'} team`,
    sender_name: p.sign_off || p.agency_name || 'our team',
    agency_name: p.agency_name || '',
    preferred_cta: p.preferred_cta || '',
  };
}

// Replace every known placeholder whose value is present. Empty values are
// left as {{token}} so cleanMessage() can drop the dependent sentence.
export function fillTemplate(text, ctx) {
  if (!text) return '';
  let out = text;
  for (const [key, value] of Object.entries(ctx)) {
    const token = `{{${key}}}`;
    if (value !== '' && value != null) {
      out = out.split(token).join(String(value));
    }
  }
  return out;
}

// Remove sentences that still contain an unresolved {{token}} (missing
// evidence), preserving paragraph breaks. Never leaves a broken placeholder.
export function cleanMessage(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const out = lines.map((line) => {
    if (!line.trim()) return '';
    if (!/{{\s*[a-z_]+\s*}}/i.test(line)) return line;
    const sentences = line.split(/(?<=[.!?])\s+/);
    const kept = sentences.filter((s) => !/{{\s*[a-z_]+\s*}}/i.test(s)).join(' ').trim();
    return kept;
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

// Resolve a template against a context: returns subject, content, the list of
// missing fields (for the UI to warn about), and the honest generation method.
export function resolveTemplate(template, ctx) {
  const subject = template.subject_template
    ? cleanMessage(fillTemplate(template.subject_template, ctx))
    : '';
  const content = cleanMessage(fillTemplate(template.body_template, ctx));
  const allText = `${template.subject_template || ''}\n${template.body_template}`;
  const tokens = allText.match(/{{\s*[a-z_]+\s*}}/gi) || [];
  const missing = [];
  for (const tok of tokens) {
    const key = tok.replace(/[{}]/g, '').trim();
    if (ctx[key] === '' || ctx[key] == null) missing.push(`{{${key}}}`);
  }
  return {
    subject,
    content,
    missingFields: [...new Set(missing)],
    method: GENERATION_METHODS.TEMPLATE,
  };
}

// Rank templates by fit for the current prospect: rewards matching evidence
// requirements and industry, penalises evidence-required templates when the
// evidence is missing, and lightly prefers the user's preferred tone.
export function recommendTemplates(templates, business, audit, preferences = {}) {
  const ctx = buildContext(business, audit, preferences);
  const hasAudit = !!(audit && audit.overall_score != null);
  const noWebsite = business?.website_classification === 'verified_no_website';
  return (templates || [])
    .map((t) => {
      let score = 0;
      const ev = t.required_evidence || 'none';
      if (ev === 'none') score += 2;
      if (ev === 'no_website_verified' && noWebsite) score += 5;
      if (ev === 'audit' && hasAudit) score += 4;
      if (ev === 'no_website_verified' && !noWebsite) score -= 4;
      if (ev === 'audit' && !hasAudit) score -= 5;
      const suitable = t.suitable_business_types && t.suitable_business_types.length ? t.suitable_business_types : ['Any'];
      if (suitable.includes('Any')) score += 1;
      else if (business?.industry && suitable.includes(business.industry)) score += 3;
      if (preferences?.tone && t.tone === preferences.tone) score += 1;
      if (preferences?.channel && t.channel === preferences.channel) score += 1;
      // Fallback templates rank last unless nothing else fits.
      if (t.is_fallback) score -= 2;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}

// Back-compat: legacy callers expected industry-matched templates.
export function matchTemplates(templates, business) {
  return recommendTemplates(templates, business, null, PREFERENCE_DEFAULTS);
}