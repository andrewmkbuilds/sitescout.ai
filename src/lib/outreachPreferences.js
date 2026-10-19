import { useState, useEffect } from 'react';

// Outreach writing preferences — persisted to localStorage so they survive
// across sessions without a backend. In anonymous demo mode this is per-browser,
// which is enough; when auth is restored these can be mirrored to the user profile.

export const PREFERENCE_DEFAULTS = {
  tone: 'casual_friendly',
  length: 'standard_email',
  approach: 'curiosity_driven',
  channel: 'email',
  agency_name: '',
  services: '',
  sign_off: '',
  preferred_cta: '',
  avoid_phrases: '',
  allow_emojis: false,
  mention_pricing: false,
  offer_free_audit: true,
  custom_instructions: '',
};

const KEY = 'sitescout_outreach_preferences';

export function loadPreferences() {
  if (typeof window === 'undefined') return { ...PREFERENCE_DEFAULTS };
  try {
    const raw = window.localStorage.getItem(KEY);
    return { ...PREFERENCE_DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...PREFERENCE_DEFAULTS };
  }
}

export function savePreferences(p) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function useOutreachPreferences() {
  const [prefs, setPrefs] = useState(loadPreferences);
  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);
  return [prefs, setPrefs];
}

export const TONE_OPTIONS = [
  { value: 'casual_friendly', label: 'Casual and friendly' },
  { value: 'professional_approachable', label: 'Professional but approachable' },
  { value: 'short_direct', label: 'Short and direct' },
  { value: 'helpful_consultative', label: 'Helpful and consultative' },
  { value: 'confident_persuasive', label: 'Confident and persuasive' },
  { value: 'premium_agency', label: 'Premium agency' },
  { value: 'warm_conversational', label: 'Warm and conversational' },
  { value: 'formal', label: 'Formal' },
  { value: 'custom', label: 'Custom tone' },
];

export const LENGTH_OPTIONS = [
  { value: 'very_short', label: 'Very short (1–3 sentences)' },
  { value: 'short', label: 'Short (3–5 sentences)' },
  { value: 'standard_email', label: 'Standard email' },
  { value: 'detailed', label: 'Detailed proposal-style' },
];

export const APPROACH_OPTIONS = [
  { value: 'curiosity_driven', label: 'Keep the first message curiosity-driven' },
  { value: 'simple_question', label: 'Ask a simple question' },
  { value: 'free_review', label: 'Offer a free website review' },
  { value: 'verified_issue', label: 'Point out a verified issue' },
  { value: 'specific_improvement', label: 'Offer a specific improvement' },
  { value: 'useful_suggestion', label: 'Lead with a useful suggestion' },
  { value: 'website_concept', label: 'Offer a website concept' },
  { value: 'seo', label: 'Focus on SEO' },
  { value: 'performance', label: 'Focus on performance' },
  { value: 'conversions', label: 'Focus on conversions' },
  { value: 'enquiries', label: 'Focus on getting more enquiries' },
];

export const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'instagram_dm', label: 'Instagram DM' },
  { value: 'linkedin', label: 'LinkedIn-style message' },
  { value: 'follow_up', label: 'Follow-up email' },
  { value: 'general_dm', label: 'General direct message' },
];