import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import GoalManagement from './pages/employee/GoalManagement';

import ManagerDashboard from './pages/manager/ManagerDashboard';
import TeamGoals from './pages/manager/TeamGoals';
import TeamCheckIns from './pages/manager/TeamCheckIns';
import CheckIns from './pages/employee/CheckIns';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGoals from './pages/admin/AdminGoals';
import AdminRegistry from './pages/admin/AdminRegistry';
import AdminCycleManager from './pages/admin/AdminCycleManager';
import UserManagement from './pages/admin/UserManagement';
import AdvancedReports from './pages/admin/AdvancedReports';
import AdminNotifications from './pages/admin/AdminNotifications';
import Placeholder from './components/Placeholder';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/employee" element={<DashboardLayout allowedRoles={['Employee', 'Manager', 'Admin']} />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="goals" element={<GoalManagement />} />
            <Route path="checkins" element={<CheckIns />} />
          </Route>

          <Route path="/manager" element={<DashboardLayout allowedRoles={['Manager', 'Admin']} />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="team-goals" element={<TeamGoals />} />
            <Route path="team-checkins" element={<TeamCheckIns />} />
          </Route>

          <Route path="/admin" element={<DashboardLayout allowedRoles={['Admin']} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="goals" element={<AdminRegistry />} />
            <Route path="manager-comm" element={<AdminGoals />} />
            <Route path="cycles" element={<AdminCycleManager />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<AdvancedReports />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
