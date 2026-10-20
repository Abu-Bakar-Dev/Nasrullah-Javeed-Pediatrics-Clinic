import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyDefaultAdmin, DEFAULT_ADMIN_EMAIL } from './default-admin.mjs';

const config = { url: 'https://clinic.example', anonKey: 'public-anonymous-key' };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status });
test('verifies the fixed online Super Admin, checks role/status, and closes only the verification session', async () => {
  const calls = [];
  const profile = await verifyDefaultAdmin('ExistingPassword123', { config, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/token?')) { assert.deepEqual(JSON.parse(options.body), { email: DEFAULT_ADMIN_EMAIL, password: 'ExistingPassword123' }); return response({ access_token: 'ephemeral-token', user: { id: 'online-admin', email: DEFAULT_ADMIN_EMAIL } }); }
    if (url.includes('/profiles?')) { assert.equal(options.headers.Authorization, 'Bearer ephemeral-token'); return response([{ id: 'online-admin', email: DEFAULT_ADMIN_EMAIL, name: 'Abu Bakar', role: 'super_admin', status: 'active' }]); }
    assert(url.endsWith('/logout?scope=local')); return response({});
  } });
  assert.equal(profile.email, DEFAULT_ADMIN_EMAIL); assert.equal(profile.role, 'super_admin');
  assert(!('password' in profile)); assert(!('access_token' in profile)); assert.equal(calls.length, 3);
});
test('rejects wrong online passwords and unavailable internet without creating an account', async () => {
  await assert.rejects(verifyDefaultAdmin('Incorrect123', { config, fetchImpl: async () => response({ error: 'Invalid credentials' }, 400) }), /did not match/);
  await assert.rejects(verifyDefaultAdmin('ExistingPassword123', { config, fetchImpl: async () => { throw new TypeError('fetch failed'); } }), /internet/);
});
test('rejects inactive or non-admin online profiles and cleans up the temporary session', async () => {
  for (const details of [{ role: 'assistant', status: 'active' }, { role: 'super_admin', status: 'inactive' }]) {
    let loggedOut = false;
    await assert.rejects(verifyDefaultAdmin('ExistingPassword123', { config, fetchImpl: async url => {
      if (url.includes('/token?')) return response({ access_token: 'token', user: { id: 'admin', email: DEFAULT_ADMIN_EMAIL } });
      if (url.includes('/profiles?')) return response([{ email: DEFAULT_ADMIN_EMAIL, ...details }]);
      loggedOut = true; return response({});
    } }), /active Super Admin/);
    assert(loggedOut);
  }
});
