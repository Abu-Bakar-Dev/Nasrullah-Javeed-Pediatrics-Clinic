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
  INITIAL_STAFF,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_PRESCRIPTIONS,
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
  
  // Actions
  login: (role: UserRole, email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActiveView: (view: ViewType) => void;
  setSelectedPatientId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Data Mutators (Persisted directly to Supabase DB & local state)
  addPatient: (patient: Omit<Patient, 'id' | 'mrn' | 'lastVisit' | 'balance' | 'vitals'> & { phone: string }) => Patient;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => Promise<{ appointment?: Appointment; error?: string }>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'date' | 'status'>) => Prescription;
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'status'>) => Promise<{ success: boolean; error?: string }>;
  updateStaffMember: (id: string, updated: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
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
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('pat-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
        if (dbData.patients && dbData.patients.length > 0) {
          setPatients(dbData.patients);
        }
        if (dbData.staff && dbData.staff.length > 0) {
          setStaff(dbData.staff);
        }
        if (dbData.appointments && dbData.appointments.length > 0) {
          setAppointments(dbData.appointments);
        }
        if (dbData.prescriptions && dbData.prescriptions.length > 0) {
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
  };


  const checkPhoneAvailability = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned === '5550000000') return false;
    return !patients.some(p => p.phone.replace(/\D/g, '') === cleaned);
  };

  // 1. ADD PATIENT - Syncs to Supabase DB
  const addPatient = (
    data: Omit<Patient, 'id' | 'mrn' | 'lastVisit' | 'balance' | 'vitals'> & { phone: string }
  ): Patient => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newPatient: Patient = {
      ...data,
      id: crypto.randomUUID(),
      mrn: `P-${randomNum}`,
      lastVisit: 'Just registered',
      balance: '$0.00',
      allergies: data.allergies || [],
      activeConditions: data.activeConditions || ['Initial Consult'],
      vitals: {
        bp: '120/80',
        heartRate: '72 bpm',
        weight: '160 lbs',
        temp: '98.6 °F',
        recordedAt: 'Just now'
      }
    };

    setPatients(prev => [newPatient, ...prev]);

    // Asynchronously save to Supabase Database
    dbUpsertPatient(newPatient).catch(err => console.warn('Supabase patient sync:', err));

    return newPatient;
  };

  // 2. ADD APPOINTMENT - Syncs to Supabase DB
  const addAppointment = async (
    data: Omit<Appointment, 'id' | 'status'>
  ): Promise<{ appointment?: Appointment; error?: string }> => {
    if (!currentUser || !['assistant', 'super_admin'].includes(currentUser.role)) {
      return { error: 'Only an Assistant or Super Admin can create bookings.' };
    }
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

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => {
      const next = prev.map(a => (a.id === id ? { ...a, status } : a));
      const target = next.find(a => a.id === id);
      if (target) {
        dbUpsertAppointment(target).catch(err => console.warn('Supabase status sync:', err));
      }
      return next;
    });
  };

  // 3. ADD PRESCRIPTION - Syncs to Supabase DB
  const addPrescription = (
    data: Omit<Prescription, 'id' | 'date' | 'status'>
  ): Prescription => {
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

    setPrescriptions(prev => [newRx, ...prev]);

    // Asynchronously save to Supabase Database
    dbUpsertPrescription(newRx).catch(err => console.warn('Supabase prescription sync:', err));

    return newRx;
  };

  // 4. ADD STAFF MEMBER - Syncs to Supabase DB
  const addStaffMember = async (
    data: Omit<StaffMember, 'id' | 'status'>
  ): Promise<{ success: boolean; error?: string }> => {
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

  const deleteStaffMember = (id: string) => {
    const target = staff.find(member => member.id === id);
    if (!target || target.role === 'super_admin') return;
    setStaff(prev => prev.filter(s => s.id !== id));
    dbDeleteStaff(id).catch(err => console.warn('Supabase delete staff sync:', err));
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
