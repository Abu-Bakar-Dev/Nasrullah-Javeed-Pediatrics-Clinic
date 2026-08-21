import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Patient, StaffMember, Appointment, Prescription, DoctorService, DoctorTiming } from '../types';

const STORAGE_URL_KEY = 'medflow_supabase_url';
const STORAGE_ANON_KEY = 'medflow_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) || '' : '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
  };
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  }
  supabaseInstance = null; // reset client instance
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
  }
  supabaseInstance = null;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    !url.includes('your-project-id') &&
    !anonKey.includes('your-supabase-anon-key') &&
    url.startsWith('https://')
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabaseConfig();
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (e) {
      console.error('Failed to create Supabase client', e);
      return null;
    }
  }

  return supabaseInstance;
};

export const signInWithPassword = async (email: string, password: string) => {
  const client = getSupabase();
  if (!client) return { user: null, error: 'Supabase is not configured.' };
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error || !data.user) return { user: null, error: error?.message || 'Login failed.' };
  const { data: profile, error: profileError } = await client.from('profiles').select('*').eq('id', data.user.id).single();
  if (profileError || !profile || profile.status !== 'active') {
    await client.auth.signOut();
    return { user: null, error: profile?.status === 'inactive' ? 'This account is inactive.' : 'No clinic profile exists for this account.' };
  }
  return { user: profileToStaff(profile), error: undefined };
};

export const getAuthenticatedProfile = async (): Promise<StaffMember | null> => {
  const client = getSupabase();
  if (!client) return null;
  const { data: session } = await client.auth.getSession();
  if (!session.session) return null;
  const { data } = await client.from('profiles').select('*').eq('id', session.session.user.id).single();
  return data?.status === 'active' ? profileToStaff(data) : null;
};

export const signOut = async () => { await getSupabase()?.auth.signOut(); };

export const requestPasswordReset = async (email: string) => {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase is not configured.' };

  const redirectTo = `${window.location.origin}${window.location.pathname}?password-recovery=1`;
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
  return error ? { success: false, error: error.message } : { success: true, error: undefined };
};

export const updateRecoveredPassword = async (password: string) => {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase is not configured.' };
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) return { success: false, error: 'This password reset link is invalid or has expired.' };

  const { data: profile } = await client.from('profiles').select('role,status').eq('id', sessionData.session.user.id).single();
  if (!profile || profile.status !== 'active' || !['doctor', 'assistant'].includes(profile.role)) {
    return { success: false, error: 'Password recovery is only available for active doctor and assistant accounts.' };
  }

  const { error } = await client.auth.updateUser({ password });
  if (error) return { success: false, error: error.message };
  await client.auth.signOut();
  return { success: true, error: undefined };
};

const profileToStaff = (row: any): StaffMember => ({
  id: row.id, name: row.name, email: row.email, role: row.role,
  department: row.department || '', status: row.status || 'active',
  avatarUrl: row.avatar_url || undefined, phone: row.phone || ''
});

