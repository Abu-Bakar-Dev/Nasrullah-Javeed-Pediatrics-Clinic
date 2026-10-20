import { verifyTestAdmin } from './test-admin.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { networkInterfaces } from 'node:os';

test('four independent LAN clients share records, preserve role access and reject concurrent conflicts', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'clinic-four-devices-'));
  process.env.CLINIC_OFFLINE_DATA = directory;
  const server = (await import('./server.mjs')).createClinicServer({ verifyAdmin: verifyTestAdmin });
  await new Promise(resolve => server.listen(0, '0.0.0.0', resolve));
  const port = server.address().port;
  const ip = Object.values(networkInterfaces()).flat().find(n => n.family === 'IPv4' && !n.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address))?.address;
  const laptop = `http://127.0.0.1:${port}`, wifi = ip ? `http://${ip}:${port}` : laptop;
  const client = origin => {
    let cookie = '';
    return async (route, body) => {
      const response = await fetch(`${origin}/offline-api/${route}`, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      return { status: response.status, data: await response.json() };
    };
  };
  const admin = client(laptop), reception = client(wifi), doctor = client(wifi), doctor2 = client(wifi);
  const ok = result => { assert.equal(result.status, 200, JSON.stringify(result.data)); return result.data; };
  try {
    if (ip) {
      assert.equal((await reception('setup')).data.canSetup, false);
      assert.equal((await reception('setup', { name: 'Bad', email: 'bad@test.local', password: 'StrongPass123' })).status, 403);
    }
    ok(await admin('setup', { name: 'Laptop Admin', email: 'abu.bakar041295@gmail.com', password: 'StrongPass123' }));
    ok(await admin('login', { email: 'abu.bakar041295@gmail.com', password: 'StrongPass123' }));
    for (const [role, email] of [['assistant', 'reception@clinic.test'], ['doctor', 'doctor@clinic.test'], ['doctor', 'doctor2@clinic.test']]) ok(await admin('staff', { id: `new-${email}`, name: email, email, password: 'StrongPass123', role, department: 'Clinic' }));
    await Promise.all([[reception, 'reception'], [doctor, 'doctor'], [doctor2, 'doctor2']].map(async ([call, name]) => ok(await call('login', { email: `${name}@clinic.test`, password: 'StrongPass123' }))));
    const staff = ok(await admin('data')).staff;
    const doc = staff.find(s => s.email === 'doctor@clinic.test').id, doc2 = staff.find(s => s.email === 'doctor2@clinic.test').id;
    const patient = { id: 'shared-patient', mrn: 'P-SHARED123', name: 'Shared patient', phone: '0333-7645673', age: 5, gender: 'Male', dob: '', allergies: [], activeConditions: [], vitals: {} };
    // Two independent devices submit the same phone concurrently. Exactly one is accepted.
    const registrations = await Promise.all([admin('patient', patient), reception('patient', { ...patient, id: 'phone-race', mrn: 'P-RACE', phone: '03337645673' })]);
    assert.deepEqual(registrations.map(r => r.status).sort(), [200, 409]);
    const saved = ok(await reception('data')).patients[0]; assert.equal(ok(await admin('data')).patients[0].mrn, saved.mrn);
    assert.equal(ok(await doctor('data')).patients.length, 0);
    const appointment = { id: 'shared-booking', patientId: saved.id, doctorId: doc, date: '2099-12-01', time: '10:00', reason: 'General Consultation' };
    const bookings = await Promise.all([admin('appointment', appointment), reception('appointment', { ...appointment, id: 'slot-race' })]);
    assert.deepEqual(bookings.map(r => r.status).sort(), [200, 409]);
    const booking = ok(await doctor('data')).appointments[0];
    assert.equal(ok(await doctor('data')).patients[0].mrn, saved.mrn);
    assert.equal(ok(await doctor2('data')).patients.length, 0);
    const statuses = await Promise.all([reception('status', { id: booking.id, status: 'checked_in', expectedStatus: 'waiting' }), admin('status', { id: booking.id, status: 'not_arrived', expectedStatus: 'waiting' })]);
    assert.deepEqual(statuses.map(r => r.status).sort(), [200, 409]);
    const latest = ok(await doctor('data')).appointments[0].status;
    ok(await doctor('status', { id: booking.id, status: 'in_consultation', expectedStatus: latest }));
    assert.equal(ok(await reception('data')).appointments[0].status, 'in_consultation');
    assert.equal((await doctor2('status', { id: booking.id, status: 'completed' })).status, 403);
    ok(await doctor('prescription', { id: 'shared-rx', patientId: saved.id, doctorId: doc, diagnosis: 'Shared diagnosis', medications: [{ drugName: 'Medicine', sig: 'As directed', quantity: 1, refills: 0 }] }));
    assert.equal(ok(await admin('data')).prescriptions.length, 1); assert.equal(ok(await reception('data')).prescriptions.length, 1); assert.equal(ok(await doctor2('data')).prescriptions.length, 0);
    const receipts = await Promise.all([admin('receipt', { appointment: booking, serviceName: 'Consultation', amountPaid: 1000 }), reception('receipt', { appointment: booking, serviceName: 'Consultation', amountPaid: 1000 })]);
    assert.equal(ok(receipts[0]).receipt.id, ok(receipts[1]).receipt.id);
    assert.equal(ok(await doctor(`receipt?id=${booking.id}`)).amount_paid, 1000);
    const service = { id: 'shared-service', doctorId: doc, name: 'Shared service', price: 1000, durationMinutes: 30 };
    const preferenceRace = await Promise.all([admin('preference-change', { type: 'service', action: 'upsert', item: service, expectedRevision: 0 }), doctor('preference-change', { type: 'service', action: 'upsert', item: { ...service, price: 1500 }, expectedRevision: 0 })]);
    assert.deepEqual(preferenceRace.map(r => r.status).sort(), [200, 409]);
    const preferences = ok(await doctor2('data')).preferences; assert.equal(preferences.services.length, 1);
    assert.equal((await doctor2('preference-change', { type: 'service', action: 'delete', id: service.id, expectedRevision: preferences.revision })).status, 403);
    const serviceBefore = preferences.services[0];
    const serviceAfter = ok(await doctor('preference-change', { type: 'service', action: 'upsert', item: { ...serviceBefore, price: 1800 }, expectedItem: serviceBefore, expectedRevision: preferences.revision }));
    assert.equal((await admin('preference-change', { type: 'service', action: 'upsert', item: { ...serviceBefore, price: 2000 }, expectedItem: serviceBefore, expectedRevision: serviceAfter.preferences.revision })).status, 409, 'A stale draft is rejected even after the device has polled a new revision.');
    const timing = { id: 'monday', doctorId: doc2, day: 'Monday', isAvailable: true, startTime: '09:00 AM', endTime: '05:00 PM', slotDurationMinutes: 30 };
    const savedTiming = ok(await doctor2('preference-change', { type: 'timings', doctorId: doc2, timings: [timing], expectedRevision: serviceAfter.preferences.revision }));
    assert.equal((await admin('preference-change', { type: 'timings', doctorId: doc2, timings: [], expectedTimings: [], expectedRevision: savedTiming.preferences.revision })).status, 409);
    assert.equal(ok(await reception('data')).preferences.timings[0].doctorId, doc2);
    const secondDoctorDevice = client(wifi);
    ok(await secondDoctorDevice('login', { email: 'doctor@clinic.test', password: 'StrongPass123' }));
    assert.equal((await doctor('data')).status, 200, 'The same account can stay signed in on multiple devices.');
    ok(await doctor('logout', {}));
    assert.equal((await doctor('data')).status, 401); assert.equal((await reception('data')).status, 200);
    ok(await admin('staff', { ...staff.find(s => s.id === doc2), status: 'inactive' }));
    assert.equal((await doctor2('data')).status, 401);
    const before = ok(await admin('data')).revision;
    ok(await reception('patient', { ...patient, id: 'last-patient', mrn: 'P-LAST', phone: '03331234567' }));
    assert(ok(await admin('data')).revision > before);
    assert.equal(ok(await admin('backup')).receipts.length, 1);
    console.log(`Verified four isolated sessions via ${wifi}: registration, bookings, status, prescriptions, receipts, services, timings, duplicate races, conflicts and session revocation.`);
  } finally { await new Promise(resolve => server.close(resolve)); rmSync(directory, { recursive: true, force: true }); }
});
