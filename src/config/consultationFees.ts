export const ROUTINE_CONSULTATION_FEES = [1000, 800, 500] as const;

export const routineConsultationLabel = (fee: number): string => {
  if (!(ROUTINE_CONSULTATION_FEES as readonly number[]).includes(fee)) throw new Error('Invalid consultation fee');
  return `Standard Routine Consultation (PKR ${fee.toLocaleString('en-PK')})`;
};

// The booking reason stores the selected fee so reopening an unpaid booking
// uses the original selection without depending on the current form state.
export const routineConsultationFee = (reason: string): number | undefined =>
  ROUTINE_CONSULTATION_FEES.find(fee => routineConsultationLabel(fee) === reason);