const adminRequest = async (method: string, body: object) => {
  const client = getSupabase();
  const token = (await client?.auth.getSession())?.data.session?.access_token;
  if (!token) return { success: false, error: 'Authentication required' };
  const response = await fetch('/api/admin-users', {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const result = response.status === 204 ? {} : await response.json();
  return response.ok ? { success: true, ...result } : { success: false, error: result.error || 'Request failed' };
};

// =========================================================================
// REAL-TIME DB CRUD OPERATIONS
// =========================================================================

export const dbUpsertStaff = async (staffMember: StaffMember): Promise<{ success: boolean; error?: string }> => {
  if (staffMember.id.startsWith('new-')) return adminRequest('POST', staffMember);
  return adminRequest('PATCH', staffMember);
};

export const dbDeleteStaff = async (id: string): Promise<boolean> => {
  return (await adminRequest('DELETE', { id })).success;
};

export const dbUpsertPatient = async (patient: Patient): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase client not configured' };

  try {
    const payload = {
      id: patient.id,
      mrn: patient.mrn,
      name: patient.name,
      phone: patient.phone,
      age: patient.age || 0,
      dob: patient.dob || '',
      gender: patient.gender || 'Other',
      blood_type: patient.bloodType || 'Unknown',
      address: patient.address || '',
      allergies: patient.allergies || [],
      active_conditions: patient.activeConditions || [],
      vitals: patient.vitals || {},
      last_visit: patient.lastVisit || 'Just registered',
      balance: patient.balance || '$0.00',
      avatar_url: patient.avatarUrl || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('patients').upsert([payload]);
    if (error) {
      console.error('Error saving patient to Supabase:', error);
      return { success: false, error: error.message };
    }
    console.log(`[Supabase DB] Patient ${patient.name} (${patient.mrn}) successfully saved to database.`);
    return { success: true };
  } catch (err: any) {
    console.error('Exception saving patient to Supabase:', err);
    return { success: false, error: err?.message || 'Unknown network error' };
  }
};

export const dbUpsertAppointment = async (apt: Appointment): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase client not configured' };

  try {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session?.user) return { success: false, error: 'Your login session has expired. Please sign in again.' };
    const payload = {
      id: apt.id,
      patient_id: apt.patientId,
      patient_name: apt.patientName,
      patient_phone: apt.patientPhone,
      patient_age: apt.patientAge || 0,
      doctor_id: apt.doctorId,
      doctor_name: apt.doctorName,
      department: apt.department,
      reason: apt.reason,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      notes: apt.notes || '',
      created_by: sessionData.session.user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('appointments').upsert([payload]);
    if (error) {
      console.error('Error saving appointment to Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exception saving appointment to Supabase:', err);
    return { success: false, error: err?.message || 'Unknown network error' };
  }
};

export const dbUpsertPrescription = async (rx: Prescription): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase client not configured' };

  try {
    const { data: visit, error: visitError } = await client.from('patient_visits').insert({
      patient_id: rx.patientId,
      doctor_id: rx.doctorId,
      doctor_name: rx.doctorName,
      diagnosis: rx.diagnosis,
      notes: rx.notes || '',
      visit_date: new Date().toISOString().slice(0, 10)
    }).select('id').single();
    if (visitError) return { success: false, error: visitError.message };
    const payload = {
      id: rx.id,
      patient_id: rx.patientId,
      patient_name: rx.patientName,
      patient_mrn: rx.patientMrn,
      patient_dob: rx.patientDob || '',
      doctor_id: rx.doctorId,
      doctor_name: rx.doctorName,
      doctor_avatar: rx.doctorAvatar || '',
      date: rx.date,
      diagnosis: rx.diagnosis,
      medications: rx.medications || [],
      status: rx.status || 'active',
      notes: rx.notes || '',
      visit_id: visit.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('prescriptions').upsert([payload]);
    if (error) {
      console.error('Error saving prescription to Supabase:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exception saving prescription to Supabase:', err);
    return { success: false, error: err?.message || 'Unknown network error' };
  }
};

export const dbSaveReceipt = async (appointment: Appointment, serviceName: string, amountPaid: number) => {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase client not configured' };
  const { data: session } = await client.auth.getSession();
  const receiptNo = `RCP-${appointment.id.replace(/\D/g, '').slice(-8) || appointment.id.slice(0, 8).toUpperCase()}`;
  const { error } = await client.from('receipts').upsert({
    receipt_no: receiptNo, appointment_id: appointment.id, patient_id: appointment.patientId,
    service_name: serviceName, amount_paid: amountPaid, payment_method: 'Cash',
    payment_status: 'Paid', printed_by: session.session?.user.id
  }, { onConflict: 'appointment_id' });
  return { success: !error, error: error?.message, receiptNo };
};

// =========================================================================
// FETCH ALL LIVE DATA FROM SUPABASE
// =========================================================================

export interface LiveDbData {
  patients: Patient[];
  staff: StaffMember[];
  appointments: Appointment[];
  prescriptions: Prescription[];
}

export const fetchAllDbData = async (): Promise<LiveDbData | null> => {
  const client = getSupabase();
  if (!client) return null;

  try {
    const [patientsRes, staffRes, aptRes, rxRes] = await Promise.all([
      client.from('patients').select('*').order('created_at', { ascending: false }),
      client.from('profiles').select('*').order('created_at', { ascending: false }),
      client.from('appointments').select('*').order('created_at', { ascending: false }),
      client.from('prescriptions').select('*').order('created_at', { ascending: false }),
    ]);

    const patients: Patient[] = (patientsRes.data || []).map((row: any) => ({
      id: row.id,
      mrn: row.mrn,
      name: row.name,
      phone: row.phone || '',
      age: Number(row.age) || 0,
      dob: row.dob || '',
      gender: row.gender || 'Other',
      bloodType: row.blood_type || row.bloodType || 'Unknown',
      address: row.address || '',
      allergies: Array.isArray(row.allergies) ? row.allergies : [],
      activeConditions: Array.isArray(row.active_conditions || row.activeConditions) ? (row.active_conditions || row.activeConditions) : ['Initial Consult'],
      vitals: row.vitals && typeof row.vitals === 'object' ? row.vitals : {
        bp: '120/80',
        heartRate: '72 bpm',
        weight: '160 lbs',
        temp: '98.6 °F',
        recordedAt: 'Just now'
      },
      lastVisit: row.last_visit || row.lastVisit || 'Recent',
      balance: row.balance || '$0.00',
      avatarUrl: row.avatar_url || row.avatarUrl || undefined,
    }));

    const staff: StaffMember[] = (staffRes.data || []).map(profileToStaff);

    const appointments: Appointment[] = (aptRes.data || []).map((row: any) => ({
      id: row.id,
      patientId: row.patient_id || row.patientId || '',
      patientName: row.patient_name || row.patientName || '',
      patientPhone: row.patient_phone || row.patientPhone || '',
      patientAge: Number(row.patient_age || row.patientAge) || undefined,
      doctorId: row.doctor_id || row.doctorId || '',
      doctorName: row.doctor_name || row.doctorName || '',
      department: row.department || '',
      reason: row.reason || '',
      date: row.date || '',
      time: row.time || '',
      status: row.status || 'waiting',
      notes: row.notes || '',
    }));

    const prescriptions: Prescription[] = (rxRes.data || []).map((row: any) => ({
      id: row.id,
      patientId: row.patient_id || row.patientId || '',
      patientName: row.patient_name || row.patientName || '',
      patientMrn: row.patient_mrn || row.patientMrn || '',
      patientDob: row.patient_dob || row.patientDob || '',
      doctorId: row.doctor_id || row.doctorId || '',
      doctorName: row.doctor_name || row.doctorName || '',
      doctorAvatar: row.doctor_avatar || row.doctorAvatar || '',
      date: row.date || '',
      diagnosis: row.diagnosis || '',
      medications: Array.isArray(row.medications) ? row.medications : [],
      status: row.status || 'active',
      notes: row.notes || '',
    }));

    return { patients, staff, appointments, prescriptions };
  } catch (e) {
    console.error('Failed to fetch data from Supabase', e);
    return null;
  }
};

// =========================================================================
// DIAGNOSTIC CONNECTION TEST & SQL SCRIPT
// =========================================================================

export interface TableTestResult {
  table: string;
  status: 'ok' | 'missing_or_error';
  count?: number;
  error?: string;
}

export interface SupabaseTestReport {
  success: boolean;
  latencyMs: number;
  url: string;
  message: string;
  tablesTested: TableTestResult[];
  recordWriteTest?: {
    success: boolean;
    message: string;
  };
}

export const testSupabaseConnection = async (): Promise<SupabaseTestReport> => {
  const startTime = Date.now();
  const config = getSupabaseConfig();

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      latencyMs: 0,
      url: config.url || 'Not configured',
      message: 'Supabase credentials missing or invalid. Please configure URL and Anon Key.',
      tablesTested: [],
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      url: config.url,
      message: 'Failed to initialize Supabase client instance.',
      tablesTested: [],
    };
  }

  const tablesToTest = ['patients', 'appointments', 'staff', 'prescriptions'];
  const tablesTested: TableTestResult[] = [];

  try {
    for (const table of tablesToTest) {
      try {
        const { count, error } = await client
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          tablesTested.push({
            table,
            status: 'missing_or_error',
            error: error.message,
          });
        } else {
          tablesTested.push({
            table,
            status: 'ok',
            count: count ?? 0,
          });
        }
      } catch (err: any) {
        tablesTested.push({
          table,
          status: 'missing_or_error',
          error: err?.message || 'Query failed',
        });
      }
    }

    const latencyMs = Date.now() - startTime;
    const okTables = tablesTested.filter(t => t.status === 'ok');

    // Test saving a ping record to connection_logs or patients table
    let recordWriteTest = { success: false, message: 'Skipped write test' };
    try {
      const pingData = {
        id: `ping-${Date.now()}`,
        test_time: new Date().toISOString(),
        client_app: 'Nasrullah Javed Pediatric & Health Clinic',
      };

      const { error: writeErr } = await client
        .from('connection_logs')
        .upsert([pingData]);

      if (!writeErr) {
        recordWriteTest = { success: true, message: 'Successfully inserted live ping record to "connection_logs" table' };
      } else {
        recordWriteTest = { success: false, message: `Write test note: ${writeErr.message}` };
      }
    } catch (wErr: any) {
      recordWriteTest = { success: false, message: `Write test note: ${wErr?.message || 'Write error'}` };
    }

    const overallSuccess = okTables.length > 0 || recordWriteTest.success;

    return {
      success: overallSuccess,
      latencyMs,
      url: config.url,
      message: overallSuccess
        ? `Database connection verified! Ping latency: ${latencyMs}ms. Accessible tables: ${okTables.length}/${tablesToTest.length}`
        : 'Connected to endpoint, but table schema queries returned errors. Ensure tables are created in Supabase SQL editor.',
      tablesTested,
      recordWriteTest,
    };
  } catch (globalErr: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      url: config.url,
      message: `Connection error: ${globalErr?.message || 'Network error pinging Supabase host'}`,
      tablesTested: [],
    };
  }
};

