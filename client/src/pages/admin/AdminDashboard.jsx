import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, Target, Activity, Download, ArrowRight, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { darkMode } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/api/admin/analytics');
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,Employee,Goal Title,Status\nAlex Rivera,Increase Code Quality,Approved\nSarah Jenkins,Expand Team Capability,Approved";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "goalsync_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10">Loading system analytics...</div>;

  const COLORS = [
    '#3B82F6', // Vibrant Blue
    '#10B981', // Emerald Green
    '#F59E0B', // Warm Amber
    '#8B5CF6', // Royal Purple
    '#EC4899', // Premium Pink
    '#06B6D4', // Cyan
    '#EF4444', // Coral Red
    '#6366F1'  // Modern Indigo
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Admin Analytics Portal</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">System-wide HR overview and goal setting statistics.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-5 py-3 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 rounded-xl transition-all shadow-md shadow-amber-500/10 font-black text-xs uppercase tracking-wider"
        >
          <Download className="mr-2 h-4 w-4" /> Export Report
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Users Card -> Leads to User Management */}
        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#FFC20E] dark:hover:border-[#FFC20E] transition-all group"
        >
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider group-hover:text-[#FFC20E] transition-colors">Total Registered Users</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{stats?.totalUsers}</p>
            <span className="text-[9px] text-[#FFC20E] font-black uppercase tracking-widest mt-2 flex items-center">
              Manage Headcount <ArrowRight className="h-3 w-3 ml-1.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors text-[#FFC20E]">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Total Goals Card -> Leads to Goal Registry */}
        <div 
          onClick={() => navigate('/admin/goals')}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#FFC20E] dark:hover:border-[#FFC20E] transition-all group"
        >
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider group-hover:text-[#FFC20E] transition-colors">Total System Goals</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{stats?.totalGoals}</p>
            <span className="text-[9px] text-[#FFC20E] font-black uppercase tracking-widest mt-2 flex items-center">
              Registry Logs <ArrowRight className="h-3 w-3 ml-1.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors text-[#FFC20E]">
            <Target className="h-6 w-6" />
          </div>
        </div>

        {/* Communication Portal Card -> Leads to Manager Communications */}
        <div 
          onClick={() => navigate('/admin/manager-comm')}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-300 dark:border-zinc-800 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#FFC20E] dark:hover:border-[#FFC20E] transition-all group"
        >
          <div>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider group-hover:text-[#FFC20E] transition-colors">Communication Channels</p>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-450 mt-1">Active</p>
            <span className="text-[9px] text-[#FFC20E] font-black uppercase tracking-widest mt-2 flex items-center">
              Delegate Targets <ArrowRight className="h-3 w-3 ml-1.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors text-[#FFC20E]">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Goal Status Volume BarChart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center">
            <BarChart3 className="h-4.5 w-4.5 text-[#FFC20E] mr-2" /> Goal Status Volume Distribution
          </h3>
          <div className="h-72 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.statusDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#27272a' : '#e4e4e7'} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#18181b' : '#ffffff', 
                    borderRadius: '12px', 
                    border: darkMode ? '1px solid #27272a' : '1px solid #d4d4d8', 
                    color: darkMode ? '#f4f4f5' : '#18181b'
                  }}
                />
                <Bar dataKey="value" fill="#FFC20E" radius={[6, 6, 0, 0]} barSize={40}>
                  {(stats?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goal Status Composition PieChart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center">
            <PieIcon className="h-4.5 w-4.5 text-[#FFC20E] mr-2" /> Performance Goal Composition Ratio
          </h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.statusDistribution || []}
                  cx="50%" cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {(stats?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#18181b' : '#ffffff', 
                    borderRadius: '12px', 
                    border: darkMode ? '1px solid #27272a' : '1px solid #d4d4d8',
                    color: darkMode ? '#f4f4f5' : '#18181b'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
