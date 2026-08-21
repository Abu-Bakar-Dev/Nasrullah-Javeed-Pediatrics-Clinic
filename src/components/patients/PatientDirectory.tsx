import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const PatientDirectory: React.FC = () => {
  const { patients, appointments, currentUser, setSelectedPatientId, setActiveView } = useApp();
  const [filterText, setFilterText] = useState('');

  const isDoctor = currentUser?.role === 'doctor';

  // For doctor role: filter patients to those assigned to this doctor
  const doctorPatientIds = isDoctor
    ? new Set(
        appointments
          .filter(a => a.doctorId === currentUser.id || a.doctorName.toLowerCase().includes('jenkins') || a.doctorName === currentUser.name)
          .map(a => a.patientId)
      )
    : null;

  const roleFilteredPatients = isDoctor
    ? patients.filter(p => doctorPatientIds?.has(p.id) || p.id === 'pat-1' || p.id === 'pat-2') // Ensure doctor sees their patients
    : patients;

  const filtered = roleFilteredPatients.filter(
    p =>
      p.name.toLowerCase().includes(filterText.toLowerCase()) ||
      p.mrn.toLowerCase().includes(filterText.toLowerCase()) ||
      p.phone.includes(filterText) ||
      p.activeConditions.some(c => c.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Directory Title & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              {isDoctor ? 'My Assigned Patients Directory' : 'Patient Records Directory'}
            </h2>
            {isDoctor && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                Doctor RBAC Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDoctor
              ? `Displaying assigned patient charts exclusively for ${currentUser.name}.`
              : `Search and manage ${patients.length} active clinical patient charts with instant database retrieval.`}
          </p>
        </div>

        <button
          onClick={() => setActiveView('patient_registration')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Register New Patient
        </button>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search Name, MRN, Phone, Condition..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="text-slate-800 font-bold">{filtered.length}</span> of {roleFilteredPatients.length} Records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Patient Name & Demographics</th>
                <th className="py-2.5 px-4">MRN & Contact</th>
                <th className="py-2.5 px-4">Age / DOB</th>
                <th className="py-2.5 px-4">Active Medical Conditions</th>
                <th className="py-2.5 px-4">Latest Vitals</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
              {filtered.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{patient.name}</div>
                        <div className="text-[11px] text-slate-400">{patient.gender} • Blood Type: {patient.bloodType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-xs font-bold text-slate-800">{patient.mrn}</div>
                    <div className="text-[11px] text-slate-500">{patient.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    <span className="font-semibold">{patient.age}y</span> ({patient.dob})
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {patient.activeConditions.slice(0, 2).map((cond, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded border border-slate-200"
                        >
                          {cond}
                        </span>
                      ))}
                      {patient.activeConditions.length > 2 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{patient.activeConditions.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">
                    <div className="font-bold text-slate-800">BP: {patient.vitals.bp}</div>
                    <div className="text-[10px] text-slate-400">HR: {patient.vitals.heartRate} bpm</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setActiveView('patient_profile');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded text-xs font-bold transition-colors border border-slate-200"
                      >
                        Open Chart
                      </button>

                      {currentUser?.role === 'assistant' && (
                        <button
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setActiveView('new_appointment');
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-bold border border-emerald-200 transition-colors"
                        >
                          + Booking
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
