import type { Patient, StaffMember, Appointment, Prescription } from '../src/types';

let latestRevision = 0;
export const getLatestRevision = () => latestRevision;
// randomUUID requires HTTPS on mobile browsers; getRandomValues also works on a LAN HTTP address.
export const newId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export async function request(route: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<any> {
  const response = await fetch(`/offline-api/${route}`, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(route === 'setup' || route === 'reset-password' ? 30000 : 10000),
  });
  const result = await response.json();
  if (response.status === 401 && route !== 'login') window.dispatchEvent(new Event('clinic-session-expired'));
  if (!response.ok) throw new Error(result.error || 'Local database request failed.');
  if (route === 'login') latestRevision = 0;
  if (typeof result?.revision === 'number') latestRevision = Math.max(latestRevision, result.revision);
  return result;
}
async function mutation(route: string, body: unknown) {
  try { return await request(route, body); }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Local save failed.' }; }
}
export const isSupabaseConfigured = () => true;
export const getSupabase = () => null;
export const signInWithPassword = async (email: string, password: string) => {
  try { return await request('login', { email, password }); }
  catch (error) { return { user: null, error: String((error as Error).message) }; }
};
export const getAuthenticatedProfile = async (): Promise<StaffMember | null> => (await request('session')).user;
export const signOut = () => request('logout', {});
export const fetchAllDbData = () => request('data');
export const dbUpsertPatient = (patient: Patient) => mutation('patient', patient);
export const dbUpsertAppointment = (appointment: Appointment) => mutation('appointment', appointment);
export const dbUpsertPrescription = (rx: Prescription) => mutation('prescription', rx);
export const dbUpsertStaff = (staff: StaffMember) => mutation('staff', staff);
export const dbDeleteStaff = (id: string) => mutation('delete-staff', { id });
export const dbUpdateAppointmentStatus = (id: string, status: Appointment['status'], expectedStatus?: Appointment['status']) => mutation('status', { id, status, expectedStatus });
export const receiptNumber = (id: string) => `RCP-${id.replace(/-/g, '').toUpperCase()}`;
export const dbGetReceipt = (id: string) => request(`receipt?id=${encodeURIComponent(id)}`);
export const dbSaveReceipt = (appointment: Appointment, serviceName: string, amountPaid: number) => mutation('receipt', { appointment, serviceName, amountPaid });
export const loadPreferences = () => request('preferences');
export const savePreferences = (preferences: unknown) => request('preferences', preferences);
export const changePreferences = (change: object) => request('preference-change', change);
export const requestPasswordReset = async (_email: string) => ({ success: false, error: 'Ask the local Super Admin to reset your password in Offline Settings.' });
export const updateRecoveredPassword = async (_password: string) => ({ success: false, error: 'Email recovery is unavailable in the offline edition.' });
