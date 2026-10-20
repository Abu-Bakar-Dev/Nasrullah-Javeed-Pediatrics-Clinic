import { verifyTestAdmin } from './test-admin.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('offline clinic persists clinical workflows, enforces access and safely restores backups', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'clinic-offline-test-'));
  process.env.CLINIC_OFFLINE_DATA = directory;
  let server = (await import('./server.mjs')).createClinicServer({ verifyAdmin: verifyTestAdmin });
  let origin;
  const start = async () => { await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); origin = `http://127.0.0.1:${server.address().port}`; };
  const stop = () => new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  async function call(route, body, cookie = '', headers = {}) {
    const response = await fetch(`${origin}/offline-api/${route}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie, ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json();
    return { status: response.status, result, cookie: response.headers.get('set-cookie')?.split(';')[0] || '' };
  }
  const login = async email => { const r = await call('login', { email, password: 'StrongPass123' }); assert.equal(r.status, 200); return r.cookie; };
  try {
    await start();
    assert.equal((await call('setup')).result.ready, false);
    assert.equal((await call('setup')).result.defaultAdminEmail, 'abu.bakar041295@gmail.com');
    assert.equal((await call('data')).status, 401);
    assert.equal((await call('setup', { name: 'Admin', email: 'abu.bakar041295@gmail.com', password: 'StrongPass123' }, '', { Origin: 'https://evil.test' })).status, 403);
    assert.equal((await call('setup', { email: 'abu.bakar041295@gmail.com', password: 'WrongPassword123' })).status, 400);
    assert.equal((await call('setup')).result.ready, false);
    assert.equal((await call('setup', { email: 'another-admin@example.com', password: 'StrongPass123' })).status, 400);
    assert.equal((await call('setup', { name: 'Admin', email: 'abu.bakar041295@gmail.com', password: 'StrongPass123' })).status, 200);
    assert.equal((await call('setup', {})).status, 409);
    assert.equal((await call('login', { email: 'abu.bakar041295@gmail.com', password: 'incorrect' })).status, 401);
    let admin = await login('abu.bakar041295@gmail.com');
    const staff = async (email, role) => {
      assert.equal((await call('staff', { id: `new-${role}-${email}`, name: role, email, role, password: 'StrongPass123', department: 'Clinic', status: 'active' }, admin)).status, 200);
    };
    await staff('doctor@local.test', 'doctor'); await staff('other@local.test', 'doctor'); await staff('assistant@local.test', 'assistant');
    const assistant = await login('assistant@local.test'), doctor = await login('doctor@local.test'), other = await login('other@local.test');
    let data = (await call('data', undefined, admin)).result;
    assert(!JSON.stringify(data).includes('passwordHash')); assert(!JSON.stringify(data).includes('StrongPass123'));
    const doctorId = data.staff.find(s => s.email === 'doctor@local.test').id;
    const patient = { id: 'patient-1', mrn: 'P-ABC123', phone: '0333-7645673', name: 'Patient', age: 5, gender: 'Male', dob: '', address: '', bloodType: 'Unknown', allergies: [], activeConditions: [], vitals: {}, lastVisit: 'Just registered', balance: '0' };
    assert.equal((await call('patient', patient, doctor)).status, 403);
    assert.equal((await call('patient', patient, assistant)).status, 200);
    assert.equal((await call('patient', { ...patient, id: 'duplicate-phone', mrn: 'P-OTHER', phone: '03337645673' }, assistant)).status, 409);
    assert.equal((await call('patient', { ...patient, id: 'duplicate-token', phone: '03331234567' }, assistant)).status, 409);
    const appointment = { id: 'booking-1', patientId: patient.id, doctorId, date: '2099-12-01', time: '10:00', reason: 'General Consultation', status: 'waiting', patientName: patient.name, doctorName: 'doctor' };
    assert.equal((await call('appointment', appointment, assistant)).status, 200);
    assert.equal((await call('appointment', { ...appointment, id: 'duplicate-slot' }, assistant)).status, 409);
    assert.equal((await call('status', { id: appointment.id, status: 'checked_in' }, assistant)).status, 200);
    assert.equal((await call('status', { id: appointment.id, status: 'in_consultation' }, other)).status, 403);
    assert.equal((await call('status', { id: appointment.id, status: 'in_consultation' }, doctor)).status, 200);
    const rx = { id: 'rx-1', patientId: patient.id, doctorId, diagnosis: 'Checkup', medications: [{ drugName: 'Medicine', sig: 'As directed', quantity: 1, refills: 0 }] };
    assert.equal((await call('prescription', rx, assistant)).status, 403);
    assert.equal((await call('prescription', rx, doctor)).status, 200);
    assert.equal((await call('data', undefined, other)).result.patients.length, 0);
    assert.equal((await call('data', undefined, doctor)).result.prescriptions.length, 1);
    const receipt = (await call('receipt', { appointment, serviceName: 'Consultation', amountPaid: 1000 }, assistant)).result.receipt;
    assert.equal(receipt.amount_paid, 1000);
    assert.equal((await call('receipt', { appointment, serviceName: 'Changed', amountPaid: 9999 }, assistant)).result.receipt.amount_paid, 1000);
    assert.equal((await call('receipt?id=booking-1', undefined, admin)).result.id, receipt.id);
    assert.equal((await call('receipt?id=booking-1', undefined, other)).status, 403);
    assert.equal((await call('preferences', { services: [{ id: 'service-1', doctorId }], timings: [], expectedRevision: 0 }, doctor)).status, 200);
    assert.equal((await call('backup', undefined, assistant)).status, 403);
    const backup = (await call('backup', undefined, admin)).result;
    assert.equal(backup.patients.length, 1); assert.equal(backup.receipts.length, 1);
    assert.equal((await call('restore', { ...backup, staff: [] }, admin)).status, 400);
    assert.equal((await call('data', undefined, admin)).result.patients.length, 1);
    await stop();
    server = (await import('./server.mjs?restart')).createClinicServer({ verifyAdmin: async () => { throw new Error('No internet connection'); } }); await start();
    assert.equal((await call('session', undefined, admin)).result.user, null);
    admin = await login('abu.bakar041295@gmail.com');
    data = (await call('data', undefined, admin)).result;
    assert.equal(data.patients[0].mrn, patient.mrn); assert.equal(data.prescriptions.length, 1); assert.equal(data.appointments[0].status, 'in_consultation');
    assert.equal((await call('preferences', undefined, admin)).result.services.length, 1);
    assert.equal((await call('patient', { ...patient, id: 'patient-2', mrn: 'P-SECOND', phone: '03331234567' }, admin)).status, 200);
    assert.equal((await call('restore', backup, admin)).status, 200);
    assert.equal((await call('data', undefined, admin)).status, 401);
    admin = await login('abu.bakar041295@gmail.com');
    assert.equal((await call('data', undefined, admin)).result.patients.length, 1);
    assert(readdirSync(directory).some(f => f.startsWith('before-restore-')));
    assert.equal((await call('delete-staff', { id: doctorId }, admin)).status, 400);
    assert.equal((await call('reset-password', { email: 'assistant@local.test', password: 'Replacement123' }, admin)).status, 200);
    assert.equal((await call('login', { email: 'assistant@local.test', password: 'StrongPass123' })).status, 401);
    assert.equal((await call('login', { email: 'assistant@local.test', password: 'Replacement123' })).status, 200);
  } finally {
    if (server.listening) await stop();
    rmSync(directory, { recursive: true, force: true });
  }
});
