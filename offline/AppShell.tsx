import React from 'react';
import { useApp } from './AppContext';
import { SideNavBar } from '../src/components/layout/SideNavBar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setActiveView, activeView, logout, connectionStatus, lastSyncedAt, dataError } = useApp();
  const links = [
    ['dashboard', 'Dashboard'], ['patients', 'Patients'], ['appointments', 'Bookings'],
    ...(currentUser?.role === 'doctor' || currentUser?.role === 'super_admin' ? [['doctor_services_timings', 'Services']] : []),
    ...(currentUser?.role === 'super_admin' ? [['staff', 'Staff'], ['settings', 'Settings']] : []),
  ] as const;
  return <div className="min-h-screen bg-slate-50 text-slate-900 flex"><SideNavBar />
    <div className="flex-1 md:ml-64 min-w-0">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold text-sm">Nasrullah Clinic · Shared offline edition</p>
          <p className="text-xs text-slate-600">{currentUser?.name} · {currentUser?.role.replace('_', ' ')}</p></div>
          <button onClick={logout} className="text-xs border rounded px-3 py-2">Sign out</button></div>
        <p role="status" aria-live="polite" className={`text-xs ${connectionStatus === 'disconnected' ? 'text-red-700' : 'text-emerald-800'}`}>
          {connectionStatus === 'connected' ? `Connected to laptop · Updates every 2 seconds${lastSyncedAt ? ` · Last sync ${new Date(lastSyncedAt).toLocaleTimeString()}` : ''}` : connectionStatus === 'connecting' ? 'Connecting to laptop…' : 'Laptop unavailable. Reconnect to clinic Wi-Fi. Changes cannot be saved while disconnected.'}
        </p>
        <nav aria-label="Clinic navigation" className="flex flex-wrap gap-1 md:hidden">{links.map(([view, label]) =>
          <button key={view} onClick={() => setActiveView(view)} className={`rounded px-3 py-2 text-xs ${activeView === view ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}>{label}</button>
        )}</nav>
      </header>
      <main className="p-3 md:p-6 max-w-[1440px] mx-auto">
        {dataError && <p role="alert" className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded">{dataError}</p>}
        {children}
      </main>
    </div>
  </div>;
};
