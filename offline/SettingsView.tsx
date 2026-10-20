import React, { useEffect, useState } from 'react';
import { request } from './database';

export const SettingsView = () => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [addresses, setAddresses] = useState<string[]>([]);
  useEffect(() => { request('network-info').then(r => setAddresses(r.addresses)).catch(e => setMessage(e.message)); }, []);
  return <div className="bg-white p-6 rounded-xl space-y-5 max-w-2xl"><h1 className="text-xl font-bold">Offline Settings & Backups</h1>
    <div className="p-3 rounded border border-emerald-200 bg-emerald-50 space-y-2"><h2 className="font-bold">Connect the three phones</h2><p>Keep this laptop running. Connect every device to the same trusted clinic Wi-Fi and open one of these laptop addresses on each phone:</p>
    {addresses.length ? addresses.map(address => <p key={address} className="font-mono text-sm break-all select-all">{address}</p>) : <p>No private Wi-Fi address found. Check the laptop network connection.</p>}
    <p>All devices share this laptop database. Signed-in screens update every two seconds. Each role sees its authorized records.</p></div>
    <p>Records are saved in the laptop SQLite database. Keep a daily backup on an external drive. Backups contain patient records and local account password hashes; store them securely.</p>
    <a className="inline-block bg-emerald-700 text-white rounded p-3" href="/offline-api/backup" download>Download backup</a>
    <div className="border-t pt-4 space-y-3"><h2 className="font-bold">Restore a backup</h2><p>This replaces all local records and accounts. A safety backup is saved on this computer before replacement. You will need to sign in using an account from the restored backup.</p>
    <input aria-label="Select offline backup" type="file" accept=".json" onChange={e => setFile(e.target.files?.[0] || null)} />
    <button disabled={!file} className="block bg-red-700 text-white rounded p-2 disabled:opacity-50" onClick={async () => {
      if (!file || !window.confirm('Replace all local records and accounts with this backup?')) return;
      try { await request('restore', JSON.parse(await file.text())); window.location.reload(); } catch (e) { setMessage((e as Error).message); }
    }}>Replace local database from backup</button></div>
    <form className="border-t pt-4 space-y-3" onSubmit={async e => { e.preventDefault(); const form = e.currentTarget; try { await request('reset-password', Object.fromEntries(new FormData(form))); form.reset(); setMessage('Password updated.'); } catch (e) { setMessage((e as Error).message); } }}>
    <h2 className="font-bold">Reset a local account password</h2><p>For abu.bakar041295@gmail.com, enter the current online password; internet verification is required to update its offline copy. Other local accounts can be reset without internet.</p><input aria-label="Account email" name="email" required type="email" placeholder="Account email" className="border p-2 rounded w-full" />
    <input aria-label="New password" name="password" type="password" required placeholder="Current online password, or new local password (8+ characters)" className="border p-2 rounded w-full" />
    <button className="bg-slate-800 text-white rounded p-2">Update password</button></form>
    {message && <p role="status">{message}</p>}
  </div>;
};
