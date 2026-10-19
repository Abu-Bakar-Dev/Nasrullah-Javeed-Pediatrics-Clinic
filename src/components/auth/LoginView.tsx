import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { login, setActiveView } = useApp();
  const [role, setRole] = useState<UserRole>('super_admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your credentials.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
    const res = await login(role, username, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials or staff member not found.');
      return;
    }

    setError('');
    } catch {
      setError('Cannot reach the clinic login server. Check your connection and Supabase configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const setRoleTab = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden p-4 font-sans">
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="bg-cover bg-center w-full h-full opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/90 to-slate-950" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-6 md:p-8 bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md flex flex-col gap-5">
        {/* Branding Header */}
        <div className="text-center flex flex-col items-center gap-2 pb-3 border-b border-slate-700">
          <div className="w-12 h-12 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md mb-1 border border-emerald-500">
            <span className="material-symbols-outlined text-2xl icon-fill">medical_services</span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Nasrullah Javed Pediatric and Health Clinic
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Role-Based Access Clinical Portal
            </p>
          </div>
        </div>

        {/* 3 Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/60">
          <button
            type="button"
            onClick={() => setRoleTab('super_admin')}
            className={`py-2 px-2 rounded text-[11px] font-bold transition-all text-center ${
              role === 'super_admin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('doctor')}
            className={`py-2 px-2 rounded text-[11px] font-bold transition-all text-center ${
              role === 'doctor'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Doctor
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('assistant')}
            className={`py-2 px-2 rounded text-[11px] font-bold transition-all text-center ${
              role === 'assistant'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Assistant
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300" htmlFor="username">
              Email / Account Identifier
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">
                person
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => setActiveView('forgot_password')}
                className="text-[11px] text-emerald-400 font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-slate-900/80 border border-slate-700 rounded text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 p-0 border-0 bg-transparent text-slate-400 hover:text-emerald-400 rounded flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>


          <div className="text-[10px] text-slate-400 pt-0.5 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-emerald-400">mark_email_read</span>
            Password reset dispatches sent via <strong className="text-emerald-300">abu.bakar041295@gmail.com</strong>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
          >
            {isLoading ? 'Signing In…' : `Sign In to ${role === 'super_admin' ? 'Super Admin Portal' : role === 'doctor' ? 'Doctor Portal' : 'Assistant Portal'}`}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-700/60">
          <p className="text-[11px] text-slate-400">
            Encrypted Clinical Security Standard • <a href="#" className="text-emerald-400 hover:underline">Clinic Policies</a>
          </p>
        </div>
      </div>
    </div>
  );
};