// SQL Schema generator helper for user's Supabase project
const LEGACY_SUPABASE_SQL_SCHEMA_SCRIPT = `-- Legacy prototype schema (not used by the MVP)

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
  id TEXT PRIMARY KEY,
  mrn TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  age NUMERIC DEFAULT 0,
  dob TEXT,
  gender TEXT DEFAULT 'Other',
  blood_type TEXT DEFAULT 'Unknown',
  address TEXT,
  allergies JSONB DEFAULT '[]'::jsonb,
  active_conditions JSONB DEFAULT '[]'::jsonb,
  vitals JSONB DEFAULT '{}'::jsonb,
  last_visit TEXT DEFAULT 'Just registered',
  balance TEXT DEFAULT '$0.00',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff Directory & Accounts Table
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_age NUMERIC,
  doctor_id TEXT,
  doctor_name TEXT,
  department TEXT,
  reason TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'waiting',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  patient_mrn TEXT,
  patient_dob TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  doctor_avatar TEXT,
  date TEXT NOT NULL,
  diagnosis TEXT,
  medications JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Connection Logs Table
CREATE TABLE IF NOT EXISTS public.connection_logs (
  id TEXT PRIMARY KEY,
  test_time TIMESTAMPTZ DEFAULT NOW(),
  client_app TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_logs ENABLE ROW LEVEL SECURITY;

-- Allow public/anon access for clinical operations
CREATE POLICY "Allow public access for patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for connection_logs" ON public.connection_logs FOR ALL USING (true) WITH CHECK (true);
`;

export const SUPABASE_SQL_SCHEMA_SCRIPT = `The secure MVP schema is stored in supabase/migrations/001_mvp.sql.
Open that file, copy its complete contents, and run it once in the Supabase SQL Editor.
The old public-access prototype schema must not be used.`;
