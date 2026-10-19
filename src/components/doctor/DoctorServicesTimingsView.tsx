import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorService, DoctorTiming } from '../../types';
import { formatPhoneNumber } from '../../utils/phoneFormatter';

export const DoctorServicesTimingsView: React.FC = () => {
  const {
    currentUser,
    staff,
    doctorServices,
    doctorTimings,
    addDoctorService,
    updateDoctorService,
    deleteDoctorService,
    updateDoctorTimings,
    updateUserProfile
  } = useApp();

  // If Super Admin, allow selecting which doctor to manage
  const doctorsList = staff.filter(s => s.role === 'doctor');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    currentUser?.role === 'super_admin' ? doctorsList[0]?.id || '' : currentUser?.id || ''
  );

  const activeDoctorId = currentUser?.role === 'super_admin' ? (doctorsList.find(doctor => doctor.id === selectedDoctorId)?.id || doctorsList[0]?.id || '') : (currentUser?.id || '');
  const activeDoctor = staff.find(s => s.id === activeDoctorId) || {
    name: currentUser?.role === 'doctor' ? currentUser.name : 'No doctor selected',
    email: currentUser?.role === 'doctor' ? currentUser.email : '',
    department: currentUser?.role === 'doctor' ? currentUser.department : '',
    phone: currentUser?.role === 'doctor' ? currentUser.phone : ''
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<'services' | 'timings' | 'profile'>('services');

  // Profile Form state
  const [profName, setProfName] = useState(currentUser?.name || '');
  const [profEmail, setProfEmail] = useState(currentUser?.email || '');
  const [profPhone, setProfPhone] = useState(currentUser?.role === 'doctor' ? currentUser.phone : '');
  const [profDept, setProfDept] = useState(currentUser?.role === 'doctor' ? currentUser.department : '');
  const [profBio, setProfBio] = useState(currentUser?.bio || 'Consultant Specialist focusing on pediatric and general wellness care.');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // New Service Modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvName, setSrvName] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState<number>(100);
  const [srvDuration, setSrvDuration] = useState<number>(30);

  // Timings State
  const defaultDays: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const currentDoctorTimings = doctorTimings.filter(t => t.doctorId === activeDoctorId);
  
  const [timingsState, setTimingsState] = useState<DoctorTiming[]>(() => {
    if (currentDoctorTimings.length > 0) return currentDoctorTimings;
    return defaultDays.map((day, idx) => ({
      id: `tm-${idx}`,
      doctorId: activeDoctorId,
      day,
      isAvailable: idx < 5,
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      slotDurationMinutes: 30
    }));
  });

  const [timingsSavedNotice, setTimingsSavedNotice] = useState(false);

  // Services for active doctor
  const myServices = doctorServices.filter(s => s.doctorId === activeDoctorId);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: profName,
      email: profEmail,
      phone: profPhone,
      department: profDept,
      bio: profBio
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleOpenNewService = () => {
    setEditingServiceId(null);
    setSrvName('');
    setSrvDesc('');
    setSrvPrice(100);
    setSrvDuration(30);
    setShowServiceModal(true);
  };

  const handleOpenEditService = (srv: DoctorService) => {
    setEditingServiceId(srv.id);
    setSrvName(srv.name);
    setSrvDesc(srv.description);
    setSrvPrice(srv.price);
    setSrvDuration(srv.durationMinutes);
    setShowServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvName.trim()) return;

    if (editingServiceId) {
      updateDoctorService(editingServiceId, {
        name: srvName,
        description: srvDesc,
        price: srvPrice,
        durationMinutes: srvDuration
      });
    } else {
      addDoctorService({
        doctorId: activeDoctorId,
        name: srvName,
        description: srvDesc,
        price: srvPrice,
        durationMinutes: srvDuration
      });
    }
    setShowServiceModal(false);
  };

  const handleTimingToggle = (dayIndex: number) => {
    setTimingsState(prev =>
      prev.map((t, idx) => (idx === dayIndex ? { ...t, isAvailable: !t.isAvailable } : t))
    );
  };

  const handleTimingChange = (dayIndex: number, field: keyof DoctorTiming, value: any) => {
    setTimingsState(prev =>
      prev.map((t, idx) => (idx === dayIndex ? { ...t, [field]: value } : t))
    );
  };

  const handleSaveTimings = () => {
    updateDoctorTimings(activeDoctorId, timingsState);
    setTimingsSavedNotice(true);
    setTimeout(() => setTimingsSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
              Doctor Management Portal
            </span>
            {currentUser?.role === 'super_admin' && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded uppercase">
                Super Admin Override
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">
            Doctor Profile, Services & Schedules
          </h2>
          <p className="text-xs text-slate-500">
            Manage personal credentials, clinical services & pricing, and weekly consultation availability.
          </p>
        </div>

        {currentUser?.role === 'super_admin' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Select Doctor:</label>
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {doctorsList.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.department})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm flex gap-1">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-2 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'services'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-base">medical_services</span>
          Services & Consultation Fees ({myServices.length})
        </button>

        <button
          onClick={() => setActiveTab('timings')}
          className={`flex-1 py-2 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'timings'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-base">schedule</span>
          Weekly Working Hours & Timings
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-base">account_box</span>
          Personal Profile & Bio
        </button>
      </div>

      {/* TAB 1: Services & Fees */}
      {activeTab === 'services' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Clinical Services Offered
              </h3>
              <p className="text-[11px] text-slate-500">
                Services and standard fee schedule configured for {activeDoctor.name}.
              </p>
            </div>
            <button
              onClick={handleOpenNewService}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add New Service
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myServices.map(srv => (
              <div
                key={srv.id}
                className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm">{srv.name}</h4>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold text-xs rounded">
                      ${srv.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{srv.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    ⏱ Duration: {srv.durationMinutes} mins
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditService(srv)}
                      className="text-emerald-700 hover:underline font-semibold text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteDoctorService(srv.id)}
                      className="text-rose-600 hover:underline font-semibold text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {myServices.length === 0 && (
              <div className="col-span-2 py-8 text-center text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                No custom services created yet. Click "Add New Service" to list your consultation services.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Timings & Schedule */}
      {activeTab === 'timings' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Weekly Consultation Schedule & Slot Duration
              </h3>
              <p className="text-[11px] text-slate-500">
                Configure your operating days, opening/closing hours, and appointment durations.
              </p>
            </div>
            <button
              onClick={handleSaveTimings}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Save Timings
            </button>
          </div>

          {timingsSavedNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Schedule successfully updated and saved to system!
            </div>
          )}

          <div className="space-y-2">
            {timingsState.map((tm, idx) => (
              <div
                key={tm.day}
                className={`p-3 border rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  tm.isAvailable ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 w-32">
                  <input
                    type="checkbox"
                    checked={tm.isAvailable}
                    onChange={() => handleTimingToggle(idx)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-xs text-slate-800">{tm.day}</span>
                </div>

                {tm.isAvailable ? (
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-medium text-[11px]">Start:</span>
                      <input
                        type="text"
                        value={tm.startTime}
                        onChange={e => handleTimingChange(idx, 'startTime', e.target.value)}
                        className="w-24 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-medium text-[11px]">End:</span>
                      <input
                        type="text"
                        value={tm.endTime}
                        onChange={e => handleTimingChange(idx, 'endTime', e.target.value)}
                        className="w-24 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-medium text-[11px]">Slot:</span>
                      <select
                        value={tm.slotDurationMinutes}
                        onChange={e => handleTimingChange(idx, 'slotDurationMinutes', parseInt(e.target.value))}
                        className="px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value={15}>15 mins</option>
                        <option value={20}>20 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold italic">Off / Closed Day</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Personal Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Doctor Credentials & Profile Information
            </h3>
            <p className="text-[11px] text-slate-500">
              Personal contact info displayed on patient receipts and consultation charts.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs max-w-xl">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name & Title</label>
              <input
                type="text"
                value={profName}
                onChange={e => setProfName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profEmail}
                  onChange={e => setProfEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={profPhone}
                  onChange={e => setProfPhone(formatPhoneNumber(e.target.value))}
                  placeholder="0333-7645673"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department / Specialty</label>
              <input
                type="text"
                value={profDept}
                onChange={e => setProfDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Biography & Specializations</label>
              <textarea
                value={profBio}
                onChange={e => setProfBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-sm"
            >
              Update Credentials
            </button>
          </form>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden font-sans">
            <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                {editingServiceId ? 'Edit Clinical Service' : 'Add New Clinical Service'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveService} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Name</label>
                <input
                  type="text"
                  value={srvName}
                  onChange={e => setSrvName(e.target.value)}
                  placeholder="e.g., General Consultation, ECG Examination"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Description</label>
                <textarea
                  value={srvDesc}
                  onChange={e => setSrvDesc(e.target.value)}
                  placeholder="Brief details about the procedure or assessment..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={srvPrice}
                    onChange={e => setSrvPrice(parseFloat(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Est. Duration (mins)</label>
                  <input
                    type="number"
                    value={srvDuration}
                    onChange={e => setSrvDuration(parseInt(e.target.value) || 15)}
                    min={5}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-sm"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
