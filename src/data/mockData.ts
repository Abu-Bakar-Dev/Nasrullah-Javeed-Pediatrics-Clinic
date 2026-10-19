import { StaffMember, Patient, Appointment, Prescription, LabAlert, DepartmentMessage, DoctorService, DoctorTiming } from '../types';

export const INITIAL_DOCTOR_SERVICES: DoctorService[] = [];

export const INITIAL_DOCTOR_TIMINGS: DoctorTiming[] = [];

export const INITIAL_STAFF: StaffMember[] = [];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    mrn: '9482-10A',
    name: 'Robert J. Oppenheimer',
    phone: '0333-7645673',
    age: 78,
    dob: '1945-04-22',
    gender: 'Male',
    bloodType: 'O+',
    address: '1089 Los Alamos Rd, Santa Fe, NM 87544',
    allergies: [],
    activeConditions: ['Hypertension', 'Type 2 Diabetes', 'Asthma (Mild)'],
    vitals: {
      bp: '142/90',
      heartRate: '72 bpm',
      weight: '185 lbs',
      temp: '98.6 °F',
      recordedAt: 'Today, 09:15 AM'
    },
    lastVisit: '2 weeks ago',
    balance: '$0.00',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'pat-2',
    mrn: 'P-84729',
    name: 'Eleanor Vance',
    phone: '0300-8392019',
    age: 42,
    dob: '1982-08-14',
    gender: 'Female',
    bloodType: 'A+',
    address: '456 Oak Lane, Clinic City, CC 10002',
    allergies: ['Penicillin (Mild)'],
    activeConditions: ['Hypertension'],
    vitals: {
      bp: '138/85',
      heartRate: '72 bpm',
      weight: '142 lbs',
      temp: '98.4 °F',
      recordedAt: 'Today, 09:45 AM'
    },
    lastVisit: '1 month ago',
    balance: '$0.00',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'pat-3',
    mrn: 'MRN-847291',
    name: 'Jane Doe',
    phone: '0321-1234567',
    age: 38,
    dob: '1985-12-05',
    gender: 'Female',
    bloodType: 'B+',
    address: '789 Maple Ave, Medical City, MC 10001',
    allergies: ['Penicillin (Severe)', 'Latex (Mild)'],
    activeConditions: ['Acute Bronchitis'],
    vitals: {
      bp: '120/80',
      heartRate: '78 bpm',
      weight: '135 lbs',
      temp: '99.1 °F',
      recordedAt: 'Today, 08:30 AM'
    },
    lastVisit: '3 weeks ago',
    balance: '$0.00',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'pat-4',
    mrn: 'P-9821',
    name: 'Michael Chen',
    phone: '(555) 444-3322',
    age: 40,
    dob: '1984-05-12',
    gender: 'Male',
    bloodType: 'A-',
    address: '123 Health Way, Suite 4B',
    allergies: [],
    activeConditions: ['Seasonal Allergies'],
    vitals: {
      bp: '122/78',
      heartRate: '68 bpm',
      weight: '170 lbs',
      temp: '98.2 °F',
      recordedAt: 'Today, 08:50 AM'
    },
    lastVisit: 'Today',
    balance: '$0.00'
  },
  {
    id: 'pat-5',
    mrn: 'P-4432',
    name: 'Emily Stanton',
    phone: '(555) 555-9988',
    age: 33,
    dob: '1990-11-02',
    gender: 'Female',
    bloodType: 'O-',
    address: '89 Willow St',
    allergies: ['Sulfa drugs'],
    activeConditions: ['Hypothyroidism'],
    vitals: {
      bp: '118/75',
      heartRate: '70 bpm',
      weight: '128 lbs',
      temp: '98.6 °F',
      recordedAt: 'Today, 09:20 AM'
    },
    lastVisit: '1 week ago',
    balance: '$0.00'
  },
  {
    id: 'pat-6',
    mrn: 'P-1093',
    name: 'Robert Fox',
    phone: '(555) 999-1122',
    age: 48,
    dob: '1975-08-21',
    gender: 'Male',
    bloodType: 'AB+',
    address: '55 Pine Rd',
    allergies: [],
    activeConditions: ['Hyperlipidemia'],
    vitals: {
      bp: '130/84',
      heartRate: '74 bpm',
      weight: '192 lbs',
      temp: '98.5 °F',
      recordedAt: 'Yesterday'
    },
    lastVisit: '3 months ago',
    balance: '$0.00'
  },
  {
    id: 'pat-7',
    mrn: 'P-3021',
    name: 'John Doe',
    phone: '(555) 000-0000',
    age: 39,
    dob: '1984-12-05',
    gender: 'Male',
    bloodType: 'O+',
    address: '100 Main St, Suite 1',
    allergies: [],
    activeConditions: ['Routine Physical'],
    vitals: {
      bp: '120/80',
      heartRate: '70 bpm',
      weight: '175 lbs',
      temp: '98.6 °F',
      recordedAt: 'Today, 08:00 AM'
    },
    lastVisit: '2 months ago',
    balance: '$0.00'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [];

export const INITIAL_ALERTS: LabAlert[] = [
  {
    id: 'alert-1',
    patientId: 'pat-6',
    patientName: 'Marcus Thorne',
    type: 'Lab Result Ready',
    urgency: 'action_required',
    message: 'Lab results for Marcus Thorne are ready for review before 10:30 AM appointment.',
    timestamp: '10 mins ago',
    reviewed: false
  }
];

export const INITIAL_MESSAGES: DepartmentMessage[] = [
  {
    id: 'msg-1',
    senderName: 'Nurse Davis',
    senderRole: 'Clinic Nurse',
    avatar: 'https://images.unsplash.com/photo-1594824813566-88855ce78c40?auto=format&fit=crop&w=100&q=80',
    message: 'Room 3 has been sanitized and is ready for the next patient.',
    timestamp: '12m ago',
    read: false
  },
  {
    id: 'msg-2',
    senderName: 'Lab Tech',
    senderRole: 'Pathology',
    avatar: undefined,
    message: 'Blood cultures for patient #442 are delayed by 2 hours.',
    timestamp: '45m ago',
    read: false
  }
];
