import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffRoleIcon } from '../staff/StaffRoleIcon';

export const TopAppBar: React.FC = () => {
  const { searchQuery, setSearchQuery, currentUser, activeView, setActiveView, setSelectedPatientId, patients } = useApp();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const filteredPatients = searchQuery.trim()
    ? patients.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery)
      )
    : [];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 flex justify-between items-center w-full px-4 md:px-6 h-16 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Mobile Title */}
        <button
          onClick={() => setActiveView('dashboard')}
          className="md:hidden font-bold text-slate-800 text-sm flex items-center gap-2"
        >
          <span className="w-6 h-6 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">N</span>
          <span>Nasrullah Clinic</span>
        </button>

        {/* Status Indicator */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <div className="flex items-center bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            <span className="text-slate-600 font-medium text-[11px]">PostgreSQL Connected</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden sm:block w-64 md:w-80">
          <div className="flex items-center bg-slate-50 rounded border border-slate-200 px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            <span className="material-symbols-outlined text-slate-400 text-base mr-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search patients by name, MRN..."
              className="bg-transparent border-none focus:outline-none text-xs text-slate-800 w-full placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Search Dropdown */}
          {showSearchDropdown && searchQuery.trim() !== '' && (
            <div className="absolute top-10 left-0 w-80 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-50">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Matching Records ({filteredPatients.length})
              </div>
              {filteredPatients.length === 0 ? (
                <div className="p-2 text-xs text-slate-500 text-center">No patients found.</div>
              ) : (
                filteredPatients.slice(0, 5).map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setActiveView('patient_profile');
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors text-left"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{patient.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        MRN: {patient.mrn} • {patient.phone}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Navigation Quick Shortcuts */}
        <nav className="hidden lg:flex gap-4 font-sans text-xs">
          <button
            onClick={() => setActiveView('appointments')}
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Schedules
          </button>
          <button
            onClick={() => setActiveView('patient_registration')}
            className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            Emergency Check-In
          </button>
        </nav>

        <div className="h-4 w-px bg-slate-200 hidden lg:block"></div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-md shadow-xl p-3 z-50">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-800">Clinical Alerts</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Live</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-rose-50 border border-rose-200 rounded">
                  <div className="flex items-center gap-1 text-rose-700 font-bold text-xs mb-0.5">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Action Required
                  </div>
                  <p className="text-xs text-slate-700">Lab results for Marcus Thorne are ready for review.</p>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="font-bold text-xs text-slate-800">Nurse Davis</div>
                  <p className="text-[11px] text-slate-500">Room 3 sanitized and ready for patient.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Header Action */}
        {currentUser?.role === 'super_admin' && (
          <button
            onClick={() => setActiveView('settings')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${
              activeView === 'settings'
                ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Open Settings & IMAP Configuration"
          >
            <span className="material-symbols-outlined text-base">settings</span>
            <span>Settings Portal</span>
          </button>
        )}

        <button
          onClick={() => setActiveView('patient_registration')}
          className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors"
        >
          + Register Patient
        </button>

        {/* Logged in User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <StaffRoleIcon role={currentUser?.role} className="!w-8 !h-8" />
        </div>
      </div>
    </header>
  );
};
