import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Target, CheckCircle2, AlertCircle, FileText, Search, Filter, ShieldCheck, HelpCircle, Plus, X, Users, Send, Sparkles } from 'lucide-react';

const AdminRegistry = () => {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering states
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Shared goal modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFormData, setShareFormData] = useState({
    title: '', description: '', thrustArea: '', uom: '',
    target: '', weightage: 10, type: 'Min', primaryOwnerId: '',
    recipientIds: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
    fetchUsers();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data } = await api.get('/api/goals');
      setGoals(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system goal registry');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data.filter(u => u.role === 'Employee'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    if (shareFormData.recipientIds.length === 0) {
      setError('Please select at least one recipient employee to propagate the shared goal.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...shareFormData,
        target: Number(shareFormData.target),
        weightage: Number(shareFormData.weightage)
      };

      await api.post('/api/goals/share', payload);
      setSuccessMsg('Successfully propagated Shared Departmental KPI across sheets!');
      setIsShareModalOpen(false);
      setShareFormData({
        title: '', description: '', thrustArea: '', uom: '',
        target: '', weightage: 10, type: 'Min', primaryOwnerId: '',
        recipientIds: []
      });
      fetchGoals();
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to propagate shared goal.');
      setIsSubmitting(false);
    }
  };

  const toggleRecipient = (id) => {
    const isSelected = shareFormData.recipientIds.includes(id);
    if (isSelected) {
      setShareFormData({
        ...shareFormData,
        recipientIds: shareFormData.recipientIds.filter(rid => rid !== id)
      });
    } else {
      setShareFormData({
        ...shareFormData,
        recipientIds: [...shareFormData.recipientIds, id]
      });
    }
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10 animate-pulse text-sm">Loading HR goal registry...</div>;

  // Filtered dataset
  const filteredGoals = goals.filter(goal => {
    const owner = goal.ownerId || {};
    const department = owner.department || 'Unassigned';
    const matchesDept = deptFilter === 'All' || department.toLowerCase() === deptFilter.toLowerCase();
    
    let matchesStatus = true;
    if (statusFilter === 'Achieved') {
      matchesStatus = goal.isAchieved;
    } else if (statusFilter === 'Submitted') {
      matchesStatus = goal.status === 'Submitted' && !goal.isAchieved;
    } else if (statusFilter === 'Active') {
      matchesStatus = goal.status === 'Approved' && !goal.isAchieved;
    }

    const matchesSearch = 
      owner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.title?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Target className="h-6 w-6 text-[#FFC20E]" />
            <span>HR System Goal Registry</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs mt-1">Corporate tracking portal to monitor achievements, verified performance ticks, and propagate shared KPIs.</p>
        </div>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all cursor-pointer shrink-0 w-max"
        >
          <Plus className="h-4 w-4" />
          <span>Propagate Shared KPI</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="ml-3 text-emerald-800 dark:text-emerald-400 text-sm font-semibold">{successMsg}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="ml-3 text-red-800 dark:text-red-400 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Control center: Filters and Search */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by employee, ID, or target title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-semibold"
          />
        </div>

        <div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-bold cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Customer Support">Customer Support</option>
            </select>
          </div>
        </div>

        <div>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-850 dark:text-zinc-100 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-bold cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Achieved">Achieved & Ticked</option>
              <option value="Submitted">Submitted (Review)</option>
              <option value="Active">Active Targets</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-550 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-black">Employee ID</th>
                <th className="px-6 py-4 font-black">Employee Name</th>
                <th className="px-6 py-4 font-black">Department</th>
                <th className="px-6 py-4 font-black">Assigned Target</th>
                <th className="px-6 py-4 font-black">Metric / Weight</th>
                <th className="px-6 py-4 font-black">Linked Type</th>
                <th className="px-6 py-4 text-right font-black">Tick Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredGoals.map(goal => (
                <tr key={goal._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200">{goal.ownerId?.employeeId || 'System'}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{goal.ownerId?.name}</div>
                    <div className="text-xs text-zinc-450 dark:text-zinc-550 mt-0.5">{goal.ownerId?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-850">
                      {goal.ownerId?.department || 'Operations'}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-semibold text-zinc-850 dark:text-zinc-100 truncate" title={goal.title}>{goal.title}</div>
                    <div className="text-xs text-zinc-450 dark:text-zinc-500 truncate mt-0.5">{goal.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-850 dark:text-zinc-200">{goal.target} {goal.uom}</div>
                    <div className="text-xs text-amber-600 dark:text-[#FFC20E] font-bold mt-0.5">Weight: {goal.weightage}%</div>
                  </td>
                  <td className="px-6 py-4">
                    {goal.isShared ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-[#FFC20E] border border-amber-500/20">
                        {goal.sharedFromId ? '🔗 Synced Recipient' : '👑 Primary Master'}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-550 italic">Individual Goal</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {goal.isAchieved ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-955/10 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30 shadow-sm">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 mr-1.5" /> Achieved
                      </span>
                    ) : goal.status === 'Submitted' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-955/15 text-amber-705 dark:text-amber-450 border border-amber-250 dark:border-amber-900/30">
                        <HelpCircle className="h-4.5 w-4.5 text-amber-600 mr-1.5" /> Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-955/15 text-blue-700 dark:text-blue-405 border border-blue-250 dark:border-blue-900/30">
                        Active Target
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredGoals.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-zinc-400 dark:text-zinc-550 italic">
                    No matching performance goals found in the corporate register.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Propagate Shared KPI Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30 text-[#FFC20E]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Propagate Shared Departmental KPI</span>
                  <Sparkles className="h-4.5 w-4.5 text-[#FFC20E]" />
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Define a corporate goal target and push it simultaneously into multiple employees' sheets.</p>
              </div>
            </div>

            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">KPI Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corporate Delivery Compliance Rate"
                    value={shareFormData.title}
                    onChange={e => setShareFormData({ ...shareFormData, title: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Thrust Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Compliance"
                    value={shareFormData.thrustArea}
                    onChange={e => setShareFormData({ ...shareFormData, thrustArea: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">KPI Description & Target Scope</label>
                <textarea
                  required
                  placeholder="Provide precise details, evaluation rules, and compliance checklist..."
                  value={shareFormData.description}
                  onChange={e => setShareFormData({ ...shareFormData, description: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-semibold"
                  rows="2"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Metric Type</label>
                  <select
                    value={shareFormData.type}
                    onChange={e => setShareFormData({ ...shareFormData, type: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-bold cursor-pointer"
                  >
                    <option value="Min">Min</option>
                    <option value="Max">Max</option>
                    <option value="Timeline">Timeline</option>
                    <option value="Zero-Based">Zero-Based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Target</label>
                  <input
                    type="number"
                    required
                    placeholder="95"
                    value={shareFormData.target}
                    onChange={e => setShareFormData({ ...shareFormData, target: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Measurement UoM</label>
                  <input
                    type="text"
                    required
                    placeholder="%"
                    value={shareFormData.uom}
                    onChange={e => setShareFormData({ ...shareFormData, uom: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Def. Weight (%)</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="100"
                    placeholder="20"
                    value={shareFormData.weightage}
                    onChange={e => setShareFormData({ ...shareFormData, weightage: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Stakeholders Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-[#FFC20E] uppercase tracking-wider mb-1.5">Select Primary Master Owner</label>
                  <p className="text-[10px] text-zinc-400 mb-2">The stakeholder whose actual check-in achievement updates will automatically sync to recipient sheets.</p>
                  <select
                    required
                    value={shareFormData.primaryOwnerId}
                    onChange={e => setShareFormData({ ...shareFormData, primaryOwnerId: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-bold cursor-pointer"
                  >
                    <option value="">Select Owner...</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.department})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Select Recipient Employees</label>
                  <p className="text-[10px] text-zinc-400 mb-2">Check the boxes of employees who should receive this linked goal in their draft sheets.</p>
                  
                  <div className="border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-950 max-h-40 overflow-y-auto space-y-2">
                    {users
                      .filter(u => u._id !== shareFormData.primaryOwnerId)
                      .map(u => (
                        <label key={u._id} className="flex items-center space-x-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={shareFormData.recipientIds.includes(u._id)}
                            onChange={() => toggleRecipient(u._id)}
                            className="rounded border-zinc-350 text-[#FFC20E] focus:ring-[#FFC20E]"
                          />
                          <span>{u.name} <span className="text-[10px] text-zinc-400 font-medium">({u.department})</span></span>
                        </label>
                      ))}
                    {users.filter(u => u._id !== shareFormData.primaryOwnerId).length === 0 && (
                      <span className="text-xs text-zinc-450 dark:text-zinc-500 italic">Please select primary owner first.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Propagating...' : 'Propagate KPI'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistry;
