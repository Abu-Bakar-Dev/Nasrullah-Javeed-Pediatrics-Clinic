import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { launchBrowser } from './browser-tools.mjs';

config({ path: '.env.local', quiet: true });
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonymousKey = process.env.VITE_SUPABASE_ANON_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const unwrap = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const directory = mkdtempSync(join(tmpdir(), 'clinic-online-devices-'));
const browsers = [], userIds = [], clients = {};
const patientName = `SYNC VERIFICATION ${randomUUID().slice(0, 8)}`;
const fixtureTag = randomUUID();
let patientId, vite;
let origin = process.env.CLINIC_TEST_ORIGIN || 'https://nasrullah-javed-pediatric-clinic.vercel.app';
try {
  if (process.argv.includes('--local')) {
    const { createServer } = await import('vite');
    vite = await createServer({ server: { port: 0, host: '127.0.0.1' } }); await vite.listen();
    origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  }
  const accounts = {};
  for (const [label, role] of [['admin', 'super_admin'], ['assistant', 'assistant'], ['doctor', 'doctor'], ['other', 'doctor']]) {
    const email = `sync-check-${label}-${fixtureTag}@example.com`, password = `${randomUUID()}Aa1!`;
    const { user } = unwrap(await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { clinic_sync_verification: fixtureTag } })); userIds.push(user.id);
    unwrap(await admin.from('profiles').insert({ id: user.id, email, name: `SYNC CHECK ${label}`, role, department: 'Temporary verification', status: 'active' }));
    accounts[label] = { id: user.id, email, password };
    clients[label] = createClient(url, anonymousKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  for (let i = 0; i < 4; i++) browsers.push(await launchBrowser({ directory: join(directory, `device-${i}`), origin, mobile: i !== 0 }));
  const [laptop, reception, doctor, other] = browsers;
  const login = async (browser, label, role) => {
    await browser.wait('!!document.querySelector("#username")'); await browser.click(role);
    await browser.fill('#username', accounts[label].email); await browser.fill('#password', accounts[label].password);
    await browser.evaluate('document.querySelector("form").requestSubmit()');
    await browser.wait('document.body.innerText.includes("Updates every 2 seconds")');
  };
  await Promise.all([login(laptop, 'admin', 'Super Admin'), login(reception, 'assistant', 'Assistant'), login(doctor, 'doctor', 'Doctor'), login(other, 'other', 'Doctor')]);
  for (const label of Object.keys(clients)) unwrap(await clients[label].auth.signInWithPassword({ email: accounts[label].email, password: accounts[label].password }));
  const appRequest = async (label, path, method, body) => {
    const { data } = await clients[label].auth.getSession();
    const response = await fetch(origin + path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  };
  const directoryFor = async browser => {
    await browser.click('Patients');
    await browser.wait(`!!document.querySelector('input[placeholder^="Search Name"]')`);
    await browser.fill('input[placeholder^="Search Name"]', patientName);
  };
  await Promise.all([directoryFor(laptop), directoryFor(doctor), directoryFor(other)]);
  await reception.click('Patients'); await reception.click('Register New Patient');
  await reception.wait('!!document.querySelector("#fullName")');
  const phone = `09${String(BigInt('0x' + randomUUID().replaceAll('-', '').slice(0, 12)) % 1000000000n).padStart(9, '0')}`;
  await reception.fill('#fullName', patientName); await reception.fill('#phone', phone); await reception.fill('#age', '5');
  await reception.evaluate('document.querySelector("form").requestSubmit()');
  await reception.wait('document.body.innerText.includes("Registration Complete")');
  const token = await reception.evaluate('document.body.innerText.match(/P-[A-F0-9]{12}/)?.[0]'); assert(token);
  const patient = unwrap(await admin.from('patients').select('id,mrn').eq('mrn', token).single()); patientId = patient.id;
  await laptop.wait(`document.body.innerText.includes(${JSON.stringify(patientName)})`);
  assert(!(await doctor.evaluate('document.body.innerText')).includes(patientName));
  console.log('PASS Assistant mobile registration automatically appears on the Super Admin laptop.');
  await reception.click('Schedule Appointment'); await reception.wait('!!document.querySelector("#booking-doctor")');
  await reception.evaluate(`(() => { const el = document.querySelector('#booking-doctor'); el.value = ${JSON.stringify(accounts.doctor.id)}; el.dispatchEvent(new Event('change', {bubbles:true})); })()`);
  await reception.fill('#booking-date', '2099-12-03'); await reception.fill('#booking-time', '14:15');
  await reception.click('Create Booking & Issue Receipt'); await reception.wait('document.body.innerText.includes("Print Receipt")');
  await reception.wait('Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Print Receipt") && !b.disabled)');
  await reception.evaluate('window.print = () => {}'); await reception.click('Print Receipt');
  await reception.wait('Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Print Receipt") && !b.disabled)');
  await reception.click('Close');
  const booking = unwrap(await admin.from('appointments').select('id,patient_id').eq('patient_id', patientId).single());
  await doctor.wait(`document.body.innerText.includes(${JSON.stringify(patientName)})`);
  assert(!(await other.evaluate('document.body.innerText')).includes(patientName));
  console.log('PASS Booking automatically reaches the assigned Doctor phone; the unassigned Doctor cannot see it.');
  await laptop.click('Bookings'); await doctor.click('Bookings');
  const checkedIn = await appRequest('assistant', '/api/appointment-status', 'PATCH', { id: booking.id, status: 'checked_in' }); assert.equal(checkedIn.status, 200);
  const statusExpression = status => `Array.from(document.querySelectorAll('h4')).some(n => n.textContent.includes(${JSON.stringify(patientName)}) && n.parentElement.parentElement.textContent.includes(${JSON.stringify('Status: ' + status)}))`;
  await Promise.all([laptop, reception, doctor].map(b => b.wait(statusExpression('checked in'))));
  assert.equal((await appRequest('other', '/api/appointment-status', 'PATCH', { id: booking.id, status: 'completed' })).status, 403);
  assert.equal((await appRequest('doctor', '/api/appointment-status', 'PATCH', { id: booking.id, status: 'in_consultation' })).status, 200);
  await Promise.all([laptop, reception, doctor].map(b => b.wait(statusExpression('in consultation'))));
  const receipt = unwrap(await admin.from('receipts').select('receipt_no,amount_paid').eq('appointment_id', booking.id).single()); assert.equal(Number(receipt.amount_paid), 1000);
  await laptop.evaluate(`(() => { const title = Array.from(document.querySelectorAll('h4')).find(n => n.textContent.includes(${JSON.stringify(patientName)})); title.parentElement.parentElement.querySelector('button').click(); })()`);
  await laptop.wait('document.body.innerText.includes("Print Receipt")');
  await laptop.wait(`document.body.innerText.includes(${JSON.stringify(receipt.receipt_no)})`); await laptop.click('Close');
  console.log('PASS Status changes synchronize across three roles; saved receipt number and amount match on another device.');
  await Promise.all([directoryFor(laptop), directoryFor(reception), directoryFor(doctor)]);
  await Promise.all([laptop, reception, doctor].map(b => b.click('Open Chart')));
  const rx = { id: randomUUID(), patientId, doctorId: accounts.doctor.id, diagnosis: 'TEST ONLY — automated sync verification', notes: 'Temporary verification record, removed after check.', medications: [{ id: randomUUID(), drugName: 'TEST ONLY SYNC MEDICATION', sig: 'TEST ONLY', quantity: 1, refills: 0 }] };
  assert.equal((await appRequest('assistant', '/api/prescriptions', 'POST', rx)).status, 403);
  assert.equal((await appRequest('other', '/api/prescriptions', 'POST', { ...rx, id: randomUUID(), doctorId: accounts.other.id })).status, 403);
  assert.equal((await appRequest('doctor', '/api/prescriptions', 'POST', rx)).status, 201);
  await Promise.all([laptop, reception, doctor].map(b => b.wait('document.body.innerText.includes("TEST ONLY SYNC MEDICATION")')));
  console.log('PASS Doctor prescription automatically updates open laptop/reception/doctor charts; unauthorized prescribing is rejected.');
  await laptop.click('Staff'); await reception.click('Bookings');
  const extraName = `SYNC CHECK extra ${fixtureTag.slice(0, 8)}`;
  assert.equal((await appRequest('assistant', '/api/admin-users', 'POST', {})).status, 403);
  const createdStaff = await appRequest('admin', '/api/admin-users', 'POST', { name: extraName, email: `sync-extra-${fixtureTag}@example.com`, password: `${randomUUID()}Aa1!`, role: 'doctor', department: 'Temporary verification' });
  assert.equal(createdStaff.status, 201); userIds.push(createdStaff.data.id);
  await laptop.wait(`document.body.innerText.includes(${JSON.stringify(extraName)})`);
  await reception.wait(`Array.from(document.querySelectorAll('#booking-doctor option')).some(o => o.textContent.includes(${JSON.stringify(extraName)}))`);
  console.log('PASS Super Admin staff creation automatically updates the laptop roster and mobile booking providers; Assistant account creation is denied.');
  await reception.command('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await reception.wait('document.body.innerText.includes("Connection lost")');
  await reception.command('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await reception.wait('document.body.innerText.includes("Updates every 2 seconds")');
  unwrap(await admin.from('profiles').update({ status: 'inactive' }).eq('id', accounts.other.id));
  await other.wait('!!document.querySelector("#username")');
  await login(other, 'assistant', 'Assistant'); await other.click('Sign out'); await other.wait('!!document.querySelector("#username")');
  unwrap(await clients.assistant.auth.refreshSession());
  assert(await reception.evaluate('!document.querySelector("#username")'));
  assert.equal((await clients.assistant.auth.getUser()).error, null);
  console.log('PASS Reconnection, account deactivation and independent same-account device sessions work.');
  for (const browser of browsers) assert.deepEqual(browser.exceptions, [], 'No browser runtime exceptions');
  console.log(`PASS Four isolated browsers (one laptop and three 390px mobile sessions) verified against ${origin}.`);
} finally {
  await Promise.allSettled(browsers.map(b => b.close()));
  const cleanupErrors = [];
  // A create-user request can reach the server even if its response is lost. Discover this run's
  // exact UUID-tagged fixtures as well as the IDs returned successfully, without touching other users.
  for (let page = 1; ; page++) {
    const listed = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listed.error) { cleanupErrors.push('Cannot audit temporary account cleanup: ' + listed.error.message); break; }
    for (const user of listed.data.users) if (user.email?.includes(fixtureTag) && /^sync-(check|extra)-/.test(user.email) && !userIds.includes(user.id)) userIds.push(user.id);
    if (listed.data.users.length < 1000) break;
  }
  // Find by the unique run name as well, so failed UI assertions cannot leave a newly saved fixture behind.
  const found = await admin.from('patients').select('id').eq('name', patientName);
  const patientIds = [...new Set([patientId, ...(found.data || []).map(p => p.id)].filter(Boolean))];
  for (const id of patientIds) {
    for (const table of ['receipts', 'prescriptions', 'patient_visits', 'appointments']) { const { error } = await admin.from(table).delete().eq('patient_id', id); if (error) cleanupErrors.push(`${table}: ${error.message}`); }
    const { error } = await admin.from('patients').delete().eq('id', id); if (error) cleanupErrors.push(error.message);
  }
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id); if (error) cleanupErrors.push(error.message);
    const deleted = await admin.from('profiles').delete().eq('id', id); if (deleted.error) cleanupErrors.push(deleted.error.message);
  }
  for (const client of Object.values(clients)) client.auth.stopAutoRefresh();
  if (vite) await vite.close();
  rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  assert.deepEqual(cleanupErrors, [], 'Temporary records must be removed');
  console.log('PASS Temporary test patients, bookings, receipts, prescriptions and accounts removed.');
}
