// =============================================================================
// Storage provider interface
// =============================================================================
// File upload + signed URLs. The current implementation delegates to the
// Base44 Core integrations (UploadPrivateFile / UploadPublicFile /
// CreateFileSignedUrl). To migrate, re-implement against S3-compatible storage
// or local filesystem behind a signed-URL service (see MIGRATION.md).
//
//   uploadPrivate(file): Promise<{ file_uri }>
//   uploadPublic(file):  Promise<{ file_url }>
//   signedUrl(file_uri, expires_in?): Promise<{ signed_url }>
// =============================================================================

import { base44 } from '@/api/base44Client';

export const storageProvider = {
  uploadPrivate: (file) => base44.integrations.Core.UploadPrivateFile({ file }),
  uploadPublic: (file) => base44.integrations.Core.UploadPublicFile({ file }),
  signedUrl: (file_uri, expires_in) =>
    base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in }),
};