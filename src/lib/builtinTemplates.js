// 50 built-in outreach templates, hand-written to sound like a thoughtful
// freelancer or small agency owner — no corporate jargon, no fake familiarity.
// Each is a complete, usable message. Templates are grouped by category with
// the exact counts requested. These are read-only built-ins; the user's own
// templates live as PitchTemplate entity records and are merged in the library.

export const TEMPLATE_CATEGORIES = [
  'First-contact emails',
  'Short casual emails',
  'Website improvement pitches',
  'No-website outreach',
  'SEO & performance',
  'Instagram & social DMs',
  'Follow-up messages',
  'Value-first approaches',
  'Premium agency outreach',
  'Re-engagement messages',
];

export const TEMPLATE_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'instagram_dm', label: 'Instagram DM' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'general_dm', label: 'General DM' },
];

export const TEMPLATE_TONES = [
  { value: 'casual_friendly', label: 'Casual and friendly' },
  { value: 'professional_approachable', label: 'Professional but approachable' },
  { value: 'short_direct', label: 'Short and direct' },
  { value: 'helpful_consultative', label: 'Helpful and consultative' },
  { value: 'confident_persuasive', label: 'Confident and persuasive' },
  { value: 'premium_agency', label: 'Premium agency' },
  { value: 'warm_conversational', label: 'Warm and conversational' },
];

const ANY = ['Any'];

