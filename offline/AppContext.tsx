import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  UserRole,
  Patient,
  Appointment,
  Prescription,
  StaffMember,
  LabAlert,
  DepartmentMessage,
  AppointmentStatus,
  DoctorService,
  DoctorTiming
} from '../src/types';

import {
  fetchAllDbData,
  dbUpsertStaff,
  dbDeleteStaff,
  dbUpsertPatient,
  dbUpsertAppointment,
  dbUpdateAppointmentStatus,
  dbUpsertPrescription,
  signInWithPassword,
  getAuthenticatedProfile,
  signOut,
} from './database';

import { newId, getLatestRevision, changePreferences } from './database';

type ViewType =
  | 'dashboard'
  | 'patients'
  | 'patient_profile'
  | 'patient_registration'
  | 'appointments'
  | 'new_appointment'
  | 'prescriptions'
  | 'new_prescription'
  | 'staff'
  | 'register_staff'
  | 'settings'
  | 'forgot_password'
  | 'doctor_services_timings'
  | 'doctor_profile';

interface AppContextType {
  currentUser: User | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  lastSyncedAt: number | null;
  activeView: ViewType;
  selectedPatientId: string | null;
  searchQuery: string;
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  staff: StaffMember[];
  alerts: LabAlert[];
  messages: DepartmentMessage[];
  doctorServices: DoctorService[];
  doctorTimings: DoctorTiming[];
  isDbSyncing: boolean;
  dataError: string;
  
