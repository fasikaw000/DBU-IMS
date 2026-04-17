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
import ReportUpload from './pages/ReportUpload';
import ActivateAccount from './pages/ActivateAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Messaging from './pages/Messaging';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/activate" element={<ActivateAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Role Protected Routes Wrapped in Standard Layout */}
      <Route element={<DashboardLayout />}>
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student/reports" element={<ReportUpload />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['advisor']} />}>
          <Route path="/advisor-dashboard" element={<AdvisorDashboard />} />
          <Route path="/advisor/students" element={<AdvisorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['department_dean']} />}>
          <Route path="/dept-dashboard" element={<DeptDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['college_admin']} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Messaging is available to all authenticated roles under the layout */}
        <Route path="/messages" element={<Messaging />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
