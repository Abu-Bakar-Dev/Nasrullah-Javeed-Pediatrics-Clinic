import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient, Appointment } from '../../types';
import { PrintReceiptModal } from './PrintReceiptModal';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

export const AppointmentSchedulingView: React.FC = () => {
  const { patients, staff, appointments, addAppointment, setActiveView, doctorServices, currentUser } = useApp();

  // Selected appointment for printing receipt modal
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

  // Search Phone
  const [searchPhone, setSearchPhone] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);

  // Form Details
  const [providerId, setProviderId] = useState('');
  const [visitReason, setVisitReason] = useState('Routine Checkup');
  const [apptDate, setApptDate] = useState(new Date().toISOString().slice(0, 10));
  const [apptTime, setApptTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [bookingError, setBookingError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const doctors = staff.filter(member => member.role === 'doctor' && member.status === 'active');
  const searchDigits = searchPhone.replace(/\D/g, '');
  const matchingPatients = searchDigits.length >= 3
    ? patients
        .filter(patient => patient.phone.replace(/\D/g, '').includes(searchDigits))
        .slice(0, 8)
    : [];
  useEffect(() => {
    if (!providerId && doctors[0]) setProviderId(doctors[0].id);
  }, [staff, providerId]);

  const handleSearchPhone = () => {
    setBookingError('');
    const cleaned = searchPhone.replace(/\D/g, '');
    if (cleaned.length < 3) { setFoundPatient(null); setBookingError('Enter at least 3 phone-number digits.'); return; }
    const p = patients.find(pat => pat.phone.replace(/\D/g, '').includes(cleaned));
    if (p) {
      setFoundPatient(p);
    } else { setFoundPatient(null); setBookingError('No registered patient was found with that phone number.'); }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    const selectedDoctor = doctors.find(doctor => doctor.id === providerId);
    if (!foundPatient) { setBookingError('Select a registered patient before creating the booking.'); return; }
    if (!selectedDoctor) { setBookingError('No active doctor is selected. Create or activate a Doctor account first.'); return; }
    if (!apptDate || !apptTime) { setBookingError('Select both an appointment date and time.'); return; }
    setIsSaving(true);

    const result = await addAppointment({
      patientId: foundPatient.id,
      patientName: foundPatient.name,
      patientPhone: foundPatient.phone,
      patientAge: foundPatient.age,
      doctorId: providerId,
      doctorName: selectedDoctor.name,
      department: selectedDoctor.department,
      reason: visitReason,
      date: apptDate,
      time: apptTime,
      notes
    });
    setIsSaving(false);

    if (!result.appointment) { setBookingError(result.error || 'Unable to save the booking.'); return; }
    setSelectedReceiptApt(result.appointment);
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
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Search Phone or Name
                </label>
                <input
                  type="text"
                  value={searchPhone}
                  onChange={e => {
                    setSearchPhone(formatPhoneNumber(e.target.value));
                    setFoundPatient(null);
                    setBookingError('');
                  }}
                  placeholder="0333-7645673"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                {searchDigits.length >= 3 && !foundPatient && (
                  <div className="mt-1.5 max-h-52 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
                    {matchingPatients.length > 0 ? matchingPatients.map(patient => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setFoundPatient(patient);
                          setSearchPhone(formatPhoneNumber(patient.phone));
                          setBookingError('');
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">{patient.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{patient.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 shrink-0">{patient.mrn}</span>
                      </button>
                    )) : (
                      <p className="px-3 py-3 text-xs text-slate-500">No registered patient matches these digits.</p>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSearchPhone}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold"
              >
                Search
              </button>
            </div>

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
                      MRN: <span className="font-mono text-emerald-800 font-bold">{foundPatient.mrn}</span> • Phone: {foundPatient.phone}
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
                <label className="font-bold text-slate-700 block mb-1">Attending Specialist</label>
                <select
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
                <label className="font-bold text-slate-700 block mb-1">Consultation Service</label>
                <select
                  value={selectedServiceId}
                  onChange={e => {
                    setSelectedServiceId(e.target.value);
                    const srv = doctorServices.find(s => s.id === e.target.value);
                    if (srv) setVisitReason(srv.name);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Standard Routine Consultation ($100)</option>
                  {doctorServices.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${s.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={apptDate}
                  onChange={e => setApptDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Slot</label>
                <input
                  type="time"
                  value={apptTime}
                  onChange={e => setApptTime(e.target.value)}
                  placeholder="10:30 AM"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Chief Complaint / Triage Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Initial symptoms or consultation notes..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              onClick={handleCreateAppointment}
              disabled={isSaving || doctors.length === 0}
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
              <span>Today's Clinic Bookings ({appointments.length})</span>
              <span className="material-symbols-outlined text-slate-400 text-lg">print</span>
            </h3>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {appointments.map(apt => (
                <div
                  key={apt.id}
                  className="p-3 border border-slate-200 rounded bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{apt.patientName}</h4>
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
          service={doctorServices.find(s => s.name === selectedReceiptApt.reason)}
        />
      )}
    </div>
  );
};
