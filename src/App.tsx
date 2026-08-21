import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './components/auth/LoginView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { DoctorDashboard } from './components/dashboard/DoctorDashboard';
import { AssistantDashboard } from './components/dashboard/AssistantDashboard';
import { PatientDirectory } from './components/patients/PatientDirectory';
import { PatientProfileView } from './components/patients/PatientProfileView';
import { PatientRegistrationView } from './components/patients/PatientRegistrationView';
import { AppointmentSchedulingView } from './components/appointments/AppointmentSchedulingView';
import { NewPrescriptionView } from './components/prescriptions/NewPrescriptionView';
import { StaffDirectoryView } from './components/staff/StaffDirectoryView';
import { RegisterStaffView } from './components/staff/RegisterStaffView';
import { SettingsView } from './components/settings/SettingsView';
import { DoctorServicesTimingsView } from './components/doctor/DoctorServicesTimingsView';

const AccessDeniedView: React.FC<{ requiredRole: string }> = ({ requiredRole }) => (
  <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-3 font-sans max-w-lg mx-auto my-12 shadow-sm">
    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
      <span className="material-symbols-outlined text-2xl">gavel</span>
    </div>
    <h3 className="text-base font-bold text-slate-800">Access Restricted</h3>
    <p className="text-xs text-slate-500 leading-relaxed">
      You do not have administrative privileges to view this section. This view requires <strong className="text-slate-800">{requiredRole}</strong> credentials.
    </p>
  </div>
);

const MainContent: React.FC = () => {
  const { currentUser, activeView } = useApp();

  if (activeView === 'forgot_password') {
    return <ForgotPasswordView />;
  }

  // Unauthenticated Views
  if (!currentUser) {
    return <LoginView />;
  }

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isDoctor = currentUser.role === 'doctor';
  const isAssistant = currentUser.role === 'assistant';

  // Authenticated Views wrapped in AppShell
  return (
    <AppShell>
      {activeView === 'dashboard' && (
        isDoctor ? <DoctorDashboard /> : <AssistantDashboard />
      )}
      {activeView === 'patients' && <PatientDirectory />}
      {activeView === 'patient_profile' && <PatientProfileView />}
      {activeView === 'patient_registration' && (isAssistant || isSuperAdmin ? <PatientRegistrationView /> : <AccessDeniedView requiredRole="Assistant" />)}
      {activeView === 'appointments' && <AppointmentSchedulingView />}
      {activeView === 'new_appointment' && (isAssistant || isSuperAdmin ? <AppointmentSchedulingView /> : <AccessDeniedView requiredRole="Assistant" />)}
      {activeView === 'prescriptions' && (isDoctor ? <NewPrescriptionView /> : <AccessDeniedView requiredRole="Doctor" />)}
      {activeView === 'new_prescription' && (isDoctor ? <NewPrescriptionView /> : <AccessDeniedView requiredRole="Doctor" />)}
      {activeView === 'doctor_services_timings' && <DoctorServicesTimingsView />}
      {activeView === 'staff' && (isSuperAdmin ? <StaffDirectoryView /> : <AccessDeniedView requiredRole="Super Admin" />)}
      {activeView === 'register_staff' && (isSuperAdmin ? <RegisterStaffView /> : <AccessDeniedView requiredRole="Super Admin" />)}
      {activeView === 'settings' && (isSuperAdmin ? <SettingsView /> : <AccessDeniedView requiredRole="Super Admin" />)}
    </AppShell>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
