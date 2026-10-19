import { createClient } from '@supabase/supabase-js';

export async function appointmentStatusHandler(req: any, res: any, env: Record<string, string | undefined>) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!url || !env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Server configuration is missing.' });
  const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Please sign in again.' });
    const { data: auth, error } = await admin.auth.getUser(token);
    if (error || !auth.user) return res.status(401).json({ error: 'Please sign in again.' });
    const { data: caller } = await admin.from('profiles').select('role,status').eq('id', auth.user.id).single();
    const { id, status } = req.body || {};
    if (!id || !['waiting', 'checked_in', 'in_consultation', 'completed', 'not_arrived'].includes(status)) return res.status(400).json({ error: 'Invalid appointment status.' });
    const { data: booking } = await admin.from('appointments').select('id,doctor_id').eq('id', id).single();
    if (!booking) return res.status(404).json({ error: 'Appointment not found.' });
    if (caller?.status !== 'active' || !(['assistant', 'super_admin'].includes(caller.role) || (caller.role === 'doctor' && booking.doctor_id === auth.user.id))) return res.status(403).json({ error: 'You cannot update this appointment.' });
    const { error: updateError } = await admin.from('appointments').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    return updateError ? res.status(400).json({ error: updateError.message }) : res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Appointment status could not be saved.' });
  }
}

export default async function handler(req: any, res: any) {
  return appointmentStatusHandler(req, res, process.env);
}
