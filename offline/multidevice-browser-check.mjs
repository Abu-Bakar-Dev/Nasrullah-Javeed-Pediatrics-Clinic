import { verifyTestAdmin } from './test-admin.mjs';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir, networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { launchBrowser } from './browser-tools.mjs';

const directory = mkdtempSync(join(tmpdir(), 'clinic-four-browsers-'));
process.env.CLINIC_OFFLINE_DATA = join(directory, 'data');
const server = (await import('./server.mjs')).createClinicServer({ verifyAdmin: verifyTestAdmin });
const browsers = [];
try {
  await new Promise(resolve => server.listen(0, '0.0.0.0', resolve));
  const port = server.address().port;
  const ip = Object.values(networkInterfaces()).flat().find(n => n.family === 'IPv4' && !n.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address))?.address;
  assert(ip, 'Connect the laptop to private Wi-Fi before running the LAN browser check.');
  const local = `http://127.0.0.1:${port}`, lan = `http://${ip}:${port}`;
  const laptop = await launchBrowser({ directory: join(directory, 'laptop'), origin: local }); browsers.push(laptop);
  await laptop.wait('!!document.querySelector("input[name=password]")');
  await laptop.fill('input[name=email]', 'abu.bakar041295@gmail.com'); await laptop.fill('input[name=password]', 'StrongPass123');
  await laptop.evaluate('document.querySelector("form").requestSubmit()');
  await laptop.wait('!!document.querySelector("#username")');
  const login = async (browser, role, email) => {
    await browser.wait('!!document.querySelector("#username")');
    await browser.click(role); await browser.fill('#username', email); await browser.fill('#password', 'StrongPass123');
    await browser.evaluate('document.querySelector("form").requestSubmit()');
    await browser.wait('document.body.innerText.includes("Connected to laptop")');
  };
  await login(laptop, 'Super Admin', 'abu.bakar041295@gmail.com');
  for (const [role, email] of [['assistant', 'assistant@clinic.test'], ['doctor', 'doctor@clinic.test'], ['doctor', 'other@clinic.test']]) {
    const result = await laptop.api('staff', { id: `new-${email}`, name: email, email, password: 'StrongPass123', role, department: 'Clinic' }); assert.equal(result.status, 200);
  }
  for (let i = 0; i < 3; i++) browsers.push(await launchBrowser({ directory: join(directory, `phone-${i}`), origin: lan, mobile: true }));
  const [, reception, doctor, other] = browsers;
  await Promise.all([login(reception, 'Assistant', 'assistant@clinic.test'), login(doctor, 'Doctor', 'doctor@clinic.test'), login(other, 'Doctor', 'other@clinic.test')]);
  assert.equal(await reception.evaluate('window.isSecureContext'), false, 'Phone test uses the actual non-HTTPS Wi-Fi address.');
  assert.equal(await reception.evaluate('typeof crypto.randomUUID'), 'undefined');
  await laptop.click('Patients'); await doctor.click('Patients'); await other.click('Patients');
  await reception.click('Patients'); await reception.click('Register New Patient');
  await reception.wait('!!document.querySelector("#fullName")');
  await reception.fill('#fullName', 'Four Device Patient'); await reception.fill('#phone', '03337645673'); await reception.fill('#age', '5');
  await reception.evaluate('document.querySelector("form").requestSubmit()');
  await reception.wait('document.body.innerText.includes("Registration Complete")');
  const token = await reception.evaluate('document.body.innerText.match(/P-[A-F0-9]{12}/)?.[0]'); assert(token);
  await laptop.wait('document.body.innerText.includes("Four Device Patient")');
  assert(!(await doctor.evaluate('document.body.innerText')).includes('Four Device Patient'), 'Unassigned doctor cannot see patient.');
  await reception.click('Schedule Appointment');
  await reception.wait('!!document.querySelector("#booking-date")');
  await reception.fill('#booking-date', '2099-12-01'); await reception.fill('#booking-time', '10:00');
  await reception.click('Create Booking & Issue Receipt');
  await reception.wait('document.body.innerText.includes("Print Receipt")');
  await reception.evaluate('window.print = () => {}'); await reception.click('Print Receipt');
  await reception.wait('Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Print Receipt") && !b.disabled)');
  await reception.click('Close');
  const data = (await reception.api('data')).data;
  const booking = data.appointments[0], patient = data.patients[0];
  await doctor.wait('document.body.innerText.includes("Four Device Patient")');
  assert(!(await other.evaluate('document.body.innerText')).includes('Four Device Patient'));
  await laptop.click('Bookings');
  await laptop.wait('document.body.innerText.includes("Four Device Patient")');
  await laptop.click('Receipt'); await laptop.wait('document.body.innerText.includes("Print Receipt")');
  assert((await laptop.api(`receipt?id=${booking.id}`)).data.receipt_no);
  await laptop.click('Close');
  const status = await doctor.api('status', { id: booking.id, status: 'completed', expectedStatus: 'waiting' }); assert.equal(status.status, 200);
  await reception.click('Dashboard'); await reception.wait('document.body.innerText.includes("Connected to laptop")');
  await laptop.click('Patients'); await laptop.click('Open Chart');
  await reception.click('Patients'); await reception.click('Open Chart');
  await doctor.click('Open Chart');
  assert.equal((await doctor.api('prescription', { id: 'cross-device-rx', patientId: patient.id, patientName: patient.name, patientMrn: patient.mrn, doctorId: booking.doctorId, doctorName: booking.doctorName, status: 'active', diagnosis: 'Shared consultation', date: '2099-12-01', medications: [{ id: 'med', drugName: 'Cross-device medicine', sig: 'As directed', quantity: 1, refills: 0 }] })).status, 200);
  await Promise.all([laptop, reception, doctor].map(b => b.wait('document.body.innerText.includes("Cross-device medicine")')));
  await laptop.click('Services'); await doctor.click('Services');
  const prefs = (await doctor.api('data')).data.preferences;
  assert.equal((await doctor.api('preference-change', { type: 'service', action: 'upsert', expectedRevision: prefs.revision, item: { id: 'shared-service', doctorId: booking.doctorId, name: 'Cross-device consultation', price: 1500, durationMinutes: 30 } })).status, 200);
  await Promise.all([laptop, doctor].map(b => b.wait('document.body.innerText.includes("Cross-device consultation")')));
  // Open timings on both devices before changing them, to prove mounted forms receive remote updates.
  await laptop.click('Weekly Working Hours'); await doctor.click('Weekly Working Hours');
  const latestPrefs = (await doctor.api('data')).data.preferences;
  assert.equal((await doctor.api('preference-change', { type: 'timings', doctorId: booking.doctorId, expectedRevision: latestPrefs.revision, timings: [{ id: 'mon', doctorId: booking.doctorId, day: 'Monday', isAvailable: true, startTime: '10:30 AM', endTime: '04:30 PM', slotDurationMinutes: 20 }] })).status, 200);
  await laptop.wait('Array.from(document.querySelectorAll("input")).some(i => i.value === "10:30 AM")');
  await laptop.fill('input[type="text"]', '11:00 AM');
  await laptop.click('Save Timings');
  await laptop.wait('document.body.innerText.includes("Schedule successfully updated")');
  await doctor.wait('Array.from(document.querySelectorAll("input")).some(i => i.value === "11:00 AM")');
  // Simulate a phone losing Wi-Fi, then reconnecting without reloading the page.
  await reception.command('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await reception.wait('document.body.innerText.includes("Laptop unavailable")');
  await reception.command('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await reception.wait('document.body.innerText.includes("Connected to laptop")');
  await other.click('Sign out'); await other.wait('!!document.querySelector("#username")');
  assert.equal((await reception.api('data')).status, 200, 'Signing out on one phone does not log out the others.');
  for (const browser of browsers) { assert.deepEqual(browser.exceptions, []); assert.deepEqual(browser.externalRequests, []); }
  console.log('PASS: four isolated browsers (one laptop and three 390px phones), actual LAN HTTP, phone registration and booking, automatic patient/prescription/service/timing updates, shared receipts, role restrictions, Wi-Fi disconnect/reconnect, separate sessions, and zero external requests.');
} finally {
  await Promise.all(browsers.map(b => b.close()));
  await new Promise(resolve => server.close(resolve));
  rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
