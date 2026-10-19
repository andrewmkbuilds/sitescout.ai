import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { ollamaGenerate } from '../../shared/freeSources.ts';

function industryTagline(industry: string): string {
  const map: Record<string, string> = {
    'Restaurants and cafes': 'Exceptional food, beautifully presented online',
    'Dental clinics and healthcare': 'Trusted care, easy online booking',
    'Beauty salons and spas': 'Relaxation and beauty, one click away',
    'Gyms and fitness studios': 'Stronger bodies, stronger brand',
    'Automotive garages and dealerships': 'Reliable service, easy to find online',
    'Real estate agencies': 'Find your next home, online',
    'Retail stores': 'Your store, open 24/7 online',
    'Home service providers': 'Book trusted pros in seconds',
    'Professional service firms': 'Expertise that speaks for itself',
    'Education and tutoring centers': 'Learning that starts online',
    'Hotels and tourism businesses': 'Welcome guests before they arrive',
    'Other local businesses': 'Your business, online',
  };
  return map[industry] || 'Your business, online';
}

function buildSections(pages: string[], cta: string) {
  const defaults = [
    { name: 'Hero', purpose: `Headline + primary ${cta} call-to-action` },
    { name: 'Services', purpose: 'What you offer, clearly laid out' },
    { name: 'About', purpose: 'Build trust with your story and credentials' },
    { name: 'Trust signals', purpose: 'Reviews, ratings, and credentials' },
    { name: 'Contact', purpose: 'Multiple ways to reach you' },
  ];
  const pageMap: Record<string, { name: string; purpose: string }> = {
    Home: { name: 'Hero', purpose: `Headline + primary ${cta} call-to-action` },
    About: { name: 'About', purpose: 'Build trust with your story and credentials' },
    Services: { name: 'Services', purpose: 'What you offer, clearly laid out' },
    Portfolio: { name: 'Portfolio', purpose: 'Showcase your best work' },
    Pricing: { name: 'Pricing', purpose: 'Transparent pricing tiers' },
    Testimonials: { name: 'Testimonials', purpose: 'Social proof from happy clients' },
    Blog: { name: 'Blog', purpose: 'Helpful content and SEO' },
    Contact: { name: 'Contact', purpose: 'Multiple ways to reach you' },
    Booking: { name: 'Booking', purpose: `Online ${cta} scheduling` },
  };
  const sections = (pages.length ? pages : ['Home', 'About', 'Services', 'Contact']).map((p) => pageMap[p] || { name: p, purpose: 'Relevant content for this section' });
  if (!sections.find((s) => s.name === 'Trust signals')) sections.splice(3, 0, { name: 'Trust signals', purpose: 'Reviews, ratings, and credentials' });
  return sections;
}

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

function buildPreviewHtml(name: string, industry: string, style: string, cta: string, pages: string[]): string {
  const tagline = industryTagline(industry);
  const navLinks = (pages.length ? pages : ['Home', 'About', 'Services', 'Contact']).filter((p) => p !== 'Home').map((p) => `<a href="#${esc(p.toLowerCase())}" style="color:#cfd8ff;text-decoration:none;margin-left:18px;font-size:14px">${esc(p)}</a>`).join('');
  const serviceCards = ['Service one', 'Service two', 'Service three'].map((s) => `
    <div style="flex:1;min-width:200px;background:rgba(255,255,255,.06);border-radius:12px;padding:24px">
      <div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);margin-bottom:12px"></div>
      <h3 style="margin:0 0 8px;font-size:18px;color:#fff">${esc(s)}</h3>
      <p style="margin:0;color:#9aa7c7;font-size:13px">A short description of this service and its benefit.</p>
    </div>`).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(name)} — Concept</title></head>
<body style="margin:0;font-family:Inter,system-ui,Arial,sans-serif;background:#0b1220;color:#e6ecff">
  <header style="padding:20px 24px;display:flex;align-items:center;justify-content:space-between;max-width:1100px;margin:0 auto">
    <strong style="font-size:18px;color:#fff">${esc(name)}</strong>
    <nav>${navLinks}</nav>
  </header>
  <section style="text-align:center;padding:80px 24px;background:radial-gradient(ellipse at top,#1e3a8a33,transparent)">
    <h1 style="font-size:42px;line-height:1.1;margin:0 0 16px;color:#fff">${esc(tagline)}</h1>
    <p style="font-size:18px;color:#9aa7c7;max-width:560px;margin:0 auto 28px">${esc(industry || 'Your business')} — a homepage concept by SiteScout AI.</p>
    <a href="#" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:14px 28px;border-radius:10px;font-weight:600;text-decoration:none">${esc(cta)}</a>
  </section>
  <section id="services" style="max-width:1100px;margin:0 auto;padding:56px 24px">
    <h2 style="text-align:center;color:#fff;font-size:28px;margin:0 0 32px">What we offer</h2>
    <div style="display:flex;flex-wrap:wrap;gap:16px">${serviceCards}</div>
  </section>
  <section id="contact" style="text-align:center;padding:64px 24px;background:#111c30">
    <h2 style="color:#fff;font-size:28px;margin:0 0 12px">Ready to begin?</h2>
    <p style="color:#9aa7c7;margin:0 0 24px">${esc(cta)} — we'll make it simple.</p>
    <a href="#" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">${esc(cta)}</a>
  </section>
  <footer style="text-align:center;padding:24px;color:#5b6889;font-size:12px">© ${new Date().getFullYear()} ${esc(name)} — unapproved concept, not the official site.</footer>
</body></html>`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // auth disabled (anonymous demo mode)
    // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 }); // re-enable to restore auth

    const body = await req.json().catch(() => ({}));
    const business = body.business || {};
    const style = body.style || 'modern';
    const pages = body.pages || ['Home', 'About', 'Services', 'Contact'];
    const cta = body.cta || 'Book Now';
    const ollamaUrl = secrets.get('OLLAMA_URL');

    if (ollamaUrl) {
      const prompt = `You are a web design strategist. Create a homepage concept (unapproved, not official). Business: ${business.name || ''}. Industry: ${business.industry || ''}. Style: ${style}. Pages: ${(Array.isArray(pages) ? pages : []).join(', ')}. CTA: ${cta}. Return JSON {"hero": string, "sections": [{"name": string, "purpose": string}], "preview_html": string}. preview_html must be a complete, self-contained, mobile-responsive HTML string with inline CSS, navy/electric-blue scheme, under 6KB.`;
      const { text, available } = await ollamaGenerate(prompt, ollamaUrl, { json: true, timeoutMs: 60000 });
      if (available) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.hero && parsed.sections && parsed.preview_html) {
            return Response.json({ hero: parsed.hero, sections: parsed.sections, preview_html: parsed.preview_html, pages, style, cta, ai_source: 'ollama (local)' });
          }
        } catch {}
      }
    }

    // Deterministic fallback
    const name = business.name || 'Your Business';
    const industry = business.industry || '';
    const hero = `${name} — ${industryTagline(industry)}. ${cta} today.`;
    const sections = buildSections(Array.isArray(pages) ? pages : [], cta);
    const preview_html = buildPreviewHtml(name, industry, style, cta, Array.isArray(pages) ? pages : []);
    return Response.json({ hero, sections, preview_html, pages: Array.isArray(pages) ? pages : ['Home', 'About', 'Services', 'Contact'], style, cta, ai_source: 'deterministic template (no AI configured)' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}