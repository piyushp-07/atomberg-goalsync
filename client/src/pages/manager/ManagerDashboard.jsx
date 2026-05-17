import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Users, CheckSquare, Clock, TrendingUp, Award, ChevronRight, X, FileText, CheckCircle2, ShieldAlert, MessageSquare, Tag, AlertTriangle, Sparkles, Send } from 'lucide-react';

const ManagerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'reports', 'verified', 'pending', or null
  const [selectedMsg, setSelectedMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const goalsRes = await api.get('/api/goals');
      const reportsRes = await api.get('/api/manager/reports');
      const msgRes = await api.get('/api/messages/inbox');
      
      setGoals(goalsRes.data);
      setReports(reportsRes.data);
      setMessages(msgRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch manager metrics');
      setLoading(false);
    }
  };

  const handleVerify = async (goalId) => {
    try {
      await api.put(`/api/goals/${goalId}/verify`);
      setSuccess('Goal verified successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to verify goal');
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10">Loading dashboard...</div>;

  // Filter goals assigned to direct reports (managed by this manager, excluding manager's own goals)
  const teamGoals = goals.filter(g => g.ownerId && g.ownerId._id !== user?._id && g.thrustArea !== 'Employment Target');

  // Filter manager's own employment targets assigned to them by HR
  const myHrTargets = goals.filter(g => g.ownerId && g.ownerId._id === user?._id && g.thrustArea === 'Employment Target');

  // Compute live statistics
  const totalTeamGoals = teamGoals.length;
  const approvedTeamGoalsList = teamGoals.filter(g => g.isAchieved);
  const pendingTeamGoalsList = teamGoals.filter(g => g.status === 'Submitted' && !g.isAchieved);
  
  const approvedCount = approvedTeamGoalsList.length;
  const pendingCount = pendingTeamGoalsList.length;

  // Completion rate
  const completionRate = totalTeamGoals > 0 ? Math.round((approvedCount / totalTeamGoals) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Manager Performance Dashboard</h2>
          <p className="text-zinc-550 dark:text-zinc-400 font-medium">Live operational oversight of team objectives, corporate HR targets, and HR message channels.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl text-emerald-800 dark:text-emerald-450 text-sm font-semibold border-zinc-300 dark:border-emerald-900/30">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl text-red-800 dark:text-red-400 text-sm font-semibold border-zinc-300 dark:border-red-900/30">
          {error}
        </div>
      )}

      {/* Roster counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clickable Direct Reports Card */}
        <div 
          onClick={() => setActiveModal('reports')}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#FFC20E] dark:hover:border-[#FFC20E] transition-all group"
        >
          <div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-[#FFC20E] transition-colors">Active Direct Reports</p>
            <p className="text-3xl font-extrabold text-zinc-850 dark:text-zinc-100 mt-1">{reports.length}</p>
            <span className="text-[10px] text-[#FFC20E] font-bold uppercase tracking-wider mt-1 block">Click to view roster →</span>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 group-hover:bg-[#FFC20E]/10 transition-colors">
            <Users className="h-6 w-6 text-[#FFC20E]" />
          </div>
        </div>

        {/* Clickable Verified Goals Card */}
        <div 
          onClick={() => setActiveModal('verified')}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#FFC20E] dark:hover:border-[#FFC20E] transition-all group"
        >
          <div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-[#FFC20E] transition-colors">Verified & Completed Goals</p>
            <p className="text-3xl font-extrabold text-zinc-850 dark:text-zinc-100 mt-1">{approvedCount}</p>
            <span className="text-[10px] text-[#FFC20E] font-bold uppercase tracking-wider mt-1 block">Click to view achieved →</span>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 group-hover:bg-[#FFC20E]/10 transition-colors">
            <CheckSquare className="h-6 w-6 text-[#FFC20E]" />
          </div>
        </div>

        {/* Clickable Pending Review Card */}
        <div 
          onClick={() => setActiveModal('pending')}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#FFC20E] dark:hover:border-[#FFC20E] transition-all group"
        >
          <div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-[#FFC20E] transition-colors">Awaiting Verification Ticks</p>
            <p className="text-3xl font-extrabold text-zinc-850 dark:text-zinc-100 mt-1">{pendingCount}</p>
            <span className="text-[10px] text-[#FFC20E] font-bold uppercase tracking-wider mt-1 block">Click to verify proofs →</span>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 group-hover:bg-[#FFC20E]/10 transition-colors">
            <Clock className="h-6 w-6 text-[#FFC20E]" />
          </div>
        </div>
      </div>

      {/* Progress Report & Dynamic Alert Inbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Progress Report */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center">
              <TrendingUp className="h-5 w-5 text-[#FFC20E] mr-2" /> Team Progress Report
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Aggregated goal completion rate based on verified ticks.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-black text-zinc-850 dark:text-zinc-100">{completionRate}%</span>
                <span className="text-xs text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider block mt-1">Goal Completion Rate</span>
              </div>
              <span className="text-xs font-bold text-zinc-550 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 rounded-full">
                {approvedCount} of {totalTeamGoals} Goals Ticked
              </span>
            </div>

            <div className="w-full bg-zinc-200 dark:bg-zinc-950 h-4 rounded-full overflow-hidden shadow-inner border border-zinc-300 dark:border-zinc-800">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-md"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 text-xs">
            <span className="text-zinc-450 dark:text-zinc-500 font-semibold">Ticking a pending submission immediately boosts this index in real-time.</span>
            <a 
              href="/manager/team-goals" 
              className="text-[#FFC20E] hover:text-amber-500 font-bold flex items-center transition-colors group"
            >
              Go to Team Goals Operations <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* HR Personalized Alerts Inbox */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-[#FFC20E] flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-[#FFC20E]" /> HR Direct Alert Inbox
            </h4>
            <span className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 text-amber-800 dark:text-[#FFC20E] text-[10px] font-bold px-2 py-0.5 rounded-full">
              {messages.length} Alerts
            </span>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 overflow-y-auto max-h-[220px] flex-grow pr-1">
            {messages.map(msg => (
              <div 
                key={msg._id} 
                onClick={() => setSelectedMsg(msg)}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-950 cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    msg.type === 'Complaint' 
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 border-red-200 dark:border-red-900/30'
                      : msg.type === 'Performance Warning'
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#FFC20E] border-amber-200 dark:border-amber-900/30'
                        : msg.type === 'Appreciation'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                  }`}>
                    {msg.type}
                  </span>
                  <span className="text-[10px] text-zinc-450 dark:text-zinc-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                <h5 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-150 truncate">{msg.subject}</h5>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-450 line-clamp-1">{msg.content}</p>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="py-12 text-center text-zinc-450 dark:text-zinc-500 text-xs italic">
                No corporate notifications from HR.
              </div>
            )}
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-450 dark:text-zinc-500 text-center font-bold">
            Strict HR to Manager Authorized Loop
          </div>
        </div>
      </div>

      {/* HR ASSIGNED CORPORATE EMPLOYMENT TARGETS */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-850">
          <div>
            <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
              <Tag className="h-5 w-5 text-[#FFC20E] mr-2" /> My Employment Targets from HR
            </h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 font-medium">Corporate benchmarks assigned strictly to you by the HR team.</p>
          </div>
          <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#FFC20E] text-xs font-bold px-3 py-1 rounded-full border border-amber-250 dark:border-amber-900/30">
            {myHrTargets.length} Active Targets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myHrTargets.map(target => (
            <div key={target._id} className="border border-zinc-300 dark:border-zinc-850 rounded-2xl p-5 bg-zinc-50/20 dark:bg-zinc-950/20 space-y-4 hover:border-[#FFC20E] hover:shadow-sm transition-all relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#FFC20E] border border-amber-250 dark:border-amber-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {target.category || 'Employment Metric'}
                  </span>
                  <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-150 mt-2">{target.title}</h4>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${
                  target.isAchieved 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/30' 
                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#FFC20E] border-amber-250 dark:border-amber-900/30'
                }`}>
                  {target.isAchieved ? 'Completed' : 'Active'}
                </span>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{target.description}</p>

              <div className="flex justify-between text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 p-2.5 rounded-xl text-zinc-650 dark:text-zinc-400">
                <span>Target: <strong>{target.target} {target.uom}</strong></span>
                <span>Deadline: <strong>{new Date(target.deadline).toLocaleDateString()}</strong></span>
              </div>
            </div>
          ))}

          {myHrTargets.length === 0 && (
            <div className="col-span-full py-8 text-center text-zinc-450 dark:text-zinc-550 text-xs italic">
              No corporate employment targets assigned to you.
            </div>
          )}
        </div>
      </div>

      {/* METRIC MODALS */}
      
      {/* 1. Direct Reports Roster Modal */}
      {activeModal === 'reports' && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-lg w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-150 mb-2 flex items-center">
              <Users className="mr-2 h-5 w-5 text-[#FFC20E]" /> Direct Reports Roster ({reports.length})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 mb-6">List of employees reporting to you in the {user?.department} department.</p>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {reports.map(rep => (
                <div key={rep._id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{rep.name}</h4>
                    <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-0.5">{rep.email}</p>
                  </div>
                  <span className="text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#FFC20E] border border-amber-250 dark:border-amber-900/30 px-2.5 py-1 rounded-full">
                    {rep.employeeId}
                  </span>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center text-zinc-450 dark:text-zinc-550 py-8">No reports allocated.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Verified Goals Modal */}
      {activeModal === 'verified' && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-2xl w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-150 mb-2 flex items-center">
              <CheckSquare className="mr-2 h-5 w-5 text-emerald-500" /> Completed & Verified Targets ({approvedCount})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 mb-6">Historical record of team goals that you have checked off as achieved.</p>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {approvedTeamGoalsList.map(goal => (
                <div key={goal._id} className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex justify-between items-center space-x-4">
                  <div className="truncate">
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm truncate">{goal.title}</h4>
                    <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">
                      Assignee: <strong className="text-zinc-600 dark:text-zinc-300 font-semibold">{goal.ownerId?.name} ({goal.ownerId?.employeeId})</strong>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-zinc-750 dark:text-zinc-250">{goal.target} {goal.uom}</p>
                    <p className="text-[10px] text-amber-700 dark:text-[#FFC20E] font-semibold">Weight: {goal.weightage}%</p>
                  </div>
                </div>
              ))}
              {approvedCount === 0 && (
                <div className="text-center text-zinc-450 dark:text-zinc-550 py-8">No goals completed yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Awaiting Verification Ticks Modal */}
      {activeModal === 'pending' && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-2xl w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-150 mb-2 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-amber-600" /> Live Verification Queue ({pendingCount})
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 mb-6">Review notes and complete target tickets directly from the dashboard.</p>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {pendingTeamGoalsList.map(goal => (
                <div key={goal._id} className="p-4 bg-amber-50/10 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{goal.title}</h4>
                      <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-0.5">Submitted by: <strong className="text-zinc-600 dark:text-zinc-300 font-semibold">{goal.ownerId?.name} ({goal.ownerId?.employeeId})</strong></p>
                    </div>
                    <button
                      onClick={() => handleVerify(goal._id)}
                      className="flex items-center px-4 py-2 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-955 font-bold text-xs rounded-xl shadow-md uppercase tracking-wider"
                    >
                      Verify & Tick
                    </button>
                  </div>
                  
                  <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-850 text-xs italic text-zinc-650 dark:text-zinc-350">
                    "{goal.submissionText}"
                  </div>

                  {goal.submissionFile && (
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 bg-white/60 dark:bg-zinc-900/60 p-2 rounded-lg border border-zinc-200 dark:border-zinc-850">
                      <FileText className="h-3.5 w-3.5 text-[#FFC20E]" />
                      <span className="font-semibold truncate text-zinc-650 dark:text-zinc-400">{goal.submissionFile}</span>
                    </div>
                  )}
                </div>
              ))}
              {pendingCount === 0 && (
                <div className="text-center text-zinc-450 dark:text-zinc-550 py-8">No tasks awaiting ticks!</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HR Message Details Popup Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-lg w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedMsg(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-2 mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                selectedMsg.type === 'Complaint' 
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 border-red-100 dark:border-red-900/30'
                  : selectedMsg.type === 'Performance Warning'
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#FFC20E] border-amber-100 dark:border-amber-900/30'
                    : selectedMsg.type === 'Appreciation'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/30'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}>
                {selectedMsg.type}
              </span>
              <span className="text-xs text-zinc-450 dark:text-zinc-500">{new Date(selectedMsg.createdAt).toLocaleDateString()}</span>
            </div>

            <h3 className="text-lg font-bold text-zinc-850 dark:text-zinc-100 mb-1 leading-snug">HR Corporate Alert</h3>
            <h4 className="text-xs font-bold text-amber-700 dark:text-[#FFC20E] uppercase tracking-wide mb-4">Subject: {selectedMsg.subject}</h4>

            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-350 dark:border-zinc-850 rounded-2xl p-4 text-sm text-zinc-750 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap">
              {selectedMsg.content}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-250 dark:border-zinc-850 flex justify-between items-center text-xs text-zinc-450 dark:text-zinc-555 font-bold">
              <span>Sender: HR Corporate Team</span>
              <button 
                onClick={() => setSelectedMsg(null)}
                className="px-4 py-2 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-955 font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