  // Actions
  login: (role: UserRole, email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActiveView: (view: ViewType) => void;
  setSelectedPatientId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Data Mutators (Persisted directly to shared local database & local state)
  addPatient: (patient: Omit<Patient, 'id' | 'mrn' | 'lastVisit' | 'balance' | 'vitals'> & { phone: string }) => Promise<{ patient?: Patient; error?: string }>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => Promise<{ appointment?: Appointment; error?: string }>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'date' | 'status'>) => Promise<{ prescription?: Prescription; error?: string }>;
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'status'>) => Promise<{ success: boolean; error?: string }>;
  updateStaffMember: (id: string, updated: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkPhoneAvailability: (phone: string) => boolean;
  getPatientById: (id: string) => Patient | undefined;
  
  // Doctor Services & Timings Actions
  addDoctorService: (service: Omit<DoctorService, 'id'>) => Promise<DoctorService | undefined>;
  updateDoctorService: (id: string, updated: Partial<DoctorService>, expectedItem?: DoctorService) => Promise<boolean>;
  deleteDoctorService: (id: string) => Promise<boolean>;
  updateDoctorTimings: (doctorId: string, updatedTimings: DoctorTiming[], expectedTimings?: DoctorTiming[]) => Promise<boolean>;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  refreshFromDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeView, setActiveView] = useState<ViewType>(() =>
    typeof window !== 'undefined' && (
      new URLSearchParams(window.location.search).has('password-recovery') ||
      window.location.hash.includes('type=recovery')
    ) ? 'forgot_password' : 'dashboard'
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dataError, setDataError] = useState('');
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [alerts] = useState<LabAlert[]>([]);
  const [messages] = useState<DepartmentMessage[]>([]);
  const [doctorServices, setDoctorServices] = useState<DoctorService[]>([]);
  const [doctorTimings, setDoctorTimings] = useState<DoctorTiming[]>([]);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const preferenceRevision = useRef(0);
  const appliedRevision = useRef(-1);
  const sessionGeneration = useRef(0);
  const refreshing = useRef(false);
  const preferenceQueue = useRef<Promise<unknown>>(Promise.resolve());

  const clearSession = () => {
    sessionGeneration.current++;
    appliedRevision.current = -1;
    setCurrentUser(null); setStaff([]); setPatients([]); setAppointments([]);
    setPrescriptions([]); setDoctorServices([]); setDoctorTimings([]);
    setSelectedPatientId(null); setSearchQuery(''); setActiveView('dashboard');
  };

  useEffect(() => {
    getAuthenticatedProfile().then(profile => profile && setCurrentUser(profile))
      .catch(() => setConnectionStatus('disconnected'));
    window.addEventListener('clinic-session-expired', clearSession);
    return () => window.removeEventListener('clinic-session-expired', clearSession);
  }, []);

  const refreshFromDatabase = async () => {
    if (refreshing.current) return;
    const generation = sessionGeneration.current;
    refreshing.current = true;
    setIsDbSyncing(true);
    try {
      const dbData = await fetchAllDbData();
      if (generation !== sessionGeneration.current) return;
      if (dbData && dbData.revision >= getLatestRevision() && dbData.revision >= appliedRevision.current) {
        if (dbData.revision !== appliedRevision.current) {
          setPatients(dbData.patients); setStaff(dbData.staff);
          setAppointments(dbData.appointments); setPrescriptions(dbData.prescriptions);
          setDoctorServices(prev => JSON.stringify(prev) === JSON.stringify(dbData.preferences.services || []) ? prev : dbData.preferences.services || []);
          setDoctorTimings(prev => JSON.stringify(prev) === JSON.stringify(dbData.preferences.timings || []) ? prev : dbData.preferences.timings || []);
          preferenceRevision.current = dbData.preferences.revision || 0;
          setCurrentUser(dbData.user);
          appliedRevision.current = dbData.revision;
        }
        setLastSyncedAt(Date.now()); setConnectionStatus('connected');
      }
    } catch {
      if (generation === sessionGeneration.current) setConnectionStatus('disconnected');
    } finally { refreshing.current = false; setIsDbSyncing(false); }
  };

  useEffect(() => {
    if (!currentUser) return;
    void refreshFromDatabase();
    const timer = window.setInterval(() => void refreshFromDatabase(), 2000);
    const refresh = () => void refreshFromDatabase();
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer); window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh);
    };
  }, [currentUser?.id]);

  const login = async (role: UserRole, email = '', password = '') => {
    const result = await signInWithPassword(email, password);
    if (!result.user) return { success: false, error: result.error };
    if (result.user.role !== role) { await signOut(); return { success: false, error: `This account is registered as ${result.user.role.replace('_', ' ')}.` }; }
    setCurrentUser(result.user);
    setActiveView('dashboard');
    return { success: true };
  };

  const logout = () => {
    void signOut().catch(() => {});
    clearSession(); setDataError('');
  };

  const checkPhoneAvailability = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return !patients.some(p => p.phone.replace(/\D/g, '') === cleaned);
  };

  // 1. ADD PATIENT - Syncs to shared local database
  const addPatient = async (
    data: Omit<Patient, 'id' | 'mrn' | 'lastVisit' | 'balance' | 'vitals'> & { phone: string }
  ): Promise<{ patient?: Patient; error?: string }> => {
    if (!currentUser || !['assistant', 'super_admin'].includes(currentUser.role)) return { error: 'Only an Assistant or Super Admin can register patients.' };
    if (!data.name.trim() || data.phone.replace(/\D/g, '').length < 10 || !Number.isFinite(data.age) || data.age < 0 || data.age > 130) return { error: 'Enter a valid name, phone number, and age (0-130).' };
    if (!checkPhoneAvailability(data.phone)) return { error: 'This phone number is already registered.' };
    const newPatient: Patient = {
      ...data,
      id: newId(),
      mrn: `P-${newId().replace(/-/g, '').slice(0, 12).toUpperCase()}`,
      lastVisit: 'Just registered',
      balance: '$0.00',
      allergies: data.allergies || [],
      activeConditions: data.activeConditions || ['Initial Consult'],
      vitals: {
        bp: 'Not recorded', heartRate: 'Not recorded', weight: 'Not recorded',
        temp: 'Not recorded', recordedAt: 'Not recorded'
      }
    };

    const result = await dbUpsertPatient(newPatient);
    if (!result.success) return { error: result.error || 'Patient registration could not be saved.' };
    appliedRevision.current = -1;
    setPatients(prev => [newPatient, ...prev.filter(p => p.id !== newPatient.id)]);
    return { patient: newPatient };
  };

  // 2. ADD APPOINTMENT - Syncs to shared local database
  const addAppointment = async (
    data: Omit<Appointment, 'id' | 'status'>
  ): Promise<{ appointment?: Appointment; error?: string }> => {
    if (!currentUser || !['assistant', 'super_admin'].includes(currentUser.role)) {
      return { error: 'Only an Assistant or Super Admin can create bookings.' };
    }
    const patient = patients.find(patient => patient.id === data.patientId);
    const doctor = staff.find(member => member.id === data.doctorId && member.role === 'doctor' && member.status === 'active');
    if (!patient) return { error: 'Register and select the patient before booking an appointment.' };
    if (!doctor) return { error: 'Select an active doctor.' };
    if (!data.date || !data.time) return { error: 'Select an appointment date and time.' };
    const newApt: Appointment = {
      ...data,
      id: newId(),
      status: 'waiting'
    };

    const result = await dbUpsertAppointment(newApt);
    if (!result.success) return { error: result.error || 'The booking could not be saved.' };
    appliedRevision.current = -1;
    setAppointments(prev => [newApt, ...prev.filter(a => a.id !== newApt.id)]);
    return { appointment: newApt };
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    setDataError('');
    const result = await dbUpdateAppointmentStatus(id, status, appointments.find(a => a.id === id)?.status);
    if (!result.success) { setDataError(result.error || 'Appointment status could not be saved.'); return false; }
    appliedRevision.current = -1;
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status } : apt));
    return true;
  };

  // 3. ADD PRESCRIPTION - Syncs to shared local database
  const addPrescription = async (
    data: Omit<Prescription, 'id' | 'date' | 'status'>
  ): Promise<{ prescription?: Prescription; error?: string }> => {
    if (currentUser?.role !== 'doctor' || data.doctorId !== currentUser.id) return { error: 'Only the signed-in doctor can issue prescriptions.' };
    if (!patients.some(patient => patient.id === data.patientId)) return { error: 'Select a registered patient.' };
    if (!data.diagnosis.trim() || !data.medications.length || data.medications.some(m => !m.drugName.trim() || !m.sig.trim() || !Number.isInteger(m.quantity) || m.quantity <= 0 || !Number.isInteger(m.refills) || m.refills < 0)) return { error: 'Enter a diagnosis and valid medication names, instructions, quantities, and refills.' };
    const newRx: Prescription = {
      ...data,
      id: newId(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: 'active'
    };

    const result = await dbUpsertPrescription(newRx);
    if (!result.success) return { error: result.error || 'Prescription could not be saved.' };
    appliedRevision.current = -1;
    setPrescriptions(prev => [newRx, ...prev.filter(p => p.id !== newRx.id)]);
    return { prescription: newRx };
  };

  // 4. ADD STAFF MEMBER - Syncs to shared local database
  const addStaffMember = async (
    data: Omit<StaffMember, 'id' | 'status'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Super Admin access required.' };
    }
    if (!['doctor', 'assistant'].includes(data.role)) {
      return { success: false, error: 'Only Doctor and Assistant accounts can be created.' };
    }
    const newStaff: StaffMember = {
      ...data,
      id: `new-${newId()}`,
      status: 'active',
      avatarUrl: undefined
    };

    const result = await dbUpsertStaff(newStaff);
    if (result.success) await refreshFromDatabase();
    return result;
  };

  const updateStaffMember = (id: string, updated: Partial<StaffMember>) => {
    const target = staff.find(s => s.id === id);
    if (!target) return;
    void dbUpsertStaff({ ...target, ...updated }).then(result => {
      if (!result.success) setDataError(result.error || 'Staff update failed.');
      void refreshFromDatabase();
    });
  };

  const deleteStaffMember = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'super_admin') {
      return { success: false, error: 'Super Admin access required.' };
    }
    const target = staff.find(member => member.id === id);
    if (!target || target.role === 'super_admin') {
      return { success: false, error: 'This account cannot be deleted.' };
    }
    const result = await dbDeleteStaff(id);
    if (!result.success) return result;
    // Refresh first so an earlier directory fetch cannot restore the deleted row.
    await refreshFromDatabase();
    setStaff(prev => prev.filter(s => s.id !== id));
    return { success: true };
  };

  const persistPreference = (change: object) => {
    const generation = sessionGeneration.current;
    const pending = preferenceQueue.current.then(async () => {
      if (generation !== sessionGeneration.current) return;
      try {
        const result = await changePreferences({ ...change, expectedRevision: preferenceRevision.current });
        if (generation !== sessionGeneration.current) return;
        preferenceRevision.current = result.preferences.revision;
        setDoctorServices(result.preferences.services || []);
        setDoctorTimings(result.preferences.timings || []);
        setDataError('');
        return true;
      } catch (error) { setDataError((error as Error).message); return false; }
      finally { void refreshFromDatabase(); }
    });
    preferenceQueue.current = pending;
    return pending.then(Boolean);
  };
  const addDoctorService = async (serviceData: Omit<DoctorService, 'id'>): Promise<DoctorService | undefined> => {
    const service = { ...serviceData, id: newId() };
    return await persistPreference({ type: 'service', action: 'upsert', item: service }) ? service : undefined;
  };
  const updateDoctorService = async (id: string, updated: Partial<DoctorService>, expectedItem?: DoctorService) => {
    const service = doctorServices.find(s => s.id === id);
    return service ? persistPreference({ type: 'service', action: 'upsert', item: { ...service, ...updated }, expectedItem }) : false;
  };
  const deleteDoctorService = (id: string) => persistPreference({ type: 'service', action: 'delete', id });
  const updateDoctorTimings = (doctorId: string, timings: DoctorTiming[], expectedTimings?: DoctorTiming[]) => persistPreference({ type: 'timings', doctorId, timings, expectedTimings });
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return false;
    const result = await dbUpsertStaff({ ...currentUser, ...updates, status: 'active' });
    if (!result.success) setDataError(result.error || 'Profile update failed.');
    else setDataError('');
    void refreshFromDatabase();
    return result.success;
  };

  const getPatientById = (id: string) => {
    return patients.find(p => p.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        connectionStatus,
        lastSyncedAt,
        activeView,
        selectedPatientId,
        searchQuery,
        patients,
        appointments,
        prescriptions,
        staff,
        alerts,
        messages,
        doctorServices,
        doctorTimings,
        isDbSyncing,
        dataError,
        login,
        logout,
        setActiveView,
        setSelectedPatientId,
        setSearchQuery,
        addPatient,
        addAppointment,
        updateAppointmentStatus,
        addPrescription,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        checkPhoneAvailability,
        getPatientById,
        addDoctorService,
        updateDoctorService,
        deleteDoctorService,
        updateDoctorTimings,
        updateUserProfile,
        refreshFromDatabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
