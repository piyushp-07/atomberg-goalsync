import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Target, TrendingUp, Calendar, CheckSquare, MessageSquare, ShieldAlert, Sparkles, User, RefreshCw, Send, Copy, X } from 'lucide-react';

const TeamCheckIns = () => {
  const { user } = useContext(AuthContext);
  const [checkIns, setCheckIns] = useState([]);
  const [myGoals, setMyGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Comment drafting states
  const [commentingCheckInId, setCommentingCheckInId] = useState(null);
  const [managerCommentText, setManagerCommentText] = useState('');

  // Check-in adoption state
  const [adoptingCheckIn, setAdoptingCheckIn] = useState(null);
  const [selectedMyGoalId, setSelectedMyGoalId] = useState('');
  const [isAdopting, setIsAdopting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both team check-ins and manager's own goals
      const [teamCheckinsRes, myGoalsRes] = await Promise.all([
        api.get('/api/checkins?scope=team'),
        api.get('/api/goals?owner=self')
      ]);

      // Filter out self-checkins to only show other members' checkins
      const reportsCheckIns = teamCheckinsRes.data.filter(c => c.ownerId && c.ownerId._id !== user?._id);
      setCheckIns(reportsCheckIns);

      // Only active/approved targets can have check-ins logged against them
      setMyGoals(myGoalsRes.data.filter(g => g.status === 'Approved' || g.status === 'Locked' || g.isAchieved));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load check-ins metadata.');
      setLoading(false);
    }
  };

  const handlePostComment = async (checkInId) => {
    if (!managerCommentText.trim()) return;
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/checkins/${checkInId}/comment`, {
        managerComments: managerCommentText
      });
      setSuccess('Manager comments logged successfully!');
      setCommentingCheckInId(null);
      setManagerCommentText('');
      fetchData();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit manager comment.');
    }
  };

  const handleStartComment = (checkIn) => {
    setCommentingCheckInId(checkIn._id);
    setManagerCommentText(checkIn.managerComments || '');
  };

  const handleAdoptCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedMyGoalId || !adoptingCheckIn) return;
    setIsAdopting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/api/checkins', {
        goalId: selectedMyGoalId,
        quarter: adoptingCheckIn.quarter,
        plannedTarget: Number(adoptingCheckIn.plannedTarget),
        actualAchievement: Number(adoptingCheckIn.actualAchievement),
        status: adoptingCheckIn.status,
        employeeComments: `[Adopted from ${adoptingCheckIn.ownerId?.name || 'team member'}] ${adoptingCheckIn.employeeComments || ''}`
      });
      setSuccess(`Check-in parameters successfully adopted to your goal!`);
      setAdoptingCheckIn(null);
      setSelectedMyGoalId('');
      setIsAdopting(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to adopt check-in parameters.');
      setIsAdopting(false);
    }
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10">Loading team check-ins hub...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-zinc-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-[#FFC20E] text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-900/30 px-3 py-1 rounded-full w-max mb-3">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Management Review Hub</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Team Performance Check-ins</h2>
          <p className="text-zinc-400 mt-1 max-w-xl text-sm">Review planned vs actual achievements of direct reports, audit system-computed scores, and log manager feedback.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl border-zinc-300 dark:border-emerald-900/30">
          <div className="flex">
            <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="ml-3 text-emerald-800 dark:text-emerald-455 text-sm font-semibold">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl border-zinc-300 dark:border-red-900/30">
          <div className="flex">
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
            <p className="ml-3 text-red-800 dark:text-red-405 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-850 dark:text-zinc-100 flex items-center">
            <MessageSquare className="h-5 w-5 text-[#FFC20E] mr-2" />
            Pending Check-in Audits
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 font-medium">Continuous feedback loops for targets submitted by your teams.</p>
        </div>

        {checkIns.length === 0 ? (
          <div className="py-16 text-center text-zinc-450 dark:text-zinc-550 text-sm">
            <Target className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="font-bold text-zinc-700 dark:text-zinc-350">No team check-ins logged yet.</p>
            <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1">When employees submit check-ins for active quarters, they will appear here for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checkIns.map(checkIn => (
              <div key={checkIn._id} className="border border-zinc-300 dark:border-zinc-855 rounded-2xl p-5 bg-zinc-50/20 dark:bg-zinc-900/30 hover:border-[#FFC20E] transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-full bg-zinc-150 dark:bg-zinc-900 text-[#FFC20E] flex items-center justify-center font-bold text-xs border border-zinc-300 dark:border-zinc-850">
                        {checkIn.ownerId?.name ? checkIn.ownerId.name[0] : 'U'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-zinc-850 dark:text-zinc-150 text-sm">{checkIn.ownerId?.name || 'System User'}</h4>
                        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold">{checkIn.ownerId?.department || 'Department'} • {checkIn.quarter} Cycle</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        checkIn.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/30' :
                        checkIn.status === 'On Track' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-[#FFC20E] border border-amber-250 dark:border-amber-900/30' :
                        'bg-zinc-100 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-850'
                      }`}>
                        {checkIn.status}
                      </span>
                      <p className="text-md font-black text-zinc-850 dark:text-zinc-150 mt-1">{checkIn.score.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="mt-3 bg-white dark:bg-zinc-955 border border-zinc-300 dark:border-zinc-850 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wide">
                      {checkIn.hrResponsibility ? 'HR Responsibility Area' : 'Goal Objective'}
                    </p>
                    <p className="text-xs font-bold text-zinc-755 dark:text-zinc-205 mt-0.5">
                      {checkIn.hrResponsibility || checkIn.goalId?.title || 'Unknown Objective'}
                    </p>
                    {!checkIn.hrResponsibility && (
                      <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-zinc-250 dark:border-zinc-850 text-[11px]">
                        <div>
                          <span className="text-zinc-450">Planned Target:</span>
                          <p className="font-extrabold text-zinc-750 dark:text-zinc-250">{checkIn.plannedTarget} {checkIn.goalId?.uom}</p>
                        </div>
                        <div>
                          <span className="text-zinc-450">Actual Achievement:</span>
                          <p className="font-extrabold text-zinc-750 dark:text-zinc-250">{checkIn.actualAchievement} {checkIn.goalId?.uom}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs bg-white/50 dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-855 p-3 rounded-xl">
                    <span className="font-bold text-zinc-550 dark:text-zinc-400">Employee Comments:</span>
                    <p className="text-zinc-655 dark:text-zinc-350 italic mt-1 font-medium">"{checkIn.employeeComments || 'No comment provided.'}"</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-250 dark:border-zinc-850 space-y-3">
                  {commentingCheckInId === checkIn._id ? (
                    <div className="space-y-2">
                      <textarea
                        required
                        placeholder="Log constructive discussion remarks and feedback comments..."
                        value={managerCommentText}
                        onChange={e => setManagerCommentText(e.target.value)}
                        className="w-full text-xs border border-zinc-300 dark:border-zinc-805 rounded-xl p-2.5 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E]"
                        rows="2"
                      ></textarea>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setCommentingCheckInId(null)}
                          className="px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-950"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePostComment(checkIn._id)}
                          className="px-3.5 py-2 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-955 rounded-lg text-[11px] font-extrabold flex items-center shadow-md uppercase tracking-wider"
                        >
                          <Send className="h-3 w-3 mr-1" /> Log Comments
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-xs">
                      {checkIn.managerComments ? (
                        <div className="text-emerald-850 dark:text-emerald-450 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/30 rounded-xl p-3 flex-1 flex items-start space-x-1.5">
                          <MessageSquare className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                          <div>
                            <span className="font-bold block text-[10px]">Your feedback remarks:</span>
                            <p className="italic mt-0.5">"{checkIn.managerComments}"</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-450 dark:text-zinc-550 italic">No feedback comments logged yet.</span>
                      )}
                      
                      <div className="flex space-x-2 shrink-0 self-end md:self-auto">
                        {myGoals.length > 0 && (
                          <button
                            onClick={() => {
                              setAdoptingCheckIn(checkIn);
                              setSelectedMyGoalId(myGoals[0]?._id || '');
                            }}
                            className="px-3 py-2 border border-zinc-300 dark:border-zinc-800 hover:border-[#FFC20E] text-zinc-650 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-slate-950 hover:bg-[#FFC20E] font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center transition-all"
                            title="Adopt this check-in for one of your goals"
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" /> Use as Own
                          </button>
                        )}
                        <button
                          onClick={() => handleStartComment(checkIn)}
                          className="px-3.5 py-2 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-955 font-bold rounded-lg text-[10px] uppercase tracking-wider"
                        >
                          {checkIn.managerComments ? 'Edit Feedback' : 'Add Remarks'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-in Adoption Modal */}
      {adoptingCheckIn && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-300 dark:border-zinc-800 max-w-md w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setAdoptingCheckIn(null);
                setSelectedMyGoalId('');
              }}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-950 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Adopt Check-in as Own</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mb-6">
              You are copying the progress parameters of <strong className="text-zinc-700 dark:text-zinc-200">{adoptingCheckIn.ownerId?.name || 'reportee'}</strong> for <strong className="text-zinc-700 dark:text-zinc-200">{adoptingCheckIn.quarter} Cycle</strong> into one of your own active targets:
            </p>

            <form onSubmit={handleAdoptCheckIn} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Select Your Target Goal</label>
                <select 
                  required 
                  value={selectedMyGoalId} 
                  onChange={e => setSelectedMyGoalId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer"
                >
                  {myGoals.map(g => (
                    <option key={g._id} value={g._id} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950">{g.title} (Target: {g.target} {g.uom})</option>
                  ))}
                </select>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400 dark:text-zinc-500">Planned Target:</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-200">{adoptingCheckIn.plannedTarget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 dark:text-zinc-500">Actual Achievement:</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-200">{adoptingCheckIn.actualAchievement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 dark:text-zinc-500">Calculated Score:</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-200">{adoptingCheckIn.score.toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setAdoptingCheckIn(null);
                    setSelectedMyGoalId('');
                  }}
                  className="px-5 py-2.5 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-950 text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdopting || !selectedMyGoalId}
                  className="px-6 py-2.5 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-955 font-bold rounded-xl disabled:bg-zinc-350 disabled:dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10"
                >
                  {isAdopting ? 'Cloning...' : 'Confirm Adoption'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCheckIns;
