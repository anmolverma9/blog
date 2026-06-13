'use client';

import React, { useState, useEffect } from 'react';
import { UserSession } from '@/lib/auth';
import {
  Users,
  ShieldAlert,
  History,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Key,
  Check,
  X,
  Plus,
  Loader2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface UsersClientProps {
  session: UserSession;
}

export default function UsersClient({ session }: UsersClientProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'logs'>('users');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<Record<number, string[]>>({});
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Active form entities
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState(6); // default Subscriber (ID 6)
  const [formStatus, setFormStatus] = useState('active');
  const [formPassword, setFormPassword] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formAvatarId, setFormAvatarId] = useState<number | null>(null);
  const [formAvatarPath, setFormAvatarPath] = useState<string | null>(null);

  // Alert State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch roles matrix
      const rolesRes = await fetch('/api/admin/users/roles');
      if (rolesRes.ok) {
        const { roles: rolesData, permissions: permsData, matrix: matrixData } = await rolesRes.json();
        setRoles(rolesData);
        setPermissions(permsData);
        setMatrix(matrixData);
      }

      // Fetch activity logs
      const logsRes = await fetch('/api/admin/users/activity-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setActivityLogs(logsData);
      }

      // Fetch media for avatar picker
      const mediaRes = await fetch('/api/admin/media');
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMedia(mediaData);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerAlert = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          name: formName,
          role_id: formRole,
          plainPassword: formPassword,
          status: formStatus,
          bio: formBio,
          avatar_id: formAvatarId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      triggerAlert('success', `User account ${formEmail} created successfully.`);
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          email: formEmail,
          name: formName,
          role_id: formRole,
          status: formStatus,
          bio: formBio,
          avatar_id: formAvatarId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      triggerAlert('success', 'User details updated successfully.');
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset User Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          plainPassword: formPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      triggerAlert('success', `Password for ${selectedUser.email} has been reset.`);
      setShowPasswordModal(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`Are you absolutely sure you want to delete user account "${email}"? This action cannot be undone.`)) {
      return;
    }
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      triggerAlert('success', `User account ${email} deleted.`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Update Matrix Cell local state
  const handleMatrixToggle = (roleId: number, permKey: string) => {
    if (roleId === 1) return; // Super admin permissions are immutable

    setMatrix(prev => {
      const currentPerms = prev[roleId] || [];
      const updated = currentPerms.includes(permKey)
        ? currentPerms.filter(k => k !== permKey)
        : [...currentPerms, permKey];
      return { ...prev, [roleId]: updated };
    });
  };

  // Save Permissions Matrix to API
  const saveMatrix = async (roleId: number) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/users/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          permissionKeys: matrix[roleId] || []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save permissions matrix');

      triggerAlert('success', 'Permissions matrix saved successfully.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Avatar Image Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', `Avatar image for ${formName || 'User'}`);

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Avatar upload failed');

      setFormAvatarId(data.media.id);
      setFormAvatarPath(data.media.file_path);
      triggerAlert('success', 'Avatar image uploaded successfully.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role_id);
    setFormStatus(user.status);
    setFormBio(user.bio || '');
    setFormAvatarId(user.avatar_id || null);
    setFormAvatarPath(user.avatar_path || null);
    setShowEditModal(true);
  };

  const openPasswordModal = (user: any) => {
    setSelectedUser(user);
    setFormPassword('');
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole(6);
    setFormStatus('active');
    setFormPassword('');
    setFormBio('');
    setFormAvatarId(null);
    setFormAvatarPath(null);
  };

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role_name && user.role_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper to format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to resolve last login for user from activity logs
  const getUserLastLogin = (userId: number) => {
    const loginLog = activityLogs.find(l => l.user_id === userId && l.action === 'login');
    return loginLog ? formatDate(loginLog.created_at) : 'Never';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Users & Role Management</h1>
          <p className="text-slate-500 text-sm">Configure WordPress-style roles, user permissions, and audit logs.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" /> Add New User
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold animate-in fade-in duration-200">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'users' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" /> Users List
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'roles' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="h-4 w-4" /> Roles & Permissions Grid
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'logs' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <History className="h-4 w-4" /> Security Logs
        </button>
      </div>

      {/* Main Tab Panels */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* TAB 1: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 border rounded-3xl shadow-sm">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name, email, or role..."
                    className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Grid / Table container */}
              <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-slate-800">
                    <thead>
                      <tr className="bg-slate-50 border-b text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        <th className="py-4 px-6">User</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Last Login</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-orange-100 border shrink-0 flex items-center justify-center font-bold text-orange-700 overflow-hidden shadow-inner">
                                  {user.avatar_path ? (
                                    <img src={user.avatar_path} alt={user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    user.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 leading-snug">{user.name}</h4>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">
                                {user.role_name}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                  user.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : user.status === 'suspended'
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {user.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-500 font-medium">
                              {getUserLastLogin(user.id)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(user)}
                                  title="Edit Profile"
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openPasswordModal(user)}
                                  title="Reset Password"
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                  <Key className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                  disabled={user.id === session.id}
                                  title="Delete User"
                                  className={`p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors ${
                                    user.id === session.id
                                      ? 'opacity-40 cursor-not-allowed'
                                      : 'hover:text-rose-600 cursor-pointer'
                                  }`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLES & PERMISSIONS GRID */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              {roles
                .filter(role => role.id !== 1) // hide Super Admin mapping as it is static
                .map((role) => (
                  <div key={role.id} className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-900">{role.name} Permissions</h3>
                        <p className="text-slate-500 text-xs mt-0.5">{role.description}</p>
                      </div>
                      <button
                        onClick={() => saveMatrix(role.id)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                        Save {role.name} Settings
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {permissions.map((perm) => {
                        const isChecked = (matrix[role.id] || []).includes(perm.permission_key);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-orange-50/20 border-orange-200 shadow-sm'
                                : 'bg-slate-50/35 hover:bg-slate-50 border-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleMatrixToggle(role.id, perm.permission_key)}
                              className="mt-1 rounded text-orange-500 focus:ring-orange-500/20 border-slate-300 h-4.5 w-4.5 cursor-pointer accent-orange-500"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">{perm.name}</p>
                              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{perm.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 3: SECURITY LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-slate-800">
                  <thead>
                    <tr className="bg-slate-50 border-b text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6">Action</th>
                      <th className="py-4 px-6">Details</th>
                      <th className="py-4 px-6">IP Address</th>
                      <th className="py-4 px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {log.user_name || log.user_email || 'System / Unknown'}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.action.includes('delete')
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : log.action.includes('create')
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-4 px-6 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-mono text-[10px]">
                            {log.ip_address || 'N/A'}
                          </td>
                          <td className="py-4 px-6 text-slate-400">
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          No audit logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-950">Add User Profile</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-4 items-center border-b pb-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-slate-100 border flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {formAvatarPath ? (
                    <img src={formAvatarPath} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Avatar Picture</span>
                  <div className="flex gap-2">
                    <label className="bg-slate-50 border hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                      <Upload className="h-3.5 w-3.5" /> Upload File
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(true)}
                      className="bg-slate-50 border hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Library
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Display Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. D. Scurlock"
                  className="w-full border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@mail.com"
                  className="w-full border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="********"
                  className="w-full border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">System Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(Number(e.target.value))}
                    className="w-full border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 bg-white"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Short Bio</label>
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Co-founder & Chief Editor of this site..."
                  rows={3}
                  className="w-full border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 resize-none"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-950">Edit User Details</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-4 items-center border-b pb-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-slate-100 border flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {formAvatarPath ? (
                    <img src={formAvatarPath} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Avatar Picture</span>
                  <div className="flex gap-2">
                    <label className="bg-slate-50 border hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                      <Upload className="h-3.5 w-3.5" /> Upload File
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(true)}
                      className="bg-slate-50 border hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Library
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Display Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. D. Scurlock"
                  className="w-full border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@mail.com"
                  className="w-full border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">System Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(Number(e.target.value))}
                    disabled={selectedUser?.id === session.id && selectedUser?.role_name === 'Super Admin'}
                    className="w-full border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 bg-white"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    disabled={selectedUser?.id === session.id}
                    className="w-full border rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Short Bio</label>
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Co-founder & Chief Editor of this site..."
                  rows={3}
                  className="w-full border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800 resize-none"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PASSWORD RESET MODAL --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-950">Reset User Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-slate-500 text-xs leading-normal">
                Setting a new password will invalidate any active sessions and force a logout on the user's side.
              </p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="minimum 8 characters..."
                  className="w-full border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-800"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MEDIA AVATAR PICKER MODAL --- */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl border overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-950">Select Avatar from Media Library</h2>
              <button onClick={() => setShowAvatarModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {media.length > 0 ? (
                media.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFormAvatarId(item.id);
                      setFormAvatarPath(item.file_path);
                      setShowAvatarModal(false);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 hover:border-orange-500 transition-all group shrink-0 ${
                      formAvatarId === item.id ? 'border-orange-500 scale-95 shadow-md' : 'border-slate-100'
                    }`}
                  >
                    <img src={item.file_path} alt={item.filename} className="w-full h-full object-cover" />
                    {formAvatarId === item.id && (
                      <div className="absolute inset-0 bg-orange-500/25 flex items-center justify-center">
                        <Check className="h-6 w-6 text-white stroke-[3px]" />
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-slate-400">
                  No images in Media library. Upload an avatar using the local file picker button instead.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 bg-slate-950 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
