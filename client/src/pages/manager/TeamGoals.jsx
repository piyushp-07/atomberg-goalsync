import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Plus, Target, CheckCircle2, UserCheck, ShieldAlert, FileText, Calendar, Users, Lock, Award, ChevronDown, ChevronUp, Info, X, Tag, Edit3, Save, RefreshCw } from 'lucide-react';

const TeamGoals = () => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sheet approval state
  const [expandedSheetEmployeeId, setExpandedSheetEmployeeId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editFields, setEditFields] = useState({ target: '', weightage: '' });

  // Dropdown/Accordion states for departments in Objectives Directory
  const [openDepts, setOpenDepts] = useState({
    Engineering: true, Product: false, Sales: false, Marketing: false, 'Customer Support': false
  });

  // Dropdown/Accordion states for departments in Grouped Tracker
  const [openGroupedDepts, setOpenGroupedDepts] = useState({
    Engineering: true, Product: false, Sales: false, Marketing: false, 'Customer Support': false
  });

  // Modal details state
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form State
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', thrustArea: '', uom: '',
    target: '', weightage: 10, type: 'Min', deadline: '',
    assignType: 'team', // 'team' or 'individual'
    assignedTeam: 'Engineering',
    assignedTo: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const goalsRes = await api.get('/api/goals');
      const reportsRes = await api.get('/api/manager/reports');
      
      setGoals(goalsRes.data);
      setReports(reportsRes.data);
      
      const allowedDeps = Array.from(new Set(reportsRes.data.map(r => r.department)));
      
      setFormData(prev => ({
        ...prev,
        assignedTo: reportsRes.data[0]?._id || '',
        assignedTeam: allowedDeps[0] || 'Engineering'
      }));
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch team data');
      setLoading(false);
    }
  };

  const handleAssignGoal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        thrustArea: formData.thrustArea,
        uom: formData.uom,
        target: Number(formData.target),
        weightage: Number(formData.weightage),
        type: formData.type,
        deadline: formData.deadline
      };

      if (formData.assignType === 'team') {
        payload.assignedTeam = formData.assignedTeam;
      } else {
        payload.assignedTo = formData.assignedTo;
      }

      await api.post('/api/goals', payload);
      setSuccess('Goal successfully assigned and dispatched!');
      setShowAssignForm(false);
      
      const allowedDeps = Array.from(new Set(reports.map(r => r.department)));
      setFormData({
        title: '', description: '', thrustArea: '', uom: '',
        target: '', weightage: 10, type: 'Min', deadline: '',
        assignType: 'team',
        assignedTeam: allowedDeps[0] || 'Engineering',
        assignedTo: reports[0]?._id || ''
      });
      
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign goal');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleStartInlineEdit = (goal) => {
    setEditingGoalId(goal._id);
    setEditFields({
      target: goal.target,
      weightage: goal.weightage
    });
  };

  const handleSaveInlineEdit = async (goalId) => {
    try {
      await api.put(`/api/goals/${goalId}`, {
        target: Number(editFields.target),
        weightage: Number(editFields.weightage)
      });
      setSuccess('Goal adjustments updated successfully!');
      setEditingGoalId(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update goal');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReviewSheet = async (employeeId, action) => {
    try {
      await api.post('/api/goals/review-sheet', { employeeId, action });
      setSuccess(`Employee goal sheet successfully ${action === 'Approve' ? 'Approved & Locked' : 'Returned for Rework'}!`);
      setExpandedSheetEmployeeId(null);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleVerify = async (goalId) => {
    try {
      await api.put(`/api/goals/${goalId}/verify`);
      setSuccess('Goal verified and marked as achieved!');
      if (selectedGoal && selectedGoal._id === goalId) {
        setSelectedGoal(prev => ({ ...prev, isAchieved: true, status: 'Approved' }));
      }
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to verify goal');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleLockTeamGoal = async (title, assignedTeam) => {
    try {
      await api.put('/api/goals/team-lock', { title, assignedTeam });
      setSuccess('Team goal completed, finalized, and closed successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to close team goal');
      setTimeout(() => setError(''), 4000);
    }
  };

  const toggleDept = (dept) => {
    setOpenDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  const toggleGroupedDept = (dept) => {
    setOpenGroupedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10">Loading team operations console...</div>;

  const myTeamGoalsRaw = goals.filter(g => g.managerId === user?._id || (g.ownerId && reports.some(r => r._id === g.ownerId._id)));
  const pendingTickingGoals = myTeamGoalsRaw.filter(g => g.status === 'Submitted' && g.submissionFile);
  
  const submittedSheetEmployees = reports.filter(employee => {
    const empGoals = goals.filter(g => g.ownerId && g.ownerId._id === employee._id);
    return empGoals.length > 0 && empGoals.some(g => g.status === 'Submitted' && !g.submissionFile);
  });

  const activeGoals = myTeamGoalsRaw.filter(g => g.status !== 'Submitted' || g.isAchieved);

  const groupedTeamGoalsMap = {};
  myTeamGoalsRaw.forEach(goal => {
    if (goal.ownerId && goal.ownerId._id !== user?._id) { 
      const teamKey = `${goal.title}_${goal.assignedTeam || 'Unassigned'}`;
      if (!groupedTeamGoalsMap[teamKey]) {
        groupedTeamGoalsMap[teamKey] = {
          title: goal.title,
          assignedTeam: goal.assignedTeam || 'Operations',
          goals: []
        };
      }
      groupedTeamGoalsMap[teamKey].goals.push(goal);
    }
  });

  const groupedTeamGoals = Object.values(groupedTeamGoalsMap);
  const allowedDepartments = Array.from(new Set(reports.map(r => r.department)));

  const groupedTeamGoalsDeptMap = {};
  allowedDepartments.forEach(dept => {
    groupedTeamGoalsDeptMap[dept] = [];
  });

  groupedTeamGoals.forEach(group => {
    const dept = group.assignedTeam;
    if (dept && groupedTeamGoalsDeptMap[dept]) {
      groupedTeamGoalsDeptMap[dept].push(group);
    }
  });

  const departmentGoalsMap = {};
  allowedDepartments.forEach(dept => {
    departmentGoalsMap[dept] = [];
  });

  activeGoals.forEach(goal => {
    const dept = goal.ownerId?.department;
    if (dept && departmentGoalsMap[dept]) {
      departmentGoalsMap[dept].push(goal);
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Team Goal Operations</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Create, delegate, review draft sheets, and cross-verify performance metrics.</p>
        </div>
        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="flex items-center px-5 py-3 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-950 rounded-xl transition-all shadow-md shadow-amber-500/10 font-bold text-xs uppercase tracking-wider"
        >
          <Plus className="mr-2 h-4 w-4" /> Push Team KPI
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl border-zinc-300 dark:border-emerald-900/30">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="ml-3 text-emerald-800 dark:text-emerald-450 text-sm font-semibold">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl border-zinc-300 dark:border-red-900/30">
          <div className="flex">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-red-750 dark:text-red-400 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* L1 GOAL SHEET APPROVAL WORKSPACE SECTION */}
      {submittedSheetEmployees.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-zinc-100 shadow-lg space-y-4">
          <div>
            <h3 className="text-lg font-bold flex items-center">
              <Award className="h-5 w-5 text-[#FFC20E] mr-2" />
              L1 Goal Sheet Approval Workspace
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5">The following direct reports have submitted their Goal Sheets for approval. Inspect objectives, edit weights inline, and approve/return them.</p>
          </div>

          <div className="space-y-3">
            {submittedSheetEmployees.map(employee => {
              const empGoals = goals.filter(g => g.ownerId && g.ownerId._id === employee._id);
              const sumWeight = empGoals.reduce((sum, g) => sum + g.weightage, 0);
              const isExpanded = expandedSheetEmployeeId === employee._id;

              return (
                <div key={employee._id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md">
                  <div 
                    onClick={() => setExpandedSheetEmployeeId(isExpanded ? null : employee._id)}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-zinc-900 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 bg-zinc-900 text-[#FFC20E] font-bold rounded-lg flex items-center justify-center text-xs border border-zinc-800">
                        {employee.name[0]}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-100">{employee.name}</h4>
                        <p className="text-[10px] text-zinc-450">{employee.department} • {empGoals.length} Proposed Goals</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sumWeight === 100 ? 'bg-emerald-500/25 text-emerald-450 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        Total Weight: {sumWeight}%
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 bg-zinc-900/50 border-t border-zinc-800 space-y-4 animate-in slide-in-from-top-2">
                      
                      {sumWeight !== 100 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-3.5 rounded-xl flex items-start space-x-2">
                          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                          <span><strong>Weight Distribution Warning:</strong> The current sum of weights is **{sumWeight}%**. Goal Sheets can only be submitted or approved at exactly **100%**. Adjust targets inline to fix this.</span>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-zinc-300">
                          <thead className="text-[10px] uppercase text-[#FFC20E] bg-zinc-950/50 rounded-lg">
                            <tr>
                              <th className="py-2 px-3">Thrust Area</th>
                              <th className="py-2 px-3">Objective Description</th>
                              <th className="py-2 px-3 text-center">Target Metric</th>
                              <th className="py-2 px-3 text-center">Weightage</th>
                              <th className="py-2 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {empGoals.map(goal => {
                              const isEditing = editingGoalId === goal._id;
                              return (
                                <tr key={goal._id} className="hover:bg-zinc-950/40 transition-colors">
                                  <td className="py-3 px-3 font-bold text-zinc-200 shrink-0">{goal.thrustArea}</td>
                                  <td className="py-3 px-3">
                                    <p className="font-extrabold text-zinc-100">{goal.title}</p>
                                    <p className="text-[10px] text-zinc-450 mt-0.5 line-clamp-1">{goal.description}</p>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        className="bg-zinc-950 border border-zinc-800 text-white rounded px-2 py-0.5 w-16 text-center focus:outline-none"
                                        value={editFields.target}
                                        onChange={e => setEditFields({ ...editFields, target: e.target.value })}
                                      />
                                    ) : (
                                      <span className="font-bold text-zinc-100">{goal.target} {goal.uom}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        className="bg-zinc-950 border border-zinc-800 text-white rounded px-2 py-0.5 w-16 text-center focus:outline-none"
                                        value={editFields.weightage}
                                        onChange={e => setEditFields({ ...editFields, weightage: e.target.value })}
                                      />
                                    ) : (
                                      <span className="font-bold text-[#FFC20E]">{goal.weightage}%</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    {isEditing ? (
                                      <button
                                        onClick={() => handleSaveInlineEdit(goal._id)}
                                        className="p-1.5 bg-[#FFC20E] text-zinc-950 rounded hover:bg-[#FFB800] mr-1"
                                        title="Save adjustments"
                                      >
                                        <Save className="h-3.5 w-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleStartInlineEdit(goal)}
                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[#FFC20E] mr-1"
                                        title="Adjust weight/target inline"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-800">
                        <button
                          onClick={() => handleReviewSheet(employee._id, 'Rework')}
                          className="px-4 py-2 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold hover:bg-red-500/10"
                        >
                          Return for Rework
                        </button>
                        <button
                          onClick={() => handleReviewSheet(employee._id, 'Approve')}
                          disabled={sumWeight !== 100}
                          className="px-5 py-2 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black shadow-lg"
                        >
                          Approve & Lock Goal Sheet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAssignForm && (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-6">Assign New Target Objective</h3>
          <form onSubmit={handleAssignGoal} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-2">Assignment Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.assignType === 'team'}
                      onChange={() => setFormData({ ...formData, assignType: 'team' })}
                      className="text-[#FFC20E] focus:ring-[#FFC20E]"
                    />
                    <span>Assign to Team (Department)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.assignType === 'individual'}
                      onChange={() => setFormData({ ...formData, assignType: 'individual' })}
                      className="text-[#FFC20E] focus:ring-[#FFC20E]"
                    />
                    <span>Assign to Employee</span>
                  </label>
                </div>
              </div>

              <div>
                {formData.assignType === 'team' ? (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider mb-1">Target Department Team</label>
                    <select
                      value={formData.assignedTeam}
                      onChange={e => setFormData({ ...formData, assignedTeam: e.target.value })}
                      className="mt-1 block w-full bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm cursor-pointer"
                    >
                      {allowedDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept} Team</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-450 uppercase tracking-wider mb-1">Target Employee</label>
                    <select
                      value={formData.assignedTo}
                      onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="mt-1 block w-full bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm cursor-pointer"
                    >
                      {reports.map(rep => (
                        <option key={rep._id} value={rep._id}>
                          {rep.name} ({rep.employeeId}) - {rep.department}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Goal Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Integrate core analytics telemetry"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Description</label>
              <textarea
                placeholder="Detailed objectives and metrics..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
                rows="3"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Thrust Area</label>
              <input
                type="text"
                placeholder="e.g. Quality, Growth, Performance"
                value={formData.thrustArea}
                onChange={e => setFormData({ ...formData, thrustArea: e.target.value })}
                className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Goal Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm cursor-pointer"
              >
                <option value="Min">Min (Higher is better)</option>
                <option value="Max">Max (Lower is better)</option>
                <option value="Timeline">Timeline</option>
                <option value="Zero-Based">Zero-Based</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Target</label>
              <input
                type="number"
                required
                placeholder="e.g. 90"
                value={formData.target}
                onChange={e => setFormData({ ...formData, target: e.target.value })}
                className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Unit of Measurement (UoM)</label>
              <input
                type="text"
                placeholder="e.g. %, Endpoints, Weeks"
                value={formData.uom}
                onChange={e => setFormData({ ...formData, uom: e.target.value })}
                className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Weightage (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                required
                value={formData.weightage}
                onChange={e => setFormData({ ...formData, weightage: e.target.value })}
                className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
              />
            </div>

            <div className="col-span-2 flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setShowAssignForm(false)}
                className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-950 text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#FFC20E] text-slate-950 font-bold rounded-xl hover:bg-[#FFB800] transition-all text-xs uppercase tracking-wider shadow-lg"
              >
                Push Shared KPI
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grouped Team Goals Progress Tracker with Collapsible Folders */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
          <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
            <Users className="h-5 w-5 text-[#FFC20E] mr-2" /> Grouped Team Goals Progress Tracker
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          {allowedDepartments.map(dept => {
            const list = groupedTeamGoalsDeptMap[dept] || [];
            const isOpen = openGroupedDepts[dept];

            return (
              <div key={dept} className="border border-zinc-300 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
                <div 
                  onClick={() => toggleGroupedDept(dept)}
                  className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-300 dark:border-zinc-800 flex justify-between items-center cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 flex items-center justify-center font-bold text-[#FFC20E] text-xs">
                      {dept[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-zinc-800 dark:text-zinc-150 text-sm">{dept} Grouped Tracker</h4>
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold">{list.length} Shared Objectives</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
                </div>

                {isOpen && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                    {list.map(group => {
                      const total = group.goals.length;
                      const approved = group.goals.filter(g => g.isAchieved).length;
                      const progress = Math.round((approved / total) * 100);
                      const isLocked = group.goals[0]?.status === 'Locked';

                      return (
                        <div key={group.title} className="border border-zinc-300 dark:border-zinc-850 rounded-2xl p-6 bg-zinc-50/30 dark:bg-zinc-900/30 flex flex-col justify-between space-y-4 hover:border-[#FFC20E] transition-all">
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 px-2.5 py-0.5 rounded-full text-amber-700 dark:text-[#FFC20E] uppercase tracking-wider">{group.assignedTeam}</span>
                                <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-150 mt-2">{group.title}</h4>
                              </div>
                              {isLocked ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                                  <Lock className="h-3 w-3 mr-1" /> Closed (Ended)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-[#FFC20E] bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/30">Active</span>
                              )}
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                <span>Approval Rate</span>
                                <span>{approved} of {total} Members Approved ({progress}%)</span>
                              </div>
                              <div className="w-full bg-zinc-200 dark:bg-zinc-950 h-2.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between mt-4">
                            <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold">Ticked as Employee verified submissions complete.</span>
                            
                            {isLocked ? (
                              <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 flex items-center py-2">
                                <CheckCircle2 className="h-4 w-4 mr-1 text-zinc-400" /> Completed & Locked
                              </div>
                            ) : (
                              <button
                                onClick={() => handleLockTeamGoal(group.title, group.assignedTeam)}
                                className="flex items-center px-3.5 py-2 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-md transition-all"
                              >
                                <Award className="mr-1.5 h-3.5 w-3.5 text-yellow-400 animate-pulse" /> Complete Goal & Close Task
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {list.length === 0 && (
                      <div className="col-span-full py-6 text-center text-zinc-400 dark:text-zinc-500 text-xs italic">
                        No team objectives assigned under the {dept} department.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Queue Section (Ticking Submissions) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
          <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-100">Verification Pending Queue</h3>
          <span className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 text-amber-800 dark:text-[#FFC20E] text-xs font-bold px-2.5 py-0.5 rounded-full">
            {pendingTickingGoals.length} Submitted Proofs
          </span>
        </div>
        
        {pendingTickingGoals.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-sm italic">
            No employee documents waiting for verification ticks.
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingTickingGoals.map(goal => (
              <div key={goal._id} className="border border-zinc-300 dark:border-zinc-800 rounded-2xl p-5 shadow-sm bg-white dark:bg-zinc-950 space-y-4 hover:border-[#FFC20E] transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-[#FFC20E]">{goal.ownerId?.department || 'Operations'}</span>
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1">{goal.ownerId?.name} ({goal.ownerId?.employeeId})</h4>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" /> Due {new Date(goal.deadline || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wide">Target Metric</p>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mt-0.5">{goal.title}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-450 mt-0.5">Value: {goal.target} {goal.uom} | Weightage: {goal.weightage}%</p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wide">Employee Response Comment</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 italic">
                      "{goal.submissionText}"
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 p-2 rounded-lg max-w-[60%]">
                    <FileText className="h-4 w-4 text-[#FFC20E] shrink-0" />
                    <span className="font-semibold truncate text-zinc-650 dark:text-zinc-350">{goal.submissionFile}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedGoal(goal)}
                      className="px-2.5 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all"
                      title="View Target Details"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleVerify(goal._id)}
                      className="flex items-center px-4 py-2 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
                    >
                      <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Verify & Complete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Directory Folders */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
          <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-100">Team Objectives Directory</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Click any folder to view tasks assigned to that department.</p>
        </div>

        <div className="p-6 space-y-4">
          {allowedDepartments.map(dept => {
            const list = departmentGoalsMap[dept] || [];
            const isOpen = openDepts[dept];

            return (
              <div key={dept} className="border border-zinc-300 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
                <div 
                  onClick={() => toggleDept(dept)}
                  className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-300 dark:border-zinc-800 flex justify-between items-center cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 flex items-center justify-center font-bold text-[#FFC20E] text-xs">
                      {dept[0]}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-zinc-800 dark:text-zinc-150 text-sm">{dept} Team Folder</h4>
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold">{list.length} Targets Allocated</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
                </div>

                {isOpen && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                    {list.map(goal => (
                      <div 
                        key={goal._id} 
                        onClick={() => setSelectedGoal(goal)}
                        className="border border-zinc-350 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3 bg-white dark:bg-zinc-900 hover:border-[#FFC20E] hover:shadow-md transition-all cursor-pointer relative group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">{goal.ownerId?.department}</p>
                            <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mt-0.5 group-hover:text-[#FFC20E] transition-colors">{goal.ownerId?.name} ({goal.ownerId?.employeeId})</h4>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            goal.status === 'Locked'
                              ? 'bg-zinc-100 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-850'
                              : goal.isAchieved 
                                ? 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30' 
                                : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-450 border border-zinc-200 dark:border-zinc-850'
                          }`}>
                            {goal.status === 'Locked' ? 'Locked' : goal.isAchieved ? 'Achieved' : goal.status}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{goal.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{goal.description}</p>
                        
                        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850">
                          <span>Weight: <strong>{goal.weightage}%</strong></span>
                          <span>Target: <strong>{goal.target} {goal.uom}</strong></span>
                        </div>
                      </div>
                    ))}

                    {list.length === 0 && (
                      <div className="col-span-full py-6 text-center text-zinc-450 dark:text-zinc-500 text-xs italic">
                        No targets assigned to the {dept} department.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PREMIUM DETAILS MODAL */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-xl w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedGoal(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-800 dark:text-[#FFC20E] bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 px-3 py-1 rounded-full w-max mb-3">
              <Tag className="h-3.5 w-3.5" />
              <span>{selectedGoal.thrustArea || 'Performance Target'}</span>
            </div>

            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 leading-tight mb-2">{selectedGoal.title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{selectedGoal.description}</p>

            <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-850 mb-6">
              <div>
                <p className="text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider">Target Objective</p>
                <p className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">{selectedGoal.target} {selectedGoal.uom}</p>
              </div>
              <div>
                <p className="text-zinc-450 dark:text-zinc-555 font-bold uppercase tracking-wider">Weightage / Impact</p>
                <p className="font-extrabold text-amber-600 dark:text-[#FFC20E] mt-1">{selectedGoal.weightage}% Impact</p>
              </div>
              <div>
                <p className="text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider">Measurement Type</p>
                <p className="font-extrabold text-zinc-750 dark:text-zinc-300 mt-1">{selectedGoal.type}</p>
              </div>
              <div>
                <p className="text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider">Target Deadline</p>
                <p className="font-extrabold text-zinc-750 dark:text-zinc-300 mt-1">{new Date(selectedGoal.deadline || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-850 pt-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider mb-2">Assigned Assignee</h4>
                <div className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50 p-3.5 border border-zinc-200 dark:border-zinc-850 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{selectedGoal.ownerId?.name}</p>
                    <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-0.5">{selectedGoal.ownerId?.email}</p>
                  </div>
                  <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-850">
                    {selectedGoal.ownerId?.employeeId || 'System'}
                  </span>
                </div>
              </div>

              {selectedGoal.submissionFile && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider mb-2">Verification Proof Upload</h4>
                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl space-y-2">
                    <p className="text-xs text-zinc-650 dark:text-zinc-400 italic">"{selectedGoal.submissionText}"</p>
                    <div className="flex items-center space-x-1.5 text-xs text-[#FFC20E] bg-zinc-900 border border-zinc-800 p-2 rounded-lg cursor-pointer">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="font-bold truncate">{selectedGoal.submissionFile}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setSelectedGoal(null)}
                className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-850 text-zinc-750 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-950 text-xs uppercase tracking-wider"
              >
                Close Details
              </button>
              
              {selectedGoal.status === 'Submitted' && !selectedGoal.isAchieved && (
                <button
                  onClick={() => handleVerify(selectedGoal._id)}
                  className="px-6 py-2.5 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 font-bold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider flex items-center"
                >
                  <UserCheck className="mr-2 h-4 w-4" /> Verify & Complete Target
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamGoals;
