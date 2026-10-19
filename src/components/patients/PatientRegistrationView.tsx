import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

export const PatientRegistrationView: React.FC = () => {
  const { addPatient, checkPhoneAvailability, setActiveView, setSelectedPatientId } = useApp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdPatientName, setCreatedPatientName] = useState('');
  const [createdPatientMrn, setCreatedPatientMrn] = useState('');
  const [createdPatientId, setCreatedPatientId] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Phone Validation State
  const cleanedPhone = phone.replace(/\D/g, '');
  const isPhoneValidLength = cleanedPhone.length >= 10;
  const isPhoneAvailable = isPhoneValidLength ? checkPhoneAvailability(phone) : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setError('');
    if (!fullName.trim() || !isPhoneValidLength || !isPhoneAvailable || age === '' || Number(age) < 0 || Number(age) > 130) {
      setError('Enter a name, an available phone number, and age between 0 and 130.');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await addPatient({
        name: fullName.trim(), phone, age: Number(age), dob: '', gender,
        bloodType: 'Unknown', address: address.trim(), allergies: [], activeConditions: []
      });
      if (!result.patient) { setError(result.error || 'Unable to register patient.'); return; }
      setCreatedPatientName(result.patient.name);
      setCreatedPatientMrn(result.patient.mrn);
      setCreatedPatientId(result.patient.id);
      setIsSubmitted(true);
    } catch {
      setError('Patient registration failed. Check your connection and try again.');
    } finally { setIsProcessing(false); }
  };

  const handleReset = () => {
    setFullName('');
    setPhone('');
    setAge('');
    setAddress('');
    setIsSubmitted(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
        <button
          onClick={() => setActiveView('patients')}
          className="flex items-center text-on-surface-variant hover:text-primary transition-colors text-xs font-semibold uppercase tracking-wider group"
        >
          <span className="material-symbols-outlined mr-1 text-base group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Back to Patients Directory
        </button>
        <span className="font-bold text-sm text-primary">Nasrullah Javed Pediatric and Health Clinic</span>
      </div>

      {/* Main Registration Box */}
      {!isSubmitted ? (
        <div className="glass-panel rounded-2xl shadow-clinical overflow-hidden p-6 md:p-8">
          <div className="mb-6">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface mb-1">Patient Registration</h1>
            <p className="font-body-md text-xs text-on-surface-variant">
              Enter patient details to generate a new electronic medical record.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {error && <p role="alert" className="text-rose-700">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-semibold text-on-surface mb-1.5" htmlFor="fullName">
                  Full Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                    person
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g., Jane Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface"
                  />
                </div>
              </div>

              {/* Phone Number (With live availability check) */}
              <div className="col-span-1">
                <label className="block font-semibold text-on-surface mb-1.5" htmlFor="phone">
                  Phone Number <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                    call
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(formatPhoneNumber(e.target.value))}
                    placeholder="0333-7645673"
                    required
                    className={`w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border text-xs text-on-surface focus:outline-none ${
                      cleanedPhone.length > 0 && !isPhoneAvailable
                        ? 'border-error focus:ring-error'
                        : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                  />
                </div>
                {/* Live Feedback */}
                <div className="mt-1.5 h-4 text-[11px]">
                  {cleanedPhone.length > 0 && (
                    !isPhoneValidLength ? (
                      <span className="text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">pending</span>
                        Format: 0333-7645673 (11 digits)
                      </span>
                    ) : !isPhoneAvailable ? (
                      <span className="text-error font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        Number already registered in database
                      </span>
                    ) : (
                      <span className="text-secondary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs icon-fill">check_circle</span>
                        Phone number available
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Age */}
              <div className="col-span-1">
                <label className="block font-semibold text-on-surface mb-1.5" htmlFor="age">
                  Age <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                    cake
                  </span>
                  <input
                    id="age"
                    type="number"
                    min="0"
                    max="130"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="Years (e.g. 38)"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="col-span-1">
                <label className="block font-semibold text-on-surface mb-1.5" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Home Address */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-semibold text-on-surface mb-1.5" htmlFor="address">
                  Home Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                    home
                  </span>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 Health Ave, Clinic City"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setActiveView('patients')}
                className="px-5 py-2.5 rounded-xl font-semibold border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || (cleanedPhone.length > 0 && !isPhoneAvailable)}
                className="px-6 py-2.5 rounded-xl font-semibold bg-primary text-on-primary hover:bg-surface-tint transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    Processing Registration...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">how_to_reg</span>
                    Register Patient
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Success Screen State */
        <div className="glass-panel rounded-2xl shadow-clinical p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-sm">
            <span className="material-symbols-outlined text-3xl icon-fill">check_circle</span>
          </div>

          <h2 className="font-title-md font-bold text-xl text-on-surface">Registration Complete</h2>
          <p className="font-body-md text-xs text-on-surface-variant max-w-md leading-relaxed">
            <strong className="text-on-surface font-semibold">{createdPatientName}</strong> has been successfully added to the clinical database.
          </p>

          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60 font-mono text-xs w-full max-w-sm">
            <div className="text-outline text-[10px] uppercase tracking-wider mb-1">Generated MRN</div>
            <div className="text-primary font-bold text-lg">{createdPatientMrn}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
            <button
              onClick={() => {
                setSelectedPatientId(createdPatientId);
                setActiveView('patient_profile');
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface font-semibold text-xs flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person</span>
              View Patient Chart
            </button>
            <button
              onClick={() => {
                setSelectedPatientId(createdPatientId);
                setActiveView('new_appointment');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-surface-tint text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">calendar_add_on</span>
              Schedule Appointment
            </button>
          </div>

          <button
            onClick={handleReset}
            className="text-xs text-primary font-semibold hover:underline pt-2"
          >
            Register Another Patient
          </button>
        </div>
      )}
    </div>
  );
};
