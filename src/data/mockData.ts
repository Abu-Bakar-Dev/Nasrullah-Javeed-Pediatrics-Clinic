import { StaffMember, Patient, Appointment, Prescription, LabAlert, DepartmentMessage, DoctorService, DoctorTiming } from '../types';

export const INITIAL_DOCTOR_SERVICES: DoctorService[] = [
  {
    id: 'srv-1',
    doctorId: 'staff-1',
    name: 'Cardiology Initial Consultation',
    description: 'Comprehensive cardiac evaluation, ECG review, and baseline assessment.',
    price: 150,
    durationMinutes: 30
  },
  {
    id: 'srv-2',
    doctorId: 'staff-1',
    name: 'Echocardiogram & Cardiac Follow-Up',
    description: 'Targeted ultrasound evaluation for heart structure and valve function.',
    price: 220,
    durationMinutes: 45
  },
  {
    id: 'srv-3',
    doctorId: 'staff-5',
    name: 'General Medical Examination',
    description: 'Standard health checkup, physical examination, and preventative care.',
    price: 90,
    durationMinutes: 20
  },
  {
    id: 'srv-4',
    doctorId: 'staff-6',
    name: 'Pediatric Growth & Well-Child Check',
    description: 'Developmental milestones assessment, growth charts, and pediatric immunizations.',
    price: 110,
    durationMinutes: 30
  }
];

