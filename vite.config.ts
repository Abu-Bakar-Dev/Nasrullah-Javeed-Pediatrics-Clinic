import { appointmentStatusHandler } from './api/appointment-status';
import { prescriptionHandler } from './api/prescriptions';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const localAdminApi = (env: Record<string, string>): Plugin => ({
  name: 'local-admin-users-api',
  configureServer(server) {
    for (const [route, handler] of [['/api/prescriptions', prescriptionHandler], ['/api/appointment-status', appointmentStatusHandler]] as const) {
      server.middlewares.use(route, async (req, res) => {
        const response: any = {
          setHeader: (name: string, value: string) => res.setHeader(name, value),
          status: (status: number) => { res.statusCode = status; return response; },
          json: (body: unknown) => res.end(JSON.stringify(body))
        };
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
          await handler({ method: req.method, headers: req.headers, body }, response, env);
        } catch {
          response.status(400).json({ error: 'Invalid API request.' });
        }
      });
    }
    server.middlewares.use('/api/admin-users', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const send = (status: number, body?: unknown) => {
        res.statusCode = status;
        res.end(body === undefined ? undefined : JSON.stringify(body));
      };

      if (!req.method || !['POST', 'PATCH', 'DELETE'].includes(req.method)) {
        return send(405, { error: 'Method not allowed' });
      }

      const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
      const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!url || !serviceKey) return send(500, { error: 'Server Supabase environment variables are missing' });
      if (!bearer) return send(401, { error: 'Unauthorized' });

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
        const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
        const { data: authData, error: authError } = await admin.auth.getUser(bearer);
        if (authError || !authData.user) return send(401, { error: 'Invalid session' });

        const { data: caller } = await admin.from('profiles').select('role,status').eq('id', authData.user.id).single();
        if (caller?.role !== 'super_admin' || caller?.status !== 'active') {
          return send(403, { error: 'Super Admin access required' });
        }

        if (req.method === 'POST') {
          const { email, password, name, role, department, phone = '' } = body;
          if (!email?.trim() || typeof password !== 'string' || password.length < 8 || !name?.trim() || !department?.trim() || !['doctor', 'assistant'].includes(role)) {
            return send(400, { error: 'Complete Doctor or Assistant account details are required' });
          }
          const { data, error } = await admin.auth.admin.createUser({
            email: String(email).trim().toLowerCase(), password, email_confirm: true
          });
          if (error || !data.user) return send(400, { error: error?.message || 'Account creation failed' });

          const { error: profileError } = await admin.from('profiles').insert({
            id: data.user.id, email: String(email).trim().toLowerCase(), name,
            role, department, phone, status: 'active'
          });
          if (profileError) {
            await admin.auth.admin.deleteUser(data.user.id);
            return send(400, { error: profileError.message });
          }
          return send(201, { id: data.user.id });
        }

        const { id, ...updates } = body;
        if (!id || id === authData.user.id) return send(400, { error: 'Invalid account' });
        const { data: target } = await admin.from('profiles').select('role').eq('id', id).single();
        if (target?.role === 'super_admin') return send(403, { error: 'Super Admin accounts are protected' });
        if (req.method === 'DELETE') {
          const { error } = await admin.auth.admin.deleteUser(id);
          if (error) return send(400, { error: error.message });
          const { error: profileError } = await admin.from('profiles').delete().eq('id', id);
          return profileError ? send(400, { error: profileError.message }) : send(204);
        }

        const allowed: Record<string, unknown> = {};
        for (const key of ['name', 'department', 'phone', 'status', 'role']) {
          if (updates[key] !== undefined) allowed[key] = updates[key];
        }
        if (allowed.role && !['doctor', 'assistant'].includes(String(allowed.role))) {
          return send(400, { error: 'Invalid role' });
        }
        const { error } = await admin.from('profiles').update(allowed).eq('id', id);
        return error ? send(400, { error: error.message }) : send(200, { success: true });
      } catch (error: any) {
        return send(500, { error: error?.message || 'Local server error' });
      }
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [localAdminApi(env), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
