import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!url || !serviceKey || !bearer) return res.status(401).json({ error: 'Unauthorized' });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(bearer);
  if (authError || !authData.user) return res.status(401).json({ error: 'Invalid session' });
  const { data: caller } = await admin.from('profiles').select('role,status').eq('id', authData.user.id).single();
  if (caller?.role !== 'super_admin' || caller?.status !== 'active') return res.status(403).json({ error: 'Super Admin access required' });

  try {
    if (req.method === 'POST') {
      const { email, password, name, role, department, phone = '' } = req.body || {};
      if (!email?.trim() || typeof password !== 'string' || password.length < 8 || !name?.trim() || !department?.trim() || !['doctor', 'assistant'].includes(role)) return res.status(400).json({ error: 'Invalid account details' });
      const { data, error } = await admin.auth.admin.createUser({ email: email.trim().toLowerCase(), password, email_confirm: true });
      if (error || !data.user) return res.status(400).json({ error: error?.message || 'Account creation failed' });
      const { error: profileError } = await admin.from('profiles').insert({ id: data.user.id, email: email.trim().toLowerCase(), name: name.trim(), role, department: department.trim(), phone, status: 'active' });
      if (profileError) { await admin.auth.admin.deleteUser(data.user.id); return res.status(400).json({ error: profileError.message }); }
      return res.status(201).json({ id: data.user.id });
    }
    const { id, ...updates } = req.body || {};
    if (!id || id === authData.user.id) return res.status(400).json({ error: 'Invalid account' });
    const { data: target } = await admin.from('profiles').select('role').eq('id', id).single();
    if (target?.role === 'super_admin') return res.status(403).json({ error: 'Super Admin accounts are protected' });
    if (req.method === 'DELETE') {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return res.status(400).json({ error: error.message });
      // Also remove the directory row on databases without the Auth delete cascade.
      const { error: profileError } = await admin.from('profiles').delete().eq('id', id);
      return profileError ? res.status(400).json({ error: profileError.message }) : res.status(204).end();
    }
    const allowed: any = {};
    for (const key of ['name','department','phone','status','role']) if (updates[key] !== undefined) allowed[key] = updates[key];
    if (allowed.role && !['doctor','assistant'].includes(allowed.role)) return res.status(400).json({ error: 'Invalid role' });
    const { error } = await admin.from('profiles').update(allowed).eq('id', id);
    return error ? res.status(400).json({ error: error.message }) : res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Server error' });
  }
}
