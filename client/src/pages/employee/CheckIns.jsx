import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Target, TrendingUp, Calendar, CheckSquare, MessageSquare, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

const CheckIns = () => {
  const { user } = useContext(AuthContext);
  const isHR = user?.role === 'Admin';

  const [goals, setGoals] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Selection state
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedResponsibility, setSelectedResponsibility] = useState('');

  const [formData, setFormData] = useState({
    quarter: 'Q1', 
    plannedTarget: '', 
    actualAchievement: '', 
    status: 'Not Started',
    employeeComments: ''
  });

  const hrResponsibilities = [
    "Recruitment & Talent Acquisition",
    "Employee Relations & Engagement",
    "Performance Management Operations",
    "Policy Compliance & Audit",
    "Training & Professional Development",
    "Payroll & Employee Benefits",
    "HR Operations & Analytics",
    "Other Corporate Responsibilities"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (isHR) {
        // HR doesn't fetch system goals for check-ins, only her check-ins
        const checkInsRes = await api.get('/api/checkins');
        setCheckIns(checkInsRes.data);
        // Default select responsibility
        setSelectedResponsibility(hrResponsibilities[0]);
      } else {
        const [goalsRes, checkInsRes] = await Promise.all([
          api.get('/api/goals?owner=self'),
          api.get('/api/checkins')
        ]);
        // Only approved/active goals can have quarterly check-ins logged against them
        setGoals(goalsRes.data.filter(g => g.status === 'Approved' || g.status === 'Locked' || g.isAchieved));
        setCheckIns(checkInsRes.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch check-in details.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isHR) {
        // HR responsibility check-in
        await api.post('/api/checkins', {
          hrResponsibility: selectedResponsibility,
          quarter: formData.quarter,
          status: formData.status,
          employeeComments: formData.employeeComments
        });
      } else {
        // Employee / Manager goal check-in
        await api.post('/api/checkins', { 
          ...formData, 
          goalId: selectedGoal,
          plannedTarget: Number(formData.plannedTarget),
          actualAchievement: Number(formData.actualAchievement)
        });
      }

      setFormData({ 
        quarter: 'Q1', 
        plannedTarget: '', 
        actualAchievement: '', 
        status: 'Not Started',
        employeeComments: '' 
      });
      setSelectedGoal('');
      setSuccess('Check-in successfully logged!');
      fetchData();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit check-in');
    }
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10">Loading check-in hub...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-zinc-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-[#FFC20E] text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-900/30 px-3 py-1 rounded-full w-max mb-3">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{isHR ? 'HR Responsibility & Governance Hub' : 'Quarterly Accountability Hub'}</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">{isHR ? 'HR Operations Check-ins' : 'Continuous Check-ins'}</h2>
          <p className="text-zinc-400 mt-1 max-w-xl text-sm">
            {isHR 
              ? 'Log progress on corporate HR responsibilities, track cycles, and maintain continuous performance compliance logs.'
              : 'Log achievements, track targets synchronously, and review direct manager comments.'
            }
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl border-zinc-300 dark:border-emerald-900/30">
          <div className="flex">
            <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="ml-3 text-emerald-800 dark:text-emerald-400 text-sm font-semibold">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl border-zinc-300 dark:border-red-900/30">
          <div className="flex">
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
            <p className="ml-3 text-red-800 dark:text-red-400 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* New Check-in Form Card */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6 h-max">
          <div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
              <CheckSquare className="h-5 w-5 text-[#FFC20E] mr-2" />
              {isHR ? 'Log HR Responsibility' : 'Log Achievement Target'}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
              {isHR ? 'Manually log operations status and comments.' : 'Review target vs actual and note comments.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isHR ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Select HR Responsibility</label>
                <select 
                  required 
                  value={selectedResponsibility} 
                  onChange={e => setSelectedResponsibility(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer"
                >
                  {hrResponsibilities.map((resp, i) => (
                    <option key={i} value={resp} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950">{resp}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Select Active Goal</label>
                <select 
                  required 
                  value={selectedGoal} 
                  onChange={e => setSelectedGoal(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer"
                >
                  <option value="" disabled className="text-zinc-400 dark:text-zinc-500">Select an approved goal...</option>
                  {goals.map(g => (
                    <option key={g._id} value={g._id} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950">{g.title} (Target: {g.target} {g.uom})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider mb-1">Cycle Quarter</label>
                <select 
                  value={formData.quarter} 
                  onChange={e => setFormData({...formData, quarter: e.target.value})}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-amber-900/20 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer"
                >
                  <option value="Q1" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium">Q1 July</option>
                  <option value="Q2" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium">Q2 October</option>
                  <option value="Q3" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium">Q3 January</option>
                  <option value="Q4" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium">Q4 March/April</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider mb-1">Cycle Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-amber-900/20 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer"
                >
                  <option value="Not Started" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium">Not Started</option>
                  <option value="On Track" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium">On Track</option>
                  <option value="Completed" className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 font-medium">Completed</option>
                </select>
              </div>
            </div>

            {!isHR && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider mb-1">Planned Target</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="e.g. 50"
                    value={formData.plannedTarget} 
                    onChange={e => setFormData({...formData, plannedTarget: e.target.value})}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider mb-1">Actual Achievement</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="e.g. 52"
                    value={formData.actualAchievement} 
                    onChange={e => setFormData({...formData, actualAchievement: e.target.value})}
                    className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm" 
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider mb-1">Comments / Key Deliverables</label>
              <textarea 
                required
                placeholder={isHR ? "Detail operations progress and execution context for this HR responsibility..." : "Log details of targets achieved during this quarter cycle..."}
                value={formData.employeeComments} 
                onChange={e => setFormData({...formData, employeeComments: e.target.value})}
                className="w-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm" 
                rows="4"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={!isHR && !selectedGoal}
              className="w-full flex items-center justify-center py-3 bg-[#FFC20E] hover:bg-[#FFB800] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/10"
            >
              <CheckSquare className="mr-2 h-4 w-4" /> {isHR ? 'Log HR Compliance Check-in' : 'Log Cycle Check-in'}
            </button>
          </form>
        </div>

        {/* Check-in History Cards / Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
                <Calendar className="h-5 w-5 text-[#FFC20E] mr-2" />
                Check-in Logs Ledger
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 font-medium">
                {isHR ? 'Operational performance compliance check-ins audit log.' : 'Continuous progress tracking logs including calculated scores and manager comments.'}
              </p>
            </div>

            {checkIns.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 dark:text-zinc-555 text-sm">
                <Target className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="font-bold text-zinc-700 dark:text-zinc-300">Your check-in log is empty.</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Use the form on the left to document and submit your targets for the active quarter cycle.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checkIns.map(checkIn => {
                  const checkInIsHR = !!checkIn.hrResponsibility;
                  return (
                    <div key={checkIn._id} className="border border-zinc-300 dark:border-zinc-800 rounded-2xl p-5 bg-zinc-50/20 dark:bg-zinc-900/30 hover:border-[#FFC20E] transition-all space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black text-amber-700 dark:text-[#FFC20E] bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {checkIn.quarter} Cycle
                          </span>
                          <h4 className="font-extrabold text-zinc-850 dark:text-zinc-100 text-sm mt-2">
                            {checkInIsHR 
                              ? checkIn.hrResponsibility 
                              : (checkIn.goalId?.title || 'Unknown Objective')
                            }
                          </h4>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            checkIn.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30' :
                            checkIn.status === 'On Track' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#FFC20E] border border-amber-250 dark:border-amber-900/30' :
                            'bg-zinc-100 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                          }`}>
                            {checkIn.status}
                          </span>
                          <p className="text-lg font-black text-zinc-850 dark:text-zinc-100 mt-1">{checkIn.score.toFixed(1)}%</p>
                        </div>
                      </div>

                      {!checkInIsHR && (
                        <div className="grid grid-cols-3 gap-4 text-xs bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-3 rounded-xl">
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-widest text-[8px]">Planned</span>
                            <p className="font-bold text-zinc-700 dark:text-zinc-200 mt-0.5">{checkIn.plannedTarget} {checkIn.goalId?.uom}</p>
                          </div>
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-widest text-[8px]">Actual</span>
                            <p className="font-bold text-zinc-700 dark:text-zinc-200 mt-0.5">{checkIn.actualAchievement} {checkIn.goalId?.uom}</p>
                          </div>
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-widest text-[8px]">Goal UoM</span>
                            <p className="font-bold text-zinc-700 dark:text-zinc-200 mt-0.5">{checkIn.goalId?.uom}</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-extrabold text-zinc-500 dark:text-zinc-400">Comments / Deliverables:</span>
                          <p className="text-zinc-650 dark:text-zinc-300 bg-white/50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-3 rounded-xl mt-1 italic font-medium">
                            "{checkIn.employeeComments || 'No comment provided.'}"
                          </p>
                        </div>

                        {!checkInIsHR && (
                          checkIn.managerComments ? (
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl mt-2 flex items-start space-x-2">
                              <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-emerald-800 dark:text-emerald-450">Manager Discussion Feedback:</span>
                                <p className="text-emerald-700 dark:text-emerald-400 italic mt-0.5">"{checkIn.managerComments}"</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-zinc-400 dark:text-zinc-500 text-[10px] italic pt-1">
                              Waiting for manager review remarks comments...
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIns;
