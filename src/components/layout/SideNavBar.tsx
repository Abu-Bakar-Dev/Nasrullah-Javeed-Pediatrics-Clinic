import React from 'react';
import { useApp } from '../../context/AppContext';

export const SideNavBar: React.FC = () => {
  const { activeView, setActiveView, logout, currentUser, setSelectedPatientId, patients } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isDoctor = currentUser?.role === 'doctor';
  const isAssistant = currentUser?.role === 'assistant';

  return (
    <nav className="bg-[#0F172A] w-64 fixed left-0 top-0 bottom-0 border-r border-slate-800 flex flex-col h-full z-50 hidden md:flex shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
        <div 
          className="flex items-center gap-3 cursor-pointer w-full" 
          onClick={() => setActiveView('dashboard')}
        >
          <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-white text-lg icon-fill">medical_services</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-xs truncate tracking-tight">
              Nasrullah Clinic
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
              <span>Portal</span> • <span className="text-emerald-400 font-bold uppercase">{currentUser?.role?.replace('_', ' ') || 'User'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3 border-b border-slate-800/80">
        <button
          onClick={() => setActiveView('new_appointment')}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Patient Booking
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto font-sans text-xs">
        {/* SECTION 1: Clinical Overview */}
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-500 px-3 mb-1.5 tracking-wider">
            {isDoctor ? 'My Clinical Workspace' : 'Clinical Overview'}
          </div>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors text-left ${
                  activeView === 'dashboard'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${activeView === 'dashboard' ? 'text-emerald-400 icon-fill' : 'text-slate-400'}`}>
                  dashboard
                </span>
                Dashboard
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveView('patients')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors text-left ${
                  activeView === 'patients' || activeView === 'patient_profile' || activeView === 'patient_registration'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${activeView === 'patients' || activeView === 'patient_profile' ? 'text-emerald-400 icon-fill' : 'text-slate-400'}`}>
                  group
                </span>
                {isDoctor ? 'My Patient Records' : 'Patients Directory'}
              </button>
            </li>

            <li>
              <button
                onClick={() => setActiveView('appointments')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors text-left ${
                  activeView === 'appointments' || activeView === 'new_appointment'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${activeView === 'appointments' || activeView === 'new_appointment' ? 'text-emerald-400 icon-fill' : 'text-slate-400'}`}>
                  calendar_today
                </span>
                {isDoctor ? 'My Appointments' : 'Bookings & Receipts'}
              </button>
            </li>
          </ul>
        </div>

        {/* SECTION 2: Doctor Specific Portal */}
        {(isDoctor || isSuperAdmin) && (
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500 px-3 mb-1.5 tracking-wider">
              Doctor Management
            </div>
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => setActiveView('doctor_services_timings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors text-left ${
                    activeView === 'doctor_services_timings'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${activeView === 'doctor_services_timings' ? 'text-emerald-400 icon-fill' : 'text-slate-400'}`}>
                    more_time
                  </span>
                  Services & Timings
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    if (patients[0]) { setSelectedPatientId(patients[0].id); setActiveView('prescriptions'); }
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors text-left ${
                    activeView === 'prescriptions' || activeView === 'new_prescription'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${activeView === 'prescriptions' || activeView === 'new_prescription' ? 'text-emerald-400 icon-fill' : 'text-slate-400'}`}>
                    medication
                  </span>
                  Prescriptions
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* SECTION 3: Executive Administration (Super Admin & Assistant access) */}
        {(isSuperAdmin || isAssistant) && (
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500 px-3 mb-1.5 tracking-wider">
              Administration
            </div>
            <ul className="space-y-0.5">
              {isSuperAdmin && (
                <li>
                  <button
                    onClick={() => setActiveView('staff')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors text-left ${
                      activeView === 'staff' || activeView === 'register_staff'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-base ${activeView === 'staff' || activeView === 'register_staff' ? 'text-emerald-400 icon-fill' : 'text-slate-400'}`}>
                      badge
                    </span>
                    Staff Roster
                  </button>
                </li>
              )}

              {isSuperAdmin && (
                <li>
                  <button
                    onClick={() => setActiveView('settings')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors text-left ${
                      activeView === 'settings'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-base ${activeView === 'settings' ? 'text-emerald-400 icon-fill' : 'text-slate-400'}`}>
                      settings
                    </span>
                    Settings & IMAP Config
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').slice(0,2) : 'DR'}
          </div>
          <div className="ml-2.5 truncate">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Dr. Jenkins'}</p>
            <p className="text-[10px] text-emerald-400 capitalize font-medium">{currentUser?.role?.replace('_', ' ') || 'Doctor'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
        >
          <span className="material-symbols-outlined text-base">logout</span>
        </button>
      </div>
    </nav>
  );
};
