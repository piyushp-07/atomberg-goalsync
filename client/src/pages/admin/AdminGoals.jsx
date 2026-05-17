import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Target, CheckCircle2, AlertCircle, FileText, Send, MessageSquare, Tag, Calendar, User, Clock, ShieldCheck, HelpCircle, ShieldAlert, Award, AlertTriangle } from 'lucide-react';

const AdminGoals = () => {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Combined/Unified Communication Type State
  // Can be: 'Goal', 'Complaint', 'Performance Warning', 'Appreciation', 'General'
  const [commType, setCommType] = useState('Goal');

  // Unified Form State
  const [form, setForm] = useState({
    managerId: '',
    // Shared Fields
    title: '', // Subject for messages, Title for goals
    description: '', // Content for messages, Description for goals
    
    // Goal-Specific Fields
    category: 'Hiring & Recruitment',
    target: '',
    uom: 'Onboardings',
    weightage: 20,
    deadline: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const goalsRes = await api.get('/api/goals');
      const usersRes = await api.get('/api/admin/users');
      const msgRes = await api.get('/api/messages/sent');
      
      setGoals(goalsRes.data);
      setUsers(usersRes.data);
      setMessages(msgRes.data);

      const firstManager = usersRes.data.find(u => u.role === 'Manager');
      if (firstManager) {
        setForm(prev => ({ ...prev, managerId: firstManager._id }));
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load corporate registry datasets');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (commType === 'Goal') {
        // Submit Employment Target Goal
        const payload = {
          title: form.title,
          description: form.description,
          thrustArea: 'Employment Target',
          uom: form.uom,
          target: Number(form.target),
          weightage: Number(form.weightage),
          type: 'Min',
          deadline: form.deadline,
          assignedTo: form.managerId,
          category: form.category
        };
        await api.post('/api/goals', payload);
        setSuccess('Employment Corporate target successfully delegated to Manager!');
      } else {
        // Submit Personalized Alert / Message
        await api.post('/api/messages', {
          receiverId: form.managerId,
          type: commType, // 'Complaint', 'Performance Warning', 'Appreciation', 'General'
          subject: form.title,
          content: form.description
        });
        setSuccess(`Corporate ${commType} alert successfully delivered directly to manager inbox!`);
      }

      // Reset form variables while keeping recipient
      setForm(prev => ({
        ...prev,
        title: '',
        description: '',
        target: '',
        deadline: ''
      }));

      fetchData();
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit communication');
      setTimeout(() => setError(''), 4500);
    }
  };

  const handleVerifyGoal = async (goalId) => {
    try {
      await api.put(`/api/goals/${goalId}/verify`);
      setSuccess('Manager corporate target checked off and marked as completed!');
      fetchData();
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      setError('Failed to verify corporate target');
      setTimeout(() => setError(''), 4500);
    }
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10">Loading HR operations workspace...</div>;

  const managersList = users.filter(u => u.role === 'Manager');

  // Filter only manager targets assigned by HR (owner is a manager and thrust area is 'Employment Target')
  const assignedManagerTargets = goals.filter(g => g.ownerId?.role === 'Manager' && g.thrustArea === 'Employment Target');

  // Configuration mapping for completely dynamic portal adjustment
  const commTypeMetadata = {
    Goal: {
      title: 'Delegate Manager Target',
      description: 'Assign critical corporate recruitment, skill training, and turnover quotas strictly to managers.',
      icon: Target,
      titleLabel: 'Objective Target Title',
      titlePlaceholder: 'e.g. Onboard 5 senior developers in Engineering',
      descLabel: 'Detailed Expectation Description',
      descPlaceholder: 'Detail key sourcing constraints, experience levels, or performance parameters...',
      buttonLabel: 'Delegate Target Objective',
      iconComponent: Target
    },
    Complaint: {
      title: 'Send Performance Complaint',
      description: 'File an official operational or organizational complaint alert directly to a manager.',
      icon: AlertTriangle,
      titleLabel: 'Complaint Subject Header',
      titlePlaceholder: 'e.g. Core Pipeline Deployment Lapses',
      descLabel: 'Complaint Details & Context',
      descPlaceholder: 'Type specific details of the complaint, organizational impacts, and expected fixes...',
      buttonLabel: 'Send Complaint Alert',
      iconComponent: AlertTriangle
    },
    'Performance Warning': {
      title: 'Issue Performance Warning Alert',
      description: 'Issue a formal warning notice directly to a manager regarding SLA or roadmap target slippages.',
      icon: ShieldAlert,
      titleLabel: 'Warning Subject Header',
      titlePlaceholder: 'e.g. Delayed Integration Roadmaps Warning',
      descLabel: 'Warning Context & Corrective Advisory',
      descPlaceholder: 'Type specific context of roadmaps slipping, advisory warnings, and target recovery dates...',
      buttonLabel: 'Send Warning Notice',
      iconComponent: ShieldAlert
    },
    Appreciation: {
      title: 'Send Performance Appreciation',
      description: 'Congratulate successes, onboardings, or performance benchmark success to a manager.',
      icon: Award,
      titleLabel: 'Appreciation Title Header',
      titlePlaceholder: 'e.g. Stellar Engineering Headcount Accomplishment',
      descLabel: 'Appreciation Notes & Praise',
      descPlaceholder: 'Describe the stellar performance details and congratulate them on their success...',
      buttonLabel: 'Send Appreciation Feed',
      iconComponent: Award
    },
    General: {
      title: 'Send General Conversation Alert',
      description: 'Start a general advisory sync, policy update conversation, or generic check-in with a manager.',
      icon: MessageSquare,
      titleLabel: 'Conversation Topic Header',
      titlePlaceholder: 'e.g. Monthly Headcount Alignment Dialogue',
      descLabel: 'Advisory Sync Comments',
      descPlaceholder: 'Type advisory check-in comments, general questions, or discussion topics...',
      buttonLabel: 'Send Check-In Dialogue',
      iconComponent: MessageSquare
    }
  };

  const currentMeta = commTypeMetadata[commType] || commTypeMetadata.Goal;
  const PortalIcon = currentMeta.iconComponent;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">HR Manager Operations & Alerts Control Center</h2>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Delegate targets and deliver direct corporate alert formats to managers in one unified workspace.</p>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl border-zinc-300 dark:border-emerald-900/30">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-bounce" />
            <p className="ml-3 text-emerald-800 dark:text-emerald-450 text-sm font-semibold">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl border-zinc-300 dark:border-red-900/30">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-red-750 dark:text-red-400 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* SINGLE UNIFIED MANAGER COMMUNICATION PORTAL CARD */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-300 dark:border-zinc-800 max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-zinc-250 dark:border-zinc-850">
          <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/20 text-[#FFC20E] rounded-xl flex items-center justify-center transition-all duration-300 border border-amber-200 dark:border-amber-900/30">
            <PortalIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-850 dark:text-zinc-150 transition-all duration-300">{currentMeta.title}</h3>
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-0.5 transition-all duration-300">{currentMeta.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Recipient & Communication Format Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1">Target Manager</label>
            <select
              required
              value={form.managerId}
              onChange={e => setForm({ ...form, managerId: e.target.value })}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm cursor-pointer"
            >
              {managersList.map(mgr => (
                <option key={mgr._id} value={mgr._id}>
                  {mgr.name} ({mgr.employeeId}) - {mgr.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1">Communication Format</label>
            <select
              value={commType}
              onChange={e => setCommType(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm font-bold text-amber-700 dark:text-[#FFC20E] cursor-pointer"
            >
              <option value="Goal">🎯 Delegate Employment Target</option>
              <option value="Complaint">⚠️ Send Complaint Alert</option>
              <option value="Performance Warning">🛑 Send Performance Warning</option>
              <option value="Appreciation">✨ Send Appreciation Feed</option>
              <option value="General">💬 Send General Conversation</option>
            </select>
          </div>

          <div className="col-span-2 border-t border-dashed border-zinc-200 dark:border-zinc-850 my-2"></div>

          {/* DYNAMIC FORM LAYOUT FORMAT ADAPTATION */}

          {/* SHARED FIELDS WITH ADAPTIVE LABELS & PLACEHOLDERS */}
          <div className={commType === 'Goal' ? 'col-span-1' : 'col-span-2'}>
            <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1 transition-all duration-300">
              {currentMeta.titleLabel}
            </label>
            <input
              type="text"
              required
              placeholder={currentMeta.titlePlaceholder}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm transition-all duration-300"
            />
          </div>

          {commType === 'Goal' && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1">Employment Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm cursor-pointer"
              >
                <option value="Hiring & Recruitment">Hiring & Recruitment</option>
                <option value="Employee Retention & Culture">Employee Retention & Culture</option>
                <option value="Training & Skill Development">Training & Skill Development</option>
                <option value="Attrition Minimization">Attrition Minimization</option>
              </select>
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1 transition-all duration-300">
              {currentMeta.descLabel}
            </label>
            <textarea
              required
              placeholder={currentMeta.descPlaceholder}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm transition-all duration-300"
              rows="4"
            ></textarea>
          </div>

          {/* GOAL-SPECIFIC EXTENDED BOX ELEMENTS (ONLY SHOWS FOR GOALS) */}
          {commType === 'Goal' && (
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-top-4 duration-300">
              <div>
                <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1">Target Value</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5"
                  value={form.target}
                  onChange={e => setForm({ ...form, target: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1">Unit of Measurement (UoM)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Onboardings, %, Trainings"
                  value={form.uom}
                  onChange={e => setForm({ ...form, uom: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1">Weightage (%)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  required
                  value={form.weightage}
                  onChange={e => setForm({ ...form, weightage: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mb-1">Target Deadline</label>
                <input
                  type="date"
                  required
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] sm:text-sm"
                />
              </div>
            </div>
          )}

          {/* SUBMISSION BLOCK */}
          <div className="col-span-2 flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="submit"
              className="px-8 py-3 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 font-bold rounded-2xl transition-all text-sm shadow-lg shadow-amber-500/10 flex items-center uppercase tracking-wider"
            >
              <PortalIcon className="mr-2 h-4.5 w-4.5" />
              {currentMeta.buttonLabel}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Ledger Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Ledger 1: Manager Targets Tracking Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
              <Target className="h-4.5 w-4.5 text-zinc-500 dark:text-zinc-400 mr-2" /> Manager Corporate Targets Ledger
            </h4>
            <span className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-2.5 py-0.5 rounded-full">
              {assignedManagerTargets.length} Assigned
            </span>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-300 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Target Objective</th>
                  <th className="px-4 py-3 text-right">Progress Ticking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {assignedManagerTargets.map(target => (
                  <tr key={target._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">{target.ownerId?.name}</div>
                      <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">{target.ownerId?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-850">
                        {target.ownerId?.department}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-800 dark:text-zinc-100 truncate max-w-[150px]">{target.title}</div>
                      <div className="text-[9px] text-zinc-450 dark:text-zinc-500 mt-0.5">{target.target} {target.uom} | Weight: {target.weightage}%</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {target.isAchieved ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                          Completed & Ticked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyGoal(target._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {assignedManagerTargets.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-zinc-400 dark:text-zinc-500 italic">
                      No corporate targets currently delegated to managers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger 2: Historical sent direct message logs */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
              <Clock className="h-4.5 w-4.5 text-zinc-500 dark:text-zinc-400 mr-2" /> Sent Personalized Alerts Ledger
            </h4>
            <span className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-2.5 py-0.5 rounded-full">
              {messages.length} Sent Messages
            </span>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 overflow-y-auto max-h-[320px]">
            {messages.map(msg => (
              <div key={msg._id} className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50 transition-colors space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 bg-amber-50 dark:bg-amber-950/20 text-[#FFC20E] rounded-lg flex items-center justify-center font-extrabold text-[10px] uppercase border border-zinc-200 dark:border-zinc-850">
                      {msg.receiverId?.name[0]}
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{msg.receiverId?.name} ({msg.receiverId?.employeeId})</h5>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    msg.type === 'Complaint' 
                      ? 'bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30'
                      : msg.type === 'Performance Warning'
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-705 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                        : msg.type === 'Appreciation'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30'
                          : 'bg-zinc-150 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800'
                  }`}>
                    {msg.type}
                  </span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-3 text-[11px]">
                  <p className="font-extrabold text-zinc-650 dark:text-zinc-350 uppercase tracking-wide">Subject: {msg.subject}</p>
                  <p className="text-zinc-500 dark:text-zinc-450 mt-1 line-clamp-2 leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="py-12 text-center text-zinc-450 dark:text-zinc-500 text-xs italic">
                No personalized alerts have been sent to managers.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminGoals;
