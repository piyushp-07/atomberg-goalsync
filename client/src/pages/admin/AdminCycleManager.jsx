import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, Target, Calendar, Lock, Unlock, FileText, CheckCircle2, AlertTriangle, Download, ArrowRight, RefreshCw, Clock } from 'lucide-react';

const AdminCycleManager = () => {
  const [activeCycle, setActiveCycle] = useState('Goal Setting');
  const [cycleLoading, setCycleLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Unlock modal states
  const [selectedUserToUnlock, setSelectedUserToUnlock] = useState(null);
  const [unlockReason, setUnlockReason] = useState('');

  useEffect(() => {
    fetchCycle();
    fetchData();
  }, []);

  const fetchCycle = async () => {
    try {
      const { data } = await api.get('/api/cycles');
      setActiveCycle(data.activeCycle);
      setCycleLoading(false);
    } catch (err) {
      console.error(err);
      setCycleLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [usersRes, goalsRes, logsRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/goals'), // Admin retrieves all system goals
        api.get('/api/admin/audit-logs')
      ]);
      setUsers(usersRes.data.filter(u => u.role === 'Employee'));
      setGoals(goalsRes.data);
      setAuditLogs(logsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data.');
      setLoading(false);
    }
  };

  const handleCycleChange = async (newCycle) => {
    setError('');
    setSuccess('');
    try {
      await api.put('/api/cycles', { activeCycle: newCycle });
      setActiveCycle(newCycle);
      setSuccess(`Organizational phase shifted to ${newCycle} successfully!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update cycle');
    }
  };

  const handleUnlockSheet = async (e) => {
    e.preventDefault();
    if (!unlockReason.trim() || !selectedUserToUnlock) return;
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/api/admin/unlock-sheet', {
        employeeId: selectedUserToUnlock._id,
        reason: unlockReason
      });
      setSuccess(response.data.message);
      setSelectedUserToUnlock(null);
      setUnlockReason('');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unlock failed');
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      // Header
      csvContent += "Employee Name,Employee ID,Department,Goal Title,Goal Type,Target Value,UoM,Weightage,Achieved Status,Actual Achievement,Score\n";

      goals.forEach(g => {
        const name = g.ownerId?.name || 'Unassigned';
        const empId = g.ownerId?.employeeId || 'N/A';
        const dept = g.ownerId?.department || 'Operations';
        const title = `"${g.title.replace(/"/g, '""')}"`;
        const type = g.type || 'Min';
        const target = g.target || 0;
        const uom = g.uom || '';
        const weight = g.weightage || 0;
        const status = g.status || 'Draft';
        const isAch = g.isAchieved ? 'Yes' : 'No';

        csvContent += `${name},${empId},${dept},${title},${type},${target},${uom},${weight}%,${status},${isAch}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `goalsync_organizational_report_${activeCycle.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to generate CSV export');
    }
  };

  if (loading || cycleLoading) return <div className="text-[#FFC20E] font-semibold p-10">Loading HR cycle governance panel...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 dark:from-zinc-900 dark:to-zinc-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#FFC20E] text-xs font-bold uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full w-max mb-3 border border-amber-500/20">
              <Shield className="h-3.5 w-3.5" />
              <span>HR Admin Center</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Governance & Cycle Management</h2>
            <p className="text-zinc-300 mt-1 max-w-xl text-sm">Shift organizational goal phases, manually unlock approved goal sheets, audit trail modifications, and export reports.</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center px-5 py-3 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-950 rounded-2xl transition-all shadow-lg font-black text-xs uppercase tracking-wider"
          >
            <Download className="mr-2 h-4 w-4" /> Export Report (CSV)
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
            <p className="ml-3 text-red-800 dark:text-red-450 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Cycle Toggle */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6 h-max">
          <div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
              <Calendar className="h-5 w-5 text-[#FFC20E] mr-2" />
              Cycle Control Board
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Shift active organizational phase. Shifting will update user workspaces dynamically.</p>
          </div>

          <div className="space-y-3 pt-2">
            {['Goal Setting', 'Q1', 'Q2', 'Q3', 'Q4'].map((cycleOpt) => {
              const isCurrent = activeCycle === cycleOpt;
              return (
                <button
                  key={cycleOpt}
                  onClick={() => handleCycleChange(cycleOpt)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
                    isCurrent 
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-900/30 text-amber-800 dark:text-[#FFC20E] shadow-sm shadow-amber-500/5' 
                      : 'bg-zinc-50/50 dark:bg-zinc-950 border-zinc-350 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-400'
                  }`}
                >
                  <span className="flex items-center">
                    <Clock className={`h-4.5 w-4.5 mr-2.5 ${isCurrent ? 'text-[#FFC20E] animate-spin-slow' : 'text-zinc-400'}`} />
                    {cycleOpt} Phase
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-[#FFC20E] bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Manual Unlock Console */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
              <Unlock className="h-5 w-5 text-[#FFC20E] mr-2" />
              Goal Sheet Lock Overrides
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Unlock employee Goal Sheets (status Approved/Locked) to revert them to Draft for edits.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-600 dark:text-zinc-305">
              <thead className="text-[10px] uppercase text-zinc-450 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Approved Goals</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {users.map(emp => {
                  const empGoals = goals.filter(g => g.ownerId && g.ownerId._id === emp._id);
                  const approvedCount = empGoals.filter(g => g.status === 'Approved' || g.status === 'Locked').length;

                  return (
                    <tr key={emp._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-800 dark:text-zinc-200 flex items-center space-x-2.5">
                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-350 flex items-center justify-center font-bold text-[10px] border border-zinc-200 dark:border-zinc-800">
                          {emp.name[0]}
                        </div>
                        <span>{emp.name} ({emp.employeeId})</span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{emp.department}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${approvedCount > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-[#FFC20E] border-amber-250 dark:border-amber-900/30' : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800'}`}>
                          {approvedCount} Locked
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          disabled={approvedCount === 0}
                          onClick={() => setSelectedUserToUnlock(emp)}
                          className="px-3.5 py-1.5 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-slate-950 font-bold rounded-xl text-[10px] uppercase tracking-wider"
                        >
                          Unlock Sheet
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Real-time Audit Trail Ledger */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
            <Clock className="h-5 w-5 text-[#FFC20E] mr-2" />
            Override Audit Trail Ledger
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">A complete immutable record of all HR manual lock overrides and target modifications.</p>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs italic border border-dashed border-zinc-250 dark:border-zinc-800 rounded-2xl">
            No audit logs registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-650 dark:text-zinc-305">
              <thead className="text-[10px] uppercase text-zinc-450 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Objective Title</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Changed Field</th>
                  <th className="py-3 px-4 text-center">Previous Value</th>
                  <th className="py-3 px-4 text-center">New Value</th>
                  <th className="py-3 px-4">Changed By</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {auditLogs.map(log => {
                  const empName = log.goalId?.ownerId?.name || 'System';
                  const empDept = log.goalId?.ownerId?.department || 'Operations';
                  const titleStr = log.goalId?.title || 'Goal Decoupled';

                  return (
                    <tr key={log._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-zinc-450 dark:text-zinc-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-800 dark:text-zinc-200 max-w-[150px] truncate" title={titleStr}>
                        {titleStr}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">
                        {empName} ({empDept})
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-[#FFC20E]">{log.fieldChanged}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-zinc-500 dark:text-zinc-400">{String(log.oldValue)}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-650 dark:text-emerald-450">{String(log.newValue)}</td>
                      <td className="py-3.5 px-4 font-bold text-zinc-750 dark:text-zinc-300">
                        {log.changedBy?.name || 'HR Admin'}
                      </td>
                      <td className="py-3.5 px-4 italic text-zinc-550 dark:text-zinc-400 max-w-[200px] truncate" title={log.reason}>
                        "{log.reason}"
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Override Unlock Modal */}
      {selectedUserToUnlock && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <form onSubmit={handleUnlockSheet} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-350 dark:border-zinc-800 max-w-md w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Unlock Employee Goal Sheet</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Unlocking goal sheets for <strong>{selectedUserToUnlock.name}</strong> will revert all their Approved or Locked goals back to <strong>Draft</strong>, allowing edits. This action is audited.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider mb-2">Override Unlock Reason</label>
                <textarea
                  required
                  placeholder="Provide details / reasons for locking override..."
                  value={unlockReason}
                  onChange={e => setUnlockReason(e.target.value)}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E]"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setSelectedUserToUnlock(null)}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-750 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  Confirm Lock Override
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminCycleManager;
