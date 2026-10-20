import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { DEFAULT_ADMIN_EMAIL, verifyDefaultAdmin } from './default-admin.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(process.env.CLINIC_OFFLINE_DATA || resolve(here, 'data'));
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(resolve(dataDir, 'clinic.sqlite'));
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)');
const empty = () => ({ version: 1, staff: [], patients: [], appointments: [], prescriptions: [], receipts: [], preferences: {} });
if (!db.prepare('SELECT id FROM state WHERE id=1').get()) db.prepare('INSERT INTO state VALUES (1,?)').run(JSON.stringify(empty()));
const load = () => JSON.parse(db.prepare('SELECT data FROM state WHERE id=1').get().data);
const save = data => { data.revision = (load().revision || 0) + 1; db.prepare('UPDATE state SET data=? WHERE id=1').run(JSON.stringify(data)); };
const lanAddresses = () => [...new Set(Object.values(networkInterfaces()).flat().filter(n => n && n.family === 'IPv4' && !n.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address)).map(n => n.address))];
const isLaptop = req => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const sessions = new Map();
const failures = new Map();
const publicStaff = ({ passwordHash, salt, password, ...staff }) => staff;
const hash = (password, salt) => scryptSync(password, salt, 64).toString('hex');
function credentials(password, minimumLength = 8) {
  requireValue(typeof password === 'string' && password.length >= minimumLength && password.length <= 256, minimumLength === 8 ? 'Use a password of 8–256 characters.' : 'Enter your existing online password.');
  const salt = randomBytes(16).toString('hex'); return { salt, passwordHash: hash(password, salt) };
}
function requireValue(condition, message, status = 400) { if (!condition) throw Object.assign(new Error(message), { status }); }
function role(user, roles) { requireValue(roles.includes(user.role), 'This action is not allowed for your role.', 403); }
function visible(data, user) {
  const appointments = user.role === 'doctor' ? data.appointments.filter(a => a.doctorId === user.id) : data.appointments;
  const ids = new Set(appointments.map(a => a.patientId));
  return { revision: data.revision || 0, user: publicStaff(user), preferences: { ...data.preferences, revision: data.preferences.revision || 0 }, staff: data.staff.map(publicStaff), appointments,
    patients: user.role === 'doctor' ? data.patients.filter(p => ids.has(p.id)) : data.patients,
    prescriptions: user.role === 'doctor' ? data.prescriptions.filter(p => p.doctorId === user.id) : data.prescriptions };
}
function validateBackup(data) {
  requireValue(data?.version === 1, 'Unsupported backup format.');
  for (const table of ['staff', 'patients', 'appointments', 'prescriptions', 'receipts']) {
    requireValue(Array.isArray(data[table]), `Invalid backup: ${table}.`);
    const ids = new Set();
    for (const row of data[table]) {
      requireValue(row && typeof row.id === 'string' && !ids.has(row.id), `Invalid or duplicate ${table} record.`); ids.add(row.id);
    }
  }
  requireValue(data.staff.some(s => s.role === 'super_admin' && s.status === 'active'), 'Backup must include an active Super Admin.');
  const emails = new Set(), phones = new Set(), tokens = new Set();
  for (const s of data.staff) {
    requireValue(['super_admin', 'doctor', 'assistant'].includes(s.role) && ['active', 'inactive'].includes(s.status) && typeof s.email === 'string' && typeof s.name === 'string' && /^[0-9a-f]{128}$/.test(s.passwordHash) && /^[0-9a-f]{32}$/.test(s.salt), 'Invalid account in backup.');
    requireValue(!emails.has(s.email.toLowerCase()), 'Duplicate account email.'); emails.add(s.email.toLowerCase());
  }
  for (const p of data.patients) {
    requireValue(typeof p.name === 'string' && typeof p.phone === 'string' && typeof p.mrn === 'string' && Array.isArray(p.activeConditions) && Array.isArray(p.allergies) && p.vitals && Number.isFinite(p.age), 'Invalid patient in backup.');
    const phone = p.phone.replace(/\D/g, ''); requireValue(phone.length >= 10 && p.mrn && !phones.has(phone) && !tokens.has(p.mrn), 'Duplicate or invalid patient phone/token.'); phones.add(phone); tokens.add(p.mrn);
  }
  const patients = new Set(data.patients.map(p => p.id)), staff = new Set(data.staff.map(s => s.id)), appointments = new Set(data.appointments.map(a => a.id));
  for (const a of data.appointments) requireValue(patients.has(a.patientId) && staff.has(a.doctorId) && typeof a.date === 'string' && typeof a.time === 'string', 'Invalid booking in backup.');
  for (const p of data.prescriptions) requireValue(patients.has(p.patientId) && staff.has(p.doctorId) && Array.isArray(p.medications), 'Invalid prescription in backup.');
  for (const r of data.receipts) requireValue(appointments.has(r.appointment_id) && patients.has(r.patient_id) && Number.isFinite(r.amount_paid), 'Invalid receipt in backup.');
  requireValue(data.preferences && typeof data.preferences === 'object' && !Array.isArray(data.preferences), 'Invalid preferences.');
}

