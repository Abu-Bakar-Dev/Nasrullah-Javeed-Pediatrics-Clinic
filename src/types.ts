export type UserRole = 'super_admin' | 'doctor' | 'assistant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'inactive';
  avatarUrl?: string;
  phone?: string;
  password?: string;
}

export interface DoctorService {
  id: string;
  doctorId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
}

export interface DoctorTiming {
  id: string;
  doctorId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface AppointmentReceipt {
  receiptNo: string;
  appointmentId: string;
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  doctorName: string;
  department: string;
  serviceName: string;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Card' | 'Insurance' | 'Online';
  paymentStatus: 'Paid' | 'Pending';
  date: string;
  time: string;
  printedBy: string;
  printedAt: string;
}

export interface PatientVisit {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  diagnosis: string;
  notes: string;
  visitDate: string;
  createdAt: string;
}

export interface PatientVitals {
  bp: string;
  heartRate: string;
  weight: string;
  temp: string;
  recordedAt: string;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  phone: string;
  age: number;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: string;
  address: string;
  allergies: string[];
  activeConditions: string[];
  vitals: PatientVitals;
  lastVisit: string;
  balance: string;
  avatarUrl?: string;
}

export type AppointmentStatus = 'waiting' | 'checked_in' | 'in_consultation' | 'completed' | 'not_arrived';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  doctorId: string;
  doctorName: string;
  department: string;
  reason: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface MedicationItem {
  id: string;
  drugName: string;
  route: string;
  frequency: string;
  sig: string;
  quantity: number;
  refills: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientDob?: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar?: string;
  date: string;
  diagnosis: string;
  medications: MedicationItem[];
  status: 'active' | 'completed' | 'discontinued';
  discontinuedReason?: string;
  notes?: string;
}

export interface LabAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  urgency: 'low' | 'medium' | 'action_required';
  message: string;
  timestamp: string;
  reviewed: boolean;
}

export interface DepartmentMessage {
  id: string;
  senderName: string;
  senderRole: string;
  avatar?: string;
  message: string;
  timestamp: string;
  read: boolean;
}
