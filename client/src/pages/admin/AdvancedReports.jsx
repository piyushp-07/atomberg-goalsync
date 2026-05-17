import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Download, Filter, HelpCircle, Briefcase, Target, 
  Award, ShieldCheck, AlertCircle, RefreshCw, BarChart3, Search
} from 'lucide-react';

const AdvancedReports = () => {
  const { darkMode } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [deptFilter, setDeptFilter] = useState('All');
  const [quarterFilter, setQuarterFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const goalsRes = await api.get('/api/goals');
      const checkInsRes = await api.get('/api/checkins?scope=team');
      
      setGoals(goalsRes.data);
      setCheckIns(checkInsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to aggregate corporate reporting registry.');
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredCheckIns.length === 0) return;

    // Headers
    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Goal Title',
      'Quarter Cycle',
      'Planned Target',
      'Actual Achievement',
      'Calculated Score (%)',
      'Status',
      'Employee Comments',
      'Manager Comments'
    ];

    // Rows
    const rows = filteredCheckIns.map(ci => {
      const owner = ci.ownerId || {};
      const goal = ci.goalId || {};
      return [
        `"${owner.employeeId || 'N/A'}"`,
        `"${owner.name || 'N/A'}"`,
        `"${owner.department || 'N/A'}"`,
        `"${(goal.title || 'N/A').replace(/"/g, '""')}"`,
        `"${ci.quarter || 'N/A'}"`,
        ci.plannedTarget,
        ci.actualAchievement,
        ci.score,
        `"${ci.status || 'N/A'}"`,
        `"${(ci.employeeComments || 'N/A').replace(/"/g, '""')}"`,
        `"${(ci.managerComments || 'N/A').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Atomberg_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-[#FFC20E] font-semibold p-10">Loading corporate analytics deck...</div>;

  // Filter lists
  const departments = ['Engineering', 'Product', 'Sales', 'Marketing', 'Customer Support', 'HR'];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Apply filters
  const filteredCheckIns = checkIns.filter(ci => {
    const owner = ci.ownerId || {};
    const goal = ci.goalId || {};
    
    const matchesDept = deptFilter === 'All' || owner.department === deptFilter;
    const matchesQuarter = quarterFilter === 'All' || ci.quarter === quarterFilter;
    
    const matchesSearch = 
      owner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.title?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesQuarter && matchesSearch;
  });

  // Calculate Metrics
  const totalSubmissions = filteredCheckIns.length;
  
  const avgScore = totalSubmissions > 0 
    ? Math.round(filteredCheckIns.reduce((acc, curr) => acc + curr.score, 0) / totalSubmissions) 
    : 0;

  const onTrackSubmissions = filteredCheckIns.filter(ci => ci.score >= 80).length;
  const onTrackRate = totalSubmissions > 0 
    ? Math.round((onTrackSubmissions / totalSubmissions) * 100) 
    : 0;

  const pendingCommentsCount = filteredCheckIns.filter(ci => !ci.managerComments).length;

  // Data processing for charts
  const deptScoresData = departments.map(dept => {
    const deptCi = checkIns.filter(ci => ci.ownerId?.department === dept);
    const avg = deptCi.length > 0 
      ? Math.round(deptCi.reduce((acc, curr) => acc + curr.score, 0) / deptCi.length)
      : 0;
    return { name: dept, score: avg };
  });

  // Category Distribution
  const categoryDataMap = {};
  goals.forEach(goal => {
    const cat = goal.category || 'Strategic Target';
    categoryDataMap[cat] = (categoryDataMap[cat] || 0) + 1;
  });
  const categoryChartData = Object.keys(categoryDataMap).map(key => ({
    name: key,
    value: categoryDataMap[key]
  }));

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

  // Top Performing Talent List
  const userAverageMap = {};
  checkIns.forEach(ci => {
    const userId = ci.ownerId?._id;
    if (!userId) return;
    if (!userAverageMap[userId]) {
      userAverageMap[userId] = {
        name: ci.ownerId.name,
        employeeId: ci.ownerId.employeeId,
        department: ci.ownerId.department,
        scores: []
      };
    }
    userAverageMap[userId].scores.push(ci.score);
  });

  const topTalent = Object.keys(userAverageMap)
    .map(key => {
      const u = userAverageMap[key];
      const avg = Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length);
      return { ...u, average: avg };
    })
    .sort((a, b) => b.average - a.average)
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
            <BarChart3 className="h-6 w-6 text-[#FFC20E] mr-2.5" /> Performance Analytics & Advanced Reports
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Aggregate continuous check-ins metrics, analyze department standings, and generate spreadsheet reports.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="p-2.5 border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            title="Refresh Ledger Datasets"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={filteredCheckIns.length === 0}
            className="flex items-center px-5 py-2.5 bg-[#FFC20E] hover:bg-[#FFB800] text-slate-950 rounded-xl transition-all text-xs font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV Report
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl border-zinc-300 dark:border-red-900/30">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="ml-3 text-red-800 dark:text-red-400 text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Avg Completion Score</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{avgScore}%</p>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <TrendingUp className="h-6 w-6 text-[#FFC20E]" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Target Success Rate</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{onTrackRate}%</p>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/10 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-450" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Analyzed Check-ins</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{totalSubmissions}</p>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <Target className="h-6 w-6 text-[#FFC20E]" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-300 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Pending Reviews</p>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{pendingCommentsCount}</p>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-zinc-200 dark:border-zinc-850">
            <HelpCircle className="h-6 w-6 text-amber-650 dark:text-amber-400" />
          </div>
        </div>

      </div>

      {/* Control Center: Search & Filter */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by talent name, employee ID, or goal target..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50/50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm"
          />
        </div>

        <div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer font-medium"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            <select
              value={quarterFilter}
              onChange={e => setQuarterFilter(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-sm cursor-pointer font-medium"
            >
              <option value="All">All Quarters</option>
              {quarters.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Standings (BarChart) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center">
            <TrendingUp className="h-4.5 w-4.5 text-[#FFC20E] mr-2" /> Comparative Department Performance Standings (%)
          </h3>
          <div className="h-[320px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptScoresData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#27272a' : '#e4e4e7'} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: darkMode ? '#27272a/30' : '#f4f4f5' }}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#18181b' : '#ffffff', 
                    borderRadius: '12px', 
                    border: darkMode ? '1px solid #27272a' : '1px solid #d4d4d8', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    color: darkMode ? '#f4f4f5' : '#18181b'
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="score" fill="#FFC20E" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {deptScoresData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goal Category Breakdown (PieChart) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center">
            <Award className="h-4.5 w-4.5 text-[#FFC20E] mr-2" /> Category Objectives Weightage Count
          </h3>
          <div className="h-[240px] w-full relative flex items-center justify-center">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#18181b' : '#ffffff', 
                      borderRadius: '12px', 
                      border: darkMode ? '1px solid #27272a' : '1px solid #d4d4d8',
                      color: darkMode ? '#f4f4f5' : '#18181b'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-400 text-xs italic">No goals found</div>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-auto space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
            {categoryChartData.map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center text-[10px] font-semibold text-zinc-650 dark:text-zinc-400">
                <div className="flex items-center space-x-1.5 truncate max-w-[170px]">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="truncate text-zinc-700 dark:text-zinc-350" title={entry.name}>{entry.name}</span>
                </div>
                <span>{entry.value} Targets</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Underneath Talent Highlights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Talent Spotlight */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center mb-1">
              <Award className="h-4.5 w-4.5 text-amber-500 mr-2" /> Top Continuous Performers
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Talents maintaining the highest weighted check-in averages.</p>
          </div>

          <div className="space-y-4">
            {topTalent.map((u, i) => (
              <div key={u.name} className="flex justify-between items-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 hover:scale-[1.01] transition-transform duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs text-slate-950 bg-[#FFC20E] shadow-md shadow-amber-500/10`}>
                    {i + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{u.name}</h5>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">{u.employeeId} • {u.department}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-zinc-850 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-2.5 py-1 rounded-xl">
                  {u.average}%
                </span>
              </div>
            ))}

            {topTalent.length === 0 && (
              <div className="text-zinc-400 text-xs italic text-center py-6">
                No check-in logs submitted to rank.
              </div>
            )}
          </div>
        </div>

        {/* Detailed Check-in Activity Logs */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Filtered Check-in Activity</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Real-time performance scores recorded in current register scope.</p>
            </div>
            <span className="text-xs font-semibold text-zinc-450 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-2.5 py-0.5 rounded-full shrink-0">
              {filteredCheckIns.length} Records
            </span>
          </div>

          <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-300 dark:border-zinc-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">Talent</th>
                  <th className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">Objective Target</th>
                  <th className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">Quarter</th>
                  <th className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredCheckIns.map(ci => (
                  <tr key={ci._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-850 dark:text-zinc-200">{ci.ownerId?.name}</div>
                      <div className="text-[9px] text-zinc-450 dark:text-zinc-500 mt-0.5">{ci.ownerId?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      <div className="font-semibold text-zinc-700 dark:text-zinc-350 truncate" title={ci.goalId?.title}>{ci.goalId?.title || 'Unknown Goal'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400">{ci.quarter}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                        ci.score >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30' :
                        ci.score >= 50 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-900/30' :
                        'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-250 dark:border-red-900/30'
                      }`}>
                        {ci.score}%
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredCheckIns.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-zinc-400 dark:text-zinc-500 italic">
                      No matching continuous check-ins recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdvancedReports;
