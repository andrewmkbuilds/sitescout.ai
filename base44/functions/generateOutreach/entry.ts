import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { ollamaGenerate } from '../../shared/freeSources.ts';

// Deterministic, evidence-based outreach templates (Mode B — no AI, no credits).
function deterministicOutreach(messageType: string, business: any, audit: any, agency: any, tone: string) {
  const agencyName = agency.name || 'Our team';
  const agencySite = agency.website || '';
  const services = (agency.services || 'website design, development, SEO, and performance optimization').slice(0, 200);
  const bName = business.name || 'your business';
  const bIndustry = business.industry || '';
  const bCity = business.city || '';
  const hasSite = !!(business.confirmed_website_url || business.website_url);
  const classification = business.website_classification || '';
  const topIssues = audit && Array.isArray(audit.findings) ? audit.findings.filter((f) => f.status !== 'pass').slice(0, 3) : [];
  const issuesText = topIssues.length ? topIssues.map((f) => `- ${f.check}: ${f.message}`).join('\n') : '';
  const greeting = `Hi ${bName} team,`;
  const signoff = tone === 'friendly' ? 'Cheers' : tone === 'concise' ? 'Thanks' : 'Best regards';
  const sig = `${signoff},\n${agencyName}${agencySite ? '\n' + agencySite : ''}`;
  const loc = bCity ? ` in ${bCity}` : '';
  const industryLine = bIndustry ? ` As a ${bIndustry.toLowerCase()} business` : '';

  const noSiteHook = `I came across ${bName}${loc} and noticed you don't appear to have a website yet. A professional site is one of the highest-impact ways to reach more customers and look credible online.`;
  const hasSiteHook = `I was reviewing ${bName}${loc}${industryLine ? ',' + industryLine.toLowerCase() : ''} and noticed a few things on your website that could be holding back conversions.`;

  let subject = '', content = '';
  switch (messageType) {
    case 'first_contact':
      subject = `${bName} — a quick idea for your website`;
      content = `${greeting}\n\n${hasSite ? hasSiteHook : noSiteHook}\n${issuesText ? '\nA few things stood out from a quick look:\n' + issuesText + '\n' : ''}\nWe help businesses like yours with ${services}. Would you be open to a short, no-obligation chat?\n\n${sig}`;
      break;
    case 'enquiry':
      subject = `Quick question for ${bName}`;
      content = `${greeting}\n\nI'm reaching out${loc ? ' from ' + bCity : ''} to ask whether you'd be interested in improving your online presence.${hasSite ? '' : ' I noticed you may not have a website yet.'} Happy to share a few ideas — no commitment.\n\n${sig}`;
      break;
    case 'follow_up':
      subject = `Following up — ${bName}`;
      content = `${greeting}\n\nI reached out recently about helping ${bName} with ${services.split(',')[0]}. I know you're busy, so I'll keep this short: would a 15-minute call this week work?\n\n${sig}`;
      break;
    case 'linkedin':
      subject = '';
      content = `Hi ${bName} team — I help ${bIndustry ? bIndustry.toLowerCase() + ' ' : ''}businesses${loc ? ' in ' + bCity : ''} improve their websites. ${hasSite ? 'I noticed a few quick wins on yours.' : 'I noticed you may not have a site yet.'} Open to connecting? — ${agencyName}`;
      break;
    case 'proposal':
      subject = `Website redesign proposal for ${bName}`;
      content = `${greeting}\n\nBased on a review of ${bName}'s website, here's a short proposal:\n\nWhat we'd improve:\n${issuesText || '- Modernize the design and mobile experience\n- Strengthen calls-to-action and contact paths'}\n\nScope: design, development, and launch. Timeline: 3-5 weeks. ${agencySite ? 'Examples of our work: ' + agencySite : ''}\n\nWould you like a detailed quote?\n\n${sig}`;
      break;
    case 'audit_summary':
      subject = `A quick website audit for ${bName}`;
      content = `${greeting}\n\nI ran a quick audit of ${hasSite ? 'your website' : 'your online presence'}. ${audit && audit.overall_score != null ? `Overall score: ${audit.overall_score}/100.` : ''}\n${issuesText ? '\nKey findings:\n' + issuesText : ''}\n\nNo obligation — happy to walk through these on a call.\n\n${sig}`;
      break;
    case 'meeting_request':
      subject = `15 minutes to help ${bName}?`;
      content = `${greeting}\n\nI'd love to show you a few concrete ways we could help ${bName} online. Would a 15-minute call this week suit you?${agencySite ? ' (More about us: ' + agencySite + ')' : ''}\n\n${sig}`;
      break;
    case 'improvement_pitch':
      subject = `One quick win for ${bName}'s website`;
      content = `${greeting}\n\n${issuesText ? 'One thing stood out on your website:\n' + issuesText.split('\n')[0] + '\n\n' : ''}Fixing this is usually quick and meaningfully improves conversions. Want me to send a short note on how?\n\n${sig}`;
      break;
    default:
      subject = `${bName} — website ideas`;
      content = `${greeting}\n\n${hasSite ? hasSiteHook : noSiteHook}\n\n${sig}`;
  }
  return { subject, content };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // auth disabled (anonymous demo mode)
    // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 }); // re-enable to restore auth

    const body = await req.json().catch(() => ({}));
    const business = body.business || {};
    const audit = body.audit || null;
    const agency = body.agency || {};
    const messageType = body.message_type || 'first_contact';
    const tone = body.tone || 'professional';

    const ollamaUrl = secrets.get('OLLAMA_URL');

    // Mode A: optional self-hosted local LLM (Ollama) — free.
    if (ollamaUrl) {
      const findingsText = audit && Array.isArray(audit.findings) && audit.findings.length
        ? audit.findings.filter((f) => f.status !== 'pass').map((f) => `- ${f.category}: ${f.message}`).join('\n')
        : 'No specific audit findings available.';
      const prompt = `You are an outreach assistant for a web design agency. Write a ${messageType} message. Agency: ${agency.name || 'Our Agency'}. Services: ${(agency.services || '').slice(0, 300)}. Tone: ${tone}. Prospect: ${business.name || ''}, ${business.industry || ''}, ${business.city || ''}. Website: ${business.confirmed_website_url || business.website_url || 'none'}. Verified findings (use ONLY these, do not invent): ${findingsText}. Return JSON {"subject": string, "content": string}. Keep it concise; never invent metrics or a prior relationship.`;
      const { text, available } = await ollamaGenerate(prompt, ollamaUrl, { json: true, timeoutMs: 60000 });
      if (available) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.subject && parsed.content) {
            return Response.json({ subject: parsed.subject, content: parsed.content, message_type: messageType, ai_source: 'ollama (local)' });
          }
        } catch {}
      }
    }

    // Mode B: deterministic fallback — always works, no credits, no fabrication.
    const out = deterministicOutreach(messageType, business, audit, agency, tone);
    return Response.json({ ...out, message_type: messageType, ai_source: 'deterministic template (no AI configured)' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}