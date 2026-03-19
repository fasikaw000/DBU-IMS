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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Role Protected Routes Wrapped in Standard Layout */}
      <Route element={<DashboardLayout />}>
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/reports" element={<ReportUpload />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['advisor']} />}>
          <Route path="/advisor/dashboard" element={<AdvisorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['department_head']} />}>
          <Route path="/department/dashboard" element={<DeptDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['college_head']} />}>
          <Route path="/college-head/dashboard" element={<CollegeHeadDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
