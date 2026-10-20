import React from 'react';
import { useApp } from '../../context/AppContext';

export const MobileNavigation = () => {
  const { currentUser, activeView, setActiveView, logout, connectionStatus } = useApp();
  const links = [
    ['dashboard', 'Dashboard'], ['patients', 'Patients'], ['appointments', 'Bookings'],
    ...(currentUser?.role === 'super_admin' || currentUser?.role === 'doctor' ? [['doctor_services_timings', 'Services']] : []),
    ...(currentUser?.role === 'super_admin' ? [['staff', 'Staff'], ['settings', 'Settings']] : []),
  ] as const;
  return <div className="md:hidden bg-white border-b border-slate-200 p-3 space-y-2">
    <div className="flex items-center justify-between gap-2 text-xs"><p className="min-w-0 truncate">{currentUser?.name} · {currentUser?.role.replace('_', ' ')}</p><button onClick={logout} className="border rounded px-3 py-2 shrink-0">Sign out</button></div>
    <p role="status" className={`text-xs ${connectionStatus === 'disconnected' ? 'text-red-700' : 'text-emerald-800'}`}>{connectionStatus === 'connected' ? 'Online · Updates every 2 seconds' : connectionStatus === 'disconnected' ? 'Connection lost · Updates paused. Check internet.' : 'Connecting…'}</p>
    <nav aria-label="Clinic navigation" className="flex flex-wrap gap-1">{links.map(([view, label]) => <button key={view} onClick={() => setActiveView(view)} className={`rounded px-3 py-2 text-xs ${activeView === view ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'}`}>{label}</button>)}</nav>
  </div>;
};
