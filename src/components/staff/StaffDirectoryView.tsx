import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffMember, UserRole } from '../../types';
import { formatPhoneNumber } from '../../utils/phoneFormatter';
import { StaffRoleIcon } from './StaffRoleIcon';

export const StaffDirectoryView: React.FC = () => {
  const { staff, updateStaffMember, deleteStaffMember, setActiveView } = useApp();
  const [filter, setFilter] = useState('');

  // Modals state
  const [viewingMember, setViewingMember] = useState<StaffMember | null>(null);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null);

  // Form state for editing
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('doctor');
  const [editDepartment, setEditDepartment] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  const openEditModal = (member: StaffMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditPhone(member.phone ? formatPhoneNumber(member.phone) : '');
    setEditRole(member.role);
    setEditDepartment(member.department);
    setEditStatus(member.status);
    setViewingMember(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    updateStaffMember(editingMember.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      role: editRole,
      department: editDepartment,
      status: editStatus
    });

    setEditingMember(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingMember || deletingMember.role === 'super_admin') return;
    deleteStaffMember(deletingMember.id);
    setDeletingMember(null);
    setViewingMember(null);
  };

  const filteredStaff = staff.filter(
    s =>
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.department.toLowerCase().includes(filter.toLowerCase()) ||
      s.role.toLowerCase().includes(filter.toLowerCase()) ||
      (s.phone && s.phone.includes(filter))
  );

  const doctorsCount = staff.filter(s => s.role === 'doctor').length;
  const assistantsCount = staff.filter(s => s.role === 'assistant').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-slate-800">Staff Management Directory</h2>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[10px] rounded uppercase">
              Super Admin Authorization
            </span>
          </div>
          <p className="font-body-lg text-xs md:text-sm text-slate-500 mt-1">
            View, edit, or delete doctors and clinical assistants, and register new personnel.
          </p>
        </div>
        <button
          onClick={() => setActiveView('register_staff')}
          className="bg-emerald-600 text-white font-title-md text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm active:scale-98"
        >
          <span className="material-symbols-outlined text-sm icon-fill">person_add</span>
          Add New Staff Member
        </button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2.5 rounded-xl icon-fill text-xl">
              stethoscope
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-label-md text-[11px] font-bold px-2.5 py-1 rounded-full">
              Registered Doctors
            </span>
          </div>
          <div>
            <p className="font-body-md text-xs text-slate-500">Active Doctors</p>
            <p className="font-display-lg text-3xl font-bold text-slate-800 mt-1">{doctorsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2.5 rounded-xl icon-fill text-xl">
              vaccines
            </span>
            <span className="bg-blue-100 text-blue-800 font-label-md text-[11px] font-bold px-2.5 py-1 rounded-full">
              Clinical Support
            </span>
          </div>
          <div>
            <p className="font-body-md text-xs text-slate-500">Clinical Assistants</p>
            <p className="font-display-lg text-3xl font-bold text-slate-800 mt-1">{assistantsCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-2.5 rounded-xl icon-fill text-xl">
              shield_person
            </span>
            <span className="bg-purple-100 text-purple-900 font-label-md text-[11px] font-bold px-2.5 py-1 rounded-full">
              Total Roster
            </span>
          </div>
          <div className="relative z-10">
            <p className="font-body-md text-xs text-slate-500">Total Personnel</p>
            <p className="font-display-lg text-3xl font-bold text-slate-800 mt-1">{staff.length}</p>
          </div>
        </div>
      </div>

      {/* Staff Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
          <div>
            <h3 className="font-title-md font-bold text-sm text-slate-800">Personnel Roster ({filteredStaff.length})</h3>
            <p className="text-[11px] text-slate-500">Super Admin commands to View, Edit, or Delete staff records</p>
          </div>
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search staff by name, role, phone..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Phone Number</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-xs text-slate-700 divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No staff records match your search filter.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(member => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <StaffRoleIcon role={member.role} />
                        <div>
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-[11px] text-slate-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          member.role === 'doctor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : member.role === 'assistant'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {member.role === 'doctor' ? '👨‍⚕️ Doctor' : member.role === 'assistant' ? '🩺 Assistant' : '⚡ Super Admin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">{member.department}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">{member.phone || '0300-0000000'}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          member.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingMember(member)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded border border-slate-200 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          View
                        </button>

                        <button
                          onClick={() => openEditModal(member)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded border border-emerald-200 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Edit
                        </button>

                        <button
                          onClick={() => member.role !== 'super_admin' && setDeletingMember(member)}
                          disabled={member.role === 'super_admin'}
                          title={member.role === 'super_admin' ? 'Super Admin accounts cannot be deleted' : 'Delete account'}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded border border-rose-200 transition-colors flex items-center gap-1 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          {member.role === 'super_admin' ? 'Protected' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. VIEW MEMBER MODAL */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">badge</span>
                <h3 className="font-bold text-slate-800 text-base">Personnel Profile View</h3>
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <StaffRoleIcon role={viewingMember.role} size="lg" className="shadow-xs" />
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{viewingMember.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded uppercase">
                    {viewingMember.role}
                  </span>
                  <span className={`px-2 py-0.5 font-bold text-[10px] rounded uppercase ${
                    viewingMember.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {viewingMember.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-xs border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">System ID:</span>
                <span className="font-mono text-slate-800 font-bold">{viewingMember.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-800">{viewingMember.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-semibold text-slate-800">{viewingMember.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-mono text-emerald-800 font-bold">{viewingMember.phone || '0300-0000000'}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => openEditModal(viewingMember)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Profile
              </button>
              <button
                onClick={() => setViewingMember(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">edit_square</span>
                <h3 className="font-bold text-slate-800 text-base">Edit Personnel Details</h3>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="assistant">Assistant</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={e => setEditDepartment(e.target.value)}
                    required
                    placeholder="e.g. Cardiology"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(formatPhoneNumber(e.target.value))}
                    placeholder="0333-7645673"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE MEMBER CONFIRMATION MODAL */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4 text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Staff Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{deletingMember.name}</strong> ({deletingMember.role})? This operation will remove their access privileges.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded transition-colors shadow-xs"
              >
                Yes, Delete Personnel
              </button>
              <button
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
