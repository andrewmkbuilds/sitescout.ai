// =============================================================================
// Database provider interface
// =============================================================================
// A thin repository layer over the entity store. The current implementation
// delegates to the Base44 entity SDK. To migrate, re-implement these methods
// against PostgreSQL/SQLite + Prisma or Drizzle (see MIGRATION.md). Pages that
// import from here instead of `base44.entities` directly need no further changes.
//
//   list(entity, opts?)            -> { items, next_cursor, has_more }
//   filter(entity, query, opts?)   -> page object (read .items)
//   get(entity, id)                -> record
//   create(entity, data)           -> record
//   update(entity, id, data)       -> record
//   delete(entity, id)              -> void
//   count(entity, query?)          -> number
//   aggregate(entity, opts)        -> { rows }
// =============================================================================

import { base44 } from '@/api/base44Client';

export const databaseProvider = {
  list: (entity, opts) => base44.entities[entity].list(opts),
  filter: (entity, query, opts) => base44.entities[entity].filter(query, opts),
  get: (entity, id) => base44.entities[entity].get(id),
  create: (entity, data) => base44.entities[entity].create(data),
  update: (entity, id, data) => base44.entities[entity].update(id, data),
  delete: (entity, id) => base44.entities[entity].delete(id),
  count: (entity, query) => base44.entities[entity].count(query),
  aggregate: (entity, opts) => base44.entities[entity].aggregate(opts),
};