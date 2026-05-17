import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, Target, Users, BarChart3, Shield, LogOut, 
  MessageSquare, Calendar, Sun, Moon, Bell 
} from 'lucide-react';
import { getRoleTheme } from '../utils/theme';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout, darkMode, toggleDarkMode } = useContext(AuthContext);
  const theme = getRoleTheme(user?.role, darkMode);

  const getLinks = () => {
    const links = [];

    // Employee Hub
    if (user?.role === 'Employee') {
      links.push({
        category: 'My Hub',
        items: [
          { name: 'My Dashboard', path: '/employee', icon: LayoutDashboard },
          { name: 'My Goals', path: '/employee/goals', icon: Target },
          { name: 'My Check-ins', path: '/employee/checkins', icon: BarChart3 },
        ]
      });
    }

    // Manager Hub
    if (user?.role === 'Manager') {
      links.push({
        category: 'Management Hub',
        items: [
          { name: 'Manager Dashboard', path: '/manager', icon: LayoutDashboard },
          { name: 'Team Goals Operations', path: '/manager/team-goals', icon: Users },
          { name: 'Team Check-ins', path: '/manager/team-checkins', icon: MessageSquare },
          { name: 'My Check-ins', path: '/employee/checkins', icon: BarChart3 },
        ]
      });
    }

    // Admin Center
    if (user?.role === 'Admin') {
      links.push({
        category: 'Admin Center',
        items: [
          { name: 'System Analytics', path: '/admin', icon: Shield },
          { name: 'Cycle Controls', path: '/admin/cycles', icon: Calendar },
          { name: 'Goal Registry', path: '/admin/goals', icon: Target },
          { name: 'Team Check-ins', path: '/manager/team-checkins', icon: MessageSquare },
          { name: 'Manager Communications', path: '/admin/manager-comm', icon: MessageSquare },
          { name: 'System Alert Logs', path: '/admin/notifications', icon: Bell },
          { name: 'My Check-ins', path: '/employee/checkins', icon: BarChart3 },
          { name: 'User Management', path: '/admin/users', icon: Users },
          { name: 'Advanced Reports', path: '/admin/reports', icon: BarChart3 },
        ]
      });
    }

    return links;
  };

  const sections = getLinks();

  return (
    <div className={`flex flex-col h-screen fixed top-0 left-0 z-20 shadow-sm border-r transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    } ${
      darkMode ? 'bg-zinc-950 border-zinc-900 text-zinc-350 shadow-zinc-950/20' : 'bg-white border-zinc-300 text-zinc-700 shadow-zinc-100/50'
    }`}>
      
      {/* Atomberg Logo Header */}
      <div className={`h-16 flex items-center transition-all duration-300 ${
        collapsed ? 'justify-center px-0' : 'px-4'
      } ${
        darkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-300 border-b'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-[#FFC20E] rounded-full flex items-center justify-center font-bold text-black shadow-md shrink-0">
            <svg viewBox="0 0 100 100" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 20C33.4 20 20 33.4 20 50C20 66.6 33.4 80 50 80C55 80 60 78.5 64 76L60 70C57 71.5 53.5 72 50 72C37.8 72 28 62.2 28 50C28 37.8 37.8 28 50 28C62.2 28 72 37.8 72 50V54C72 57.3 69.3 60 66 60C62.7 60 60 57.3 60 54V50C60 44.5 55.5 40 50 40C44.5 40 40 44.5 40 50C40 55.5 44.5 60 50 60C53 60 55.5 58.5 57 56C58.5 58.5 61.5 60 65 60C70.5 60 75 55.5 75 50V46C75 31.6 63.8 20 50 20ZM50 52C48.9 52 48 51.1 48 50C48 48.9 48.9 48 50 48C51.1 48 52 48.9 52 50C52 51.1 51.1 52 50 52Z" fill="black" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in duration-200">
              <span className={`font-extrabold text-base tracking-tight leading-none uppercase transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-zinc-800'
              }`}>atomberg</span>
              <span className={`font-medium text-[8px] uppercase tracking-widest mt-1 transition-colors duration-300 ${
                darkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}>"Why not?"</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 py-6 space-y-6 overflow-y-auto ${collapsed ? 'px-2' : 'px-4'}`}>
        {sections.map((section) => (
          <div key={section.category} className="space-y-2">
            {!collapsed ? (
              <span className={`px-3 text-[10px] font-bold uppercase tracking-wider block transition-colors duration-300 ${
                darkMode ? 'text-zinc-600' : 'text-zinc-450'
              }`}>
                {section.category}
              </span>
            ) : (
              <div className="h-px bg-zinc-200 dark:bg-zinc-850 mx-2 my-4"></div>
            )}
            <div className="space-y-1">
              {section.items.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center rounded-xl transition-all duration-300 ${
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                      } ${
                        isActive 
                          ? `bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/15` 
                          : darkMode 
                            ? 'hover:bg-zinc-900 hover:text-white text-zinc-400' 
                            : 'hover:bg-zinc-100 hover:text-zinc-950 text-zinc-700'
                      }`
                    }
                    title={collapsed ? link.name : undefined}
                    end={link.path === '/employee' || link.path === '/manager' || link.path === '/admin'}
                  >
                    <Icon className={`transition-all ${collapsed ? 'h-5 w-5 mr-0' : 'mr-3 h-4.5 w-4.5'}`} />
                    {!collapsed && <span className="truncate">{link.name}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Control Actions */}
      <div className={`p-4 border-t space-y-2 transition-all duration-300 ${
        collapsed ? 'flex flex-col items-center px-2' : ''
      } ${
        darkMode ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50/50 border-zinc-300'
      }`}>
        <button
          onClick={toggleDarkMode}
          className={`flex items-center text-xs font-bold rounded-xl transition-all duration-200 ${
            collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2.5'
          } ${
            darkMode 
              ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' 
              : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
          }`}
          title={collapsed ? (darkMode ? "Light Theme" : "Dark Theme") : undefined}
        >
          {darkMode ? (
            <Sun className={`text-[#FFC20E] ${collapsed ? 'h-5 w-5' : 'mr-3 h-4.5 w-4.5'}`} />
          ) : (
            <Moon className={`text-zinc-500 ${collapsed ? 'h-5 w-5' : 'mr-3 h-4.5 w-4.5'}`} />
          )}
          {!collapsed && (darkMode ? "Light Theme" : "Dark Theme")}
        </button>
        
        <button
          onClick={logout}
          className={`flex items-center text-xs font-bold rounded-xl transition-all duration-200 ${
            collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2.5'
          } ${
            darkMode 
              ? 'text-zinc-400 hover:bg-red-500/10 hover:text-red-400' 
              : 'text-zinc-700 hover:bg-red-50 hover:text-red-650'
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className={`${collapsed ? 'h-5 w-5' : 'mr-3 h-4.5 w-4.5'}`} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
