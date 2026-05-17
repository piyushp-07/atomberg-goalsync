import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Target, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const EmployeeDashboard = () => {
  const { user, darkMode } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { data } = await api.get('/api/goals');
        setGoals(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 font-bold animate-pulse text-sm">
        Loading Employee Dashboard Analytics...
      </div>
    );
  }

  const totalGoals = goals.length;
  
  // 1. Approved & Achieved: The goal is explicitly verified and marked complete by manager
  const approvedGoals = goals.filter(g => g.isAchieved || g.status === 'Locked').length;
  
  // 2. Active / In Progress: Goal sheet has been approved, employee is actively working on it
  const activeGoals = goals.filter(g => g.status === 'Approved' && !g.isAchieved).length;
  
  // 3. Pending Review: Employee submitted proof document, waiting for manager verification
  const submittedGoals = goals.filter(g => g.status === 'Submitted' && !g.isAchieved).length;
  
  // 4. Drafts / Rework: Under planning/draft phase
  const draftGoals = goals.filter(g => g.status === 'Draft' || g.status === 'Returned').length;

  const statusData = [
    { name: 'Approved & Completed', value: approvedGoals, color: '#10b981' },
    { name: 'Active / In Progress', value: activeGoals, color: '#3b82f6' },
    { name: 'Pending Review', value: submittedGoals, color: '#f59e0b' },
    { name: 'Drafts / Rework', value: draftGoals, color: '#71717a' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
          Welcome back, {user?.name}
        </h2>
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-450 mt-1 uppercase tracking-wider">
          Here is an overview of your performance goals.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Total Goals</p>
              <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{totalGoals}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-full shrink-0">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Approved & Achieved</p>
              <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{approvedGoals}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-full shrink-0">
              <CheckCircle className="h-6 w-6 text-green-655 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Active / In Progress</p>
              <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{activeGoals}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-full shrink-0">
              <Clock className="h-6 w-6 text-blue-550 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Pending Review</p>
              <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{submittedGoals}</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-full shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Diagrams & Recent Action log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Goal Distribution Pie-chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm transition-all duration-300">
          <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            Goal Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <div className="h-64 flex flex-col justify-between">
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#18181b' : '#ffffff', 
                        borderColor: darkMode ? '#27272a' : '#e4e4e7',
                        color: darkMode ? '#f4f4f5' : '#18181b',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-6 mt-4 flex-wrap gap-y-2">
                {statusData.map(item => (
                  <div key={item.name} className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-[10px] font-bold text-zinc-655 dark:text-zinc-300 uppercase tracking-wider">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-xs italic">
              No active goal status data available.
            </div>
          )}
        </div>
        
        {/* Recent Activity Log */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm transition-all duration-300">
          <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            Recent Activity
          </h3>
          <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
            {goals.slice(0, 5).map(goal => (
              <div key={goal._id} className="flex items-start space-x-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850">
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${goal.isAchieved || goal.status === 'Locked' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div className="flex-grow">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-normal">{goal.title}</p>
                  <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wide mt-1">
                    Status: {goal.isAchieved ? 'Achieved' : goal.status === 'Approved' ? 'Active' : goal.status}
                  </p>
                </div>
              </div>
            ))}
            {goals.length === 0 && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic py-10 text-center">No recent goal activity logged.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
