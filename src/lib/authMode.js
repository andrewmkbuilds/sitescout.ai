// =============================================================================
// TEMPORARY: AUTHENTICATION DISABLED (anonymous demo / testing mode)
// =============================================================================
// AUTH_ENABLED = false removes every auth wall from SiteScout so the app is
// fully usable without signup/login. This is INTENTIONALLY TEMPORARY for
// automated testing and product exploration.
//
// To RESTORE authentication later:
//   1. Set AUTH_ENABLED = true below.
//   2. Re-add the `rls` ownership rules to each entity in base44/entities/
//      (standard pattern: read/update/delete -> { created_by_id: "{{user.id}}" }).
//   3. Re-enable the `if (!user) return 401` guard in each base44/functions/*/entry.ts.
//   4. In the dashboard (App Settings), set the app visibility back to Private.
// =============================================================================

export const AUTH_ENABLED = false;

// Synthetic, clearly-labelled demo identity used ONLY so the UI and any code
// that reads a current user keeps functioning without a real session. This is
// not a real registered user and exposes no personal data.
export const DEMO_USER = {
  id: 'anonymous-demo-user',
  email: 'demo@sitescout.local',
  full_name: 'Demo User',
  role: 'admin',
};