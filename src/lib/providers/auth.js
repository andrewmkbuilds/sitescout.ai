// =============================================================================
// Auth provider interface
// =============================================================================
// Contract any auth backend must satisfy. The current implementation delegates
// to the Base44 SDK (src/api/base44Client.js). To migrate off Base44, implement
// this interface with an open-source auth solution (see MIGRATION.md).
//
//   me(): Promise<{ id, email, full_name, role, ...extra }>
//   isAuthenticated(): Promise<boolean>
//   updateMe(data): Promise<user>          // persist extra profile fields
//   logout(redirectUrl?): void
//   inviteUser(email, role): Promise<void>
// =============================================================================

import { base44 } from '@/api/base44Client';

export const authProvider = {
  me: () => base44.auth.me(),
  isAuthenticated: () => base44.auth.isAuthenticated(),
  updateMe: (data) => base44.auth.updateMe(data),
  logout: (redirectUrl) => base44.auth.logout(redirectUrl),
  inviteUser: (email, role) => base44.users.inviteUser(email, role),
};