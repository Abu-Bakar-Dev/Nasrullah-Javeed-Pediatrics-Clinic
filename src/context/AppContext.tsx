import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types';
import {
  INITIAL_ALERTS,
  INITIAL_MESSAGES,
  INITIAL_DOCTOR_SERVICES,
  INITIAL_DOCTOR_TIMINGS
} from '../data/mockData';
import {
  isSupabaseConfigured,
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
} from '../lib/supabase';

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
  
  // Data Mutators (Persisted directly to Supabase DB & local state)
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
  addDoctorService: (service: Omit<DoctorService, 'id'>) => DoctorService;
  updateDoctorService: (id: string, updated: Partial<DoctorService>) => void;
  deleteDoctorService: (id: string) => void;
  updateDoctorTimings: (doctorId: string, updatedTimings: DoctorTiming[]) => void;
  updateUserProfile: (updates: Partial<User>) => void;
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
  const [alerts, setAlerts] = useState<LabAlert[]>(INITIAL_ALERTS);
  const [messages, setMessages] = useState<DepartmentMessage[]>(INITIAL_MESSAGES);
  const [doctorServices, setDoctorServices] = useState<DoctorService[]>(INITIAL_DOCTOR_SERVICES);
  const [doctorTimings, setDoctorTimings] = useState<DoctorTiming[]>(INITIAL_DOCTOR_TIMINGS);

  // Restore the authenticated Supabase session. Clinical records always come from the DB.
  useEffect(() => {
    getAuthenticatedProfile().then(profile => profile && setCurrentUser(profile));
  }, []);

  // Fetch live Supabase DB records on mount if credentials are configured
  const refreshFromDatabase = async () => {
    if (!isSupabaseConfigured()) return;
    setIsDbSyncing(true);
    try {
      const dbData = await fetchAllDbData();
      if (dbData) {
        if (dbData.patients) {
          setPatients(dbData.patients);
        }
        if (dbData.staff) {
          setStaff(dbData.staff);
        }
        if (dbData.appointments) {
          setAppointments(dbData.appointments);
        }
        if (dbData.prescriptions) {
          setPrescriptions(dbData.prescriptions);
        }
        console.log('[Supabase DB Sync] Successfully loaded dynamic records from live database.');
      }
    } catch (err) {
      console.warn('Could not sync from Supabase DB:', err);
    } finally {
      setIsDbSyncing(false);
    }
  };

  useEffect(() => { if (currentUser) refreshFromDatabase(); }, [currentUser?.id]);

  const login = async (role: UserRole, email = '', password = '') => {
    const result = await signInWithPassword(email, password);
    if (!result.user) return { success: false, error: result.error };
    if (result.user.role !== role) { await signOut(); return { success: false, error: `This account is registered as ${result.user.role.replace('_', ' ')}.` }; }
    setCurrentUser(result.user);
    setActiveView('dashboard');
    return { success: true };
  };

  const logout = () => {
    void signOut();
    setCurrentUser(null);
    setDataError('');
    setStaff([]);
    setPatients([]);
    setAppointments([]);
    setPrescriptions([]);
  };


  const checkPhoneAvailability = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return !patients.some(p => p.phone.replace(/\D/g, '') === cleaned);
  };

  // 1. ADD PATIENT - Syncs to Supabase DB
  const addPatient = async (
    data: Omit<Patient, 'id' | 'mrn' | 'lastVisit' | 'balance' | 'vitals'> & { phone: string }
  ): Promise<{ patient?: Patient; error?: string }> => {
    if (!currentUser || !['assistant', 'super_admin'].includes(currentUser.role)) return { error: 'Only an Assistant or Super Admin can register patients.' };
    if (!data.name.trim() || data.phone.replace(/\D/g, '').length < 10 || !Number.isFinite(data.age) || data.age < 0 || data.age > 130) return { error: 'Enter a valid name, phone number, and age (0-130).' };
    if (!checkPhoneAvailability(data.phone)) return { error: 'This phone number is already registered.' };
    const newPatient: Patient = {
      ...data,
      id: crypto.randomUUID(),
      mrn: `P-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`,
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
    setPatients(prev => [newPatient, ...prev]);
    return { patient: newPatient };
  };

  // 2. ADD APPOINTMENT - Syncs to Supabase DB
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
      id: crypto.randomUUID(),
      status: 'waiting'
    };

    const result = await dbUpsertAppointment(newApt);
    if (!result.success) return { error: result.error || 'The booking could not be saved.' };
    setAppointments(prev => [newApt, ...prev]);
    return { appointment: newApt };
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    setDataError('');
    const result = await dbUpdateAppointmentStatus(id, status);
    if (!result.success) { setDataError(result.error || 'Appointment status could not be saved.'); return false; }
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status } : apt));
    return true;
  };

  // 3. ADD PRESCRIPTION - Syncs to Supabase DB
  const addPrescription = async (
    data: Omit<Prescription, 'id' | 'date' | 'status'>
  ): Promise<{ prescription?: Prescription; error?: string }> => {
    if (currentUser?.role !== 'doctor' || data.doctorId !== currentUser.id) return { error: 'Only the signed-in doctor can issue prescriptions.' };
    if (!patients.some(patient => patient.id === data.patientId)) return { error: 'Select a registered patient.' };
    if (!data.diagnosis.trim() || !data.medications.length || data.medications.some(m => !m.drugName.trim() || !m.sig.trim() || !Number.isInteger(m.quantity) || m.quantity <= 0 || !Number.isInteger(m.refills) || m.refills < 0)) return { error: 'Enter a diagnosis and valid medication names, instructions, quantities, and refills.' };
    const newRx: Prescription = {
      ...data,
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: 'active'
    };

    const result = await dbUpsertPrescription(newRx);
    if (!result.success) return { error: result.error || 'Prescription could not be saved.' };
    setPrescriptions(prev => [newRx, ...prev]);
    return { prescription: newRx };
  };

  // 4. ADD STAFF MEMBER - Syncs to Supabase DB
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
      id: `new-${crypto.randomUUID()}`,
      status: 'active',
      avatarUrl: undefined
    };

    const result = await dbUpsertStaff(newStaff);
    if (result.success) await refreshFromDatabase();
    return result;
  };

  const updateStaffMember = (id: string, updated: Partial<StaffMember>) => {
    setStaff(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, ...updated } : s));
      const target = next.find(s => s.id === id);
      if (target) {
        dbUpsertStaff(target).catch(err => console.warn('Supabase update staff sync:', err));
      }
      return next;
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

  const addDoctorService = (serviceData: Omit<DoctorService, 'id'>): DoctorService => {
    const newSrv: DoctorService = {
      ...serviceData,
      id: `srv-${Date.now()}`
    };
    setDoctorServices(prev => [...prev, newSrv]);
    return newSrv;
  };

  const updateDoctorService = (id: string, updated: Partial<DoctorService>) => {
    setDoctorServices(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteDoctorService = (id: string) => {
    setDoctorServices(prev => prev.filter(s => s.id !== id));
  };

  const updateDoctorTimings = (doctorId: string, updatedTimings: DoctorTiming[]) => {
    setDoctorTimings(prev => [
      ...prev.filter(t => t.doctorId !== doctorId),
      ...updatedTimings
    ]);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      void dbUpsertStaff({ ...updatedUser, status: 'active' });
    }
  };

  const getPatientById = (id: string) => {
    return patients.find(p => p.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
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
