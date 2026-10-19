import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { AUTH_ENABLED, DEMO_USER } from '@/lib/authMode';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  appBaseUrl
});

// TEMPORARY (anonymous demo mode): stub the SDK auth methods so pages that call
// base44.auth.me()/updateMe()/logout() keep working without a real session.
// Restore by setting AUTH_ENABLED = true in src/lib/authMode.js.
if (!AUTH_ENABLED) {
  try {
    base44.auth.me = async () => DEMO_USER;
    base44.auth.isAuthenticated = async () => true;
    base44.auth.updateMe = async (data) => ({ ...DEMO_USER, ...data });
    base44.auth.logout = () => {};
    base44.auth.redirectToLogin = () => {};
  } catch { /* SDK auth object not extensible — pages degrade to empty defaults */ }
}