export function createClinicServer({ verifyAdmin = verifyDefaultAdmin } = {}) {
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  try {
    const host = req.headers.host;
    const allowedHosts = ['127.0.0.1', 'localhost', ...lanAddresses()].map(address => `${address}:${server.address().port}`);
    requireValue(allowedHosts.includes(host), 'Use the laptop address printed by Start Clinic.', 403);
    const url = new URL(req.url, `http://${host}`);
    if (!url.pathname.startsWith('/offline-api/')) {
      requireValue(req.method === 'GET' || req.method === 'HEAD', 'Method not allowed.', 405);
      const root = resolve(here, 'dist');
      let file = resolve(root, '.' + decodeURIComponent(url.pathname));
      requireValue(file.startsWith(root + sep) || file === root, 'Invalid path.', 403);
      if (file === root || !existsSync(file)) file = resolve(root, 'index.html');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : readFileSync(file)); return;
    }
    requireValue(['GET', 'POST'].includes(req.method), 'Method not allowed.', 405);
    if (req.method === 'POST') requireValue(req.headers.origin === `http://${host}`, 'Requests must come from the local clinic app.', 403);
    let bytes = 0; const chunks = [];
    for await (const chunk of req) { bytes += chunk.length; requireValue(bytes <= 32 * 1024 * 1024, 'Request is too large.', 413); chunks.push(chunk); }
    let body = {};
    if (bytes) { try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new Error('Invalid JSON request.'); } }
    const route = url.pathname.slice('/offline-api/'.length);
    const data = load();
    const cookie = /(?:^|;\s*)clinic_session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
    const session = sessions.get(cookie);
    const user = session && session.expires > Date.now() && data.staff.find(s => s.id === session.id && s.status === 'active');
    if (route === 'setup') {
      const defaultAdmin = data.staff.find(s => s.email === DEFAULT_ADMIN_EMAIL);
      if (req.method === 'GET') return send(200, { ready: data.staff.length > 0, defaultAdminReady: Boolean(defaultAdmin?.onlinePasswordVerifiedAt), canSetup: isLaptop(req), defaultAdminEmail: DEFAULT_ADMIN_EMAIL });
      requireValue(isLaptop(req), 'Complete first-run setup on the laptop at http://127.0.0.1:' + server.address().port, 403);
      requireValue(!defaultAdmin?.onlinePasswordVerifiedAt, 'The default Super Admin is already activated.', 409);
      requireValue(!body.email || String(body.email).trim().toLowerCase() === DEFAULT_ADMIN_EMAIL, 'The default offline Super Admin is ' + DEFAULT_ADMIN_EMAIL);
      const profile = await verifyAdmin(body.password);
      // Online verification is asynchronous. Re-read before saving so simultaneous setup cannot overwrite a completed setup.
      const latest = load();
      const existing = latest.staff.find(s => s.email === DEFAULT_ADMIN_EMAIL);
      requireValue(!existing?.onlinePasswordVerifiedAt, 'The default Super Admin is already activated.', 409);
      const admin = { id: existing?.id || randomUUID(), ...profile, email: DEFAULT_ADMIN_EMAIL, role: 'super_admin', status: 'active', onlinePasswordVerifiedAt: new Date().toISOString(), ...credentials(body.password, 1) };
      if (existing) Object.assign(existing, admin); else latest.staff.push(admin);
      for (const [token, s] of sessions) if (s.id === admin.id) sessions.delete(token);
      save(latest); return send(200, { success: true });
    }
    if (route === 'session' && req.method === 'GET') return send(200, { user: user ? publicStaff(user) : null });
    if (route === 'login' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const attempt = failures.get(email);
      requireValue(!attempt || attempt.count < 10 || Date.now() - attempt.time > 60000, 'Too many attempts. Wait one minute.', 429);
      const account = data.staff.find(s => s.email === email && s.status === 'active');
      const valid = account && typeof body.password === 'string' && body.password.length <= 256 && timingSafeEqual(Buffer.from(account.passwordHash, 'hex'), Buffer.from(hash(body.password, account.salt), 'hex'));
      if (!valid) { failures.set(email, { count: (attempt && Date.now() - attempt.time < 60000 ? attempt.count : 0) + 1, time: Date.now() }); return send(401, { error: 'Invalid local email or password.' }); }
      failures.delete(email); const token = randomBytes(32).toString('hex');
      if (cookie) sessions.delete(cookie);
      sessions.set(token, { id: account.id, expires: Date.now() + 12 * 3600000 });
      res.setHeader('Set-Cookie', `clinic_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`);
      return send(200, { user: publicStaff(account) });
    }
    requireValue(user, 'Please sign in to the offline clinic.', 401);
    if (route === 'logout' && req.method === 'POST') { sessions.delete(cookie); res.setHeader('Set-Cookie', 'clinic_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send(200, { success: true }); }
    if (route === 'data' && req.method === 'GET') return send(200, visible(data, user));
    if (route === 'network-info' && req.method === 'GET') return send(200, { addresses: lanAddresses().map(ip => `http://${ip}:${server.address().port}`), revision: data.revision || 0 });
    if (route === 'backup' && req.method === 'GET') { role(user, ['super_admin']); res.setHeader('Content-Disposition', `attachment; filename="clinic-offline-${new Date().toISOString().slice(0, 10)}.json"`); return send(200, data); }
    if (route === 'receipt' && req.method === 'GET') {
      const receipt = data.receipts.find(r => r.appointment_id === url.searchParams.get('id')) || null;
      if (user.role === 'doctor') requireValue(data.appointments.some(a => a.id === url.searchParams.get('id') && a.doctorId === user.id), 'Access denied.', 403);
      return send(200, receipt);
    }
    if (route === 'preferences' && req.method === 'GET') return send(200, { ...data.preferences, revision: data.preferences.revision || 0 });
    requireValue(req.method === 'POST', 'Unknown route.', 404);
    if (route === 'restore') {
      role(user, ['super_admin']); validateBackup(body);
      writeFileSync(resolve(dataDir, `before-restore-${Date.now()}.json`), JSON.stringify(data));
      save(body); sessions.clear(); return send(200, { success: true });
    } else if (route === 'reset-password') {
      role(user, ['super_admin']); const account = data.staff.find(s => s.email === String(body.email).trim().toLowerCase());
      requireValue(account, 'Account not found.');
      if (account.email === DEFAULT_ADMIN_EMAIL) {
        await verifyAdmin(body.password);
        const latest = load(); const latestUser = latest.staff.find(s => s.id === user.id && s.role === 'super_admin' && s.status === 'active');
        requireValue(latestUser && sessions.has(cookie), 'Please sign in again.', 401);
        const latestAccount = latest.staff.find(s => s.id === account.id);
        requireValue(latestAccount, 'Account not found.');
        Object.assign(latestAccount, credentials(body.password, 1), { onlinePasswordVerifiedAt: new Date().toISOString() }); save(latest);
        for (const [token, s] of sessions) if (s.id === account.id && token !== cookie) sessions.delete(token);
        return send(200, { success: true, revision: latest.revision });
      }
      Object.assign(account, credentials(body.password));
      for (const [token, s] of sessions) if (s.id === account.id && token !== cookie) sessions.delete(token);
    } else if (route === 'staff') {
      const existing = data.staff.find(s => s.id === body.id);
      requireValue(user.role === 'super_admin' || existing?.id === user.id, 'Access denied.', 403);
      if (!existing) {
        role(user, ['super_admin']); requireValue(['doctor', 'assistant'].includes(body.role) && body.name?.trim() && body.department?.trim() && /^\S+@\S+\.\S+$/.test(body.email || ''), 'Complete staff details are required.');
        const email = body.email.trim().toLowerCase(); requireValue(!data.staff.some(s => s.email === email), 'Email already registered.');
        data.staff.push({ id: randomUUID(), name: body.name.trim(), email, department: body.department, phone: body.phone || '', role: body.role, status: 'active', ...credentials(body.password) });
      } else {
        requireValue(existing.role !== 'super_admin' || existing.id === user.id, 'Super Admin accounts are protected.');
        const fields = user.role === 'super_admin' && existing.id !== user.id ? ['name', 'department', 'phone', 'avatarUrl', 'bio', 'status'] : ['name', 'department', 'phone', 'avatarUrl', 'bio'];
        for (const key of fields) if (body[key] !== undefined) { requireValue(typeof body[key] === 'string', 'Invalid profile field.'); existing[key] = body[key]; }
        requireValue(existing.name.trim() && ['active', 'inactive'].includes(existing.status), 'Invalid account details.');
      }
    } else if (route === 'delete-staff') {
      role(user, ['super_admin']); const target = data.staff.find(s => s.id === body.id);
      requireValue(target && target.role !== 'super_admin', 'Account cannot be deleted.');
      requireValue(!data.appointments.some(a => a.doctorId === body.id) && !data.prescriptions.some(p => p.doctorId === body.id), 'This account has clinical history. Deactivate it instead.');
      data.staff = data.staff.filter(s => s.id !== body.id);
    } else if (route === 'patient') {
      role(user, ['super_admin', 'assistant']);
      requireValue(typeof body.id === 'string' && body.name?.trim() && typeof body.phone === 'string' && body.phone.replace(/\D/g, '').length >= 10 && typeof body.mrn === 'string' && body.mrn && Number.isFinite(body.age) && body.age >= 0 && body.age <= 130 && Array.isArray(body.allergies) && Array.isArray(body.activeConditions) && body.vitals, 'Invalid patient details.');
      requireValue(!data.patients.some(p => p.id === body.id || p.mrn === body.mrn || p.phone.replace(/\D/g, '') === body.phone.replace(/\D/g, '')), 'Patient phone or token is already registered.', 409);
      data.patients.unshift(body);
    } else if (route === 'appointment') {
      role(user, ['super_admin', 'assistant']); const patient = data.patients.find(p => p.id === body.patientId), doctor = data.staff.find(s => s.id === body.doctorId && s.role === 'doctor' && s.status === 'active');
      requireValue(patient && doctor && typeof body.id === 'string' && typeof body.date === 'string' && typeof body.time === 'string' && Number.isFinite(new Date(`${body.date}T${body.time}`).getTime()) && new Date(`${body.date}T${body.time}`) > new Date(), 'Select a registered patient, active doctor and future date/time.');
      requireValue(!data.appointments.some(a => a.id === body.id || (a.doctorId === doctor.id && a.date === body.date && a.time === body.time && a.status !== 'cancelled')), 'This booking or doctor time slot already exists.', 409);
      data.appointments.unshift({ ...body, patientName: patient.name, patientPhone: patient.phone, patientAge: patient.age, doctorName: doctor.name, status: 'waiting' });
    } else if (route === 'status') {
      const apt = data.appointments.find(a => a.id === body.id); requireValue(apt, 'Booking not found.');
      requireValue(user.role !== 'doctor' || apt.doctorId === user.id, 'Access denied.', 403);
      requireValue(body.expectedStatus === undefined || body.expectedStatus === apt.status, 'This booking changed on another device. Wait for sync and try again.', 409);
      requireValue(['waiting', 'checked_in', 'in_consultation', 'completed', 'not_arrived'].includes(body.status), 'Invalid appointment status.'); apt.status = body.status;
    } else if (route === 'prescription') {
      role(user, ['doctor']); requireValue(body.doctorId === user.id && data.appointments.some(a => a.patientId === body.patientId && a.doctorId === user.id), 'Select a patient assigned to you.', 403);
      requireValue(typeof body.id === 'string' && !data.prescriptions.some(p => p.id === body.id) && body.diagnosis?.trim() && Array.isArray(body.medications) && body.medications.length && body.medications.every(m => m.drugName?.trim() && m.sig?.trim() && Number.isInteger(m.quantity) && m.quantity > 0 && Number.isInteger(m.refills) && m.refills >= 0), 'Enter a diagnosis and valid medications.');
      data.prescriptions.unshift(body);
    } else if (route === 'receipt') {
      role(user, ['super_admin', 'assistant']); const apt = data.appointments.find(a => a.id === body.appointment?.id);
      requireValue(apt && Number.isFinite(body.amountPaid) && body.amountPaid >= 0 && body.serviceName?.trim(), 'Invalid receipt details.');
      let receipt = data.receipts.find(r => r.appointment_id === apt.id);
      if (!receipt) { receipt = { id: randomUUID(), receipt_no: `RCP-${apt.id.replace(/-/g, '').toUpperCase()}`, appointment_id: apt.id, patient_id: apt.patientId, service_name: body.serviceName, amount_paid: body.amountPaid, payment_method: 'Cash', payment_status: 'Paid', printed_by: user.id, printed_at: new Date().toISOString() }; data.receipts.push(receipt); save(data); }
      return send(200, { success: true, receipt, revision: data.revision || 0 });
    } else if (route === 'preference-change') {
      role(user, ['super_admin', 'doctor']);
      const preferences = { services: [], timings: [], revision: 0, ...data.preferences };
      requireValue(body.expectedRevision === preferences.revision, 'Services or timings changed on another device. Wait for sync and try again.', 409);
      if (body.type === 'service') {
        const existing = preferences.services.find(s => s.id === (body.item?.id || body.id));
        requireValue(body.expectedItem === undefined || JSON.stringify(body.expectedItem) === JSON.stringify(existing), 'This service changed while you were editing. Close and reopen the form to load the latest values.', 409);
        const doctorId = body.item?.doctorId || existing?.doctorId;
        requireValue(data.staff.some(s => s.id === doctorId && s.role === 'doctor'), 'Select a doctor.');
        requireValue(user.role === 'super_admin' || (doctorId === user.id && (!existing || existing.doctorId === user.id)), 'Access denied.', 403);
        if (body.action === 'delete') { requireValue(existing, 'Service not found.'); preferences.services = preferences.services.filter(s => s.id !== body.id); }
        else {
          requireValue(body.action === 'upsert' && typeof body.item?.id === 'string' && body.item.name?.trim() && Number.isFinite(body.item.price) && body.item.price >= 0 && Number.isFinite(body.item.durationMinutes) && body.item.durationMinutes > 0, 'Enter valid service details.');
          preferences.services = [...preferences.services.filter(s => s.id !== body.item.id), body.item];
        }
      } else {
        requireValue(body.type === 'timings' && Array.isArray(body.timings) && data.staff.some(s => s.id === body.doctorId && s.role === 'doctor'), 'Invalid doctor timings.');
        requireValue(user.role === 'super_admin' || body.doctorId === user.id, 'Access denied.', 403);
        requireValue(body.expectedTimings === undefined || JSON.stringify(body.expectedTimings) === JSON.stringify(preferences.timings.filter(t => t.doctorId === body.doctorId)), 'These timings changed while you were editing. Reopen Services to load the latest values.', 409);
        requireValue(body.timings.every(t => t.doctorId === body.doctorId && typeof t.id === 'string' && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(t.day) && typeof t.isAvailable === 'boolean' && /^(?:[01]\d|2[0-3]):[0-5]\d(?: (?:AM|PM))?$/.test(t.startTime) && /^(?:[01]\d|2[0-3]):[0-5]\d(?: (?:AM|PM))?$/.test(t.endTime) && Number.isFinite(t.slotDurationMinutes) && t.slotDurationMinutes > 0), 'Invalid timing details.');
        preferences.timings = [...preferences.timings.filter(t => t.doctorId !== body.doctorId), ...body.timings];
      }
      preferences.revision++; data.preferences = preferences; save(data);
      return send(200, { success: true, preferences, revision: data.revision });
    } else if (route === 'preferences') {
      role(user, ['super_admin', 'doctor']);
      // Legacy full snapshots require a revision so a stale client cannot overwrite another device.
      requireValue(body.expectedRevision === (data.preferences.revision || 0), 'Preferences changed. Reload and try again.', 409);
      requireValue(Array.isArray(body.services) && Array.isArray(body.timings), 'Invalid preferences.');
      // Each doctor can only change their own services and timings.
      if (user.role === 'doctor') for (const key of ['services', 'timings']) body[key] = [...(data.preferences[key] || []).filter(x => x.doctorId !== user.id), ...body[key].filter(x => x.doctorId === user.id)];
      else role(user, ['super_admin', 'assistant']);
      data.preferences = { services: body.services, timings: body.timings, revision: (data.preferences.revision || 0) + 1 };
    } else { return send(404, { error: 'Unknown local API route.' }); }
    save(data); send(200, { success: true, revision: data.revision });
  } catch (error) { if (!res.headersSent) send(error.status || 400, { error: error.message }); else res.end(); }
});

server.on('close', () => db.close());
server.on('error', error => { console.error(`Cannot start offline clinic: ${error.message}`); });
return server;
}
export const server = createClinicServer();
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.CLINIC_OFFLINE_PORT || 4317);
  server.listen(port, process.env.CLINIC_OFFLINE_HOST || '0.0.0.0', () => console.log(`Laptop: http://127.0.0.1:${port}\nPhones (same clinic Wi-Fi):\n${lanAddresses().map(ip => `  http://${ip}:${port}`).join('\n') || '  No private Wi-Fi address found. Connect the laptop to clinic Wi-Fi.'}\nDatabase: ${resolve(dataDir, 'clinic.sqlite')}\nKeep this window open and the laptop awake. Press Ctrl+C to stop.`));
}
