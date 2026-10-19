// Bulk outreach generation: for a set of selected leads, pick the best-fit
// template per prospect (using the lead's business + latest audit when
// available), resolve it with real evidence, and produce draft + activity
// payloads. All client-side and template-based — no AI calls, no credits.
// Sentences that need missing evidence are removed, never fabricated.

import { buildContext, resolveTemplate, recommendTemplates } from '@/lib/pitchTemplates';
import { PREFERENCE_DEFAULTS } from '@/lib/outreachPreferences';

// Build a business-shaped object from a lead (and its Business record when the
// lead is linked to one) so the template engine can reuse the same context.
function leadToBusiness(lead, business) {
  return {
    name: lead.business_name || business?.name || '',
    industry: lead.industry || business?.industry || '',
    city: lead.city || business?.city || '',
    website_url: lead.website_url || business?.website_url || '',
    confirmed_website_url: business?.confirmed_website_url || '',
    website_status: business?.website_status || '',
    website_classification: business?.website_classification || '',
    suggested_services: business?.suggested_services || [],
    contact_name: lead.contact_name || business?.contact_name || '',
    email: lead.contact_email || business?.email || '',
  };
}

// auditsByBusinessId should map business_id -> latest audit (already sorted).
export function generateForLeads(leads, businessesById, auditsByBusinessId, templates, prefs = PREFERENCE_DEFAULTS) {
  const drafts = [];
  const activities = [];
  const skipped = [];

  for (const lead of leads) {
    const business = businessesById[lead.business_id] || null;
    const audit = lead.business_id ? auditsByBusinessId[lead.business_id] : null;
    const ctxBusiness = leadToBusiness(lead, business);
    const ranked = recommendTemplates(templates, ctxBusiness, audit, prefs);
    const template = ranked[0];
    if (!template) { skipped.push(lead.business_name || 'Untitled lead'); continue; }
    const r = resolveTemplate(template, ctxBusiness);
    if (!r.content) { skipped.push(lead.business_name || 'Untitled lead'); continue; }

    drafts.push({
      business_id: lead.business_id || null,
      lead_id: lead.id,
      business_name: lead.business_name,
      message_type: template.message_type || 'first_contact',
      subject: r.subject,
      content: r.content,
      tone: template.tone || prefs.tone,
      is_demo: lead.is_demo,
    });
    activities.push({
      business_id: lead.business_id || null,
      lead_id: lead.id,
      business_name: lead.business_name,
      channel: 'email',
      direction: 'outbound',
      subject: r.subject,
      content: r.content,
      status: 'sent',
      sent_at: new Date().toISOString(),
      is_demo: lead.is_demo,
    });
  }

  return { drafts, activities, skipped };
}