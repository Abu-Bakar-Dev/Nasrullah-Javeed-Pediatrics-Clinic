import { cpSync, mkdirSync, copyFileSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { parse } from 'dotenv';

// Only the public project URL and anonymous key are packaged. Never copy service-role keys or passwords.
const env = { ...(existsSync('.env.local') ? parse(readFileSync('.env.local')) : {}), ...process.env };
const onlineAuth = { url: env.SUPABASE_URL || env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY };
if (!onlineAuth.url?.startsWith('https://') || !onlineAuth.anonKey) throw new Error('Set the public Supabase URL and VITE_SUPABASE_ANON_KEY before packaging default-admin verification.');
if (onlineAuth.anonKey === env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('The public anonymous key must not be a service-role key.');
try { if (JSON.parse(Buffer.from(onlineAuth.anonKey.split('.')[1], 'base64url')).role === 'service_role') throw new Error('Service-role keys cannot be packaged.'); }
catch (error) { if (error.message === 'Service-role keys cannot be packaged.') throw error; }
writeFileSync(resolve('offline/online-auth.json'), JSON.stringify(onlineAuth));

const target = resolve('offline/release/Clinic Offline');
mkdirSync(target, { recursive: true });
const output = resolve(target, 'dist');
if (!output.startsWith(target + sep)) throw new Error('Invalid package output path.');
rmSync(output, { recursive: true, force: true });
cpSync(resolve('offline/dist'), output, { recursive: true });
for (const file of ['server.mjs', 'default-admin.mjs', 'online-auth.json', 'Start Clinic.cmd', 'Enable Clinic WiFi.cmd', 'Enable Clinic WiFi.ps1', 'README.md', 'NODE-LICENSE.txt']) copyFileSync(resolve('offline', file), resolve(target, file));
copyFileSync(process.execPath, resolve(target, process.platform === 'win32' ? 'node.exe' : 'node'));
console.log(`Portable offline edition ready: ${target}\nOn Windows, double-click Start Clinic.cmd. No installation or internet is required.`);
