// =============================================================================
// Provider registry — the single import surface for all infrastructure.
// =============================================================================
// Pages and components import from here instead of `@/api/base44Client`
// directly, so swapping the underlying platform only requires re-implementing
// these modules (see MIGRATION.md). The active implementations all delegate to
// the Base44 SDK today.
//
//   import { providers } from '@/lib/providers';
//   providers.database.filter('Lead', { stage: 'new' }, { sort: '-created_date' });
// =============================================================================

import { authProvider } from '@/lib/providers/auth';
import { databaseProvider } from '@/lib/providers/database';
import { searchProvider } from '@/lib/providers/search';
import { aiProvider } from '@/lib/providers/ai';
import { auditProvider } from '@/lib/providers/audit';
import { storageProvider } from '@/lib/providers/storage';

export const providers = {
  auth: authProvider,
  database: databaseProvider,
  search: searchProvider,
  ai: aiProvider,
  audit: auditProvider,
  storage: storageProvider,
};

export { authProvider, databaseProvider, searchProvider, aiProvider, auditProvider, storageProvider };