import { defineConfig, normalizePath } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  envDir: false,
  plugins: [{
    name: 'isolated-offline-edition',
    enforce: 'pre',
    resolveId(id) {
      if (id.endsWith('/context/AppContext')) return normalizePath(path.resolve('offline/AppContext.tsx'));
      if (id.endsWith('/layout/AppShell')) return normalizePath(path.resolve('offline/AppShell.tsx'));
      if (id.endsWith('/doctor/DoctorServicesTimingsView')) return normalizePath(path.resolve('offline/DoctorServicesTimingsView.tsx'));
      if (id.endsWith('/lib/supabase')) return normalizePath(path.resolve('offline/database.ts'));
      if (id.endsWith('/components/settings/SettingsView')) return normalizePath(path.resolve('offline/SettingsView.tsx'));
      if (id.endsWith('/components/auth/LoginView') && !id.startsWith('../src/')) return normalizePath(path.resolve('offline/LoginView.tsx'));
    },
    transform(code, id) {
      if (id.includes('/src/') || id.includes('\\src\\')) {
        code = code.replaceAll('PostgreSQL Connected', 'Offline · Local database');
        code = code.replaceAll('MRN:', 'Patient Token:');
        code = code.replaceAll('Manage doctor & assistant staff, IMAP email settings, and clinic system configuration.', 'Manage local staff, backups, and clinic settings on this computer.');
        code = code.replaceAll(/https:\/\/images\.unsplash\.com\/[^'"\s)]+/g, '');
        if (id.endsWith('/auth/LoginView.tsx') || id.endsWith('\\auth\\LoginView.tsx')) {
          code = code.replace("const [username, setUsername] = useState('');", "const [username, setUsername] = useState('abu.bakar041295@gmail.com');");
          code = code.replace("setUsername('');", "setUsername(selectedRole === 'super_admin' ? 'abu.bakar041295@gmail.com' : '');");
        }
        if (id.endsWith('AssistantDashboard.tsx')) {
          code = code.replace('>24</span>', '>{appointments.filter(a => a.date === new Date().toLocaleDateString("en-CA")).length}</span>');
        }
        return code;
      }
    },
    transformIndexHtml(html) {
      return html.replace(/\s*<link[^>]+https:\/\/fonts\.[^>]+>/g, '')
        .replace('</head>', '<link rel="stylesheet" href="/offline-fonts.css"></head>')
        .replace('<title>', '<title>Offline · ');
    },
  }, react(), tailwindcss()],
  publicDir: path.resolve('offline/public'),
  build: { outDir: 'offline/dist', emptyOutDir: true },
});
