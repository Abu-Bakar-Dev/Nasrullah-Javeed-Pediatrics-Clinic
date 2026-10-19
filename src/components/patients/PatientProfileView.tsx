import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const PatientProfileView: React.FC = () => {
  const {
    selectedPatientId,
    getPatientById,
    patients,
    prescriptions,
    addPrescription,
    currentUser,
    setActiveView
  } = useApp();

  const patient = getPatientById(selectedPatientId || '');
  const patientPrescriptions = prescriptions.filter(rx => rx.patientId === patient?.id);

  const [activeTab, setActiveTab] = useState<'prescriptions' | 'notes' | 'labs'>('prescriptions');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New Prescription Modal Form State
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily (QD)');
  const [duration, setDuration] = useState('30');
  const [refills, setRefills] = useState('0');
  const [indication, setIndication] = useState(patient?.activeConditions[0] || 'General Consultation');
  const [instructions, setInstructions] = useState('');

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !patient || !currentUser) return;
    setSaveError('');
    setIsSaving(true);
    try {
      const result = await addPrescription({
        patientId: patient.id,
        patientName: patient.name,
        patientMrn: patient.mrn,
        patientDob: patient.dob,
        doctorId: currentUser.id,
        doctorName: currentUser.name,
        doctorAvatar: currentUser?.avatarUrl,
        diagnosis: indication,
        medications: [
          {
            id: `med-${Date.now()}`,
            drugName: `${medName} ${dosage}`.trim(),
            route: 'Oral (PO)',
            frequency,
            sig: instructions || `Take 1 tablet ${frequency.toLowerCase()}`,
            quantity: parseInt(duration) || 30,
            refills: parseInt(refills) || 0
          }
        ]
      });

      if (!result.prescription) { setSaveError(result.error || 'Unable to save prescription.'); return; }
      setShowModal(false);
      setMedName('');
      setDosage('');
      setInstructions('');
    } catch { setSaveError('Prescription could not be saved. Please try again.'); }
    finally { setIsSaving(false); }
  };

  if (!patient) return (
    <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
      <p>No patient selected. Choose a registered patient to view their history.</p>
      <button onClick={() => setActiveView('patients')} className="text-emerald-700 underline">Open Patient Directory</button>
    </div>
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Patient Header Summary Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-md bg-emerald-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm border border-emerald-700">
            {patient.name.split(' ').map(n=>n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold font-mono text-[10px] rounded border border-slate-200">
                MRN: {patient.mrn}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-emerald-600">Active Patient</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">{patient.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5 font-mono">
              <span>DOB: {patient.dob || 'Not recorded'} ({patient.age} yrs)</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Blood: {patient.bloodType}</span>
              <span>•</span>
              <span>Phone: {patient.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveView('patients')}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Patient Directory
          </button>
          {currentUser?.role === 'doctor' && <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">medication</span>
            Issue Rx Order
          </button>}
        </div>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Stats Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Demographics Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex justify-between items-center">
              <span>Demographics</span>
              <span className="material-symbols-outlined text-slate-400 text-sm">badge</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400 font-medium">Gender</span>
                <span className="font-semibold text-slate-800">{patient.gender}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400 font-medium">Contact</span>
                <span className="font-semibold text-slate-800">{patient.phone}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400 font-medium">Address</span>
                <span className="font-semibold text-slate-800 text-right max-w-[160px] truncate">{patient.address}</span>
              </div>
            </div>
          </div>

          {/* Active Conditions */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              Diagnosed Conditions
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {patient.activeConditions.map((cond, i) => (
                <span
                  key={i}
                  className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded text-xs font-bold"
                >
                  {cond}
                </span>
              ))}
            </div>
          </div>

          {/* Vitals Summary Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clinical Vitals</span>
              <span className="text-[10px] text-slate-400 font-mono">{patient.vitals.recordedAt}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Pressure</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{patient.vitals.bp}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Heart Rate</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{patient.vitals.heartRate}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Body Weight</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{patient.vitals.weight}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Temp</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{patient.vitals.temp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tabbed Details Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Navigation Sub-Tabs */}
          <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm flex gap-1">
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                activeTab === 'prescriptions'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Rx Orders ({patientPrescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                activeTab === 'notes'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Consultation Notes
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                activeTab === 'labs'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Lab Panels
            </button>
          </div>

          {/* Prescription History View */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Electronic Prescriptions & Refill Log
              </h3>
              <div className="space-y-3">
                {patientPrescriptions.length === 0 && <p className="text-xs text-slate-500">No prescriptions recorded yet.</p>}
                {patientPrescriptions.map(rx => (
                  <div
                    key={rx.id}
                    className="p-3.5 rounded border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-base">medication</span>
                        <h4 className="font-bold text-xs text-slate-800">
                          {rx.medications.map(med => med.drugName).join(', ') || 'Prescription Order'}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        {rx.status === 'active' ? 'ACTIVE' : 'DISCONTINUED'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-mono mb-2">
                      {rx.medications.map(med => `${med.drugName}: ${med.sig}`).join('; ')}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 font-sans">
                      <span>Prescriber: <strong className="text-slate-700">{rx.doctorName}</strong></span>
                      <span className="font-mono">{rx.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                SOAP Chart Progress Note
              </h3>
              <div className="space-y-2">
                {patientPrescriptions.length === 0 && <p className="p-3 text-xs text-slate-500">No consultation history recorded yet.</p>}
                {patientPrescriptions.map(rx => <div key={rx.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                  <div className="flex justify-between"><strong>{rx.diagnosis}</strong><span>{rx.date}</span></div>
                  <p className="mt-2 whitespace-pre-wrap">{rx.notes || 'No consultation notes recorded.'}</p>
                  <p className="mt-2 text-slate-500">Doctor: {rx.doctorName}</p>
                </div>)}
              </div>
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Laboratory Records
              </h3>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500">Laboratory management is outside the first MVP.</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog: Add New Prescription */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden z-10 font-sans">
            <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">New Clinical Prescription Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
            </div>

            <form onSubmit={handleCreatePrescription} className="p-5 space-y-3 text-xs">
              {saveError && <p role="alert" className="p-3 text-rose-700 bg-rose-50 rounded">{saveError}</p>}
              <div>
                <label className="block font-bold text-slate-700 mb-1" htmlFor="medication">Medication & Strength</label>
                <input
                  id="medication"
                  type="text"
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  placeholder="e.g. Amoxicillin, Lisinopril 20mg"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="dosage">Dosage Strength</label>
                  <input
                    id="dosage"
                    type="text"
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    placeholder="20mg"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1" htmlFor="frequency">Frequency</label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option>Once daily (QD)</option>
                    <option>Twice daily (BID)</option>
                    <option>Three times daily (TID)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1" htmlFor="instructions">Sig Instructions</label>
                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Take 1 tablet by mouth daily with meal..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-sm"
                >
                  Authorize & Sign Rx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
