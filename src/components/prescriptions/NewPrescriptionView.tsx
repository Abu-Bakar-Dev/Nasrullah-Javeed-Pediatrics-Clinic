import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MedicationItem } from '../../types';

export const NewPrescriptionView: React.FC = () => {
  const { selectedPatientId, getPatientById, patients, addPrescription, currentUser, setActiveView } = useApp();

  const patient = getPatientById(selectedPatientId || '');

  const [diagnosis, setDiagnosis] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: 'med-1', drugName: '', route: 'Oral (PO)', frequency: '', sig: '', quantity: 1, refills: 0 }
  ]);

  const handleMedChange = (index: number, field: keyof MedicationItem, value: any) => {
    setMedications(prev =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        drugName: '',
        route: 'Oral (PO)',
        frequency: 'Once Daily (QD)',
        sig: '',
        quantity: 30,
        refills: 0
      }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    if (medications.length <= 1) return;
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !patient || !currentUser) return;
    setError('');
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
        diagnosis,
        medications,
        notes: visitNotes
      });

      if (!result.prescription) { setError(result.error || 'Unable to save prescription.'); return; }
      document.body.classList.add('printing-prescription');
      window.print();
      document.body.classList.remove('printing-prescription');
      setActiveView('patient_profile');
    } catch { setError('Prescription could not be saved. Please try again.'); }
    finally { setIsSaving(false); }
  };

  if (!patient) return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-3">
      <p>Select a registered patient from the patient directory before prescribing.</p>
      <button onClick={() => setActiveView('patients')} className="text-emerald-700 underline">Open Patient Directory</button>
    </div>
  );

  return (
    <div id="printable-prescription" className="max-w-4xl mx-auto space-y-6">
      {error && <p role="alert" className="p-3 text-rose-700 bg-rose-50 rounded">{error}</p>}
      <div className="mb-2">
        <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-primary">New Electronic Prescription</h2>
        <p className="font-body-md text-xs text-on-surface-variant mt-1">
          Create and issue signed medication orders for electronic record delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Context Sidebar (1 col) */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 shadow-sm space-y-3 text-xs">
            <h3 className="font-title-md font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary icon-fill">person</span>
              Patient Context
            </h3>
            <div>
              <label className="text-outline font-semibold block mb-0.5">Patient Name</label>
              <div className="font-bold text-sm text-on-surface bg-surface-container-low p-2 rounded-lg">
                {patient.name}
              </div>
            </div>
            <div>
              <label className="text-outline font-semibold block mb-0.5">Medical Record No.</label>
              <div className="font-mono text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-lg">
                {patient.mrn}
              </div>
            </div>
            <div>
              <label className="text-outline font-semibold block mb-0.5">DOB / Age</label>
              <div className="text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-lg">
                {patient.dob || 'Not recorded'} ({patient.age}y)
              </div>
            </div>
          </div>

          {/* Allergies & Alerts Warning */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 shadow-sm text-xs">
            <h3 className="font-title-md font-bold text-sm text-error mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-error icon-fill">warning</span>
              Allergies & Alerts
            </h3>
            {patient.allergies.length > 0 ? (
              <ul className="list-disc list-inside text-xs text-error font-medium space-y-1">
                {patient.allergies.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : (
              <p className="text-outline italic">No known drug allergies reported.</p>
            )}
          </div>
        </div>

        {/* Prescription Order Form (2 cols) */}
        <form onSubmit={handleSubmit} className="md:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col text-xs">
          <div className="p-6 flex-1 space-y-6">
            {/* Primary Diagnosis */}
            <div>
              <label className="font-semibold text-on-surface block mb-1.5" htmlFor="diagnosis">
                Primary Diagnosis *
              </label>
              <div className="relative">
                <input
                  id="diagnosis"
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g., Acute Bronchitis (J20.9)"
                  required
                  className="w-full bg-surface p-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary font-medium text-on-surface"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
              </div>
            </div>

            <hr className="border-outline-variant/60" />

            <div>
              <label className="font-semibold text-on-surface block mb-1.5" htmlFor="visitNotes">Consultation / Patient History</label>
              <textarea id="visitNotes" value={visitNotes} onChange={e => setVisitNotes(e.target.value)} rows={4}
                placeholder="Symptoms, examination findings, diagnosis context and follow-up advice..."
                className="w-full bg-surface p-2.5 rounded-xl border border-outline-variant focus:border-primary text-xs resize-none" required />
            </div>

            <hr className="border-outline-variant/60" />

            {/* Medications List */}
            <div className="space-y-4">
              {medications.map((med, index) => (
                <div key={med.id} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-xl" />
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-title-md font-bold text-sm text-primary">Medication {index + 1}</h4>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-error hover:bg-error-container p-1 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="font-semibold text-on-surface block mb-1">
                        Drug Name & Strength *
                      </label>
                      <input
                        type="text"
                        value={med.drugName}
                        onChange={e => handleMedChange(index, 'drugName', e.target.value)}
                        placeholder="e.g. Amoxicillin 500mg or Azithromycin 250mg"
                        required
                        className="w-full bg-surface p-2 rounded-lg border border-outline-variant focus:border-primary text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-on-surface block mb-1">Route</label>
                      <select
                        value={med.route}
                        onChange={e => handleMedChange(index, 'route', e.target.value)}
                        className="w-full bg-surface p-2 rounded-lg border border-outline-variant focus:border-primary text-xs"
                      >
                        <option>Oral (PO)</option>
                        <option>Intravenous (IV)</option>
                        <option>Topical</option>
                        <option>Inhalation</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-on-surface block mb-1">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={e => handleMedChange(index, 'frequency', e.target.value)}
                        className="w-full bg-surface p-2 rounded-lg border border-outline-variant focus:border-primary text-xs"
                      >
                        <option>Once Daily (QD)</option>
                        <option>Twice Daily (BID)</option>
                        <option>Three times Daily (TID)</option>
                        <option>As Needed (PRN)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-semibold text-on-surface block mb-1">Patient Instructions (SIG)</label>
                      <textarea
                        value={med.sig}
                        onChange={e => handleMedChange(index, 'sig', e.target.value)}
                        placeholder="e.g., Take 1 tablet by mouth twice daily with food."
                        rows={2}
                        className="w-full bg-surface p-2 rounded-lg border border-outline-variant focus:border-primary text-xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-on-surface block mb-1">Dispense Qty</label>
                      <input
                        type="number"
                        value={med.quantity}
                        onChange={e => handleMedChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full bg-surface p-2 rounded-lg border border-outline-variant focus:border-primary text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-on-surface block mb-1">Refills</label>
                      <input
                        type="number"
                        value={med.refills}
                        onChange={e => handleMedChange(index, 'refills', parseInt(e.target.value) || 0)}
                        className="w-full bg-surface p-2 rounded-lg border border-outline-variant focus:border-primary text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddMedication}
              className="font-label-md text-xs font-semibold text-primary flex items-center gap-1.5 hover:bg-surface-container-high p-2.5 rounded-xl transition-colors border border-dashed border-primary/60 w-full justify-center"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Another Medication Order
            </button>
          </div>

          {/* Action Bar */}
          <div className="bg-surface-container-low p-4 border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveView('patient_profile')}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-highest font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-surface-tint font-semibold shadow-sm flex items-center gap-2 active:scale-98"
            >
              <span className="material-symbols-outlined text-base">print</span>
              {isSaving ? 'Saving...' : 'Save & Print Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