export const INITIAL_DOCTOR_TIMINGS: DoctorTiming[] = [
  { id: 'tm-1', doctorId: 'staff-1', day: 'Monday', isAvailable: true, startTime: '09:00 AM', endTime: '05:00 PM', slotDurationMinutes: 30 },
  { id: 'tm-2', doctorId: 'staff-1', day: 'Tuesday', isAvailable: true, startTime: '09:00 AM', endTime: '05:00 PM', slotDurationMinutes: 30 },
  { id: 'tm-3', doctorId: 'staff-1', day: 'Wednesday', isAvailable: true, startTime: '09:00 AM', endTime: '01:00 PM', slotDurationMinutes: 30 },
  { id: 'tm-4', doctorId: 'staff-1', day: 'Thursday', isAvailable: true, startTime: '09:00 AM', endTime: '05:00 PM', slotDurationMinutes: 30 },
  { id: 'tm-5', doctorId: 'staff-1', day: 'Friday', isAvailable: true, startTime: '09:00 AM', endTime: '04:00 PM', slotDurationMinutes: 30 },
  { id: 'tm-6', doctorId: 'staff-1', day: 'Saturday', isAvailable: false, startTime: '10:00 AM', endTime: '02:00 PM', slotDurationMinutes: 30 },
  { id: 'tm-7', doctorId: 'staff-1', day: 'Sunday', isAvailable: false, startTime: '09:00 AM', endTime: '01:00 PM', slotDurationMinutes: 30 }
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@medflow.clinic',
    role: 'doctor',
    department: 'Cardiology',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
    phone: '0300-2345678'
  },
  {
    id: 'staff-2',
    name: 'Marcus Chen',
    email: 'marcus.chen@medflow.clinic',
    role: 'assistant',
    department: 'Pediatrics',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
    phone: '0311-3456789'
  },
  {
    id: 'staff-3',
    name: 'Dr. Robert Vance',
    email: 'robert.vance@medflow.clinic',
    role: 'doctor',
    department: 'Neurology',
    status: 'inactive',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&q=80',
    phone: '0322-4567890'
  },
  {
    id: 'staff-4',
    name: 'Elena Rostova',
    email: 'elena.rostova@medflow.clinic',
    role: 'assistant',
    department: 'Triage',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce78c40?auto=format&fit=crop&w=200&q=80',
    phone: '0333-5678901'
  },
  {
    id: 'staff-5',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@medflow.clinic',
    role: 'doctor',
    department: 'General Medicine',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80',
    phone: '0344-6789012'
  },
  {
    id: 'staff-6',
    name: 'Dr. Emily Stone',
    email: 'emily.stone@medflow.clinic',
    role: 'doctor',
    department: 'Pediatrics',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=200&q=80',
    phone: '0355-7890123'
  }
];

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

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientId: 'pat-2',
    patientName: 'Eleanor Vance',
    patientPhone: '(555) 839-2019',
    patientAge: 42,
    doctorId: 'staff-1',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'Cardiology',
    reason: 'Follow-up: Hypertension',
    date: '2026-08-05',
    time: '10:00 AM',
    status: 'waiting',
    notes: 'BP history 138/85. Patient feels well.'
  },
  {
    id: 'apt-2',
    patientId: 'pat-6',
    patientName: 'Marcus Thorne',
    patientPhone: '(555) 999-1122',
    patientAge: 48,
    doctorId: 'staff-1',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'General Medicine',
    reason: 'Annual Physical',
    date: '2026-08-05',
    time: '10:30 AM',
    status: 'waiting',
    notes: 'Lab results ready for review.'
  },
  {
    id: 'apt-3',
    patientId: 'pat-3',
    patientName: 'Sarah Jenkins',
    patientPhone: '(555) 123-4567',
    patientAge: 38,
    doctorId: 'staff-5',
    doctorName: 'Dr. Michael Chen',
    department: 'Endocrinology',
    reason: 'Thyroid Check',
    date: '2026-08-05',
    time: '11:00 AM',
    status: 'checked_in',
    notes: 'Checked in at front desk.'
  },
  {
    id: 'apt-4',
    patientId: 'pat-7',
    patientName: 'David Chen',
    patientPhone: '(555) 000-0000',
    patientAge: 39,
    doctorId: 'staff-6',
    doctorName: 'Dr. Emily Stone',
    department: 'Pediatrics',
    reason: 'Vaccination',
    date: '2026-08-05',
    time: '11:30 AM',
    status: 'not_arrived',
    notes: 'Flu shot & booster.'
  },
  {
    id: 'apt-5',
    patientId: 'pat-4',
    patientName: 'Michael Chen',
    patientPhone: '(555) 444-3322',
    patientAge: 40,
    doctorId: 'staff-1',
    doctorName: 'Dr. Adams',
    department: 'Cardiology',
    reason: 'Routine Checkup',
    date: '2026-08-05',
    time: '09:00 AM',
    status: 'checked_in'
  },
  {
    id: 'apt-6',
    patientId: 'pat-5',
    patientName: 'Emily Stanton',
    patientPhone: '(555) 555-9988',
    patientAge: 33,
    doctorId: 'staff-5',
    doctorName: 'Dr. Patel',
    department: 'General',
    reason: 'Follow-up',
    date: '2026-08-05',
    time: '09:30 AM',
    status: 'waiting'
  },
  {
    id: 'apt-7',
    patientId: 'pat-6',
    patientName: 'Robert Fox',
    patientPhone: '(555) 999-1122',
    patientAge: 48,
    doctorId: 'staff-1',
    doctorName: 'Dr. Adams',
    department: 'Cardiology',
    reason: 'Lab Results',
    date: '2026-08-05',
    time: '10:15 AM',
    status: 'checked_in'
  },
  {
    id: 'apt-8',
    patientId: 'pat-1',
    patientName: 'Alice Johnson',
    patientPhone: '(555) 019-2837',
    patientAge: 78,
    doctorId: 'staff-1',
    doctorName: 'Dr. Smith',
    department: 'Pediatrics',
    reason: 'Vaccination',
    date: '2026-08-05',
    time: '08:15 AM',
    status: 'completed'
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-1',
    patientId: 'pat-1',
    patientName: 'Robert J. Oppenheimer',
    patientMrn: '9482-10A',
    patientDob: '04/22/1945',
    doctorId: 'staff-1',
    doctorName: 'Dr. Sarah Jenkins',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
    date: 'Oct 15, 2023 - Present',
    diagnosis: 'Hypertension (I10)',
    medications: [
      {
        id: 'med-1',
        drugName: 'Lisinopril 20mg tab',
        route: 'Oral (PO)',
        frequency: 'Once Daily (QD)',
        sig: 'Take 1 tablet by mouth daily for Hypertension.',
        quantity: 30,
        refills: 3
      }
    ],
    status: 'active'
  },
  {
    id: 'rx-2',
    patientId: 'pat-1',
    patientName: 'Robert J. Oppenheimer',
    patientMrn: '9482-10A',
    patientDob: '04/22/1945',
    doctorId: 'staff-5',
    doctorName: 'Dr. Michael Chen',
    doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80',
    date: 'Aug 10, 2023 - Present',
    diagnosis: 'Type 2 Diabetes (E11.9)',
    medications: [
      {
        id: 'med-2',
        drugName: 'Metformin 500mg tab',
        route: 'Oral (PO)',
        frequency: 'Twice Daily (BID)',
        sig: 'Take 1 tablet with meals twice daily for Type 2 Diabetes.',
        quantity: 60,
        refills: 2
      }
    ],
    status: 'active'
  },
  {
    id: 'rx-3',
    patientId: 'pat-1',
    patientName: 'Robert J. Oppenheimer',
    patientMrn: '9482-10A',
    patientDob: '04/22/1945',
    doctorId: 'staff-1',
    doctorName: 'Dr. Sarah Jenkins',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
    date: 'Jan 12, 2022 - Oct 14, 2023',
    diagnosis: 'Hypertension',
    medications: [
      {
        id: 'med-3',
        drugName: 'Amlodipine 5mg tab',
        route: 'Oral (PO)',
        frequency: 'Once Daily (QD)',
        sig: 'Take 1 tablet daily.',
        quantity: 30,
        refills: 0
      }
    ],
    status: 'discontinued',
    discontinuedReason: 'Discontinued. Patient reported persistent ankle edema.'
  },
  {
    id: 'rx-4',
    patientId: 'pat-3',
    patientName: 'Jane Doe',
    patientMrn: 'MRN-847291',
    patientDob: '12/05/1985',
    doctorId: 'staff-1',
    doctorName: 'Dr. Sarah Jenkins',
    date: 'Today',
    diagnosis: 'Acute Bronchitis (J20.9)',
    medications: [
      {
        id: 'med-4',
        drugName: 'Azithromycin 250mg tab',
        route: 'Oral (PO)',
        frequency: 'Once Daily (QD)',
        sig: 'Take 2 tablets on day 1, then 1 tablet daily for 4 days.',
        quantity: 6,
        refills: 0
      }
    ],
    status: 'active'
  }
];

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
