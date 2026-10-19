import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const RegisterStaffView: React.FC = () => {
  const { addStaffMember, setActiveView } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('doctor');
  const [department, setDepartment] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!fullName.trim() || !email.trim() || !department.trim() || tempPassword.length < 8) {
      setError('Enter a name, email, department, and a password of at least 8 characters.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {

    const result = await addStaffMember({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: department.trim(),
      password: tempPassword
    });

    if (!result.success) { setError(result.error || 'Unable to register account.'); return; }
    setIsSubmitted(true);
    setTimeout(() => {
      setActiveView('staff');
    }, 1200);
    } catch {
      setError('Unable to register account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 font-body-md text-xs text-on-surface-variant">
          <li>
            <button
              onClick={() => setActiveView('staff')}
              className="hover:text-primary transition-colors hover:underline"
            >
              Staff Management
            </button>
          </li>
          <li>
            <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
          </li>
          <li aria-current="page" className="font-semibold text-on-surface">
            Add New Staff Member
          </li>
        </ol>
      </nav>

      {/* Registration Form Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-clinical overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface-container-low flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h1 className="font-headline-lg text-xl md:text-2xl font-bold text-on-surface">Register Staff Member</h1>
            <p className="font-body-md text-xs text-on-surface-variant mt-1">
              Provision credentials for a new Doctor or Clinical Assistant.
            </p>
          </div>
          <span className="px-3 py-1 bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs rounded-full flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-sm">shield_person</span>
            Super Admin Access Only
          </span>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-2xl icon-fill">check_circle</span>
            </div>
            <h3 className="font-bold text-base text-on-surface">Staff Member Registered!</h3>
            <p className="text-xs text-on-surface-variant">Redirecting back to staff directory...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">{error}</div>}
            {/* Full Name */}
            <div>
              <label className="block font-semibold text-on-surface mb-1.5" htmlFor="fullName">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Dr. Jane Doe"
                required
                className="w-full font-body-md text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all py-2.5 px-4 text-on-surface placeholder:text-outline"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold text-on-surface mb-1.5" htmlFor="email">
                Email Address <span className="text-error">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane.doe@medflow.clinic"
                required
                className="w-full font-body-md text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all py-2.5 px-4 text-on-surface placeholder:text-outline"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Selection */}
              <div>
                <label className="block font-semibold text-on-surface mb-1.5" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  required
                  className="w-full font-body-md text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all py-2.5 px-4 text-on-surface"
                >
                  <option value="doctor">Doctor / Specialist</option>
                  <option value="assistant">Clinical Assistant</option>
                </select>
              </div>

              {/* Department / Specialty */}
              <div>
                <label className="block font-semibold text-on-surface mb-1.5" htmlFor="department">
                  Department / Specialty <span className="text-error">*</span>
                </label>
                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Cardiology, Pediatrics"
                  required
                  className="w-full font-body-md text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all py-2.5 px-4 text-on-surface placeholder:text-outline"
                />
              </div>
            </div>

            {/* Temporary Password */}
            <div>
              <label className="block font-semibold text-on-surface mb-1.5" htmlFor="tempPassword">
                Temporary Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="tempPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={tempPassword}
                  onChange={e => setTempPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full font-body-md text-xs bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all py-2.5 px-4 pr-10 text-on-surface placeholder:text-outline"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-base">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              <p className="font-label-md text-[11px] text-on-surface-variant mt-1 font-normal">
                Must be at least 8 characters long with numbers/symbols.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-outline-variant flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setActiveView('staff')}
                className="font-semibold px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="font-semibold px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-surface-tint transition-all shadow-sm active:scale-98"
              >
                {isSubmitting ? 'Registering?' : 'Register Staff Member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
