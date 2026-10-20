import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_ADMIN_EMAIL = 'abu.bakar041295@gmail.com';

export async function verifyDefaultAdmin(password, options = {}) {
  if (typeof password !== 'string' || !password.length || password.length > 256) throw new Error('Enter your existing online Super Admin password.');
  let config = options.config;
  if (!config) {
    try { config = JSON.parse(readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'online-auth.json'), 'utf8')); }
    catch { throw new Error('Online verification configuration is missing. Rebuild the offline package.'); }
  }
  if (!config.url?.startsWith('https://') || !config.anonKey) throw new Error('Invalid online verification configuration.');
  const fetcher = options.fetchImpl || fetch;
  const url = config.url.replace(/\/$/, '');
  let accessToken;
  try {
    const login = await fetcher(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEFAULT_ADMIN_EMAIL, password }),
      signal: AbortSignal.timeout(10000), redirect: 'error',
    });
    if (!login.ok) throw new Error('The password did not match the online Super Admin account.');
    const session = await login.json(); accessToken = session.access_token;
    if (!accessToken || !session.user?.id || session.user.email?.toLowerCase() !== DEFAULT_ADMIN_EMAIL) throw new Error('Online account could not be verified.');
    const response = await fetcher(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=id,email,name,role,status,department`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000), redirect: 'error',
    });
    if (!response.ok) throw new Error('Cannot verify the online clinic profile.');
    const profiles = await response.json(); const profile = Array.isArray(profiles) ? profiles[0] : null;
    if (profile?.email?.toLowerCase() !== DEFAULT_ADMIN_EMAIL || profile.role !== 'super_admin' || profile.status !== 'active') throw new Error('This online account must be an active Super Admin.');
    return { email: DEFAULT_ADMIN_EMAIL, name: profile.name || 'Abu Bakar', department: profile.department || 'Administration', role: 'super_admin', status: 'active' };
  } catch (error) {
    if (/fetch|network|timeout|abort/i.test(error.message)) throw new Error('Connect the laptop to the internet to verify the online password once. Existing offline accounts continue to work without internet.');
    throw error;
  } finally {
    // End only this verification session, without signing out the user's online devices.
    if (accessToken) try {
      await fetcher(`${url}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: config.anonKey, Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(5000), redirect: 'error' });
    } catch { /* No online token is persisted locally, even if cleanup cannot connect. */ }
  }
}
