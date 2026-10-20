import React, { useEffect, useState } from 'react';
import { LoginView as ExistingLogin } from '../src/components/auth/LoginView';
import { request } from './database';

export const LoginView = () => {
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [canSetup, setCanSetup] = useState(false);
  const email = 'abu.bakar041295@gmail.com';
  const [processing, setProcessing] = useState(false);
  const [defaultAdminReady, setDefaultAdminReady] = useState(false);
  useEffect(() => { request('setup').then(r => { setReady(r.ready); setCanSetup(r.canSetup); setDefaultAdminReady(r.defaultAdminReady); }).catch(e => setError(e.message)); }, []);
  if (ready) return <><div className="fixed top-0 inset-x-0 z-50 bg-amber-100 text-amber-950 text-center p-2 text-xs">Offline edition · Shared laptop database · Connect to clinic Wi-Fi
    {canSetup && !defaultAdminReady && <button onClick={() => setReady(false)} className="ml-2 underline font-bold">Activate default Super Admin</button>}
  </div><ExistingLogin /></>;
  return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6"><form className="bg-white rounded-xl p-8 space-y-4 w-full max-w-md" onSubmit={async e => {
    e.preventDefault(); if (processing) return; const data = new FormData(e.currentTarget); setError(''); setProcessing(true);
    try { await request('setup', Object.fromEntries(data)); setDefaultAdminReady(true); setReady(true); } catch (e) { setError((e as Error).message); } finally { setProcessing(false); }
  }}><h1 className="text-xl font-bold">Activate Default Super Admin</h1><p className="text-sm">Enter your existing online password once. The laptop needs internet for this verification. Afterwards, use the same email and password offline.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {ready === false && !canSetup && <p>Complete first-run setup on the laptop using http://127.0.0.1:4317, then reload this page.</p>}
    {ready === false && canSetup && <><label className="block">Default Super Admin email<input name="email" type="email" value={email} readOnly className="block border rounded p-2 w-full bg-slate-100" /></label>
    <label className="block">Existing online password<input name="password" type="password" autoComplete="current-password" required className="block border rounded p-2 w-full" /></label>
    <button disabled={processing} className="bg-emerald-700 text-white rounded p-3 w-full disabled:opacity-50">{processing ? 'Verifying online account…' : 'Verify and activate offline admin'}</button></>}
  </form></div>;
};
