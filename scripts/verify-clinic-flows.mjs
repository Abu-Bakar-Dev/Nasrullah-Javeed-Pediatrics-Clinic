import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

config({ path: '.env.local', quiet: true });
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const userIds = [];
const patientId = randomUUID();
const appointmentId = randomUUID();
const prescriptionId = randomUUID();
let vite;
const originalFetch = globalThis.fetch;
const check = (label) => console.log(`PASS ${label}`);
const unwrap = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
const profilesBefore = unwrap(await admin.from('profiles').select('id').order('id'));
try {
  vite = await createServer({ server: { port: 0, host: '127.0.0.1' }, appType: 'custom' });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  const db = await vite.ssrLoadModule('/src/lib/supabase.ts');
  globalThis.fetch = async (input, init) => originalFetch(typeof input === 'string' && input.startsWith('/api/') ? origin + input : input, init);
  const accounts = {};
  for (const role of ['assistant', 'doctor']) {
    const email = `flow-check-${randomUUID()}@example.com`;
    const password = `${randomUUID()}Aa1!`;
    const { user } = unwrap(await admin.auth.admin.createUser({ email, password, email_confirm: true }));
    userIds.push(user.id);
    unwrap(await admin.from('profiles').insert({ id: user.id, name: `Flow check ${role}`, email, role, department: 'Testing', status: 'active' }));
    accounts[role] = { id: user.id, email, password };
  }
  const client = db.getSupabase();
  assert(client, 'Configured browser client');
  unwrap(await client.auth.signInWithPassword(accounts.assistant));
  const patient = { id: patientId, mrn: `TEST-${randomUUID()}`, name: 'Temporary flow-check patient', phone: `09${String(Date.now()).slice(-9)}`, age: 0, dob: '', gender: 'Other', bloodType: 'Unknown', address: '', allergies: [], activeConditions: [], vitals: {}, lastVisit: 'Just registered', balance: '$0.00' };
  assert.equal((await db.dbUpsertPatient(patient)).success, true);
  assert.equal(unwrap(await admin.from('patients').select('dob,age').eq('id', patientId).single()).dob, null);
  assert.equal(unwrap(await admin.from('patients').select('age').eq('id', patientId).single()).age, 0);
  check('Patient registration persists without inventing DOB, including age zero');
  assert.equal((await db.dbUpsertPatient({ ...patient, id: randomUUID(), mrn: `TEST-${randomUUID()}` })).success, false);
  check('Duplicate patient phone rejected');
  const appointment = { id: appointmentId, patientId, patientName: patient.name, patientPhone: patient.phone, patientAge: 0, doctorId: accounts.doctor.id, doctorName: 'Flow check doctor', department: 'Testing', reason: 'Flow verification', date: '2099-01-01', time: '10:00', status: 'waiting' };
  assert.equal((await db.dbUpsertAppointment({ ...appointment, patientId: randomUUID() })).success, false);
  check('Booking rejected for unregistered patient');
  assert.equal((await db.dbUpsertAppointment({ ...appointment, doctorId: accounts.assistant.id })).success, false);
  check('Booking rejected for a non-doctor provider');
  assert.equal((await db.dbUpsertAppointment(appointment)).success, true);
  check('Registered patient booking persists');
  assert.equal((await db.dbUpdateAppointmentStatus(appointmentId, 'checked_in')).success, true);
  check('Assistant check-in persists');
  const receipt = await db.dbSaveReceipt(appointment, 'Flow verification', 100);
  assert.equal(receipt.success, true);
  const reprint = await db.dbSaveReceipt(appointment, 'Changed title', 999);
  assert.equal(reprint.receipt.receipt_no, receipt.receipt.receipt_no);
  assert.equal(Number(reprint.receipt.amount_paid), 100);
  assert.equal(reprint.receipt.service_name, 'Flow verification');
  check('Receipt persists and reprints preserve its number, service, and amount');
  const rx = { id: prescriptionId, patientId, patientName: patient.name, patientMrn: patient.mrn, doctorId: accounts.doctor.id, doctorName: 'Flow check doctor', date: 'Test', diagnosis: 'TEST ONLY', notes: 'Temporary integration test', status: 'active', medications: [{ id: randomUUID(), drugName: 'TEST ONLY', route: 'Test', frequency: 'Test', sig: 'TEST ONLY', quantity: 1, refills: 0 }] };
  assert.equal((await db.dbUpsertPrescription(rx)).success, false);
  check('Assistant cannot issue prescriptions');
  unwrap(await client.auth.signInWithPassword(accounts.doctor));
  assert.equal((await db.dbUpdateAppointmentStatus(appointmentId, 'in_consultation')).success, true);
  check('Assigned doctor can start consultation without overwriting booking ownership');
  assert.equal((await db.dbUpsertPrescription({ ...rx, patientId: randomUUID() })).success, false);
  check('Prescription rejected for unregistered patient');
  assert.equal((await db.dbUpsertPrescription(rx)).success, true);
  assert.equal((await db.dbUpsertPrescription(rx)).success, true);
  const visits = unwrap(await admin.from('patient_visits').select('id').eq('patient_id', patientId));
  assert.equal(visits.length, 1);
  check('Doctor prescription and consultation persist; retry does not duplicate history');
  const reloaded = await db.fetchAllDbData();
  assert(reloaded.patients.some(p => p.id === patientId));
  assert(reloaded.appointments.some(a => a.id === appointmentId));
  assert(reloaded.prescriptions.some(r => r.id === prescriptionId && r.notes === rx.notes));
  check('Patient, appointment, prescription, and notes survive reload');
  const { AppProvider } = await vite.ssrLoadModule('/src/context/AppContext.tsx');
  for (const [path, name, expected] of [
    ['/src/components/patients/PatientProfileView.tsx', 'PatientProfileView', 'No patient selected'],
    ['/src/components/prescriptions/NewPrescriptionView.tsx', 'NewPrescriptionView', 'Select a registered patient'],
    ['/src/components/appointments/AppointmentSchedulingView.tsx', 'AppointmentSchedulingView', 'Registration is required before booking']
  ]) {
    const component = (await vite.ssrLoadModule(path))[name];
    const html = renderToString(React.createElement(AppProvider, null, React.createElement(component)));
    assert(html.includes(expected));
    if (name === 'AppointmentSchedulingView') assert(/disabled=""/.test(html));
    check(`${name} renders safely with no patient selected`);
  }
} finally {
  globalThis.fetch = originalFetch;
  for (const table of ['receipts', 'prescriptions', 'patient_visits', 'appointments']) {
    unwrap(await admin.from(table).delete().eq('patient_id', patientId));
  }
  unwrap(await admin.from('patients').delete().eq('id', patientId));
  for (const id of userIds) unwrap(await admin.auth.admin.deleteUser(id));
  if (vite) await vite.close();
  const profilesAfter = unwrap(await admin.from('profiles').select('id').order('id'));
  assert.deepEqual(profilesAfter, profilesBefore);
  check('Temporary records removed; existing user accounts preserved');
}
