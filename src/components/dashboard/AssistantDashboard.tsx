import React from 'react';
import { useApp } from '../../context/AppContext';

export const AssistantDashboard: React.FC = () => {
  const {
    currentUser,
    appointments,
    patients,
    updateAppointmentStatus,
    setActiveView,
    setSelectedPatientId
  } = useApp();

  const checkedInCount = appointments.filter(a => a.status === 'checked_in').length;
  const waitingCount = appointments.filter(a => a.status === 'waiting').length;

  return (
    <div className="space-y-6">
      {/* Super Admin Executive Banner */}
      {currentUser?.role === 'super_admin' && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-emerald-500/30 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Super Admin Control Portal</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Full System Authorization
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage doctor & assistant staff, IMAP email settings, and clinic system configuration.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveView('register_staff')}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Add Doctor / Assistant
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">settings</span>
              Open Settings Portal
            </button>
            <button
              onClick={() => setActiveView('staff')}
              className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">badge</span>
              Staff Directory
            </button>
          </div>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface">
            Good morning, {currentUser?.name || 'Sarah'}
          </h2>
          <p className="font-body-lg text-sm text-on-surface-variant mt-1">
            Clinic operations overview for today. Ensure all incoming patients are checked in.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveView('patient_registration')}
            className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold hover:bg-surface-tint transition-colors flex items-center gap-1.5 shadow-sm active:scale-98"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Patient
          </button>
          <button
            onClick={() => setActiveView('new_appointment')}
            className="bg-surface-container-high text-on-surface border border-outline-variant px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold hover:bg-surface-variant transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">calendar_add_on</span>
            New Appointment
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Appointments Table (8 cols) */}
        <section className="col-span-12 lg:col-span-8 bg-surface border border-outline-variant rounded-2xl p-6 shadow-clinical flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-title-md text-lg font-bold text-on-surface">Today's Appointments Roster</h3>
              <p className="text-xs text-on-surface-variant">Live appointment statuses & check-in management</p>
            </div>
            <button
              onClick={() => setActiveView('appointments')}
              className="text-primary font-label-md text-xs font-semibold hover:underline flex items-center gap-1"
            >
              View Schedule <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-xs text-on-surface-variant font-semibold">
                  <th className="p-3">Time</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Visit Reason</th>
                  <th className="p-3 text-right">Check-In Action</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-sm text-on-surface">
                {appointments.map(apt => (
                  <tr
                    key={apt.id}
                    className="border-b border-outline-variant/60 hover:bg-surface-container-low/60 transition-colors"
                  >
                    <td className="p-3 font-medium text-on-surface-variant">{apt.time}</td>
                    <td className="p-3 font-semibold text-on-surface">{apt.patientName}</td>
                    <td className="p-3 text-xs text-on-surface-variant">{apt.doctorName}</td>
                    <td className="p-3 text-xs text-on-surface-variant">{apt.reason}</td>
                    <td className="p-3 text-right">
                      {apt.status === 'checked_in' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold text-xs">
                          Checked In
                        </span>
                      ) : apt.status === 'completed' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-medium text-xs">
                          Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'checked_in')}
                          className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Stats & Recent Patients (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="font-display-lg text-3xl font-bold text-primary">24</span>
              <span className="font-label-md text-xs text-on-surface-variant mt-1">Total Today</span>
            </div>
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="font-display-lg text-3xl font-bold text-secondary">{waitingCount + checkedInCount}</span>
              <span className="font-label-md text-xs text-on-surface-variant mt-1">In Clinic</span>
            </div>
          </div>

          {/* Recent Patient Records */}
          <section className="bg-surface border border-outline-variant rounded-2xl p-5 flex-1 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-title-md font-bold text-sm text-on-surface">Recent Patients</h3>
              <button
                onClick={() => setActiveView('patients')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                All Patients
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto">
              {patients.slice(0, 4).map(pat => (
                <div
                  key={pat.id}
                  onClick={() => {
                    setSelectedPatientId(pat.id);
                    setActiveView('patient_profile');
                  }}
                  className="bg-surface-container-lowest border border-outline-variant/70 rounded-xl p-3 flex items-center gap-3 hover:border-primary transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                    {pat.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-on-surface truncate">{pat.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      MRN: {pat.mrn} • DOB: {pat.dob}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary text-sm">
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
