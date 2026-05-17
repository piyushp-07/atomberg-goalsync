import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { 
  Users, UserPlus, Edit2, Trash2, Building2, Shield, Search, Filter, 
  CheckCircle2, AlertTriangle, X, ShieldAlert, Award, UserCheck, Key
} from 'lucide-react';

const UserManagement = () => {
  const { darkMode } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Modal Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    password: '',
    role: 'Employee',
    department: 'Engineering',
    managerId: ''
  });

  // Delete warning state
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch corporate users directory.');
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      employeeId: '',
      password: '',
      role: 'Employee',
      department: 'Engineering',
      managerId: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      password: '', // blank by default during edit
      role: user.role,
      department: user.department || 'Engineering',
      managerId: user.managerId?._id || user.managerId || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        // Edit flow
        const payload = { ...form };
        if (!payload.password) delete payload.password; // Do not send blank password
        await api.put(`/api/admin/users/${editingUser._id}`, payload);
        setSuccess('User profile updated successfully!');
      } else {
        // Create flow
        if (!form.password) {
          setError('Password is required for new users.');
          return;
        }
        await api.post('/api/admin/users', form);
        setSuccess('New corporate user registered successfully!');
      }

      setIsModalOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/admin/users/${userToDelete._id}`);
      setSuccess(`User "${userToDelete.name}" and all associated goals have been successfully removed.`);
      setUserToDelete(null);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove user');
      setUserToDelete(null);
    }
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10">Loading corporate user directories...</div>;

  // Filter lists
  const managers = users.filter(u => u.role === 'Manager');
  const departments = ['Engineering', 'Product', 'Sales', 'Marketing', 'Customer Support', 'HR'];

  // Stats
  const totalHeadcount = users.length;
  const employeesCount = users.filter(u => u.role === 'Employee').length;
  const managersCount = users.filter(u => u.role === 'Manager').length;
  const adminsCount = users.filter(u => u.role === 'Admin').length;

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesDept = deptFilter === 'All' || u.department === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 dark:from-zinc-900 dark:to-zinc-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#FFC20E] text-xs font-bold uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full w-max mb-3">
              <Shield className="h-3.5 w-3.5" />
              <span>HR Control Deck</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Corporate Directory Management</h2>
            <p className="text-zinc-300 mt-1 max-w-xl text-sm">Register new employees, update role authorization scopes, structure departments, and configure reporting nodes.</p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-5 py-3 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-950 rounded-2xl transition-all shadow-lg font-black text-xs uppercase tracking-wider"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Add Corporate User
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl border-zinc-300 dark:border-emerald-900/30">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="ml-3 text-emerald-800 dark:text-emerald-450 text-sm font-semibold">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl border-zinc-300 dark:border-red-900/30">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="ml-3 text-red-850 dark:text-red-450 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Headcount Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-450">Corporate Headcount</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{totalHeadcount}</p>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <Users className="h-6 w-6 text-[#FFC20E]" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-450">Managers Active</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{managersCount}</p>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/10 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-450" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-450">Employees Registered</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{employeesCount}</p>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <Award className="h-6 w-6 text-[#FFC20E]" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-450">HR Administrators</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{adminsCount}</p>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <Shield className="h-6 w-6 text-[#FFC20E]" />
          </div>
        </div>

      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, employee ID, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm"
          />
        </div>

        <div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer font-medium"
            >
              <option value="All">All Roles</option>
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="Admin">HR Admin</option>
            </select>
          </div>
        </div>

        <div>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer font-medium"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-55 dark:bg-zinc-950 border-b border-zinc-300 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role Badge</th>
                <th className="px-6 py-4">Reporting Manager</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.map(user => {
                const isEmployee = user.role === 'Employee';
                const isManager = user.role === 'Manager';
                const isAdmin = user.role === 'Admin';

                // Find manager name
                let mgrName = 'None';
                if (user.managerId) {
                  const foundMgr = users.find(u => u._id === (user.managerId?._id || user.managerId));
                  if (foundMgr) mgrName = foundMgr.name;
                }

                return (
                  <tr key={user._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200">{user.employeeId}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-350 flex items-center justify-center font-bold text-[10px] border border-zinc-300 dark:border-zinc-855">
                          {user.name[0]}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-medium">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-850">
                        {user.department || 'Corporate'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isAdmin ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-250 dark:border-amber-900/30' :
                        isManager ? 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30' :
                        'bg-blue-50 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400 border border-blue-250 dark:border-blue-900/30'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isEmployee || isManager ? (
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{mgrName}</span>
                      ) : (
                        <span className="text-zinc-400 italic">Global Authority</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 border border-zinc-300 dark:border-zinc-800 hover:border-amber-300 text-zinc-400 hover:text-[#FFC20E] rounded-xl bg-white dark:bg-zinc-900 transition-colors shadow-sm"
                          title="Edit User Parameters"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-1.5 border border-zinc-300 dark:border-zinc-800 hover:border-red-300 text-zinc-400 hover:text-red-500 rounded-xl bg-white dark:bg-zinc-900 transition-colors shadow-sm"
                          title="Remove User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-zinc-400 dark:text-zinc-500 italic">
                    No matching headcount found in corporate directories.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleFormSubmit}
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-lg w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
              {editingUser ? 'Update User Profile' : 'Register Corporate User'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              {editingUser 
                ? `Modify account settings and authorizations for ${editingUser.name}.`
                : 'Create a new employee profile. Password will be hashed securely.'
              }
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E17"
                    disabled={!!editingUser}
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex@goalsync.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3.5 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">
                  {editingUser ? 'Reset Password (Optional)' : 'Password'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to preserve password' : 'At least 4 characters...'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Role Authorization</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">HR Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.role !== 'Admin' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Reporting Node Manager</label>
                  <select
                    value={form.managerId}
                    onChange={e => setForm({ ...form, managerId: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer"
                  >
                    <option value="">None / Self Managed</option>
                    {managers.map(mgr => (
                      <option key={mgr._id} value={mgr._id}>{mgr.name} ({mgr.department})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  {editingUser ? 'Save Updates' : 'Confirm Registration'}
                </button>
              </div>

            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION OVERLAY */}
      {userToDelete && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-md w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-750 dark:text-red-400 p-4 rounded-2xl mb-6 flex items-start space-x-3">
              <ShieldAlert className="h-6 w-6 shrink-0 text-red-650 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wide">Destructive Override Actions</h4>
                <p className="text-xs mt-1 leading-relaxed">
                  Removing employee <strong>{userToDelete.name}</strong> ({userToDelete.employeeId}) will delete all their current goal drafts, verified goals, and quarterly check-ins ledger instantly. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-750 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-lg"
              >
                Permanently Delete User
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
