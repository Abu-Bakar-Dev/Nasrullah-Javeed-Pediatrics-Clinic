import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { requestPasswordReset, updateRecoveredPassword } from '../../lib/supabase';
import { UserRole } from '../../types';

const SENDER_EMAIL = 'abu.bakar041295@gmail.com';

export const ForgotPasswordView: React.FC = () => {
  const { setActiveView } = useApp();
  const [role, setRole] = useState<Extract<UserRole, 'doctor' | 'assistant'>>('doctor');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRecovery, setIsRecovery] = useState(() => new URLSearchParams(window.location.search).has('password-recovery'));
  const [sent, setSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) setIsRecovery(true);
  }, []);

  const hasLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const goToLogin = () => {
    window.history.replaceState({}, '', window.location.pathname);
    setActiveView('dashboard');
  };

  const sendReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await requestPasswordReset(email);
    setLoading(false);
    if (!result.success) return setError(result.error || 'Unable to send the reset email.');
    setSent(true);
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasLength || !hasNumber || !hasSpecial) return setError('Use at least 8 characters, one number, and one special character.');
    if (!passwordsMatch) return setError('Passwords do not match.');
    setLoading(true);
    setError('');
    const result = await updateRecoveredPassword(newPassword);
    setLoading(false);
    if (!result.success) return setError(result.error || 'Unable to update your password.');
    window.history.replaceState({}, '', window.location.pathname);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <main className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5">
        <div className="text-center space-y-2 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-600 flex items-center justify-center"><span className="material-symbols-outlined text-2xl">lock_reset</span></div>
          <h1 className="text-xl font-bold">{isRecovery ? 'Choose a new password' : 'Forgot your password?'}</h1>
          <p className="text-xs text-slate-400">{isRecovery ? 'Reset access to your doctor or assistant account.' : 'We will email you a secure, time-limited reset link.'}</p>
        </div>

        {error && <div role="alert" className="p-3 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">{error}</div>}

        {success ? (
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-emerald-400">check_circle</span>
            <div><h2 className="font-bold">Password updated</h2><p className="text-xs text-slate-400 mt-1">You can now sign in with your new password.</p></div>
            <button onClick={goToLogin} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold">Return to login</button>
          </div>
        ) : isRecovery ? (
          <form onSubmit={resetPassword} className="space-y-4">
            <label className="block text-xs font-bold">New password<input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" required /></label>
            <label className="block text-xs font-bold">Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" required /></label>
            <div className="text-[11px] grid grid-cols-3 gap-2 text-slate-400"><span className={hasLength ? 'text-emerald-400' : ''}>8+ characters</span><span className={hasNumber ? 'text-emerald-400' : ''}>One number</span><span className={hasSpecial ? 'text-emerald-400' : ''}>One symbol</span></div>
            <button disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-xs font-bold">{loading ? 'Updating…' : 'Reset password'}</button>
          </form>
        ) : sent ? (
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-emerald-400">mark_email_read</span>
            <div><h2 className="font-bold">Check your email</h2><p className="text-xs text-slate-400 mt-1">If an active {role} account exists for <strong className="text-white">{email}</strong>, a reset link has been sent.</p></div>
            <button onClick={() => setSent(false)} className="text-xs text-emerald-400 hover:underline">Try another email</button>
          </div>
        ) : (
          <form onSubmit={sendReset} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg">{(['doctor', 'assistant'] as const).map(value => <button key={value} type="button" onClick={() => setRole(value)} className={`py-2 rounded text-xs font-bold capitalize ${role === value ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>{value}</button>)}</div>
            <label className="block text-xs font-bold">Registered email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="mt-1 w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" required /></label>
            <button disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-xs font-bold">{loading ? 'Sending…' : 'Send reset link'}</button>
            <p className="text-[10px] text-center text-slate-500">Reset mail is delivered by {SENDER_EMAIL}. For privacy, the result is the same whether or not an account exists.</p>
          </form>
        )}

        {!success && <button onClick={goToLogin} className="w-full text-xs text-slate-400 hover:text-white">← Back to login</button>}
      </main>
    </div>
  );
};
