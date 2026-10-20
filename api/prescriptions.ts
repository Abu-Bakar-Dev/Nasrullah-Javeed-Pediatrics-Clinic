import { createClient } from '@supabase/supabase-js';

export async function prescriptionHandler(req: any, res: any, env: Record<string, string | undefined>) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Server Supabase configuration is missing.' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in again.' });
  const admin = createClient(url, key, { auth: { persistSession: false } });
  try {
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) return res.status(401).json({ error: 'Please sign in again.' });
    const { data: doctor } = await admin.from('profiles').select('name,role,status,avatar_url').eq('id', auth.user.id).single();
    if (doctor?.role !== 'doctor' || doctor.status !== 'active') return res.status(403).json({ error: 'Only an active Doctor can issue prescriptions.' });
    const rx = req.body || {};
    if (!/^[0-9a-f-]{36}$/i.test(rx.id || '') || !rx.patientId || !rx.diagnosis?.trim() || !Array.isArray(rx.medications) || !rx.medications.length || rx.medications.some((m: any) => !m.drugName?.trim() || !m.sig?.trim() || !Number.isInteger(m.quantity) || m.quantity <= 0 || !Number.isInteger(m.refills) || m.refills < 0)) {
      return res.status(400).json({ error: 'Enter a patient, diagnosis, and complete medication details.' });
    }
    const { data: patient } = await admin.from('patients').select('id,name,mrn,dob').eq('id', rx.patientId).single();
    if (!patient) return res.status(400).json({ error: 'Select a registered patient before prescribing.' });
    const { data: assignment, error: assignmentError } = await admin.from('appointments').select('id').eq('patient_id', patient.id).eq('doctor_id', auth.user.id).limit(1).maybeSingle();
    if (assignmentError) return res.status(400).json({ error: assignmentError.message });
    if (!assignment) return res.status(403).json({ error: 'You can only prescribe for patients assigned to you.' });
    const { data: existing, error: existingError } = await admin.from('prescriptions').select('id,doctor_id').eq('id', rx.id).maybeSingle();
    if (existingError) return res.status(400).json({ error: existingError.message });
    if (existing) return existing.doctor_id === auth.user.id ? res.status(200).json({ success: true }) : res.status(403).json({ error: 'Prescription belongs to another doctor.' });
    const { data: visit, error: visitError } = await admin.from('patient_visits').insert({
      patient_id: patient.id, doctor_id: auth.user.id, doctor_name: doctor.name,
      diagnosis: rx.diagnosis.trim(), notes: rx.notes || '', visit_date: new Date().toISOString().slice(0, 10)
    }).select('id').single();
    if (visitError) return res.status(400).json({ error: visitError.message });
    const { error } = await admin.from('prescriptions').insert({
      id: rx.id, patient_id: patient.id, patient_name: patient.name, patient_mrn: patient.mrn,
      patient_dob: patient.dob || '', doctor_id: auth.user.id, doctor_name: doctor.name,
      doctor_avatar: doctor.avatar_url || '', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      diagnosis: rx.diagnosis.trim(), medications: rx.medications, status: 'active', notes: rx.notes || '', visit_id: visit.id
    });
    if (error) {
      const { error: cleanupError } = await admin.from('patient_visits').delete().eq('id', visit.id);
      return res.status(400).json({ error: cleanupError ? `${error.message}. The incomplete consultation could not be removed.` : error.message });
    }
    return res.status(201).json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Prescription could not be saved. Please try again.' });
  }
}

export default async function handler(req: any, res: any) {
  return prescriptionHandler(req, res, process.env);
}
