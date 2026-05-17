import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Target, Send, AlertCircle, FileText, CheckCircle2, CloudUpload, X, Lock, Plus, Trash2, Edit3, Sparkles, HelpCircle } from 'lucide-react';

const GoalManagement = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [isEditingShared, setIsEditingShared] = useState(false);
  
  // Creation/Edit Form State
  const [formData, setFormData] = useState({
    title: '', description: '', thrustArea: '', uom: '',
    target: '', weightage: 10, type: 'Min', deadline: ''
  });

  // Submission proof modal state
  const [activeGoal, setActiveGoal] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data } = await api.get('/api/goals');
      setGoals(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load goals');
      setLoading(false);
    }
  };

  const handleCreateOrUpdateGoal = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Pre-validations
    if (Number(formData.weightage) < 10) {
      setError('Minimum weightage per individual goal is 10%.');
      return;
    }

    try {
      const payload = {
        ...formData,
        target: Number(formData.target),
        weightage: Number(formData.weightage)
      };

      if (editingGoalId) {
        await api.put(`/api/goals/${editingGoalId}`, payload);
        setSuccess('Goal successfully updated!');
        setEditingGoalId(null);
        setIsEditingShared(false);
      } else {
        if (goals.length >= 8) {
          setError('Maximum number of goals per employee is 8.');
          return;
        }
        await api.post('/api/goals', payload);
        setSuccess('Goal draft successfully added to your sheet!');
      }

      setFormData({
        title: '', description: '', thrustArea: '', uom: '',
        target: '', weightage: 10, type: 'Min', deadline: ''
      });
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEditInit = (goal) => {
    setEditingGoalId(goal._id);
    setIsEditingShared(!!goal.isShared);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      thrustArea: goal.thrustArea || '',
      uom: goal.uom || '',
      target: goal.target,
      weightage: goal.weightage,
      type: goal.type || 'Min',
      deadline: goal.deadline ? goal.deadline.split('T')[0] : ''
    });
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to remove this draft goal?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/goals/${goalId}`);
      setSuccess('Goal removed successfully.');
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete goal');
    }
  };

  const handleSubmitGoalSheet = async () => {
    setError('');
    setSuccess('');
    try {
      await api.post('/api/goals/submit');
      setSuccess('Your Goal Sheet was successfully submitted to your manager for review!');
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Goal sheet validation failed');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 50);
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please attach a verification proof document.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/api/goals/${activeGoal._id}/submit`, {
        submissionText,
        submissionFile: selectedFile.name
      });
      
      setIsSubmitting(false);
      setActiveGoal(null);
      setSubmissionText('');
      setSelectedFile(null);
      setUploadProgress(0);
      setError('');
      setSuccess('Proof document successfully submitted for review!');
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-[#FFC20E] font-extrabold animate-pulse text-sm">
        Loading employee objectives workspace...
      </div>
    );
  }

  // Split goals by phase status groups
  const draftGoals = goals.filter(g => g.status === 'Draft' || g.status === 'Returned');
  const submittedGoals = goals.filter(g => g.status === 'Submitted' && !g.isAchieved);
  const approvedGoals = goals.filter(g => g.status === 'Approved' || g.status === 'Locked' || g.isAchieved);

  // Validation Metrics
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const countGoals = goals.length;
  const isSheetValid = totalWeightage === 100 && countGoals <= 8 && goals.every(g => g.weightage >= 10);

  // An employee CANNOT add drafts if the sheet has already been submitted, approved, or locked.
  const canAddDraft = goals.length === 0 || !goals.some(g => g.status === 'Submitted' || g.status === 'Approved' || g.status === 'Locked');

  // Filter tasks completed and assigned for the customized workspace state
  const assignedGoals = goals.filter(g => (g.status === 'Approved' || g.status === 'Locked') && !g.isAchieved);
  const completedGoals = goals.filter(g => g.isAchieved || g.status === 'Locked');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Dashboard */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-zinc-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center space-x-2 text-[#FFC20E] text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-900/30 px-3 py-1 rounded-full w-max mb-3">
              <Sparkles className="h-3 w-3" />
              <span>Goal Sheet Workspace</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Performance Development Portal</h2>
            <p className="text-zinc-400 mt-1 max-w-xl text-sm font-medium">Draft your quarterly objectives, assign weights, and log achievements synchronously.</p>
          </div>

          <div className="flex space-x-4 bg-zinc-950/50 border border-zinc-800 p-4 rounded-2xl backdrop-blur-md">
            <div className="text-center px-4">
              <span className="text-[10px] text-[#FFC20E] uppercase tracking-widest font-extrabold">Total Weight</span>
              <p className={`text-2xl font-black mt-1 ${totalWeightage === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {totalWeightage}%
              </p>
            </div>
            <div className="w-px bg-zinc-800"></div>
            <div className="text-center px-4">
              <span className="text-[10px] text-[#FFC20E] uppercase tracking-widest font-extrabold">Goals Count</span>
              <p className={`text-2xl font-black mt-1 ${countGoals > 8 ? 'text-red-400' : 'text-zinc-200'}`}>
                {countGoals} / 8
              </p>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl border-zinc-300 dark:border-emerald-900/30">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="ml-3 text-emerald-800 dark:text-emerald-400 text-sm font-semibold">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl border-zinc-300 dark:border-red-900/30">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="ml-3 text-red-800 dark:text-red-400 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Goal Setting Center (Drafting / Tracking Workspace Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Creation Form OR Tasks Completed & Assigned Logs */}
        {!canAddDraft ? (
          <div className="lg:col-span-1 space-y-6 animate-in slide-in-from-left duration-300">
            
            {/* Assigned Objectives Panel */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-150 flex items-center uppercase tracking-wider">
                    <Target className="h-4.5 w-4.5 text-blue-500 mr-2 shrink-0" />
                    Assigned Targets
                  </h3>
                  <span className="bg-blue-50 dark:bg-blue-900/10 text-blue-650 dark:text-blue-400 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {assignedGoals.length} Active
                  </span>
                </div>
                <p className="text-zinc-450 dark:text-zinc-500 text-[10px] uppercase font-bold mt-1.5 tracking-wide">
                  Active parameters currently being tracked
                </p>
              </div>
              <div className="space-y-3">
                {assignedGoals.map(goal => (
                  <div key={goal._id} className="p-3.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-850 rounded-2xl">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-normal">{goal.title}</p>
                    <div className="flex justify-between items-center text-[10px] text-zinc-450 dark:text-zinc-500 font-bold mt-2.5 uppercase tracking-wide">
                      <span>Target: {goal.target} {goal.uom}</span>
                      <span>Weight: {goal.weightage}%</span>
                    </div>
                  </div>
                ))}
                {assignedGoals.length === 0 && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-4 text-center">No pending active parameters.</p>
                )}
              </div>
            </div>

            {/* Completed Objectives Panel */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-150 flex items-center uppercase tracking-wider">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 mr-2 shrink-0" />
                    Completed & Achieved
                  </h3>
                  <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {completedGoals.length} Met
                  </span>
                </div>
                <p className="text-zinc-450 dark:text-zinc-500 text-[10px] uppercase font-bold mt-1.5 tracking-wide">
                  Verified achievements log
                </p>
              </div>
              <div className="space-y-3">
                {completedGoals.map(goal => (
                  <div key={goal._id} className="p-3.5 bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-950 rounded-2xl">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-normal">{goal.title}</p>
                    <div className="flex justify-between items-center text-[10px] text-emerald-650 dark:text-emerald-400 font-bold mt-2.5 uppercase tracking-wide">
                      <span>Target Met: {goal.target} {goal.uom}</span>
                      <span className="bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md text-[9px]">Verified</span>
                    </div>
                  </div>
                ))}
                {completedGoals.length === 0 && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-4 text-center">No completed targets recorded.</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
                <Plus className="h-5 w-5 text-[#FFC20E] mr-2" />
                {editingGoalId ? 'Modify Goal Draft' : 'Add New Draft Goal'}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Construct an individual target parameters. Individual weights must be at least 10%.</p>
            </div>

            <form onSubmit={handleCreateOrUpdateGoal} className="space-y-4">
              {isEditingShared && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-xs p-3.5 rounded-2xl flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span><strong>Shared KPI Alert:</strong> This target was assigned to you as a team-wide parameter. You may only adjust its weightage. Title and target criteria are locked.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Thrust Area</label>
                <input
                  type="text"
                  required
                  disabled={isEditingShared}
                  placeholder="e.g. Sales, Code Quality, Delivery"
                  value={formData.thrustArea}
                  onChange={e => setFormData({ ...formData, thrustArea: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  disabled={isEditingShared}
                  placeholder="e.g. Integrate core analytics telemetry"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  placeholder="Metrics, context, and criteria..."
                  disabled={isEditingShared}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  rows="2"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Goal Type</label>
                  <select
                    disabled={isEditingShared}
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="Min" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Min (Higher = Better)</option>
                    <option value="Max" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Max (Lower = Better)</option>
                    <option value="Timeline" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Timeline</option>
                    <option value="Zero-Based" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Zero-Based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Weightage (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={formData.weightage}
                    onChange={e => setFormData({ ...formData, weightage: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Target</label>
                  <input
                    type="number"
                    required
                    disabled={isEditingShared}
                    placeholder="e.g. 90"
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Measurement UoM</label>
                  <input
                    type="text"
                    required
                    disabled={isEditingShared}
                    placeholder="e.g. %, Weeks, incidents"
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Completion Deadline</label>
                <input
                  type="date"
                  required
                  disabled={isEditingShared}
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                {editingGoalId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGoalId(null);
                      setFormData({
                        title: '', description: '', thrustArea: '', uom: '',
                        target: '', weightage: 10, type: 'Min', deadline: ''
                      });
                    }}
                    className="w-1/2 py-2 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-950 text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className={`py-3 px-4 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-955 rounded-xl font-bold shadow-md shadow-amber-500/10 text-xs uppercase tracking-wider ${editingGoalId ? 'w-1/2' : 'w-full'}`}
                >
                  {editingGoalId ? 'Save Edits' : 'Add Draft Goal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right Side: Roster and Submission Action OR The Approved & Active Targets list */}
        <div className="lg:col-span-2 space-y-6">
          {!canAddDraft ? (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6 animate-in slide-in-from-right duration-300">
              <div>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                  Active & Approved Objectives
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 font-medium">These are locked objectives verified by your manager. Upload proof parameters when target achievement is met.</p>
              </div>

              {approvedGoals.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                  <Lock className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">No active or approved targets currently.</p>
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">Once L1 manager approves your sheets, active goals will display here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {approvedGoals.map(goal => (
                    <div key={goal._id} className="bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-white dark:hover:bg-zinc-900 rounded-3xl border border-zinc-300 dark:border-zinc-800 hover:border-[#FFC20E] hover:shadow-md transition-all p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full">
                            {goal.thrustArea || 'Performance Target'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${
                            goal.status === 'Locked'
                              ? 'bg-zinc-150 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 border border-zinc-200 dark:border-zinc-800'
                              : goal.isAchieved 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30' 
                                : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 border border-zinc-200 dark:border-zinc-800'
                          }`}>
                            {goal.status === 'Locked' ? 'Closed' : goal.isAchieved ? 'Achieved' : 'Active'}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-zinc-800 dark:text-zinc-150 text-sm mt-1">{goal.title}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{goal.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-3.5 rounded-2xl mt-4">
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Target Objective</span>
                            <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{goal.target} {goal.uom}</p>
                          </div>
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Weight</span>
                            <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{goal.weightage}%</p>
                          </div>
                        </div>

                        {goal.submissionFile && (
                          <div className="mt-3 flex items-center space-x-2 text-xs text-zinc-500 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-2 rounded-xl">
                            <FileText className="h-4 w-4 text-[#FFC20E] shrink-0" />
                            <span className="font-semibold truncate text-zinc-650 dark:text-zinc-300">{goal.submissionFile}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        {goal.status === 'Locked' ? (
                          <div className="flex items-center justify-center space-x-2 text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-xs py-2.5 rounded-xl">
                            <Lock className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Task Closed & Complete</span>
                          </div>
                        ) : goal.isAchieved ? (
                          <div className="flex items-center justify-center space-x-1.5 text-emerald-705 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/20 py-2.5 border border-emerald-250 dark:border-emerald-900/30 rounded-xl">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Manager Approved</span>
                          </div>
                        ) : goal.status === 'Submitted' ? (
                          <div className="text-center text-amber-600 font-bold text-xs py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-250 dark:border-[#FFC20E]/20 rounded-xl">
                            Pending Manager Review
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveGoal(goal)}
                            className="w-full flex justify-center items-center py-3 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all"
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Proof Document
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
                    <FileText className="h-5 w-5 text-[#FFC20E] mr-2" />
                    My Draft Goal Sheet
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 font-medium">Manage and organize your current performance sheet. Once ready, hit submit.</p>
                </div>

                {draftGoals.length > 0 && (
                  <button
                    onClick={handleSubmitGoalSheet}
                    disabled={!isSheetValid}
                    className={`flex items-center px-4 py-2.5 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-955 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all ${
                      !isSheetValid ? 'opacity-40 cursor-not-allowed' : 'hover:scale-102 hover:shadow-amber-500/20'
                    }`}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Goal Sheet
                  </button>
                )}
              </div>

              {/* Validation Banner Indicator */}
              {draftGoals.length > 0 && (
                <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-3 ${isSheetValid ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-450' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-900/30 text-amber-800 dark:text-amber-400'}`}>
                  <HelpCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-extrabold uppercase tracking-wide">Validation Ledger Verification</p>
                    <p className="mt-0.5 font-semibold leading-relaxed">
                      Total weightage must be exactly **100%** (current: **{totalWeightage}%**). Count of goals must be between **1** and **8** (current: **{countGoals}**). Each individual goal must have at least **10%** weight.
                    </p>
                  </div>
                </div>
              )}

              {/* Draft Goal Lists */}
              {draftGoals.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                  <Target className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Your draft goal sheet is empty.</p>
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">Use the form on the left to add draft performance parameters to your goal sheet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftGoals.map(goal => (
                    <div key={goal._id} className="border border-zinc-300 dark:border-zinc-800 hover:border-[#FFC20E] rounded-2xl p-5 bg-zinc-50/20 dark:bg-zinc-900/30 shadow-sm relative flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-[#FFC20E] bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 px-2 py-0.5 rounded-md">
                            {goal.thrustArea || 'Performance Metric'}
                          </span>
                          {goal.status === 'Returned' ? (
                            <span className="text-[10px] font-bold text-red-655 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              Rework Required
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded-full">
                              Draft
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-zinc-850 dark:text-zinc-100 text-sm mt-1">{goal.title}</h4>
                        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 line-clamp-2">{goal.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-3 rounded-xl mt-3 text-zinc-700 dark:text-zinc-300 font-semibold">
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Target</span>
                            <p className="font-extrabold text-zinc-800 dark:text-zinc-250">{goal.target} {goal.uom}</p>
                          </div>
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Weight</span>
                            <p className="font-extrabold text-zinc-800 dark:text-zinc-250">{goal.weightage}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={() => handleEditInit(goal)}
                          className="p-2 border border-zinc-300 dark:border-zinc-800 hover:border-[#FFC20E] text-zinc-500 hover:text-[#FFC20E] rounded-xl bg-white dark:bg-zinc-950 transition-colors"
                          title="Edit Target"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal._id)}
                          className="p-2 border border-zinc-300 dark:border-zinc-800 hover:border-red-300 hover:text-red-650 text-zinc-500 hover:text-red-600 rounded-xl bg-white dark:bg-zinc-950 transition-colors"
                          title="Delete Target"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Roster of Approved & Submitted Goals (Fallback below if drafting state is active but has approved goals) */}
      {canAddDraft && approvedGoals.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
              Approved & Active Targets
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 font-medium">These are locked objectives verified by your manager. Upload proof parameters when target achievement is met.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedGoals.map(goal => (
              <div key={goal._id} className="bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-white dark:hover:bg-zinc-900 rounded-3xl border border-zinc-300 dark:border-zinc-800 hover:border-[#FFC20E] hover:shadow-md transition-all p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full">
                      {goal.thrustArea || 'Performance Target'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${
                      goal.status === 'Locked'
                        ? 'bg-zinc-150 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 border border-zinc-200 dark:border-zinc-800'
                        : goal.isAchieved 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30' 
                          : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 border border-zinc-200 dark:border-zinc-800'
                    }`}>
                      {goal.status === 'Locked' ? 'Closed' : goal.isAchieved ? 'Achieved' : 'Active'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-zinc-800 dark:text-zinc-150 text-sm mt-1">{goal.title}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{goal.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-3.5 rounded-2xl mt-4">
                    <div>
                      <span className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Target Objective</span>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{goal.target} {goal.uom}</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Weight</span>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{goal.weightage}%</p>
                    </div>
                  </div>

                  {goal.submissionFile && (
                    <div className="mt-3 flex items-center space-x-2 text-xs text-zinc-500 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-2 rounded-xl">
                      <FileText className="h-4 w-4 text-[#FFC20E] shrink-0" />
                      <span className="font-semibold truncate text-zinc-650 dark:text-zinc-300">{goal.submissionFile}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  {goal.status === 'Locked' ? (
                    <div className="flex items-center justify-center space-x-2 text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-xs py-2.5 rounded-xl">
                      <Lock className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Task Closed & Complete</span>
                    </div>
                  ) : goal.isAchieved ? (
                    <div className="flex items-center justify-center space-x-1.5 text-emerald-705 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/20 py-2.5 border border-emerald-250 dark:border-emerald-900/30 rounded-xl">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Manager Approved</span>
                    </div>
                  ) : goal.status === 'Submitted' ? (
                    <div className="text-center text-amber-600 font-bold text-xs py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-250 dark:border-emerald-900/30 rounded-xl">
                      Pending Manager Review
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveGoal(goal)}
                      className="w-full flex justify-center items-center py-3 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all"
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Proof Document
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROOF SUBMISSION MODAL */}
      {activeGoal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-lg w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setActiveGoal(null);
                setSelectedFile(null);
                setUploadProgress(0);
              }}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Submit Performance Proof</h3>
            <p className="text-sm text-zinc-550 dark:text-zinc-400 mb-6">Attach a file and add any notes to verify you addressed the goal objectives: <strong className="text-zinc-700 dark:text-zinc-200">{activeGoal.title}</strong></p>

            <form onSubmit={handleResponseSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Notes / Verification Comments</label>
                <textarea
                  required
                  placeholder="Explain exactly how you successfully addressed the goal objectives..."
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-150 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm"
                  rows="3"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Upload Proof File</label>
                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-[#FFC20E] dark:hover:border-[#FFC20E] transition-colors rounded-2xl p-6 text-center cursor-pointer relative bg-zinc-50/50 dark:bg-zinc-900/10">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <CloudUpload className="mx-auto h-10 w-10 text-zinc-450 dark:text-zinc-500 mb-2" />
                  <p className="text-sm font-bold text-zinc-850 dark:text-zinc-200">Click to upload document</p>
                  <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">PDF, Excel, Word or image files supported</p>
                </div>
              </div>

              {selectedFile && (
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-200 truncate max-w-[80%]">{selectedFile.name}</span>
                    <span className="text-[#FFC20E] font-black">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveGoal(null);
                    setSelectedFile(null);
                    setUploadProgress(0);
                  }}
                  className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-950 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile || uploadProgress < 100}
                  className="px-6 py-2.5 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-955 font-bold rounded-xl disabled:bg-zinc-350 disabled:dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10"
                >
                  {isSubmitting ? 'Uploading...' : 'Submit Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalManagement;
