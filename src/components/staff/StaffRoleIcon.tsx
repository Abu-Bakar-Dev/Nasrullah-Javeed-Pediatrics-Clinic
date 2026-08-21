import React from 'react';
import { UserRole } from '../../types';

interface StaffRoleIconProps {
  role?: UserRole;
  size?: 'sm' | 'lg';
  className?: string;
}

export const StaffRoleIcon: React.FC<StaffRoleIconProps> = ({ role, size = 'sm', className = '' }) => {
  const icon = role === 'doctor' ? 'medical_services' : role === 'assistant' ? 'face_6' : 'admin_panel_settings';
  const colors = role === 'doctor'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : role === 'assistant'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-purple-100 text-purple-700 border-purple-200';
  const dimensions = size === 'lg' ? 'w-16 h-16 text-3xl border-2' : 'w-9 h-9 text-xl border';

  return (
    <div aria-label={`${role || 'staff'} profile icon`} className={`${dimensions} ${colors} ${className} shrink-0 rounded-full flex items-center justify-center`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  );
};
