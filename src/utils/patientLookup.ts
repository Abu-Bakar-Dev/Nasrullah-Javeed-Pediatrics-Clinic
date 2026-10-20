import type { Patient } from '../types';

// MRN is the permanent patient token stored on the patient record.
export const matchesPatientIdentifier = (patient: Pick<Patient, 'mrn' | 'phone'>, query: string): boolean => {
  const value = query.trim();
  if (!value) return false;
  if (patient.mrn.toLowerCase().includes(value.toLowerCase())) return true;
  // Only treat phone-shaped queries as phone numbers; tokens may contain digits too.
  const digits = value.replace(/\D/g, '');
  return /^[+\d\s().-]+$/.test(value) && digits.length > 0 &&
    patient.phone.replace(/\D/g, '').includes(digits);
};
