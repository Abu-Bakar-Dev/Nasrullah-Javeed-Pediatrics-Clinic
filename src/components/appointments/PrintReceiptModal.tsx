import { routineConsultationFee } from '../../config/consultationFees';
import React, { useEffect, useState } from 'react';
import { Appointment, DoctorService } from '../../types';
import { useApp } from '../../context/AppContext';
import { dbSaveReceipt, dbGetReceipt, receiptNumber } from '../../lib/supabase';

interface PrintReceiptModalProps {
  appointment: Appointment;
  onClose: () => void;
  service?: DoctorService;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  appointment,
  onClose,
  service
}) => {
  const { currentUser, getPatientById } = useApp();
  const patient = getPatientById(appointment.patientId);

  const [savedReceipt, setSavedReceipt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    dbGetReceipt(appointment.id).then(receipt => { if (!cancelled) setSavedReceipt(receipt); })
      .catch(() => { if (!cancelled) setError('Cannot load this receipt. Close and reopen to retry.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [appointment.id]);
  const receiptNo = savedReceipt?.receipt_no || receiptNumber(appointment.id);
  const currentDate = new Date(savedReceipt?.printed_at || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const currentTime = new Date(savedReceipt?.printed_at || Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const amount = Number(savedReceipt?.amount_paid ?? routineConsultationFee(appointment.reason) ?? service?.price ?? 1000);
  const serviceTitle = savedReceipt?.service_name || service?.name || appointment.reason || 'General Health Consultation';

  const handlePrint = async () => {
    if (isSaving || isLoading || error) return;
    setIsSaving(true);
    try {
      const result = await dbSaveReceipt(appointment, serviceTitle, amount);
      if (!result.success) { setError(result.error || 'Receipt could not be stored.'); return; }
      setSavedReceipt(result.receipt);
      // Let React render the persisted receipt details before opening print preview.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      document.body.classList.add('printing-receipt');
      window.print();
      document.body.classList.remove('printing-receipt');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls (Hidden in browser print mode) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">receipt_long</span>
            <span className="font-bold text-xs uppercase tracking-wider">Patient Booking Receipt & Voucher</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        {error && <p role="alert" className="p-3 text-xs text-rose-700 print:hidden">{error}</p>}
        {/* Printable Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 bg-white print:p-0 print:shadow-none" id="printable-receipt">
          {/* Clinic Banner */}
          <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-2xl font-bold">medical_services</span>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                Nasrullah Javed Pediatric and Health Clinic
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              124 Medical Boulevard, Suite 300 • Emergency & Appointments: (555) 019-2831
            </p>
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-[11px] rounded uppercase mt-2 tracking-wider">
              Official Payment Voucher
            </div>
          </div>

          {/* Receipt Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Receipt No:</span>
              <span className="font-bold text-slate-900 text-sm">{receiptNo}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Issued Date & Time:</span>
              <span className="font-bold text-slate-800">{currentDate} • {currentTime}</span>
            </div>
          </div>

          {/* Patient Info */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Patient Identification
            </h3>
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Patient Name:</span>
                <span className="font-bold text-slate-900">{appointment.patientName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Patient Token:</span>
                <span className="font-mono font-bold text-emerald-700">{patient?.mrn || 'Unavailable'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Contact Phone:</span>
                <span className="font-mono text-slate-700">{appointment.patientPhone || patient?.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Gender / Age:</span>
                <span className="text-slate-700">{patient?.gender || 'Unknown'}, {patient?.age ?? appointment.patientAge ?? 'Unknown'} yrs</span>
              </div>
            </div>
          </div>

          {/* Appointment & Attending Doctor */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Clinical Booking Details
            </h3>
            <div className="p-3 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Attending Specialist:</span>
                <span className="font-bold text-slate-900">{appointment.doctorName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Department:</span>
                <span className="font-medium text-slate-800">{appointment.department}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Scheduled Date & Time:</span>
                <span className="font-bold font-mono text-slate-900">{appointment.date} at {appointment.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chief Complaint / Reason:</span>
                <span className="font-medium text-slate-800">{appointment.reason}</span>
              </div>
            </div>
          </div>

          {/* Service Line Item & Pricing */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Fee Summary
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold text-slate-700 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Service Description</th>
                    <th className="p-2.5 text-right">Fee (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-2.5 text-slate-800">{serviceTitle}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">PKR {amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td className="p-2.5">Total Amount Charged:</td>
                    <td className="p-2.5 text-right font-mono text-emerald-700 text-sm">PKR {amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Status Stamp */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center text-xs">
            <div>
              <span className="text-emerald-800 block font-bold text-[10px] uppercase">Payment Status:</span>
              <span className="font-black text-emerald-900 text-sm tracking-widest uppercase">✓ PAID IN FULL</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px]">Issued By:</span>
              <span className="font-bold text-slate-800">{currentUser?.name || 'Front Desk Assistant'}</span>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="text-center pt-2 text-[10px] text-slate-400 space-y-1 border-t border-slate-100">
            <p>Please present this receipt at the nursing station during check-in.</p>
            <p className="font-mono">Computer generated receipt. No signature required.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={isLoading || isSaving || !!error}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">print</span>
            {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Print Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
