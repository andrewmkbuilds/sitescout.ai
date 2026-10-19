export const INDUSTRIES = [
  'Restaurants and cafes',
  'Dental clinics and healthcare',
  'Beauty salons and spas',
  'Gyms and fitness studios',
  'Automotive garages and dealerships',
  'Real estate agencies',
  'Retail stores',
  'Home service providers',
  'Professional service firms',
  'Education and tutoring centers',
  'Hotels and tourism businesses',
  'Other local businesses',
];

export const WEBSITE_STATUSES = [
  { value: 'no_website_listed', label: 'No website listed', color: 'text-amber-500' },
  { value: 'unverified', label: 'Website unverified', color: 'text-muted-foreground' },
  { value: 'reachable', label: 'Reachable', color: 'text-chart-5' },
  { value: 'redirecting', label: 'Redirecting', color: 'text-amber-500' },
  { value: 'inaccessible', label: 'Inaccessible', color: 'text-destructive' },
  { value: 'error', label: 'Error', color: 'text-destructive' },
  { value: 'blocked', label: 'Blocked', color: 'text-destructive' },
  { value: 'audit_incomplete', label: 'Audit incomplete', color: 'text-muted-foreground' },
];

export const LEAD_STAGES = [
  { value: 'new', label: 'New', color: 'bg-slate-500' },
  { value: 'to_review', label: 'To Review', color: 'bg-blue-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-cyan-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-indigo-500' },
  { value: 'replied', label: 'Replied', color: 'bg-violet-500' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-purple-500' },
  { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-fuchsia-500' },
  { value: 'won', label: 'Won', color: 'bg-emerald-500' },
  { value: 'lost', label: 'Lost', color: 'bg-rose-500' },
  { value: 'do_not_contact', label: 'Do Not Contact', color: 'bg-zinc-500' },
];

export const MESSAGE_TYPES = [
  { value: 'first_contact', label: 'First-contact email' },
  { value: 'enquiry', label: 'Business enquiry' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'linkedin', label: 'LinkedIn connection' },
  { value: 'proposal', label: 'Redesign proposal' },
  { value: 'audit_summary', label: 'Audit summary' },
  { value: 'meeting_request', label: 'Meeting request' },
  { value: 'improvement_pitch', label: 'Improvement pitch' },
];

export function statusLabel(value) {
  return WEBSITE_STATUSES.find((s) => s.value === value)?.label || value || 'Unknown';
}
export function statusColor(value) {
  return WEBSITE_STATUSES.find((s) => s.value === value)?.color || 'text-muted-foreground';
}
export function stageLabel(value) {
  return LEAD_STAGES.find((s) => s.value === value)?.label || value;
}
export function stageColor(value) {
  return LEAD_STAGES.find((s) => s.value === value)?.color || 'bg-slate-500';
}

export function scoreTone(score) {
  if (score == null) return 'text-muted-foreground';
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-destructive';
}
export function scoreBg(score) {
  if (score == null) return 'bg-muted';
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-destructive';
}

export function formatAED(value) {
  if (value == null || isNaN(value)) return '—';
  return 'AED ' + Number(value).toLocaleString('en-AE');
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function relativeDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  const now = new Date();
  const diff = Math.round((d - now) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `in ${diff}d`;
}

// Rule-based opportunity scoring (explainable). Returns score + factors.
export const CLASSIFICATIONS = [
  { value: 'verified_no_website', label: 'Verified No Website', color: 'text-amber-500', bg: 'bg-amber-500/15', dot: 'bg-amber-500' },
  { value: 'website_found', label: 'Website Found', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15', dot: 'bg-emerald-500' },
  { value: 'needs_checking', label: 'Needs Checking', color: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-slate-400' },
  { value: 'broken_inaccessible', label: 'Broken / Inaccessible', color: 'text-destructive', bg: 'bg-destructive/15', dot: 'bg-destructive' },
  { value: 'needs_improvement', label: 'Needs Improvement', color: 'text-blue-500', bg: 'bg-blue-500/15', dot: 'bg-blue-500' },
];

export function classLabel(value) {
  return CLASSIFICATIONS.find((c) => c.value === value)?.label || value || 'Needs Checking';
}
export function classColor(value) {
  return CLASSIFICATIONS.find((c) => c.value === value)?.color || 'text-muted-foreground';
}
export function classBg(value) {
  return CLASSIFICATIONS.find((c) => c.value === value)?.bg || 'bg-muted';
}
export function classDot(value) {
  return CLASSIFICATIONS.find((c) => c.value === value)?.dot || 'bg-slate-400';
}

export const CHECK_STATUS = {
  passed: { label: 'Passed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15', icon: 'CheckCircle2' },
  negative: { label: 'Negative Finding', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15', icon: 'MinusCircle' },
  failed: { label: 'Failed', color: 'text-destructive', bg: 'bg-destructive/15', icon: 'XCircle' },
  unavailable: { label: 'Unavailable', color: 'text-muted-foreground', bg: 'bg-muted', icon: 'CircleDashed' },
};
export function checkStatusInfo(status) {
  return CHECK_STATUS[status] || { label: status, color: 'text-muted-foreground', bg: 'bg-muted', icon: 'Circle' };
}

export function scoreOpportunity(business, audit, idealClient = {}) {
  const factors = [];
  let score = 50; // baseline
  let confidence = 40;

  // Missing website = strong signal
  if (business.website_status === 'no_website_listed') {
    score += 25;
    confidence += 15;
    factors.push({ label: 'No website listed', impact: '+25', positive: true });
  } else if (['inaccessible', 'error', 'blocked'].includes(business.website_status)) {
    score += 18;
    confidence += 10;
    factors.push({ label: 'Website inaccessible/errored', impact: '+18', positive: true });
  } else if (business.website_status === 'redirecting') {
    score += 8;
    factors.push({ label: 'Website redirecting', impact: '+8', positive: true });
  }

  // Website quality (from audit) — lower quality = higher opportunity
  if (audit && audit.overall_score != null) {
    const gap = 100 - audit.overall_score;
    const add = Math.round(gap * 0.25);
    score += add;
    confidence += 12;
    factors.push({ label: `Website quality ${audit.overall_score}/100`, impact: `+${add}`, positive: true });
  }

  // Industry relevance to ideal client
  if (idealClient.industries && idealClient.industries.length && business.industry) {
    if (idealClient.industries.includes(business.industry)) {
      score += 10;
      confidence += 8;
      factors.push({ label: 'Matches target industry', impact: '+10', positive: true });
    } else {
      score -= 5;
      factors.push({ label: 'Outside target industries', impact: '-5', positive: false });
    }
  }

  // Contact info availability
  if (business.email || business.phone) {
    score += 7;
    confidence += 6;
    factors.push({ label: 'Contact info available', impact: '+7', positive: true });
  } else {
    score -= 8;
    factors.push({ label: 'No contact info', impact: '-8', positive: false });
  }

  // Rating — operational signal
  if (business.rating && business.rating >= 4.0) {
    score += 5;
    confidence += 5;
    factors.push({ label: `Strong rating ${business.rating}`, impact: '+5', positive: true });
  } else if (business.rating && business.rating < 3.5) {
    score -= 6;
    factors.push({ label: `Low rating ${business.rating}`, impact: '-6', positive: false });
  }

  // Already a lead / contacted reduces raw opportunity (in progress)
  if (business.lead_status === 'won') {
    score -= 30;
    factors.push({ label: 'Already won', impact: '-30', positive: false });
  } else if (business.lead_status === 'contacted' || business.lead_status === 'replied') {
    score -= 5;
    factors.push({ label: 'Already in outreach', impact: '-5', positive: false });
  }

  score = Math.max(0, Math.min(100, score));
  confidence = Math.max(10, Math.min(95, confidence));

  const missing = [];
  if (!business.email && !business.phone) missing.push('contact information');
  if (!business.website_url) missing.push('website verification');
  if (!audit) missing.push('website audit');
  if (business.rating == null) missing.push('business rating');

  let nextAction = 'Run a website audit to confirm opportunity.';
  if (business.website_status === 'no_website_listed') nextAction = 'Reach out — no website present.';
  else if (audit && audit.overall_score != null && audit.overall_score < 50) nextAction = 'Send an audit-led pitch.';

  return { score, confidence, factors, missing, nextAction };
}