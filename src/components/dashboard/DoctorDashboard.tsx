import React from 'react';
import { useApp } from '../../context/AppContext';

export const DoctorDashboard: React.FC = () => {
  const {
    currentUser,
    appointments,
    updateAppointmentStatus,
    setSelectedPatientId,
    setActiveView,
    alerts,
    messages
  } = useApp();

  const upNextApt = appointments.find(a => a.status === 'waiting' || a.status === 'checked_in') || appointments[0];
  const waitingApts = appointments.filter(a => a.id !== upNextApt?.id && a.status !== 'completed');
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-5 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinical Dashboard</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-emerald-600">Live Practice Mode</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800">
            Good morning, {currentUser?.name || 'Dr. Sarah Jenkins'}
          </h2>
          <p className="text-xs text-slate-500">
            You have {appointments.length} patients scheduled today. {waitingApts.length} in waiting queue.
          </p>
        </div>
        
        {/* Quick Metrics */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-slate-50 px-3.5 py-2 rounded border border-slate-200 min-w-[110px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Queue</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{appointments.length}</p>
          </div>
          <div className="bg-slate-50 px-3.5 py-2 rounded border border-slate-200 min-w-[110px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consulted</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Active Patient & Queue Table (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Patient Hero Card */}
          {upNextApt && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base border border-emerald-200">
                    {upNextApt.patientName.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase">
                        Active Consultation
                      </span>
                      <span className="text-xs font-mono text-slate-400">{upNextApt.time} Slot</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mt-0.5">{upNextApt.patientName}</h3>
                    <p className="text-xs text-slate-500">
                      Age: {upNextApt.patientAge || '34'} yrs • Phone: {upNextApt.patientPhone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPatientId(upNextApt.patientId || 'pat-1');
                    setActiveView('patient_profile');
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">folder_shared</span>
                  Open Chart
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chief Complaint / Reason</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{upNextApt.reason}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recorded Vitals</span>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">BP: 120/80 mmHg • HR: 72 bpm</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => {
                    updateAppointmentStatus(upNextApt.id, 'in_consultation');
                    setSelectedPatientId(upNextApt.patientId || 'pat-1');
                    setActiveView('patient_profile');
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-bold shadow-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  Begin Clinical Examination
                </button>
                <button
                  onClick={() => {
                    setSelectedPatientId(upNextApt.patientId || 'pat-1');
                    setActiveView('new_prescription');
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">medication</span>
                  Issue Rx
                </button>
              </div>
            </div>
          )}

          {/* Today's Queue Data Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Upcoming Appointment Schedule ({waitingApts.length})
              </h3>
              <button
                onClick={() => setActiveView('appointments')}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                View Full Roster →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Time</th>
                    <th className="px-4 py-2.5">Patient Record</th>
                    <th className="px-4 py-2.5">Visit Purpose</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-600 divide-y divide-slate-100 font-sans">
                  {waitingApts.map(apt => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{apt.time}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{apt.patientName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{apt.patientPhone}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{apt.reason}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === 'checked_in'
                              ? 'bg-blue-100 text-blue-700'
                              : apt.status === 'waiting'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {apt.status === 'checked_in' ? 'Checked-In' : apt.status === 'waiting' ? 'Waiting Room' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedPatientId(apt.patientId || 'pat-1');
                            setActiveView('patient_profile');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                        >
                          View Chart
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Live Logs (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Action Alerts */}
          {alerts.map(alert => (
            <div key={alert.id} className="bg-rose-50 border border-rose-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">error</span>
                High Priority Alert
              </div>
              <p className="text-xs text-slate-700 leading-snug mb-3">{alert.message}</p>
              <button
                onClick={() => {
                  setSelectedPatientId(alert.patientId);
                  setActiveView('patient_profile');
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded text-xs font-bold text-center"
              >
                Review Critical Results
              </button>
            </div>
          ))}

          {/* Real-Time Clinical Activity Panel */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Department Communications</h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className="flex items-start text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 mr-2 shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-400">({msg.senderRole})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Health Card */}
          <div className="bg-[#0F172A] rounded-lg shadow-sm p-4 text-white space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Supabase DB Sync</span>
              <span className="px-1.5 py-0.5 bg-emerald-900/80 text-emerald-300 text-[10px] rounded font-mono font-bold">Active</span>
            </div>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Row Level Security (RLS)</span>
                <span className="text-emerald-400">Enforced</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Query Latency</span>
                <span className="text-slate-200">14ms</span>
              </div>
            </div>
            <button
              onClick={() => setActiveView('settings')}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded text-[11px] font-semibold text-center border border-slate-700"
            >
              Open Database Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
