import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Bell, LogOut, User as UserIcon, Settings, ChevronDown, X, 
  Shield, Briefcase, Mail, UserCheck, Sun, Moon, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoleTheme } from '../utils/theme';
import api from '../services/api';

const Topbar = ({ collapsed, setCollapsed }) => {
  const { user, logout, darkMode, toggleDarkMode } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Personalization settings
  const [personalization, setPersonalization] = useState({
    birthday: '',
    age: '',
    pfp: '',
    altNumber: '',
  });

  // Modal edit states
  const [editBirthday, setEditBirthday] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editPfp, setEditPfp] = useState('');
  const [editAltNumber, setEditAltNumber] = useState('');

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const theme = getRoleTheme(user?.role, darkMode);

  const PREDEFINED_AVATARS = [
    { name: 'Felix (Robot)', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
    { name: 'Aneka (Tech)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { name: 'Callie (Minimalist)', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Callie' },
    { name: 'Jack (Adventurer)', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack' }
  ];

  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getFallbackNotifications = () => {
    if (user?.role === 'Admin') {
      return [
        { id: 'f-1', text: "Goal setting cycle Q1 July has been successfully opened.", time: "10m ago", read: false },
        { id: 'f-2', text: "Audit logs updated: 4 goal configurations modified today.", time: "2h ago", read: false },
        { id: 'f-3', text: "User headcount synced successfully with HR registry.", time: "1d ago", read: true },
      ];
    } else if (user?.role === 'Manager') {
      return [
        { id: 'f-1', text: "Alex Rivera submitted a new Q1 July check-in for your review.", time: "5m ago", read: false },
        { id: 'f-2', text: "HR sent you a Direct Appreciation Alert for team performance.", time: "1h ago", read: false },
        { id: 'f-3', text: "1 pending target requires verification in your queue.", time: "4h ago", read: true },
      ];
    } else {
      return [
        { id: 'f-1', text: "Your Q1 July check-in was successfully logged.", time: "15m ago", read: false },
        { id: 'f-2', text: "Your goal 'Integrate core analytics telemetry' was assigned by Manager.", time: "1d ago", read: false },
        { id: 'f-3', text: "HR assigned a team-wide KPI to your goal set.", time: "2d ago", read: true },
      ];
    }
  };

  // Load personalization from localStorage
  useEffect(() => {
    if (user?._id) {
      const saved = localStorage.getItem(`atomquest_personalization_${user._id}`);
      if (saved) {
        setPersonalization(JSON.parse(saved));
      }
    }
  }, [user]);

  // Load default edits when modal opens
  useEffect(() => {
    if (isSettingsModalOpen) {
      setEditBirthday(personalization.birthday || '');
      setEditAge(personalization.age || '');
      setEditPfp(personalization.pfp || '');
      setEditAltNumber(personalization.altNumber || '');
    }
  }, [isSettingsModalOpen, personalization]);

  const handleSaveSettings = () => {
    const updated = {
      birthday: editBirthday,
      age: editAge,
      pfp: editPfp,
      altNumber: editAltNumber,
    };
    setPersonalization(updated);
    if (user?._id) {
      localStorage.setItem(`atomquest_personalization_${user._id}`, JSON.stringify(updated));
    }
    setIsSettingsModalOpen(false);
  };

  // Live Database Notification Syncer
  useEffect(() => {
    const fetchRealNotifications = async () => {
      if (!user) return;
      try {
        let list = [];
        
        if (user.role === 'Admin') {
          try {
            const { data } = await api.get('/api/admin/audit-logs');
            if (data && data.length > 0) {
              list = data.map((log, index) => ({
                id: `audit-${log._id || index}`,
                text: `${log.changedBy?.name || 'Admin'} adjusted ${log.fieldChanged} of goal '${log.goalId?.title || 'System Goal'}' to '${log.newValue}'`,
                time: timeAgo(log.createdAt),
                timestamp: new Date(log.createdAt).getTime(),
                read: false
              }));
            }
          } catch (e) {
            console.warn("Audit logs fetch failed, using fallback", e);
          }
        } else if (user.role === 'Manager') {
          try {
            const [checkinsRes, goalsRes, msgRes] = await Promise.allSettled([
              api.get('/api/checkins?scope=team'),
              api.get('/api/goals'),
              api.get('/api/messages/inbox')
            ]);

            let managerItems = [];

            if (checkinsRes.status === 'fulfilled' && checkinsRes.value.data) {
              checkinsRes.value.data.forEach(ci => {
                managerItems.push({
                  id: `ci-${ci._id}`,
                  text: `${ci.ownerId?.name || 'Team member'} submitted Q${ci.quarter || '1'} accountability check-in (Score: ${ci.score}%)`,
                  time: timeAgo(ci.updatedAt || ci.createdAt),
                  timestamp: new Date(ci.updatedAt || ci.createdAt).getTime(),
                  read: false
                });
              });
            }

            if (goalsRes.status === 'fulfilled' && goalsRes.value.data) {
              goalsRes.value.data.forEach(g => {
                if (g.ownerId?._id !== user._id) {
                  managerItems.push({
                    id: `g-${g._id}`,
                    text: `${g.ownerId?.name || 'Team member'} updated goal '${g.title}' to [${g.status}]`,
                    time: timeAgo(g.updatedAt || g.createdAt),
                    timestamp: new Date(g.updatedAt || g.createdAt).getTime(),
                    read: false
                  });
                }
              });
            }

            if (msgRes.status === 'fulfilled' && msgRes.value.data) {
              msgRes.value.data.forEach(m => {
                managerItems.push({
                  id: `m-${m._id}`,
                  text: `HR Broadcast: "${m.title}" was published to your inbox.`,
                  time: timeAgo(m.createdAt),
                  timestamp: new Date(m.createdAt).getTime(),
                  read: false
                });
              });
            }

            list = managerItems.sort((a, b) => b.timestamp - a.timestamp);
          } catch (e) {
            console.warn("Manager metrics fetch failed", e);
          }
        } else {
          try {
            const [checkinsRes, goalsRes] = await Promise.allSettled([
              api.get('/api/checkins'),
              api.get('/api/goals')
            ]);

            let employeeItems = [];

            if (checkinsRes.status === 'fulfilled' && checkinsRes.value.data) {
              checkinsRes.value.data.forEach(ci => {
                if (ci.managerComments) {
                  employeeItems.push({
                    id: `ci-rev-${ci._id}`,
                    text: `Manager reviewed your Q${ci.quarter || '1'} check-in: "${ci.managerComments.substring(0, 45)}..."`,
                    time: timeAgo(ci.updatedAt),
                    timestamp: new Date(ci.updatedAt).getTime(),
                    read: false
                  });
                } else {
                  employeeItems.push({
                    id: `ci-sub-${ci._id}`,
                    text: `Your Q${ci.quarter || '1'} check-in was successfully logged.`,
                    time: timeAgo(ci.createdAt),
                    timestamp: new Date(ci.createdAt).getTime(),
                    read: false
                  });
                }
              });
            }

            if (goalsRes.status === 'fulfilled' && goalsRes.value.data) {
              goalsRes.value.data.forEach(g => {
                if (g.status === 'Approved') {
                  if (g.isAchieved) {
                    employeeItems.push({
                      id: `g-ach-${g._id}`,
                      text: `Your achievement for "${g.title}" was approved by Manager.`,
                      time: timeAgo(g.updatedAt),
                      timestamp: new Date(g.updatedAt).getTime(),
                      read: false
                    });
                  } else {
                    employeeItems.push({
                      id: `g-app-${g._id}`,
                      text: `Your goal "${g.title}" was assigned by Manager.`,
                      time: timeAgo(g.updatedAt),
                      timestamp: new Date(g.updatedAt).getTime(),
                      read: false
                    });
                  }
                } else {
                  employeeItems.push({
                    id: `g-upd-${g._id}`,
                    text: `Goal "${g.title}" was saved successfully as [${g.status}].`,
                    time: timeAgo(g.updatedAt || g.createdAt),
                    timestamp: new Date(g.updatedAt || g.createdAt).getTime(),
                    read: false
                  });
                }
              });
            }

            list = employeeItems.sort((a, b) => b.timestamp - a.timestamp);
          } catch (e) {
            console.warn("Employee metrics fetch failed", e);
          }
        }

        if (list.length === 0) {
          list = getFallbackNotifications();
        }

        setNotifications(list.slice(0, 5));

      } catch (err) {
        console.error("Error fetching notifications", err);
        setNotifications(getFallbackNotifications());
      }
    };

    fetchRealNotifications();
    const interval = setInterval(fetchRealNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-300 dark:border-zinc-900 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm transition-colors duration-300">
        
        {/* Left Side: Role Header with Collapsible Toggle */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-400 dark:text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 mr-1 focus:outline-none"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <h1 className="text-lg font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
            {user?.role} Workspace
          </h1>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-4">
          
          {/* Quick Theme Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="text-zinc-400 dark:text-zinc-550 hover:text-[#FFC20E] dark:hover:text-[#FFC20E] transition-colors p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900"
            title="Toggle Theme Mode"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="text-zinc-400 dark:text-zinc-550 hover:text-zinc-650 dark:hover:text-zinc-300 relative transition-colors p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950"></span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl py-2 border border-zinc-250 dark:border-zinc-800 ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 z-50 animate-duration-150">
                <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center mb-1">
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">Notifications</h4>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5 font-semibold">Continuous System Alerts</p>
                  </div>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                      className="text-[10px] font-bold text-[#FFC20E] hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                  {notifications.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => setNotifications(notifications.map(n => n.id === item.id ? { ...n, read: true } : n))}
                      className={`p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-950/40 transition-colors cursor-pointer flex items-start space-x-2.5 ${!item.read ? 'bg-amber-50/10 dark:bg-amber-950/5' : ''}`}
                    >
                      <div className="mt-1 shrink-0">
                        <span className={`block h-2 w-2 rounded-full ${!item.read ? 'bg-[#FFC20E]' : 'bg-zinc-300 dark:bg-zinc-700'}`}></span>
                      </div>
                      <div className="flex-grow space-y-0.5">
                        <p className={`text-xs leading-normal ${!item.read ? 'text-zinc-850 dark:text-zinc-100 font-bold' : 'text-zinc-650 dark:text-zinc-400 font-medium'}`}>
                          {item.text}
                        </p>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-semibold">{item.time}</span>
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="py-10 text-center text-zinc-400 dark:text-zinc-500 text-xs italic">
                      No new notifications.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* User Account Info */}
          <div className="pl-4 border-l border-zinc-300 dark:border-zinc-900 relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 focus:outline-none p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-[#FFC20E] flex items-center justify-center text-slate-950 font-bold shadow-sm shrink-0 overflow-hidden">
                {personalization.pfp ? (
                  <img src={personalization.pfp} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase mt-0.5">{user?.role}</p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl py-1 border border-zinc-250 dark:border-zinc-800 ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 z-50 animate-duration-150">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 mb-1">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Signed in as</p>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate mt-0.5">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center transition-colors"
                >
                  <UserIcon className="h-4 w-4 mr-2.5 text-zinc-400" />
                  Your Profile
                </button>
                <button 
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2.5 text-zinc-400" />
                  Account Settings
                </button>
                
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2.5 text-red-500" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-250 dark:border-zinc-800 max-w-md w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-6 border-b border-zinc-200 dark:border-zinc-800 mb-6">
              <div className="mx-auto h-20 w-20 bg-[#FFC20E] rounded-full flex items-center justify-center text-slate-950 font-black text-3xl shadow-lg mb-4 overflow-hidden">
                {personalization.pfp ? (
                  <img src={personalization.pfp} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{user?.name}</h3>
              
              <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                <Shield className="h-3 w-3 mr-1" /> {user?.role}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900">
                <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-zinc-400 shadow-sm border border-zinc-200 dark:border-zinc-850">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Email Address</p>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 mt-0.5">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900">
                <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-zinc-400 shadow-sm border border-zinc-200 dark:border-zinc-850">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Department</p>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 mt-0.5">{user?.department || 'Operations'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900">
                <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-zinc-400 shadow-sm border border-zinc-200 dark:border-zinc-850">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Security Status</p>
                  <p className="text-xs font-bold text-emerald-650 dark:text-emerald-450 flex items-center mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-ping animate-duration-1000"></span> Fully Authorized
                  </p>
                </div>
              </div>

              {/* Personalization Details */}
              {(personalization.birthday || personalization.age || personalization.altNumber) && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Personal Details</p>
                  
                  {personalization.birthday && (
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400 shadow-sm border border-zinc-250 dark:border-zinc-850 text-sm">
                        🎂
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Birthday</p>
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 mt-0.5">{personalization.birthday}</p>
                      </div>
                    </div>
                  )}

                  {personalization.age && (
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400 shadow-sm border border-zinc-250 dark:border-zinc-850 text-sm">
                        ⏳
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Age</p>
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 mt-0.5">{personalization.age} years old</p>
                      </div>
                    </div>
                  )}

                  {personalization.altNumber && (
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900">
                      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400 shadow-sm border border-zinc-250 dark:border-zinc-850 text-sm">
                        📞
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Alternate Contact</p>
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 mt-0.5">{personalization.altNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="mt-8">
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-3 bg-zinc-900 dark:bg-[#FFC20E] text-white dark:text-slate-950 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-[#FFB800] transition-colors shadow-lg"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings / Personalization Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-250 dark:border-zinc-800 max-w-md w-full p-8 relative mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pb-6 border-b border-zinc-200 dark:border-zinc-800 mb-6">
              <h3 className="text-xl font-extrabold text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">Account Personalization</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Customize unofficial profile settings to personalize your workspace.</p>
            </div>

            <div className="space-y-6">
              
              {/* Select Profile Picture (pfp) */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">1. Personalize Profile Picture</label>
                
                {/* Predefined Avatars */}
                <div className="grid grid-cols-4 gap-3">
                  {PREDEFINED_AVATARS.map((avatar) => (
                    <button
                      key={avatar.name}
                      onClick={() => setEditPfp(avatar.url)}
                      className={`h-16 w-16 rounded-full overflow-hidden border-2 bg-zinc-50 dark:bg-zinc-950 p-1 transition-all ${
                        editPfp === avatar.url 
                          ? 'border-[#FFC20E] scale-105 shadow-md shadow-amber-500/20' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700'
                      }`}
                      title={avatar.name}
                    >
                      <img src={avatar.url} alt={avatar.name} className="h-full w-full object-cover rounded-full" />
                    </button>
                  ))}
                </div>

                {/* Custom URL Input */}
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Or paste custom image URL..."
                    value={editPfp}
                    onChange={(e) => setEditPfp(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Date of Birth input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">2. Birthday</label>
                <input
                  type="date"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-bold"
                />
              </div>

              {/* Age input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">3. Age</label>
                <input
                  type="number"
                  placeholder="Enter your age..."
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-bold"
                />
              </div>

              {/* Alternative Number input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">4. Alternate Contact Number</label>
                <input
                  type="text"
                  placeholder="Enter alternate phone number..."
                  value={editAltNumber}
                  onChange={(e) => setEditAltNumber(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/20 focus:border-[#FFC20E] text-xs font-bold"
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="mt-8 flex space-x-3">
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold transition-colors text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings}
                className="flex-1 py-3 bg-zinc-900 dark:bg-[#FFC20E] hover:bg-zinc-800 dark:hover:bg-[#FFB800] text-white dark:text-slate-950 rounded-xl font-bold transition-colors shadow-lg text-xs uppercase tracking-wider"
              >
                Save Settings
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
