import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient, Appointment } from '../../types';
import { PrintReceiptModal } from './PrintReceiptModal';
import { ROUTINE_CONSULTATION_FEES, routineConsultationLabel } from '../../config/consultationFees';
import { matchesPatientIdentifier } from '../../utils/patientLookup';

export const AppointmentSchedulingView: React.FC = () => {
  const { patients, staff, appointments, addAppointment, setActiveView, doctorServices, currentUser, selectedPatientId } = useApp();

  // Selected appointment for printing receipt modal
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

  // Search by permanent patient token or phone number
  const [patientQuery, setPatientQuery] = useState(() => patients.find(p => p.id === selectedPatientId)?.phone || '');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(() => patients.find(p => p.id === selectedPatientId) || null);

  // Form Details
  const [providerId, setProviderId] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(1000);
  const [apptDate, setApptDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [apptTime, setApptTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const doctors = staff.filter(member => member.role === 'doctor' && member.status === 'active');
  const canBook = currentUser?.role === 'assistant' || currentUser?.role === 'super_admin';
  const selectedPatient = foundPatient && patients.find(patient => patient.id === foundPatient.id);
  const canSearch = patientQuery.trim().length >= 3;
  const matchingPatients = canSearch
    ? patients
        .filter(patient => matchesPatientIdentifier(patient, patientQuery))
        .slice(0, 8)
    : [];
  useEffect(() => {
    if (!providerId && doctors[0]) setProviderId(doctors[0].id);
  }, [staff, providerId]);

  const handleSearchPatient = () => {
    setBookingError('');
    if (!canSearch) { setFoundPatient(null); setBookingError('Enter at least 3 characters of a patient token or phone number.'); return; }
    const matches = patients.filter(pat => matchesPatientIdentifier(pat, patientQuery));
    if (matches.length > 1) { setFoundPatient(null); setBookingError('Multiple patients match. Select the correct patient from the results.'); return; }
    const p = matches[0];
    if (p) {
      setFoundPatient(p);
    } else { setFoundPatient(null); setBookingError('No registered patient was found with that token or phone number.'); }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setBookingError('');
    if (!canBook) { setBookingError('Only an Assistant or Super Admin can create bookings.'); return; }
    const selectedDoctor = doctors.find(doctor => doctor.id === providerId);
    if (!selectedPatient) { setBookingError('Select a registered patient before creating the booking.'); return; }
    if (!selectedDoctor) { setBookingError('No active doctor is selected. Create or activate a Doctor account first.'); return; }
    if (!apptDate || !apptTime) { setBookingError('Select both an appointment date and time.'); return; }
    if (new Date(`${apptDate}T${apptTime}`) < new Date()) { setBookingError('Select a future appointment date and time.'); return; }
    setIsSaving(true);

    try {
      const result = await addAppointment({
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientPhone: selectedPatient.phone,
        patientAge: selectedPatient.age,
        doctorId: providerId,
        doctorName: selectedDoctor.name,
        department: selectedDoctor.department,
        reason: routineConsultationLabel(consultationFee),
        date: apptDate,
        time: apptTime,
        notes
      });
      if (!result.appointment) { setBookingError(result.error || 'Unable to save the booking.'); return; }
      setSelectedReceiptApt(result.appointment);
      setApptTime('');
    } catch { setBookingError('Booking could not be saved. Please try again.'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">
              Patient Bookings & Receipt Center
            </h2>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
              Assistant / Front Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create new patient bookings, view appointment schedules, and issue printed payment receipts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Booking Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Patient Lookup */}
          <section className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-base">person_search</span>
              1. Select Patient Record
            </h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label htmlFor="booking-patient" className="text-[11px] font-bold text-slate-600 block mb-1">
                  Search by Patient Token or Phone
                </label>
                <input
                  id="booking-patient"
                  type="text"
                  value={patientQuery}
                  onChange={e => {
                    setPatientQuery(e.target.value);
                    setFoundPatient(null);
                    setBookingError('');
                  }}
                  placeholder="Patient token (P-...) or 0333-7645673"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                {canSearch && !foundPatient && (
                  <div className="mt-1.5 max-h-52 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
                    {matchingPatients.length > 0 ? matchingPatients.map(patient => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setFoundPatient(patient);
                          setPatientQuery(patient.mrn);
                          setBookingError('');
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{patient.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{patient.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 shrink-0">Token: {patient.mrn}</span>
                      </button>
                    )) : (
                      <p className="px-3 py-3 text-xs text-slate-500">No registered patient matches this token or phone number.</p>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSearchPatient}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold"
              >
                Search
              </button>
            </div>

            {!selectedPatient && <div className="mt-3 text-xs text-slate-600 space-y-2">
              <p>Registration is required before booking. Search above and select an existing patient.</p>
              {canBook && <button type="button" onClick={() => setActiveView('patient_registration')} className="font-bold text-emerald-700 underline">Register New Patient</button>}
            </div>}
            {/* Found Result Card */}
            {foundPatient && (
              <div className="mt-3 p-3 bg-emerald-50/60 rounded border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {foundPatient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{foundPatient.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      Patient Token: <span className="font-mono text-emerald-800 font-bold">{foundPatient.mrn}</span> • Phone: {foundPatient.phone}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded uppercase">
                  Selected
                </span>
              </div>
            )}
          </section>

          {/* Booking Form Details */}
          <section className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-base">event_note</span>
              2. Appointment & Service Details
            </h3>

            {bookingError && <div role="alert" className="p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 font-semibold">{bookingError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1" htmlFor="booking-doctor">Attending Specialist</label>
                <select
                  id="booking-doctor"
                  value={providerId}
                  onChange={e => {
                    setProviderId(e.target.value);
                  }}
                  disabled={doctors.length === 0}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {doctors.length === 0 && <option value="">No active doctors available</option>}
                  {doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.name} ({doctor.department})</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1" htmlFor="booking-service">Consultation Fee (PKR)</label>
                <select
                  id="booking-service"
                  value={consultationFee}
                  onChange={e => setConsultationFee(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {ROUTINE_CONSULTATION_FEES.map(fee => (
                    <option key={fee} value={fee}>PKR {fee.toLocaleString('en-PK')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1" htmlFor="booking-date">Date</label>
                <input
                  id="booking-date"
                  type="date"
                  min={new Date().toLocaleDateString('en-CA')}
                  value={apptDate}
                  onChange={e => setApptDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1" htmlFor="booking-time">Time Slot</label>
                <input
                  id="booking-time"
                  type="time"
                  value={apptTime}
                  onChange={e => setApptTime(e.target.value)}
                  placeholder="10:30 AM"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1" htmlFor="booking-notes">Chief Complaint / Triage Notes</label>
              <textarea
                id="booking-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Initial symptoms or consultation notes..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              onClick={handleCreateAppointment}
              disabled={isSaving || !selectedPatient || doctors.length === 0 || !canBook}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              {isSaving ? 'Saving Booking…' : 'Create Booking & Issue Receipt'}
            </button>
          </section>
        </div>

        {/* Right Column: Existing Bookings & Print Receipts List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
              <span>Clinic Bookings ({appointments.length})</span>
              <span className="material-symbols-outlined text-slate-400 text-lg">print</span>
            </h3>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {appointments.length === 0 && <p className="p-3 text-xs text-slate-500">No appointments booked yet.</p>}
              {appointments.map(apt => (
                <div
                  key={apt.id}
                  className="p-3 border border-slate-200 rounded bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{apt.patientName}</h4>
                    <p className="text-[11px] font-semibold text-emerald-800">Status: {apt.status.replaceAll('_', ' ')}</p>
                    <p className="text-[11px] text-slate-500">{apt.doctorName} • {apt.reason}</p>
                    <p className="font-mono text-[10px] text-emerald-800 font-bold mt-0.5">
                      📅 {apt.date} at {apt.time}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedReceiptApt(apt)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded flex items-center gap-1 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    Receipt
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Receipt Modal */}
      {selectedReceiptApt && (
        <PrintReceiptModal
          appointment={selectedReceiptApt}
          onClose={() => setSelectedReceiptApt(null)}
          service={doctorServices.find(s => s.name === selectedReceiptApt.reason && s.doctorId === selectedReceiptApt.doctorId)}
        />
      )}
    </div>
  );
};
