import React, { useContext, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthContext } from '../context/AuthContext';

const DashboardLayout = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Topbar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