export const BUILTIN_TEMPLATES = [
  // ── First-contact emails (8) ──────────────────────────────────────────────
  {
    id: 'builtin-01',
    name: 'Curiosity opener — local discovery',
    category: 'First-contact emails',
    channel: 'email',
    tone: 'casual_friendly',
    message_type: 'first_contact',
    situation: 'First message to a local business with a listed website',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `A quick idea for {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

I was looking into {{business_category}} in {{business_location}} and {{business_name}} stood out. I build websites for small businesses and had a thought about how yours could bring in more enquiries.

Would you be open to a quick look? No pitch — just an idea.

Best,
{{sender_name}}`,
    recommended_cta: 'Ask for a quick look',
    usage_note: 'Low-pressure first touch for a business you discovered locally.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-02',
    name: 'Helpful intro — mobile experience',
    category: 'First-contact emails',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'first_contact',
    situation: 'First contact framed around mobile usability',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Your website on mobile, {{business_name}}?`,
    body_template: `Hi {{contact_name_or_business_team}},

I help local businesses improve how their website works on phones — that's where most of your visitors are. I had a couple of simple ideas for {{business_name}} that could make it easier for people to get in touch.

Want me to send them over?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer to send ideas',
    usage_note: 'Good for service businesses where mobile traffic dominates.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-03',
    name: 'Direct question — enquiries',
    category: 'First-contact emails',
    channel: 'email',
    tone: 'short_direct',
    message_type: 'enquiry',
    situation: 'Opening with a direct question about results',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Quick question about {{business_name}}'s website`,
    body_template: `Hi {{contact_name_or_business_team}},

Quick one: are you happy with how {{business_name}}'s website brings in new customers right now?

I build sites focused on that, and I'd be glad to share a few thoughts if it's useful.

Best,
{{sender_name}}`,
    recommended_cta: 'Ask a direct question',
    usage_note: 'Short, confident opener that invites an honest answer.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-04',
    name: 'Warm intro — story',
    category: 'First-contact emails',
    channel: 'email',
    tone: 'warm_conversational',
    message_type: 'first_contact',
    situation: 'Friendly first message that references their work',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Found {{business_name}} while researching local businesses`,
    body_template: `Hi {{contact_name_or_business_team}},

I came across {{business_name}} while looking through {{business_category}} in {{business_location}}. It looks like you care about what you do.

I work with small businesses on their websites and online presence. If you're ever thinking about refreshing yours, I'd be happy to chat — no pressure.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a no-pressure chat',
    usage_note: 'Warm opener for businesses with a clear sense of craft.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-05',
    name: 'Professional intro — credibility',
    category: 'First-contact emails',
    channel: 'email',
    tone: 'professional_approachable',
    message_type: 'first_contact',
    situation: 'Straightforward professional introduction',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `A thought on {{business_name}}'s online presence`,
    body_template: `Hi {{contact_name_or_business_team}},

I'm {{sender_name}} — I build and improve websites for businesses like {{business_name}}. A strong online presence makes it easier for people to find and trust you.

If you'd like, I can share a few specific ideas for your site. Happy to keep it short.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer specific ideas',
    usage_note: 'Clean, professional first contact for B2B-style prospects.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-06',
    name: 'Local angle — community',
    category: 'First-contact emails',
    channel: 'email',
    tone: 'casual_friendly',
    message_type: 'first_contact',
    situation: 'First message leaning on shared local context',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `{{business_name}} and the local scene`,
    body_template: `Hi {{contact_name_or_business_team}},

I spend a lot of time working with {{business_category}} businesses in {{business_location}}, and {{business_name}} caught my eye.

I build websites that help local places get found and get more bookings. If that's something you'd find useful, I'd love to share an idea or two.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer an idea or two',
    usage_note: 'Great for neighbourhood businesses where local identity matters.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-07',
    name: 'Question-led — what is missing',
    category: 'First-contact emails',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'first_contact',
    situation: 'Teasing one specific improvement without revealing it',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `One thing I'd tweak on {{business_name}}'s site`,
    body_template: `Hi {{contact_name_or_business_team}},

I took a quick look at {{business_name}} online and there's one small thing I'd probably change to help it work harder for you.

Want me to send a short note about it?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a short note',
    usage_note: 'Curiosity hook; follow up with the real observation once they reply.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-08',
    name: 'Confident intro — results',
    category: 'First-contact emails',
    channel: 'email',
    tone: 'confident_persuasive',
    message_type: 'first_contact',
    situation: 'Confident opener focused on turning visits into enquiries',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Getting more from {{business_name}}'s website`,
    body_template: `Hi {{contact_name_or_business_team}},

Most of your future customers will check {{business_name}} online before they ever walk in. I build websites that turn those visits into enquiries.

If you'd like to see what that could look like, I'd be glad to show you.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer to show what is possible',
    usage_note: 'Confident tone for prospects who respond to clear value.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── Short casual emails (6) ───────────────────────────────────────────────
  {
    id: 'builtin-09',
    name: 'One-liner question',
    category: 'Short casual emails',
    channel: 'email',
    tone: 'short_direct',
    message_type: 'enquiry',
    situation: 'Shortest possible opener',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Quick one about your website`,
    body_template: `Hey {{business_name}},

Are you happy with how your website's working for you right now?

If not, I'd be glad to share a couple of ideas.

{{sender_name}}`,
    recommended_cta: 'Ask if they are happy with their site',
    usage_note: 'Bare-bones opener for prospects who dislike long emails.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-10',
    name: 'Casual idea drop',
    category: 'Short casual emails',
    channel: 'email',
    tone: 'casual_friendly',
    message_type: 'first_contact',
    situation: 'Casual offer to share one idea',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Had an idea for {{business_name}}`,
    body_template: `Hey {{business_name}},

I was looking at local {{business_category}} spots and had a small idea for your website. Want me to send it over?

{{sender_name}}`,
    recommended_cta: 'Offer to send one idea',
    usage_note: 'Friendly and light; good for Instagram-era businesses.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-11',
    name: 'Low-pressure check-in',
    category: 'Short casual emails',
    channel: 'email',
    tone: 'warm_conversational',
    message_type: 'first_contact',
    situation: 'Reassuring, no-pressure opener',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Website thoughts for {{business_name}}?`,
    body_template: `Hi {{business_name}},

Just a quick note — I build websites and had a couple of thoughts that might help yours. No pressure at all, but happy to share if useful.

{{sender_name}}`,
    recommended_cta: 'Offer thoughts with no pressure',
    usage_note: 'Use when you want to feel approachable, not salesy.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-12',
    name: 'Direct offer — free ideas',
    category: 'Short casual emails',
    channel: 'email',
    tone: 'short_direct',
    message_type: 'first_contact',
    situation: 'Direct offer of free ideas',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `A few free ideas for your site`,
    body_template: `Hey {{business_name}},

I can send over a few free ideas for your website — things I'd tweak to help it bring in more customers. Interested?

{{sender_name}}`,
    recommended_cta: 'Offer free ideas',
    usage_note: 'Short and concrete; pairs well with offer_free_audit preference.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-13',
    name: 'Casual local nod',
    category: 'Short casual emails',
    channel: 'email',
    tone: 'casual_friendly',
    message_type: 'first_contact',
    situation: 'Short hello referencing their location',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `{{business_name}} in {{business_location}}`,
    body_template: `Hey {{business_name}},

Saw you online and wanted to say hi. I help local businesses with their websites — if you ever want a second pair of eyes on yours, I'm around.

{{sender_name}}`,
    recommended_cta: 'Offer a second pair of eyes',
    usage_note: 'Light touch for a first hello in a local market.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-14',
    name: 'Quick value tease',
    category: 'Short casual emails',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'first_contact',
    situation: 'Teasing a specific observation to earn a reply',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Something worth a look, {{business_name}}`,
    body_template: `Hi {{business_name}},

I noticed something on your website that might be worth a quick look. I can send the details if you'd like.

{{sender_name}}`,
    recommended_cta: 'Offer to send details',
    usage_note: 'Use when you have a real observation to share on reply.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── Website improvement pitches (6) — require an audit ───────────────────
  {
    id: 'builtin-15',
    name: 'Audit-led — top issue',
    category: 'Website improvement pitches',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'improvement_pitch',
    situation: 'Pitch built around the single biggest audit finding',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `One quick win for {{business_name}}'s website`,
    body_template: `Hi {{contact_name_or_business_team}},

I ran a quick audit of {{website_url}} and one thing stood out: {{audit_finding}}.

It's usually a quick fix and it tends to help conversions. Want me to send a short note on how to sort it?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a short fix note',
    usage_note: 'Requires a completed audit. Lead with the top finding only.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-16',
    name: 'Score-led — overall',
    category: 'Website improvement pitches',
    channel: 'email',
    tone: 'professional_approachable',
    message_type: 'audit_summary',
    situation: 'Pitch that opens with the overall audit score',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `Your website scored {{audit_score}}/100`,
    body_template: `Hi {{contact_name_or_business_team}},

I put {{business_name}}'s site through a quick audit and it came out at {{audit_score}}/100. The biggest gap was: {{audit_finding}}.

I'd be glad to walk you through what that means and how to improve it — no cost for the first chat.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a free walkthrough',
    usage_note: 'Requires an audit. Use when the score is a useful hook.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-17',
    name: 'Mobile-focused improvement',
    category: 'Website improvement pitches',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'improvement_pitch',
    situation: 'Pitch focused on mobile-specific audit findings',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `How {{business_name}} looks on mobile`,
    body_template: `Hi {{contact_name_or_business_team}},

I checked {{website_url}} on mobile and spotted a couple of things that could be putting people off: {{audit_finding}}.

Most of your visitors are on phones, so this one's worth fixing. Want me to send the details?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer to send mobile details',
    usage_note: 'Requires an audit with mobile-related findings.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-18',
    name: 'Speed-focused improvement',
    category: 'Website improvement pitches',
    channel: 'email',
    tone: 'short_direct',
    message_type: 'improvement_pitch',
    situation: 'Pitch focused on slow load speed',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `{{business_name}}'s site is a bit slow`,
    body_template: `Hi {{contact_name_or_business_team}},

Your site {{website_url}} took a while to load when I checked — {{audit_finding}}. Faster sites keep more visitors around.

I can show you what's slowing it down and how to fix it. Want the details?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer speed fix details',
    usage_note: 'Requires an audit showing a performance issue.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-19',
    name: 'Conversion-focused improvement',
    category: 'Website improvement pitches',
    channel: 'email',
    tone: 'confident_persuasive',
    message_type: 'improvement_pitch',
    situation: 'Pitch focused on turning visitors into enquiries',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `Turning more of {{business_name}}'s visitors into customers`,
    body_template: `Hi {{contact_name_or_business_team}},

I looked at {{website_url}} and there's a clear gap between people visiting and people getting in touch: {{audit_finding}}.

Small changes can make a real difference here. I'd be happy to share a short plan if you're interested.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a short plan',
    usage_note: 'Requires an audit with a conversion-related finding.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-20',
    name: 'Honest observation',
    category: 'Website improvement pitches',
    channel: 'email',
    tone: 'warm_conversational',
    message_type: 'improvement_pitch',
    situation: 'Soft, honest pitch around one real finding',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `A small thing I noticed on {{business_name}}'s site`,
    body_template: `Hi {{contact_name_or_business_team}},

I had a proper look at {{website_url}} and noticed {{audit_finding}}. It's not a disaster, but it's probably costing you a few enquiries.

If you'd like, I can send a quick note on how to put it right.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a quick fix note',
    usage_note: 'Requires an audit. Tones down urgency for sensitive prospects.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── No-website business outreach (6) — require verified no-website ──────
  {
    id: 'builtin-21',
    name: 'No website — simple offer',
    category: 'No-website outreach',
    channel: 'email',
    tone: 'casual_friendly',
    message_type: 'first_contact',
    situation: 'Reaching a business verified as having no website',
    suitable_business_types: ANY,
    required_evidence: 'no_website_verified',
    subject_template: `A website for {{business_name}}?`,
    body_template: `Hi {{contact_name_or_business_team}},

I came across {{business_name}} and noticed you don't seem to have a website yet. A simple one can help people find you and get in touch.

I'd be glad to chat about what that could look like — no obligation.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a no-obligation chat',
    usage_note: 'Only use when verification confirms no website. Never assume.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-22',
    name: 'No website — discovery angle',
    category: 'No-website outreach',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'first_contact',
    situation: 'Framing a website as how people discover the business',
    suitable_business_types: ANY,
    required_evidence: 'no_website_verified',
    subject_template: `Making {{business_name}} easier to find online`,
    body_template: `Hi {{contact_name_or_business_team}},

When people search for {{business_category}} in {{business_location}}, a website helps them find and choose {{business_name}}. Right now it looks like you might not have one.

I build simple, effective sites for local businesses. Want to hear a few ideas?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a few ideas',
    usage_note: 'Requires verified no-website status.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-23',
    name: 'No website — booking angle',
    category: 'No-website outreach',
    channel: 'email',
    tone: 'professional_approachable',
    message_type: 'first_contact',
    situation: 'For booking-led businesses without a website',
    suitable_business_types: ['Restaurants and cafes', 'Beauty salons and spas', 'Gyms and fitness studios'],
    required_evidence: 'no_website_verified',
    subject_template: `More bookings for {{business_name}}?`,
    body_template: `Hi {{contact_name_or_business_team}},

A website makes it easier for customers to find {{business_name}} and reach out — especially outside your opening hours. I noticed you may not have one yet.

I'd be happy to show you how a simple site could help. Want a quick chat?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a quick chat',
    usage_note: 'Requires verified no-website. Best for booking-driven businesses.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-24',
    name: 'No website — credibility',
    category: 'No-website outreach',
    channel: 'email',
    tone: 'confident_persuasive',
    message_type: 'first_contact',
    situation: 'Framing a website as a credibility baseline',
    suitable_business_types: ANY,
    required_evidence: 'no_website_verified',
    subject_template: `{{business_name}} online`,
    body_template: `Hi {{contact_name_or_business_team}},

These days, people expect to find a business online before they trust it. It looks like {{business_name}} might not have a website yet.

I build sites that help local businesses look credible and get more enquiries. Open to a quick conversation?

Best,
{{sender_name}}`,
    recommended_cta: 'Invite a quick conversation',
    usage_note: 'Requires verified no-website. Confident tone.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-25',
    name: 'No website — warm',
    category: 'No-website outreach',
    channel: 'email',
    tone: 'warm_conversational',
    message_type: 'first_contact',
    situation: 'Warm, gentle no-website opener',
    suitable_business_types: ANY,
    required_evidence: 'no_website_verified',
    subject_template: `A small idea for {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

I was looking at {{business_category}} in {{business_location}} and noticed {{business_name}} doesn't appear to have a website. A simple page or two could help more people find you.

If you're curious, I'd be glad to share some thoughts.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer to share thoughts',
    usage_note: 'Requires verified no-website. Softest tone in this group.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-26',
    name: 'No website — short',
    category: 'No-website outreach',
    channel: 'email',
    tone: 'short_direct',
    message_type: 'first_contact',
    situation: 'Shortest no-website opener',
    suitable_business_types: ANY,
    required_evidence: 'no_website_verified',
    subject_template: `Website for {{business_name}}?`,
    body_template: `Hi {{contact_name_or_business_team}},

Looks like {{business_name}} doesn't have a website yet. I can build a simple one that helps people find and contact you. Want to chat?

Best,
{{sender_name}}`,
    recommended_cta: 'Invite a chat',
    usage_note: 'Requires verified no-website. Very short.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── SEO and performance opportunities (5) — require an audit ─────────────
  {
    id: 'builtin-27',
    name: 'SEO — being found',
    category: 'SEO & performance',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'improvement_pitch',
    situation: 'Pitch around search visibility findings',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `Can people find {{business_name}} on Google?`,
    body_template: `Hi {{contact_name_or_business_team}},

I checked how {{business_name}} shows up in search and there's room to improve: {{audit_finding}}.

Better visibility means more people finding you without you spending on ads. I can send a short list of what to fix.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a short fix list',
    usage_note: 'Requires an audit with SEO-related findings.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-28',
    name: 'Performance — speed',
    category: 'SEO & performance',
    channel: 'email',
    tone: 'short_direct',
    message_type: 'improvement_pitch',
    situation: 'Pitch around slow load times',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `{{business_name}}'s site loads slowly`,
    body_template: `Hi {{contact_name_or_business_team}},

Your site {{website_url}} is on the slow side — {{audit_finding}}. Faster pages keep visitors and help search rankings.

Want me to send the quick wins?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer the quick wins',
    usage_note: 'Requires an audit showing a performance issue.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-29',
    name: 'SEO — local search',
    category: 'SEO & performance',
    channel: 'email',
    tone: 'professional_approachable',
    message_type: 'improvement_pitch',
    situation: 'Local-search visibility pitch',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `Showing up in local searches, {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

For a {{business_category}} in {{business_location}}, appearing in local search is one of the best ways to get new customers. I looked at {{website_url}} and found: {{audit_finding}}.

I'd be glad to share a few specific fixes.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer specific fixes',
    usage_note: 'Requires an audit. Strong for local-service businesses.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-30',
    name: 'Performance — Core Web Vitals',
    category: 'SEO & performance',
    channel: 'email',
    tone: 'confident_persuasive',
    message_type: 'improvement_pitch',
    situation: 'Pitch around technical performance scores',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `A faster {{business_name}} website`,
    body_template: `Hi {{contact_name_or_business_team}},

I ran a performance check on {{website_url}} and the results were lower than they should be: {{audit_finding}}.

Speed affects both rankings and how many people stick around. I can show you what to fix first.

Best,
{{sender_name}}`,
    recommended_cta: 'Show what to fix first',
    usage_note: 'Requires an audit. Use for prospects who care about metrics.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-31',
    name: 'SEO — content gap',
    category: 'SEO & performance',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'improvement_pitch',
    situation: 'Pitch around missing content for SEO',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `What's missing on {{business_name}}'s site`,
    body_template: `Hi {{contact_name_or_business_team}},

I looked at {{website_url}} and there are a few things that would help it rank better: {{audit_finding}}.

Most are straightforward. Want me to send the list?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer the list',
    usage_note: 'Requires an audit with content or SEO findings.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── Instagram and social-media DMs (5) ───────────────────────────────────
  {
    id: 'builtin-32',
    name: 'IG — casual DM',
    category: 'Instagram & social DMs',
    channel: 'instagram_dm',
    tone: 'casual_friendly',
    message_type: 'first_contact',
    situation: 'Short Instagram DM opener',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: ``,
    body_template: `Hey {{business_name}} came across your page and had a quick idea about your website. Mind if I send it over?`,
    recommended_cta: 'Ask permission to send the idea',
    usage_note: 'Short DM. Add an emoji only if allow_emojis is on.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-33',
    name: 'IG — value DM',
    category: 'Instagram & social DMs',
    channel: 'instagram_dm',
    tone: 'helpful_consultative',
    message_type: 'first_contact',
    situation: 'Value-first Instagram DM',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: ``,
    body_template: `Hi {{business_name}} I noticed something on your website that might be worth a quick look. Happy to send the details if useful.`,
    recommended_cta: 'Offer to send details',
    usage_note: 'Use when you have a real observation to follow up with.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-34',
    name: 'IG — short question',
    category: 'Instagram & social DMs',
    channel: 'instagram_dm',
    tone: 'short_direct',
    message_type: 'enquiry',
    situation: 'One-question Instagram DM',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: ``,
    body_template: `Hey {{business_name}} quick one. Happy with how your website is bringing in customers? I build sites and had a thought or two.`,
    recommended_cta: 'Ask if they are happy with their site',
    usage_note: 'Direct DM for prospects who reply to straight questions.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-35',
    name: 'IG — no website nudge',
    category: 'Instagram & social DMs',
    channel: 'instagram_dm',
    tone: 'warm_conversational',
    message_type: 'first_contact',
    situation: 'DM for a business verified as having no website',
    suitable_business_types: ANY,
    required_evidence: 'no_website_verified',
    subject_template: ``,
    body_template: `Hey {{business_name}} noticed you might not have a website linked. A simple one could help people find you. Open to a quick chat?`,
    recommended_cta: 'Invite a quick chat',
    usage_note: 'Requires verified no-website. Keep emojis off if preference set.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-36',
    name: 'IG — booking focus',
    category: 'Instagram & social DMs',
    channel: 'instagram_dm',
    tone: 'casual_friendly',
    message_type: 'first_contact',
    situation: 'DM for booking-led businesses with a social following',
    suitable_business_types: ['Restaurants and cafes', 'Beauty salons and spas', 'Gyms and fitness studios'],
    required_evidence: 'none',
    subject_template: ``,
    body_template: `Hi {{business_name}} love your page. A small idea: a simple website with a booking button could help turn your followers into customers. Want to hear more?`,
    recommended_cta: 'Offer to share more',
    usage_note: 'Best for booking-driven businesses active on Instagram.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── Follow-up messages (5) ───────────────────────────────────────────────
  {
    id: 'builtin-37',
    name: 'Gentle follow-up',
    category: 'Follow-up messages',
    channel: 'follow_up',
    tone: 'warm_conversational',
    message_type: 'follow_up',
    situation: 'Warm first follow-up after no reply',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Following up — {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

Just following up on my earlier note about {{business_name}}'s website. If it's something you're thinking about, I'd be glad to share a few ideas.

No rush at all.

Best,
{{sender_name}}`,
    recommended_cta: 'Reopen the conversation gently',
    usage_note: 'Use 3 to 5 days after a first contact with no reply.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-38',
    name: 'Short follow-up',
    category: 'Follow-up messages',
    channel: 'follow_up',
    tone: 'short_direct',
    message_type: 'follow_up',
    situation: 'Brief follow-up',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Quick follow-up, {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

Did you get a chance to think about the website ideas for {{business_name}}? Happy to send specifics whenever suits.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer specifics',
    usage_note: 'Short follow-up for busy prospects.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-39',
    name: 'Value follow-up',
    category: 'Follow-up messages',
    channel: 'follow_up',
    tone: 'helpful_consultative',
    message_type: 'follow_up',
    situation: 'Helpful, no-pressure follow-up',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Still happy to help, {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

I know things get busy. Just wanted to say I'm still glad to share those website thoughts for {{business_name}} whenever you have a moment.

Best,
{{sender_name}}`,
    recommended_cta: 'Stay available',
    usage_note: 'Useful when you want to stay present without pushing.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-40',
    name: 'Audit follow-up',
    category: 'Follow-up messages',
    channel: 'follow_up',
    tone: 'professional_approachable',
    message_type: 'follow_up',
    situation: 'Follow-up referencing a previously sent audit',
    suitable_business_types: ANY,
    required_evidence: 'audit',
    subject_template: `Following up — the audit for {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

I sent over a quick audit for {{website_url}} recently (score {{audit_score}}/100). The main thing was: {{audit_finding}}.

If you'd like help fixing it, I'm around.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer help fixing it',
    usage_note: 'Requires a prior audit. Use after sending an audit summary.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-41',
    name: 'Final check-in',
    category: 'Follow-up messages',
    channel: 'follow_up',
    tone: 'warm_conversational',
    message_type: 'follow_up',
    situation: 'Last follow-up before stepping back',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Last note from me, {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

I'll leave it here so I'm not cluttering your inbox. If you ever want a hand with {{business_name}}'s website, you know where to find me.

All the best,
{{sender_name}}`,
    recommended_cta: 'Leave the door open',
    usage_note: 'Use as the final follow-up before stopping.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── Value-first and helpful approaches (4) ───────────────────────────────
  {
    id: 'builtin-42',
    name: 'Free review offer',
    category: 'Value-first approaches',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'first_contact',
    situation: 'Offering a free website review up front',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `A free website review for {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

I'd be glad to do a quick, free review of {{business_name}}'s website and send you a short list of what's working and what could improve.

No catch — if it's useful, great. Want me to put it together?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a free review',
    usage_note: 'Pairs with offer_free_audit preference. Strong value-first opener.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-43',
    name: 'Useful suggestion lead',
    category: 'Value-first approaches',
    channel: 'email',
    tone: 'helpful_consultative',
    message_type: 'first_contact',
    situation: 'Leading with one genuinely useful suggestion',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `A suggestion for {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

Rather than pitch anything, I wanted to share one suggestion that might genuinely help {{business_name}} online. I can send it in a few lines if you'd like.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a short suggestion',
    usage_note: 'Use when you have a real, specific tip to share on reply.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-44',
    name: 'Concept offer',
    category: 'Value-first approaches',
    channel: 'email',
    tone: 'professional_approachable',
    message_type: 'meeting_request',
    situation: 'Offering to sketch a website concept for free',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `A quick website concept for {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

I'd be happy to sketch a quick website concept for {{business_name}} — what the homepage could look like and how it could bring in more enquiries.

Want me to put one together?

Best,
{{sender_name}}`,
    recommended_cta: 'Offer a free concept',
    usage_note: 'High-value opener; follow through with a real concept on reply.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-45',
    name: 'Helpful audit, no strings',
    category: 'Value-first approaches',
    channel: 'email',
    tone: 'warm_conversational',
    message_type: 'audit_summary',
    situation: 'Offering audit notes with no strings attached',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Some notes on {{business_name}}'s website`,
    body_template: `Hi {{contact_name_or_business_team}},

I put together a few notes on {{business_name}}'s website — things I'd tweak and why. Happy to send them over, no strings attached.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer notes, no strings',
    usage_note: 'Warm value-first opener; deliver real notes on reply.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── Premium agency outreach (3) ──────────────────────────────────────────
  {
    id: 'builtin-46',
    name: 'Premium — brand presence',
    category: 'Premium agency outreach',
    channel: 'email',
    tone: 'premium_agency',
    message_type: 'first_contact',
    situation: 'Premium positioning for a considered online presence',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `A stronger online presence for {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

We work with a small number of businesses on considered, well-built websites that reflect the quality of what they do. {{business_name}} seems like a good fit.

If you're thinking about your online presence seriously, I'd be glad to talk through what that could look like.

Best,
{{sender_name}}`,
    recommended_cta: 'Invite a considered conversation',
    usage_note: 'Premium tone for high-value prospects. Use sparingly.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-47',
    name: 'Premium — considered rebuild',
    category: 'Premium agency outreach',
    channel: 'email',
    tone: 'premium_agency',
    message_type: 'proposal',
    situation: 'Premium pitch for a full website rebuild',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Rebuilding {{business_name}}'s website properly`,
    body_template: `Hi {{contact_name_or_business_team}},

A website is often the first impression of {{business_name}}. We build them carefully — fast, considered, and built to convert.

If you'd like to explore a proper rebuild, I'd be glad to share how we'd approach it.

Best,
{{sender_name}}`,
    recommended_cta: 'Share how you would approach it',
    usage_note: 'Premium tone for prospects ready for a serious rebuild.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-48',
    name: 'Premium — partnership',
    category: 'Premium agency outreach',
    channel: 'email',
    tone: 'premium_agency',
    message_type: 'first_contact',
    situation: 'Premium pitch framed as a long-term partnership',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `Working with {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

We're a small studio that takes on a handful of clients at a time, and {{business_name}} caught our attention. We focus on websites that genuinely move the needle.

If a thoughtful, long-term partner on your online presence appeals, let's talk.

Best,
{{sender_name}}`,
    recommended_cta: 'Invite a partnership conversation',
    usage_note: 'Use for high-value prospects where exclusivity lands well.',
    is_builtin: true,
    is_fallback: false,
  },

  // ── Re-engagement messages (2) ───────────────────────────────────────────
  {
    id: 'builtin-49',
    name: 'Re-engage — new ideas',
    category: 'Re-engagement messages',
    channel: 'email',
    tone: 'warm_conversational',
    message_type: 'follow_up',
    situation: 'Re-engaging a cold prospect with fresh ideas',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `New ideas for {{business_name}}`,
    body_template: `Hi {{contact_name_or_business_team}},

It's been a little while since we last spoke about {{business_name}}'s website. I've had a few new ideas since then that might be worth a look.

If you're open to it, I'd be glad to share them.

Best,
{{sender_name}}`,
    recommended_cta: 'Offer fresh ideas',
    usage_note: 'Use weeks after the last contact went cold.',
    is_builtin: true,
    is_fallback: false,
  },
  {
    id: 'builtin-50',
    name: 'Re-engage — check in',
    category: 'Re-engagement messages',
    channel: 'email',
    tone: 'casual_friendly',
    message_type: 'follow_up',
    situation: 'Casual re-engagement check-in',
    suitable_business_types: ANY,
    required_evidence: 'none',
    subject_template: `How's {{business_name}} doing?`,
    body_template: `Hi {{contact_name_or_business_team}},

Hope things are going well with {{business_name}}. If your website's back on your mind, I'd be glad to pick up where we left off.

Best,
{{sender_name}}`,
    recommended_cta: 'Reopen the conversation',
    usage_note: 'Light re-engagement for a past prospect.',
    is_builtin: true,
    is_fallback: false,
  },
];

export function getBuiltinTemplates() {
  return BUILTIN_TEMPLATES;
}