import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import StudentDashboard from './pages/StudentDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import DeptDashboard from './pages/DeptDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CollegeHeadDashboard from './pages/CollegeHeadDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import ReportsPage from './pages/ReportsPage';
import CompaniesPage from './pages/CompaniesPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AdvisorStudentsPage from './pages/AdvisorStudentsPage';
import NotFound from './pages/NotFound';
import ActivateAccount from './pages/ActivateAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Messaging from './pages/Messaging';
import AdminStudents from './pages/AdminStudents';
import AdminStaff from './pages/AdminStaff';
import AdminDepartments from './pages/AdminDepartments';
import AdminLogs from './pages/AdminLogs';
import { AdminInternships, AdminReports, AdminSettings } from './pages/AdminModules';
import Profile from './pages/Profile';
import AccountSettings from './pages/AccountSettings';
import NotificationCenter from './pages/NotificationCenter';
import DeanStudents from './pages/DeanStudents';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/activate" element={<ActivateAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Role Protected Routes Wrapped in Standard Layout */}
      <Route element={<DashboardLayout />}>
        <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student/reports" element={<ReportsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Advisor']} />}>
          <Route path="/advisor-dashboard" element={<AdvisorDashboard />} />
          <Route path="/students" element={<AdvisorStudentsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Dean']} />}>
          <Route path="/dept-dashboard" element={<DeptDashboard />} />
          <Route path="/dean/students" element={<DeanStudents />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
          <Route path="/admin/internships" element={<AdminInternships />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
        </Route>

        {/* Shared authenticated routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/messages" element={<Messaging />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<AccountSettings />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
